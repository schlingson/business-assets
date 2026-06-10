// Relative-time formatting for article timestamps. Pure client/server safe.

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return "just now";
  if (diff < hour) {
    const m = Math.round(diff / min);
    return `${m}m ago`;
  }
  if (diff < day) {
    const h = Math.round(diff / hour);
    return `${h}h ago`;
  }
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) {
    const d = Math.round(diff / day);
    return `${d}d ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: now - then > 365 * day ? "numeric" : undefined,
  });
}
