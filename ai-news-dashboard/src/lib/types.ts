export type Article = {
  id: number;
  source_name: string;
  source_url: string;
  title: string;
  description: string;
  link: string;
  image_url: string | null;
  published_at: string; // ISO 8601
  category: string;
  created_at: string; // ISO 8601
};

// Article as returned by the API, enriched with bookmark info.
export type ArticleWithMeta = Article & {
  bookmark_count: number;
  is_bookmarked: boolean;
  is_german: boolean;
};

export type SourceRow = {
  id: number;
  name: string;
  feed_url: string;
  logo_url: string | null;
  description: string;
  is_active: number; // 0 | 1
  last_fetched_at: string | null;
};

export type PublicUser = {
  id: number;
  email: string;
};

export type SortOption = "newest" | "bookmarks";
export type TimeRange = "today" | "week" | "month" | "all";
