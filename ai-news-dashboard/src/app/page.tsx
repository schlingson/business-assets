"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Filters, { type FilterState } from "@/components/Filters";
import ArticleCard from "@/components/ArticleCard";
import { useHiddenSources } from "@/components/useHiddenSources";
import { SOURCES } from "@/lib/sources";
import type { ArticleWithMeta, SortOption } from "@/lib/types";

const PAGE_SIZE = 24;

export default function HomePage() {
  const { hidden, loaded: prefsLoaded, toggle, setHidden } = useHiddenSources();

  const [filters, setFilters] = useState<FilterState>({
    category: null,
    range: "all",
    sort: "newest",
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [articles, setArticles] = useState<ArticleWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqId = useRef(0);

  // Active sources = everything that isn't toggled off.
  const activeSources = useMemo(
    () => SOURCES.map((s) => s.name).filter((n) => !hidden.includes(n)),
    [hidden],
  );

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildUrl = useCallback(
    (nextOffset: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(nextOffset));
      params.set("sort", filters.sort);
      params.set("range", filters.range);
      if (filters.category) params.set("category", filters.category);
      if (search.trim()) params.set("search", search.trim());
      // Only constrain by source when some are hidden (avoids huge query strings).
      if (hidden.length > 0) params.set("sources", activeSources.join(","));
      return `/api/articles?${params.toString()}`;
    },
    [filters, search, hidden, activeSources],
  );

  // Reset & fetch first page whenever filters/search/sources change.
  useEffect(() => {
    if (!prefsLoaded) return;
    const id = ++reqId.current;
    setLoading(true);
    // No active sources selected → empty result, skip the request.
    if (activeSources.length === 0) {
      setArticles([]);
      setTotal(0);
      setOffset(0);
      setLoading(false);
      return;
    }
    fetch(buildUrl(0), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return;
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
        setOffset(data.nextOffset ?? 0);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setArticles([]);
        setTotal(0);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [buildUrl, prefsLoaded, activeSources.length]);

  const loadMore = useCallback(() => {
    if (loadingMore || articles.length >= total) return;
    setLoadingMore(true);
    const id = reqId.current;
    fetch(buildUrl(offset), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return;
        setArticles((prev) => [...prev, ...(data.articles ?? [])]);
        setOffset(data.nextOffset ?? offset);
      })
      .finally(() => setLoadingMore(false));
  }, [buildUrl, offset, loadingMore, articles.length, total]);

  const updateFilters = (next: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) / collapsible (mobile) */}
      <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
        <Filters
          filters={filters}
          onChange={updateFilters}
          hiddenSources={hidden}
          onToggleSource={toggle}
          onResetSources={() => setHidden([])}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Top bar: search + sort */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="btn-ghost lg:hidden"
          >
            {showFilters ? "Hide filters" : "Filters"}
          </button>
          <div className="relative min-w-[200px] flex-1">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search headlines & previews…"
              className="input pl-9"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              ⌕
            </span>
          </div>
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
            className="input w-auto"
            aria-label="Sort articles"
          >
            <option value="newest">Newest first</option>
            <option value="bookmarks">Most bookmarked</option>
          </select>
        </div>

        <p className="text-sm text-neutral-500">
          {loading ? "Loading…" : `${total} article${total === 1 ? "" : "s"}`}
        </p>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : articles.length === 0 ? (
          <EmptyState noSources={activeSources.length === 0} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
            {articles.length < total && (
              <div className="flex justify-center py-4">
                <button onClick={loadMore} disabled={loadingMore} className="btn-primary">
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card-surface h-56 animate-pulse bg-white/[0.03]" />
      ))}
    </div>
  );
}

function EmptyState({ noSources }: { noSources: boolean }) {
  return (
    <div className="card-surface flex flex-col items-center gap-2 p-12 text-center">
      <p className="text-lg font-medium text-neutral-300">
        {noSources ? "No sources selected" : "No articles found"}
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        {noSources
          ? "Enable at least one source in the filter panel to see articles."
          : "Try widening your filters or running a feed refresh. New articles are fetched every 30 minutes."}
      </p>
    </div>
  );
}
