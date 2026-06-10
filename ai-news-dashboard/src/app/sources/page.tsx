"use client";

import { useEffect, useState } from "react";
import { useHiddenSources } from "@/components/useHiddenSources";
import { SOURCE_BY_NAME } from "@/lib/sources";
import { relativeTime } from "@/lib/time";

type SourceOverview = {
  id: number;
  name: string;
  feed_url: string;
  description: string;
  is_active: number;
  last_fetched_at: string | null;
  article_count: number;
};

export default function SourcesPage() {
  const { hidden, toggle } = useHiddenSources();
  const [sources, setSources] = useState<SourceOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSources(data.sources ?? []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Sources</h1>
        <p className="text-sm text-neutral-500">
          {sources.length} feeds aggregated. Toggle any source on or off — your choice is
          remembered.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-3">
          {sources.map((s) => {
            const meta = SOURCE_BY_NAME.get(s.name);
            const enabled = !hidden.includes(s.name);
            return (
              <div key={s.id} className="card-surface flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: meta?.color ?? "#3B82F6",
                      color: meta?.textColor ?? "#fff",
                    }}
                  >
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{s.name}</h2>
                    <p className="text-xs text-neutral-500">
                      {s.last_fetched_at
                        ? `Updated ${relativeTime(s.last_fetched_at)}`
                        : "Not fetched yet"}
                    </p>
                  </div>
                  <Toggle enabled={enabled} onClick={() => toggle(s.name)} />
                </div>

                <p className="text-sm leading-relaxed text-neutral-400">{s.description}</p>

                <div className="mt-auto flex items-center justify-between pt-1 text-xs text-neutral-500">
                  <span>
                    <strong className="text-neutral-300">{s.article_count}</strong> articles
                  </span>
                  {meta && (
                    <a
                      href={meta.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Visit site →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle source"
      className={`relative ml-auto h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function initials(name: string): string {
  return name
    .replace(/AI|KI/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
