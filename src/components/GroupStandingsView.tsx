import { GROUP_CODES, type Team } from "@/lib/tournament";
import { POINTS } from "@/lib/scoring";

type Props = {
  groups: Record<string, string[]>;
  teams: Team[];
  // Actual group standings, if known. When provided, each predicted team is
  // annotated with the points it earned (exact slot / advancement) or missed.
  results?: Record<string, string[]>;
};

// Read-only rendering of a player's group standings prediction, optionally
// annotated with where points were earned vs missed.
export function GroupStandingsView({ groups, teams, results }: Props) {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {GROUP_CODES.map((code) => {
        const order = groups[code] ?? [];
        const actual = results?.[code] ?? [];
        const decided = actual.length > 0;
        const actualTop2 = new Set(actual.slice(0, 2));

        return (
          <div key={code} className="card">
            <h3 className="mb-2 font-semibold">{code} Grubu</h3>
            <ol className="space-y-1">
              {order.length === 0 && (
                <li className="text-sm text-white/40">Tahmin yok</li>
              )}
              {order.map((teamId, i) => {
                const team = teamById.get(teamId);
                const predAdvances = i < 2;

                const exact = decided && actual[i] === teamId;
                const adv = decided && i < 2 && actualTop2.has(teamId);
                const pts =
                  (exact ? POINTS.groupExactPosition : 0) +
                  (adv ? POINTS.groupAdvance : 0);
                const actualPos = decided ? actual.indexOf(teamId) : -1;

                let rowCls = predAdvances ? "bg-emerald-500/15" : "bg-white/5";
                if (decided) {
                  rowCls = pts > 0 ? "bg-emerald-500/15" : "bg-rose-500/10";
                }

                return (
                  <li
                    key={teamId}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${rowCls}`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded text-xs font-bold ${
                        predAdvances
                          ? "bg-emerald-400 text-emerald-950"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-lg">{team?.flag}</span>
                    <span className="flex-1 truncate">{team?.name}</span>

                    {decided ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs">
                        {actualPos >= 0 && actualPos !== i && (
                          <span className="text-white/40">
                            gerçek {actualPos + 1}.
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            pts > 0
                              ? "bg-emerald-400 text-emerald-950"
                              : "bg-rose-400/80 text-rose-950"
                          }`}
                        >
                          {pts > 0 ? `+${pts}` : "0"}
                        </span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-white/30">
                        bekliyor
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
