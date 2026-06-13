import { reachedFromRaw } from "@/lib/bracket";
import { POINTS } from "@/lib/scoring";
import {
  KNOCKOUT_ROUNDS,
  type Prediction,
  type RawPrediction,
  type Team,
} from "@/lib/tournament";

type Props = {
  raw: RawPrediction;
  results: Prediction; // actual reached sets live in results.knockout
  teams: Team[];
};

// Shows, round by round, which teams the player predicted to reach that stage
// and whether each one actually got there (where the knockout points came
// from or were missed).
export function KnockoutBreakdown({ raw, results, teams }: Props) {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const predReached = reachedFromRaw(raw, teamById).knockout;
  const actualReached = results.knockout ?? ({} as Prediction["knockout"]);

  return (
    <div className="space-y-3">
      {KNOCKOUT_ROUNDS.map((r) => {
        const pred = predReached[r.key] ?? [];
        const actual = new Set((actualReached[r.key] ?? []) as string[]);
        const decided = actual.size > 0;
        const value = POINTS.knockout[r.key];

        return (
          <div key={r.key} className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{r.label}</h3>
              <span className="text-xs text-white/50">{value} puan / takım</span>
            </div>
            {pred.length === 0 ? (
              <p className="text-sm text-white/40">Tahmin yok</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {pred.map((teamId) => {
                  const team = teamById.get(teamId);
                  const correct = decided && actual.has(teamId);
                  const cls = !decided
                    ? "bg-white/10 text-white/70"
                    : correct
                    ? "bg-emerald-400 text-emerald-950"
                    : "bg-rose-400/80 text-rose-950";
                  return (
                    <span
                      key={teamId}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${cls}`}
                    >
                      <span>{team?.flag}</span>
                      <span>{team?.name}</span>
                      {decided && <span>{correct ? `+${value}` : "0"}</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
