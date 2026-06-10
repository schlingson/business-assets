import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHiddenSources, setHiddenSources } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ hiddenSources: [] });
  return NextResponse.json({ hiddenSources: getHiddenSources(user.id) });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { hiddenSources?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const hidden = Array.isArray(body.hiddenSources)
    ? body.hiddenSources.filter((x): x is string => typeof x === "string")
    : [];

  setHiddenSources(user.id, hidden);
  return NextResponse.json({ hiddenSources: hidden });
}
