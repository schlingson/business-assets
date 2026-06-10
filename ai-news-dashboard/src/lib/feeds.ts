import { getDb } from "./db";
import { SOURCES, type SourceDef } from "./sources";
import { categorize } from "./categorize";
import { stripHtml } from "./text";

const RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json";
const RETENTION_DAYS = 90;

type Rss2JsonItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  enclosure?: { link?: string };
};

type Rss2JsonResponse = {
  status: string;
  items?: Rss2JsonItem[];
  message?: string;
};

export type FetchResult = {
  source: string;
  ok: boolean;
  fetched: number;
  inserted: number;
  error?: string;
};

function parseDate(input?: string): string {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function pickImage(item: Rss2JsonItem): string | null {
  if (item.thumbnail && item.thumbnail.startsWith("http")) return item.thumbnail;
  if (item.enclosure?.link && item.enclosure.link.startsWith("http")) {
    return item.enclosure.link;
  }
  // Fall back to the first <img> in the content/description.
  const html = item.content || item.description || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

async function fetchFeed(source: SourceDef): Promise<Rss2JsonItem[]> {
  const url = new URL(RSS2JSON_ENDPOINT);
  url.searchParams.set("rss_url", source.feedUrl);
  url.searchParams.set("count", "40");
  if (process.env.RSS2JSON_API_KEY) {
    url.searchParams.set("api_key", process.env.RSS2JSON_API_KEY);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // Always hit the network; we do our own caching in SQLite.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`rss2json HTTP ${res.status}`);
  }
  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== "ok") {
    throw new Error(data.message || `rss2json status: ${data.status}`);
  }
  return data.items ?? [];
}

function ingest(source: SourceDef, items: Rss2JsonItem[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO articles
      (source_name, source_url, title, description, link, image_url, published_at, category)
    VALUES
      (@source_name, @source_url, @title, @description, @link, @image_url, @published_at, @category)
    ON CONFLICT(link) DO NOTHING
  `);

  const tx = db.transaction((rows: Rss2JsonItem[]) => {
    let inserted = 0;
    for (const item of rows) {
      const link = (item.link || "").trim();
      const title = stripHtml(item.title).trim();
      if (!link || !title) continue;

      const description = stripHtml(item.description || item.content || "");
      const category = categorize(title, description);

      const info = insert.run({
        source_name: source.name,
        source_url: source.siteUrl,
        title,
        description,
        link,
        image_url: pickImage(item),
        published_at: parseDate(item.pubDate),
        category,
      });
      if (info.changes > 0) inserted += 1;
    }
    return inserted;
  });

  return tx(items);
}

function markFetched(sourceName: string) {
  getDb()
    .prepare("UPDATE sources SET last_fetched_at = datetime('now') WHERE name = ?")
    .run(sourceName);
}

/** Delete articles older than the retention window. Returns rows removed. */
export function pruneOldArticles(): number {
  const info = getDb()
    .prepare(
      `DELETE FROM articles WHERE published_at < datetime('now', '-${RETENTION_DAYS} days')`,
    )
    .run();
  return info.changes;
}

/**
 * Fetch every (or one) source, upsert new articles, mark fetch time and prune
 * stale rows. Failures are isolated per-source so one bad feed can't abort the run.
 */
export async function refreshAllFeeds(only?: string): Promise<{
  results: FetchResult[];
  pruned: number;
}> {
  const targets = only ? SOURCES.filter((s) => s.name === only) : SOURCES;
  const results: FetchResult[] = [];

  for (const source of targets) {
    try {
      const items = await fetchFeed(source);
      const inserted = ingest(source, items);
      markFetched(source.name);
      results.push({ source: source.name, ok: true, fetched: items.length, inserted });
    } catch (err) {
      results.push({
        source: source.name,
        ok: false,
        fetched: 0,
        inserted: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const pruned = pruneOldArticles();
  return { results, pruned };
}
