import Link from "next/link";
import {
  getProfileName,
  getRawPrediction,
  getResults,
  getTeams,
  scoreRaw,
} from "@/lib/data";
import { GroupStandingsView } from "@/components/GroupStandingsView";
import { KnockoutBreakdown } from "@/components/KnockoutBreakdown";
import { BracketTree } from "@/components/BracketTree";
import { KNOCKOUT_ROUNDS } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const [teams, raw, name, results] = await Promise.all([
    getTeams(),
    getRawPrediction(params.id),
    getProfileName(params.id),
    getResults(),
  ]);

  const score = scoreRaw(raw, results, teams);
  const hasPrediction =
    Object.keys(raw.groups).length > 0 || Object.keys(raw.winners).length > 0;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/leaderboard" className="text-sm text-white/50 hover:text-white">
          ← Sıralama
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{name ?? "Oyuncu"}</h1>
        <p className="text-sm text-white/60">Tahminleri ve puan kırılımı</p>
      </div>

      {!hasPrediction ? (
        <div className="card text-sm text-white/60">
          Bu oyuncu henüz tahmin yapmamış.
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-lg font-bold text-emerald-400">
              {score.total} puan
            </span>
            <span>Grup: {score.groupExact + score.groupAdvance}</span>
            {KNOCKOUT_ROUNDS.map((r) => (
              <span key={r.key} className="text-white/70">
                {r.label}: {score.knockout[r.key]}
              </span>
            ))}
          </div>

          {/* Colour legend for the annotated breakdown below */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
            <span className="font-medium text-white/70">Renkler:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-400" /> puan aldı
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-400/80" /> puan yok
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-white/15" /> henüz belli değil
            </span>
          </div>

          <section>
            <h2 className="mb-3 text-xl font-bold">Grup sıralamaları</h2>
            <GroupStandingsView
              groups={raw.groups}
              teams={teams}
              results={results.groups}
            />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Eleme turları — puan kırılımı</h2>
            <p className="mb-3 text-sm text-white/50">
              Her turda oyuncunun o aşamaya taşıdığı takımlar ve gerçekten
              ulaşıp ulaşmadıkları.
            </p>
            <KnockoutBreakdown raw={raw} results={results} teams={teams} />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Eleme ağacı</h2>
            <BracketTree
              teams={teams}
              groups={raw.groups}
              thirds={raw.thirds}
              winners={raw.winners}
            />
          </section>
        </>
      )}
    </div>
  );
}
