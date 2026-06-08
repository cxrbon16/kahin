"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { runSync, type SyncSummary } from "@/lib/sync/run";

// Lets an authenticated admin trigger a result sync from the admin page,
// without needing the cron secret.
export async function syncNowAction(): Promise<SyncSummary> {
  const { isAdmin } = await getSessionUser();
  if (!isAdmin) {
    return {
      ok: false,
      decidedGroups: [],
      knockoutCounts: { r32: 0, r16: 0, qf: 0, sf: 0, final: 0, champion: 0 },
      champion: null,
      unmatched: [],
      message: "Yetkisiz.",
    };
  }
  try {
    const summary = await runSync();
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/");
    return summary;
  } catch (e) {
    return {
      ok: false,
      decidedGroups: [],
      knockoutCounts: { r32: 0, r16: 0, qf: 0, sf: 0, final: 0, champion: 0 },
      champion: null,
      unmatched: [],
      message: e instanceof Error ? e.message : "Senkronizasyon başarısız.",
    };
  }
}
