"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { useAuth } from "@/components/AuthProvider";
import type { ArticleWithMeta } from "@/lib/types";

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<ArticleWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/bookmarks", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleChange = useCallback((articleId: number, bookmarked: boolean) => {
    if (!bookmarked) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    }
  }, []);

  const exportMarkdown = () => {
    const lines = [
      "# AI News Bookmarks",
      "",
      `_Exported ${new Date().toLocaleDateString()}_`,
      "",
      ...articles.map(
        (a) =>
          `- [${a.title}](${a.link}) — *${a.source_name}* (${new Date(
            a.published_at,
          ).toLocaleDateString()})`,
      ),
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-news-bookmarks.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
        <h1 className="text-xl font-semibold">Bookmarks require an account</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          Sign up or log in to save articles and access them from anywhere.
        </p>
        <div className="flex gap-2">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Bookmarks{" "}
          <span className="text-sm font-normal text-neutral-500">({articles.length})</span>
        </h1>
        {articles.length > 0 && (
          <button onClick={exportMarkdown} className="btn-ghost">
            Export as Markdown
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-2 p-12 text-center">
          <p className="text-lg font-medium text-neutral-300">No bookmarks yet</p>
          <p className="text-sm text-neutral-500">
            Tap the heart on any article in the{" "}
            <Link href="/" className="text-accent hover:underline">
              feed
            </Link>{" "}
            to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} onBookmarkChange={handleChange} />
          ))}
        </div>
      )}
    </div>
  );
}
