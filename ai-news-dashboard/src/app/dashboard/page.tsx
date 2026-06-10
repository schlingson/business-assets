"use client";

import { useEffect, useState } from "react";
import { SOURCE_BY_NAME } from "@/lib/sources";

type Stats = {
  todayCount: number;
  mostActiveSource: { name: string; count: number } | null;
  trendingCategory: { name: string; count: number } | null;
  perSource: { source: string; count: number }[];
  topWords: { word: string; count: number }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!stats) return <p className="text-sm text-neutral-500">Stats unavailable.</p>;

  const maxSource = Math.max(1, ...stats.perSource.map((s) => s.count));
  const maxWord = Math.max(1, ...stats.topWords.map((w) => w.count));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Today's numbers */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="New articles today" value={String(stats.todayCount)} />
        <StatCard
          label="Most active source"
          value={stats.mostActiveSource?.name ?? "—"}
          sub={
            stats.mostActiveSource
              ? `${stats.mostActiveSource.count} today`
              : "No articles yet"
          }
        />
        <StatCard
          label="Trending category"
          value={stats.trendingCategory?.name ?? "—"}
          sub={
            stats.trendingCategory
              ? `${stats.trendingCategory.count} this week`
              : "No articles yet"
          }
        />
      </section>

      {/* Articles per source */}
      <section className="card-surface p-5">
        <h2 className="mb-4 font-semibold">Articles per source — last 7 days</h2>
        {stats.perSource.length === 0 ? (
          <p className="text-sm text-neutral-500">No articles in the last week.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {stats.perSource.map((s) => {
              const meta = SOURCE_BY_NAME.get(s.source);
              return (
                <div key={s.source} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate text-neutral-400">{s.source}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${(s.count / maxSource) * 100}%`,
                        backgroundColor: meta?.color ?? "#3B82F6",
                        minWidth: "2px",
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums text-neutral-300">
                    {s.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top words */}
      <section className="card-surface p-5">
        <h2 className="mb-4 font-semibold">Most frequent headline words — this week</h2>
        {stats.topWords.length === 0 ? (
          <p className="text-sm text-neutral-500">Not enough data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.topWords.map((w) => {
              const scale = 0.8 + (w.count / maxWord) * 1.2; // 0.8rem – 2rem
              return (
                <span
                  key={w.word}
                  className="rounded-lg bg-white/5 px-2.5 py-1 leading-none text-neutral-200"
                  style={{ fontSize: `${scale}rem` }}
                  title={`${w.count} mentions`}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold text-neutral-100">{value}</p>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}
