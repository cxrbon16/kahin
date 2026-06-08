import { GROUP_CODES, type Team } from "@/lib/tournament";

type Props = {
  groups: Record<string, string[]>;
  teams: Team[];
};

// Read-only rendering of a player's group standings prediction.
export function GroupStandingsView({ groups, teams }: Props) {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {GROUP_CODES.map((code) => {
        const order = groups[code] ?? [];
        return (
          <div key={code} className="card">
            <h3 className="mb-2 font-semibold">{code} Grubu</h3>
            <ol className="space-y-1">
              {order.length === 0 && (
                <li className="text-sm text-white/40">Tahmin yok</li>
              )}
              {order.map((teamId, i) => {
                const team = teamById.get(teamId);
                const advances = i < 2;
                return (
                  <li
                    key={teamId}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                      advances ? "bg-emerald-500/15" : "bg-white/5"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded text-xs font-bold ${
                        advances
                          ? "bg-emerald-400 text-emerald-950"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-lg">{team?.flag}</span>
                    <span className="flex-1 truncate">{team?.name}</span>
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
