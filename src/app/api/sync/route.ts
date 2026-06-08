import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is set.
// Also callable manually with ?secret=<CRON_SECRET>.
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runSync();
    return NextResponse.json(summary);
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
