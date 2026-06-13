import { createAdminClient } from "../supabase/admin";
import { emptyReached, GROUP_CODES, type KnockoutKey, type Team } from "../tournament";
import { fetchMatches, fetchStandings, type FdTeam } from "./footballData";
import { buildTeamResolver } from "./teamMap";

export type SyncSummary = {
  ok: boolean;
  decidedGroups: string[];
  knockoutCounts: Record<KnockoutKey, number>;
  champion: string | null;
  unmatched: string[]; // provider team names we could not map
  message?: string;
};

// Normalize a provider label to UPPER_SNAKE so we match regardless of whether
// the API sends "GROUP_A", "Group A", "Last 16", etc.
function norm(label: string | null | undefined): string {
  return (label ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

// Provider group label -> our group code letter (A..L).
function groupCode(label: string | null | undefined): string {
  return norm(label).replace(/^GROUP_/, "");
}

// Football-data stage -> the knockout round a participating team has "reached".
const STAGE_TO_ROUND: Record<string, KnockoutKey> = {
  LAST_32: "r32",
  ROUND_OF_32: "r32",
  LAST_16: "r16",
  ROUND_OF_16: "r16",
  QUARTER_FINALS: "qf",
  QUARTER_FINAL: "qf",
  SEMI_FINALS: "sf",
  SEMI_FINAL: "sf",
  FINAL: "final",
};

// Fetches live results from the provider, maps them onto our teams, and writes
// the singleton `results` row. Group order is taken only for fully-played
// groups; knockout "reached" sets are derived from who appears in each round's
// matches; the champion is the winner of the final.
export async function runSync(): Promise<SyncSummary> {
  const supabase = createAdminClient();

  const { data: teamRows, error: teamErr } = await supabase
    .from("teams")
    .select("id, name, flag, group_code");
  if (teamErr) throw teamErr;
  const teams = (teamRows ?? []) as Team[];
  const resolve = buildTeamResolver(teams);
  const groupByTeam = new Map(teams.map((t) => [t.id, t.group_code]));

  const unmatched = new Set<string>();
  const resolveOrTrack = (t: FdTeam): string | null => {
    const id = resolve(t.tla, t.name);
    if (!id && (t.name || t.tla)) unmatched.add(t.name ?? t.tla ?? "?");
    return id;
  };

  const [standings, matches] = await Promise.all([
    fetchStandings(),
    fetchMatches(),
  ]);

  // --- Group standings: emit the CURRENT (provisional) order as soon as a
  // group has kicked off, so points accrue live as matches are played. The
  // order finalises once all three matchdays are complete.
  const groups: Record<string, string[]> = {};
  for (const s of standings) {
    if (s.type !== "TOTAL" || !s.group) continue;
    const code = groupCode(s.group);
    if (!GROUP_CODES.includes(code as (typeof GROUP_CODES)[number])) continue;

    const started =
      s.table.length === 4 && s.table.some((r) => r.playedGames > 0);
    if (!started) continue;

    const ordered = [...s.table]
      .sort((a, b) => a.position - b.position)
      .map((r) => resolveOrTrack(r.team))
      .filter((id): id is string => Boolean(id) && groupByTeam.get(id!) === code);
    if (ordered.length === 4) groups[code] = ordered;
  }

  // --- Knockout: a team that appears in a round's match has reached that round.
  const reached: Record<KnockoutKey, Set<string>> = {
    r32: new Set(),
    r16: new Set(),
    qf: new Set(),
    sf: new Set(),
    final: new Set(),
    champion: new Set(),
  };

  for (const m of matches) {
    const stage = norm(m.stage);
    const round = STAGE_TO_ROUND[stage];
    if (!round) continue;
    for (const t of [m.homeTeam, m.awayTeam]) {
      const id = resolveOrTrack(t);
      if (id) reached[round].add(id);
    }
    // Champion = winner of the final.
    if (stage === "FINAL" && m.status === "FINISHED" && m.score.winner) {
      const winner = m.score.winner === "HOME_TEAM" ? m.homeTeam : m.awayTeam;
      const id = resolveOrTrack(winner);
      if (id) reached.champion.add(id);
    }
  }

  const knockout = emptyReached();
  knockout.r32 = [...reached.r32];
  knockout.r16 = [...reached.r16];
  knockout.qf = [...reached.qf];
  knockout.sf = [...reached.sf];
  knockout.final = [...reached.final];
  knockout.champion = [...reached.champion];

  const knockoutCounts = {
    r32: knockout.r32.length,
    r16: knockout.r16.length,
    qf: knockout.qf.length,
    sf: knockout.sf.length,
    final: knockout.final.length,
    champion: knockout.champion.length,
  } satisfies Record<KnockoutKey, number>;

  // Preserve the `locked` flag — only update results data.
  const { error: upErr } = await supabase
    .from("results")
    .update({ groups, knockout, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (upErr) throw upErr;

  return {
    ok: true,
    decidedGroups: Object.keys(groups).sort(),
    knockoutCounts,
    champion: knockout.champion[0] ?? null,
    unmatched: [...unmatched].sort(),
  };
}
