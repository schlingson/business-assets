import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryArticles } from "@/lib/queries";
import type { SortOption, TimeRange } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();

  const sourcesParam = searchParams.get("sources");
  const sources = sourcesParam
    ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const category = searchParams.get("category");
  const range = (searchParams.get("range") as TimeRange | null) ?? "all";
  const search = searchParams.get("search") ?? "";
  const sort = (searchParams.get("sort") as SortOption | null) ?? "newest";
  const limit = Number(searchParams.get("limit") ?? 24);
  const offset = Number(searchParams.get("offset") ?? 0);

  const { articles, total } = queryArticles({
    sources,
    category: category || null,
    range,
    search,
    sort,
    limit: Number.isFinite(limit) ? limit : 24,
    offset: Number.isFinite(offset) ? offset : 0,
    userId: user?.id ?? null,
  });

  return NextResponse.json({
    articles,
    total,
    nextOffset: offset + articles.length,
    hasMore: offset + articles.length < total,
  });
}
