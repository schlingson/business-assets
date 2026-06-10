import { NextResponse } from "next/server";
import { refreshAllFeeds } from "@/lib/feeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes — fetching 12 feeds sequentially can be slow.
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow (useful for local dev).
  if (!secret) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  // Vercel cron sends this header.
  if (req.headers.get("x-vercel-cron")) return true;

  return false;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const only = searchParams.get("source") || undefined;

  const started = Date.now();
  const { results, pruned } = await refreshAllFeeds(only);
  const inserted = results.reduce((sum, r) => sum + r.inserted, 0);

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - started,
    inserted,
    pruned,
    results,
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
