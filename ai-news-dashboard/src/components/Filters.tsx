"use client";

import { SOURCES } from "@/lib/sources";
import { CATEGORIES } from "@/lib/categorize";
import type { SortOption, TimeRange } from "@/lib/types";

export type FilterState = {
  category: string | null;
  range: TimeRange;
  sort: SortOption;
};

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

type Props = {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  hiddenSources: string[];
  onToggleSource: (name: string) => void;
  onResetSources: () => void;
};

export default function Filters({
  filters,
  onChange,
  hiddenSources,
  onToggleSource,
  onResetSources,
}: Props) {
  return (
    <aside className="card-surface flex flex-col gap-6 p-4 lg:sticky lg:top-[4.5rem]">
      {/* Category */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Category
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange({ category: null })}
            className={`chip ${
              filters.category === null
                ? "bg-accent text-white"
                : "bg-white/5 text-neutral-300 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange({ category: cat })}
              className={`chip ${
                filters.category === cat
                  ? "bg-accent text-white"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Time range */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Time range
        </h3>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onChange({ range: r.value })}
              className={`chip ${
                filters.range === r.value
                  ? "bg-accent text-white"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sources
          </h3>
          {hiddenSources.length > 0 && (
            <button
              onClick={onResetSources}
              className="text-xs text-accent hover:underline"
            >
              Select all
            </button>
          )}
        </div>
        <ul className="flex flex-col gap-1.5">
          {SOURCES.map((s) => {
            const active = !hiddenSources.includes(s.name);
            return (
              <li key={s.name}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggleSource(s.name)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
