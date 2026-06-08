"use client";

import { useState, useTransition } from "react";
import { syncNowAction } from "@/app/admin/actions";
import type { SyncSummary } from "@/lib/sync/run";

export function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncSummary | null>(null);

  function run() {
    startTransition(async () => {
      const summary = await syncNowAction();
      setResult(summary);
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Otomatik sonuç çekme</h3>
          <p className="text-sm text-white/60">
            football-data.org’dan canlı sonuçları çek ve herkesi puanla.
            (Vercel Cron ayrıca otomatik çalışır.)
          </p>
        </div>
        <button onClick={run} disabled={pending} className="btn-primary">
          {pending ? "Çekiliyor…" : "Şimdi senkronize et"}
        </button>
      </div>

      {result && (
        <div className="mt-3 rounded-lg bg-black/30 p-3 text-sm">
          {result.ok ? (
            <ul className="space-y-1 text-white/80">
              <li>
                Sonuçlanan gruplar:{" "}
                <strong>
                  {result.decidedGroups.length
                    ? result.decidedGroups.join(", ")
                    : "—"}
                </strong>
              </li>
              <li>
                Eleme (geçen takım sayısı): Son16 {result.knockoutCounts.r16} ·
                Çeyrek {result.knockoutCounts.qf} · Yarı{" "}
                {result.knockoutCounts.sf} · Final {result.knockoutCounts.final}{" "}
                · Şampiyon {result.knockoutCounts.champion}
              </li>
              {result.unmatched.length > 0 && (
                <li className="text-amber-300">
                  Eşleşmeyen takımlar: {result.unmatched.join(", ")} — bunları{" "}
                  <code>src/lib/sync/teamMap.ts</code> içindeki alias tablosuna
                  ekle.
                </li>
              )}
            </ul>
          ) : (
            <p className="text-red-400">{result.message ?? "Hata."}</p>
          )}
        </div>
      )}
    </div>
  );
}
