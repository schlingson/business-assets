import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeBookmark } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { articleId } = await params;
  const id = Number(articleId);
  if (!id) return NextResponse.json({ error: "Invalid article id." }, { status: 400 });

  removeBookmark(user.id, id);
  return NextResponse.json({ ok: true });
}
