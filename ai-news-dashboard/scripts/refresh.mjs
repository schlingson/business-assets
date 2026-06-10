#!/usr/bin/env node
/**
 * Triggers a feed refresh against a running instance of the dashboard.
 *
 * Usage:
 *   node scripts/refresh.mjs                 # uses BASE_URL or http://localhost:3000
 *   BASE_URL=https://my-app node scripts/refresh.mjs
 *
 * Honors CRON_SECRET (sent as a Bearer token). Intended for a system crontab:
 *   *\/30 * * * * cd /path/to/app && node scripts/refresh.mjs >> /var/log/news.log 2>&1
 */

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;

const url = `${baseUrl}/api/cron/refresh`;
const headers = { "Content-Type": "application/json" };
if (secret) headers.Authorization = `Bearer ${secret}`;

try {
  const res = await fetch(url, { method: "POST", headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Refresh failed (HTTP ${res.status}):`, data);
    process.exit(1);
  }
  const ok = data.results?.filter((r) => r.ok).length ?? 0;
  const failed = data.results?.filter((r) => !r.ok) ?? [];
  console.log(
    `Refreshed ${ok} source(s) in ${data.durationMs}ms — ` +
      `${data.inserted} new article(s), ${data.pruned} pruned.`,
  );
  for (const f of failed) console.warn(`  ! ${f.source}: ${f.error}`);
} catch (err) {
  console.error("Could not reach the dashboard:", err.message);
  console.error(`Is the server running at ${baseUrl}?`);
  process.exit(1);
}
