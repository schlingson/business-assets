import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addBookmark, getArticleById, getBookmarkedArticles } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  return NextResponse.json({ articles: getBookmarkedArticles(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { articleId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const articleId = Number(body.articleId);
  if (!articleId || !getArticleById(articleId)) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  addBookmark(user.id, articleId);
  return NextResponse.json({ ok: true });
}
