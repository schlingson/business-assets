# AI News Dashboard

Aggregates RSS feeds from the biggest AI & tech news sources into one clean,
filterable, dark-mode interface. Built with **Next.js (App Router)**,
**TypeScript**, **Tailwind CSS** and **SQLite**.

## Features

- **Feed / Home** (no auth) — responsive card grid (3 / 2 / 1 columns), per-source
  colored badges, relative timestamps, 2-sentence previews, auto-assigned category
  tags, bookmark hearts. Filter by source, category and time range; full-text search
  across headlines + previews; sort by newest or most-bookmarked; "Load more" paging.
- **Bookmarks** (auth) — saved articles in the same card layout, remove button, and
  one-click **export to Markdown**.
- **Sources** (no auth) — overview of all 12 feeds with description, article count,
  last-updated time, and on/off toggles (localStorage for guests, DB for users).
- **Dashboard / Stats** (no auth) — today's numbers (new articles, most active source,
  trending category), a 7-day articles-per-source bar chart, and a headline word cloud.
- **Auth** — optional email + password sign up / log in (bcrypt + JWT session cookie).
  The feed is fully usable logged-out.
- **Scheduled ingestion** — fetches all 12 feeds via the rss2json proxy, dedupes by
  URL, auto-categorizes, and prunes articles older than 90 days.

## Quick start

```bash
cd ai-news-dashboard
cp .env.example .env        # set AUTH_SECRET and CRON_SECRET
npm install
npm run dev                 # http://localhost:3000
```

On first run the SQLite database (`data/news.db`) and the 12 sources are created
automatically.

### Get some articles

Real data (requires outbound access to `api.rss2json.com`) — with the dev server running:

```bash
CRON_SECRET=... npm run refresh     # triggers POST /api/cron/refresh
```

Offline / demo data (no network needed):

```bash
npm run db:seed   # -> node scripts/seed-demo.mjs
```

## Auto-categorization

On insert each article is scored by keyword matches in its title + description and
assigned one primary category: **Models & Research**, **Products & Launches**,
**Business & Funding**, **Policy & Ethics**, or **Tutorials & Tools**. Articles from
**t3n** and **Heise** additionally carry the **German News** tag (their primary
category is preserved). See `src/lib/categorize.ts`.

## Scheduled refresh (every 30 min)

The ingestion lives behind `POST /api/cron/refresh` (protected by `CRON_SECRET`).
Pick whichever scheduler fits your deployment:

- **Vercel** — `vercel.json` already declares a `*/30 * * * *` cron.
- **System crontab** — point it at the running server:
  ```
  */30 * * * * cd /path/to/ai-news-dashboard && CRON_SECRET=... node scripts/refresh.mjs
  ```
- **Manual** — `curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/refresh`

## Environment variables

| Var | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signs auth session JWTs. Use a long random string in production. |
| `CRON_SECRET` | Bearer token required to trigger feed refresh. |
| `DATABASE_PATH` | Optional. Absolute path to the SQLite file (default `data/news.db`). |
| `RSS2JSON_API_KEY` | Optional. rss2json API key for higher rate limits. |

## Project structure

```
src/
  app/
    api/            route handlers (articles, bookmarks, auth, sources,
                    preferences, stats, cron/refresh)
    page.tsx        Home feed
    bookmarks/      Bookmarks page
    sources/        Sources page
    dashboard/      Stats page
    login, signup/  Auth pages
  components/        Nav, ArticleCard, Filters, SourceBadge, AuthForm, AuthProvider…
  lib/              db, sources, categorize, feeds, queries, auth, text, time
scripts/            refresh.mjs (cron trigger), seed-demo.mjs (offline sample data)
```

## Data model

`articles`, `bookmarks`, `sources`, `user_preferences` (plus a `users` table for
auth). Schema is created on boot in `src/lib/db.ts`.

> **Note on deployment:** the default SQLite file works great for a single
> long-running Node server (a VPS, Fly.io, Render, a container, etc.). On
> ephemeral/serverless filesystems set `DATABASE_PATH` to a mounted volume, or
> swap the thin data layer in `src/lib/db.ts`/`queries.ts` for a hosted database.
