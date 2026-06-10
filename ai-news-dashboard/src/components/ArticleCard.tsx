"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import SourceBadge from "./SourceBadge";
import type { ArticleWithMeta } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { firstSentences } from "@/lib/text";

type Props = {
  article: ArticleWithMeta;
  onBookmarkChange?: (articleId: number, bookmarked: boolean) => void;
};

export default function ArticleCard({ article, onBookmarkChange }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(article.is_bookmarked);
  const [count, setCount] = useState(article.bookmark_count);
  const [busy, setBusy] = useState(false);

  const preview = firstSentences(article.description, 2);

  async function toggleBookmark() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !bookmarked;
    // Optimistic update.
    setBookmarked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (next) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: article.id }),
        });
      } else {
        await fetch(`/api/bookmarks/${article.id}`, { method: "DELETE" });
      }
      onBookmarkChange?.(article.id, next);
    } catch {
      // Revert on failure.
      setBookmarked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card-surface group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-white/10 hover:shadow-lift">
      {article.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt=""
          loading="lazy"
          className="h-40 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge name={article.source_name} />
          <span className="chip bg-white/5 text-neutral-300">{article.category}</span>
          {article.is_german && (
            <span className="chip bg-white/5 text-neutral-300">German News</span>
          )}
          <span className="ml-auto text-xs text-neutral-500">
            {relativeTime(article.published_at)}
          </span>
        </div>

        <h2 className="text-base font-semibold leading-snug">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-100 transition-colors hover:text-accent"
          >
            {article.title}
          </a>
        </h2>

        {preview && (
          <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">{preview}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
          >
            Read original →
          </a>
          <button
            onClick={toggleBookmark}
            disabled={busy}
            aria-pressed={bookmarked}
            title={user ? (bookmarked ? "Remove bookmark" : "Bookmark") : "Log in to bookmark"}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors ${
              bookmarked
                ? "text-accent"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <HeartIcon filled={bookmarked} />
            {count > 0 && <span className="text-xs">{count}</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
