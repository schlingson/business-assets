import { NextResponse } from "next/server";
import { getSourceOverview } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ sources: getSourceOverview() });
}
