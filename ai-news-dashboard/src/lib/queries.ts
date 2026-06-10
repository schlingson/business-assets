import { getDb } from "./db";
import { GERMAN_SOURCE_NAMES, isGermanSource } from "./sources";
import type { ArticleWithMeta, SortOption, TimeRange } from "./types";

export type ArticleQuery = {
  sources?: string[]; // include only these source names
  category?: string | null;
  range?: TimeRange;
  search?: string;
  sort?: SortOption;
  limit?: number;
  offset?: number;
  userId?: number | null;
};

function sinceForRange(range?: TimeRange): string | null {
  if (!range || range === "all") return null;
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  const days = range === "week" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type Row = Omit<ArticleWithMeta, "is_german" | "is_bookmarked"> & {
  is_bookmarked: number;
};

export function queryArticles(q: ArticleQuery): { articles: ArticleWithMeta[]; total: number } {
  const db = getDb();
  const where: string[] = [];
  const args: unknown[] = [];

  if (q.sources && q.sources.length > 0) {
    where.push(`a.source_name IN (${q.sources.map(() => "?").join(",")})`);
    args.push(...q.sources);
  }

  if (q.category) {
    if (q.category === "German News") {
      // German News is a cross-cutting tag, not a stored primary category.
      where.push(`a.source_name IN (${GERMAN_SOURCE_NAMES.map(() => "?").join(",")})`);
      args.push(...GERMAN_SOURCE_NAMES);
    } else {
      where.push("a.category = ?");
      args.push(q.category);
    }
  }

  const since = sinceForRange(q.range);
  if (since) {
    where.push("a.published_at >= ?");
    args.push(since);
  }

  if (q.search && q.search.trim()) {
    where.push("(a.title LIKE ? OR a.description LIKE ?)");
    const like = `%${q.search.trim()}%`;
    args.push(like, like);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Total count for pagination (before LIMIT/OFFSET).
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM articles a ${whereClause}`).get(...args) as {
      c: number;
    }
  ).c;

  const orderBy =
    q.sort === "bookmarks"
      ? "bookmark_count DESC, a.published_at DESC"
      : "a.published_at DESC";

  const limit = Math.min(Math.max(q.limit ?? 24, 1), 100);
  const offset = Math.max(q.offset ?? 0, 0);
  const userId = q.userId ?? null;

  const rows = db
    .prepare(
      `
      SELECT a.*,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.article_id = a.id) AS bookmark_count,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM bookmarks b2 WHERE b2.article_id = a.id AND b2.user_id = ?
        ) THEN 1 ELSE 0 END AS is_bookmarked
      FROM articles a
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
    )
    .all(userId, userId, ...args, limit, offset) as Row[];

  const articles = rows.map(decorate);
  return { articles, total };
}

function decorate(row: Row): ArticleWithMeta {
  return {
    ...row,
    is_bookmarked: row.is_bookmarked === 1,
    is_german: isGermanSource(row.source_name),
  };
}

export function getBookmarkedArticles(userId: number): ArticleWithMeta[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT a.*,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.article_id = a.id) AS bookmark_count,
        1 AS is_bookmarked
      FROM articles a
      JOIN bookmarks bm ON bm.article_id = a.id
      WHERE bm.user_id = ?
      ORDER BY bm.created_at DESC
      `,
    )
    .all(userId) as Row[];
  return rows.map(decorate);
}

export function addBookmark(userId: number, articleId: number): void {
  getDb()
    .prepare(
      "INSERT INTO bookmarks (user_id, article_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
    )
    .run(userId, articleId);
}

export function removeBookmark(userId: number, articleId: number): void {
  getDb()
    .prepare("DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?")
    .run(userId, articleId);
}

export type SourceOverview = {
  id: number;
  name: string;
  feed_url: string;
  description: string;
  is_active: number;
  last_fetched_at: string | null;
  article_count: number;
};

export function getSourceOverview(): SourceOverview[] {
  return getDb()
    .prepare(
      `
      SELECT s.id, s.name, s.feed_url, s.description, s.is_active, s.last_fetched_at,
        (SELECT COUNT(*) FROM articles a WHERE a.source_name = s.name) AS article_count
      FROM sources s
      ORDER BY s.id
      `,
    )
    .all() as SourceOverview[];
}

export function getHiddenSources(userId: number): string[] {
  const row = getDb()
    .prepare("SELECT hidden_sources FROM user_preferences WHERE user_id = ?")
    .get(userId) as { hidden_sources: string } | undefined;
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.hidden_sources);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function setHiddenSources(userId: number, hidden: string[]): void {
  getDb()
    .prepare(
      `
      INSERT INTO user_preferences (user_id, hidden_sources)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET hidden_sources = excluded.hidden_sources
      `,
    )
    .run(userId, JSON.stringify(hidden));
}

// ---- Dashboard / stats ----

export type DashboardStats = {
  todayCount: number;
  mostActiveSource: { name: string; count: number } | null;
  trendingCategory: { name: string; count: number } | null;
  perSource: { source: string; count: number }[];
  topWords: { word: string; count: number }[];
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","at","by","from","is","are","be","as","it","its","that","this","these","those","new","how","why","what","will","can","你","der","die","das","und","oder","mit","für","von","im","ein","eine","den","des","auf","ist","im","zu","so","wie","kann","mehr","ki","ai","de","s","i","you","your","our","we","they","he","she","not","no","yes","up","out","into","more","most","than","over","after","before","about","now","just","get","gets","got","vs",
]);

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const todayIso = startToday.toISOString();
  const weekIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const todayCount = (
    db.prepare("SELECT COUNT(*) AS c FROM articles WHERE created_at >= ? OR published_at >= ?")
      .get(todayIso, todayIso) as { c: number }
  ).c;

  const mostActiveRow = db
    .prepare(
      `SELECT source_name AS name, COUNT(*) AS count FROM articles
       WHERE published_at >= ? GROUP BY source_name ORDER BY count DESC LIMIT 1`,
    )
    .get(todayIso) as { name: string; count: number } | undefined;

  const trendingRow = db
    .prepare(
      `SELECT category AS name, COUNT(*) AS count FROM articles
       WHERE published_at >= ? GROUP BY category ORDER BY count DESC LIMIT 1`,
    )
    .get(weekIso) as { name: string; count: number } | undefined;

  const perSource = db
    .prepare(
      `SELECT source_name AS source, COUNT(*) AS count FROM articles
       WHERE published_at >= ? GROUP BY source_name ORDER BY count DESC`,
    )
    .all(weekIso) as { source: string; count: number }[];

  // Word frequency across this-week headlines.
  const titles = db
    .prepare("SELECT title FROM articles WHERE published_at >= ?")
    .all(weekIso) as { title: string }[];

  const counts = new Map<string, number>();
  for (const { title } of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s-]/gi, " ")
      .split(/\s+/);
    for (const w of words) {
      const word = w.trim();
      if (word.length < 3 || STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const topWords = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  return {
    todayCount,
    mostActiveSource: mostActiveRow ?? null,
    trendingCategory: trendingRow ?? null,
    perSource,
    topWords,
  };
}

export function getArticleById(id: number) {
  return getDb().prepare("SELECT * FROM articles WHERE id = ?").get(id);
}
