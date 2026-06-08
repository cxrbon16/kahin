import { ANNEX_C, THIRD_MATCH_ORDER } from "./annexC";
import { SCHEDULE, type Match, type Slot } from "./schedule";
import {
  BEST_THIRDS,
  emptyReached,
  type Prediction,
  type RawPrediction,
  type ReachedSets,
  type Team,
} from "./tournament";

export const MATCH_BY_NO = new Map<number, Match>(SCHEDULE.map((m) => [m.no, m]));

// Match numbers per knockout round (from the fixed schedule).
export const R32_MATCHES = SCHEDULE.filter((m) => m.stage === "r32").map((m) => m.no);
export const R16_MATCHES = SCHEDULE.filter((m) => m.stage === "r16").map((m) => m.no);
export const QF_MATCHES = SCHEDULE.filter((m) => m.stage === "qf").map((m) => m.no);
export const SF_MATCHES = SCHEDULE.filter((m) => m.stage === "sf").map((m) => m.no);
export const FINAL_NO = 104;
export const THIRD_PLACE_NO = 103;

// The two bracket roots (semi-finals) that meet at the final, for the
// mirrored left/right tree layout.
export const LEFT_ROOT = 101;
export const RIGHT_ROOT = 102;

// The eight R32 matches that take a third-placed team, with their group pool.
export const THIRD_SLOTS = SCHEDULE.flatMap((m) => {
  const slot = [m.a, m.b].find((s) => s.kind === "third");
  return slot && slot.kind === "third"
    ? [{ no: m.no, pool: slot.groups }]
    : [];
});

export type ResolvedSlot = {
  team: Team | null;
  label: string;
  sub?: string;
};

// Lightweight, non-recursive slot resolver for simple lists (e.g. the matches
// tab): resolves known teams and group positions, otherwise returns a label.
export function resolveSlot(
  slot: Slot,
  groups: Record<string, string[]>,
  teamById: Map<string, Team>,
): ResolvedSlot {
  switch (slot.kind) {
    case "team":
      return { team: teamById.get(slot.teamId) ?? null, label: slot.teamId };
    case "pos": {
      const id = groups[slot.group]?.[slot.pos - 1];
      return {
        team: id ? teamById.get(id) ?? null : null,
        label: `${slot.group}${slot.pos}`,
      };
    }
    case "third":
      return { team: null, label: "3.", sub: slot.groups.join("/") };
    case "winner":
      return { team: null, label: `M${slot.match}`, sub: "galibi" };
    case "loser":
      return { team: null, label: `M${slot.match}`, sub: "mağlup" };
  }
}

export type ResolvedMatch = {
  a: ResolvedSlot;
  b: ResolvedSlot;
  winnerId: string | null;
};

// Assigns the chosen best-third teams to the third-place R32 slots using the
// official FIFA Annex C table (495 combinations). Returns matchNo -> third
// teamId. Falls back to a valid pool-respecting matching only if a combination
// is somehow missing from the table.
export function assignThirds(
  groups: Record<string, string[]>,
  thirds: string[],
  teamById: Map<string, Team>,
): Map<number, string> {
  const result = new Map<number, string>();
  // group -> its third-placed teamId, limited to chosen groups
  const groupThird = new Map<string, string>();
  for (const id of thirds) {
    const g = teamById.get(id)?.group_code;
    if (g) groupThird.set(g, id);
  }
  const chosenGroups = [...groupThird.keys()];
  if (chosenGroups.length !== BEST_THIRDS) return result; // not 8 chosen yet

  const key = [...chosenGroups].sort().join("");
  const assignment = ANNEX_C[key];
  if (assignment) {
    THIRD_MATCH_ORDER.forEach((matchNo, i) => {
      const teamId = groupThird.get(assignment[i]);
      if (teamId) result.set(matchNo, teamId);
    });
    return result;
  }

  return assignThirdsFallback(groupThird);
}

// Backtracking perfect matching against the slot group pools, used only if a
// combination is unexpectedly absent from the Annex C table.
function assignThirdsFallback(
  groupThird: Map<string, string>,
): Map<number, string> {
  const result = new Map<number, string>();
  const used = new Set<string>();
  const assign = new Map<number, string>();
  function backtrack(i: number): boolean {
    if (i === THIRD_SLOTS.length) return true;
    const slot = THIRD_SLOTS[i];
    for (const g of slot.pool) {
      if (groupThird.has(g) && !used.has(g)) {
        used.add(g);
        assign.set(slot.no, g);
        if (backtrack(i + 1)) return true;
        used.delete(g);
        assign.delete(slot.no);
      }
    }
    return false;
  }
  if (!backtrack(0)) return result;
  for (const [no, g] of assign) result.set(no, groupThird.get(g)!);
  return result;
}

type Ctx = {
  groups: Record<string, string[]>;
  teamById: Map<string, Team>;
  thirdByMatch: Map<number, string>;
  winners: Record<string, string>;
  memo: Map<number, ResolvedMatch>;
};

export function makeBracket(
  groups: Record<string, string[]>,
  thirds: string[],
  winners: Record<string, string>,
  teamById: Map<string, Team>,
) {
  const ctx: Ctx = {
    groups,
    teamById,
    thirdByMatch: assignThirds(groups, thirds, teamById),
    winners,
    memo: new Map(),
  };

  function resolveSlot(slot: Slot, matchNo: number): ResolvedSlot {
    switch (slot.kind) {
      case "team":
        return { team: ctx.teamById.get(slot.teamId) ?? null, label: slot.teamId };
      case "pos": {
        const id = ctx.groups[slot.group]?.[slot.pos - 1];
        return {
          team: id ? ctx.teamById.get(id) ?? null : null,
          label: `${slot.group}${slot.pos}`,
        };
      }
      case "third": {
        const id = ctx.thirdByMatch.get(matchNo);
        return {
          team: id ? ctx.teamById.get(id) ?? null : null,
          label: "3.",
          sub: slot.groups.join("/"),
        };
      }
      case "winner": {
        const w = resolveMatch(slot.match).winnerId;
        return {
          team: w ? ctx.teamById.get(w) ?? null : null,
          label: `M${slot.match}`,
          sub: "galibi",
        };
      }
      case "loser": {
        const r = resolveMatch(slot.match);
        const loser =
          r.winnerId && r.a.team && r.b.team
            ? r.winnerId === r.a.team.id
              ? r.b.team.id
              : r.a.team.id
            : null;
        return {
          team: loser ? ctx.teamById.get(loser) ?? null : null,
          label: `M${slot.match}`,
          sub: "mağlup",
        };
      }
    }
  }

  function resolveMatch(no: number): ResolvedMatch {
    const cached = ctx.memo.get(no);
    if (cached) return cached;
    const m = MATCH_BY_NO.get(no)!;
    // placeholder to guard against cycles (there are none, but be safe)
    const placeholder: ResolvedMatch = {
      a: { team: null, label: "" },
      b: { team: null, label: "" },
      winnerId: null,
    };
    ctx.memo.set(no, placeholder);
    const a = resolveSlot(m.a, no);
    const b = resolveSlot(m.b, no);
    const picked = ctx.winners[no];
    // Honour a pick only if that team is actually one of the two participants.
    const winnerId =
      picked && (picked === a.team?.id || picked === b.team?.id) ? picked : null;
    const resolved: ResolvedMatch = { a, b, winnerId };
    ctx.memo.set(no, resolved);
    return resolved;
  }

  return { resolveMatch };
}

// Derives the canonical reached-set prediction from a raw bracket prediction,
// so the existing scorer can compare it against actual results.
export function reachedFromRaw(
  raw: RawPrediction,
  teamById: Map<string, Team>,
): Prediction {
  const groups = raw.groups ?? {};
  const { resolveMatch } = makeBracket(
    groups,
    raw.thirds ?? [],
    raw.winners ?? {},
    teamById,
  );

  const knockout: ReachedSets = emptyReached();

  // Round of 32 participants = top 2 of every group + the chosen thirds.
  const r32 = new Set<string>();
  for (const g of Object.keys(groups)) {
    const arr = groups[g] ?? [];
    if (arr[0]) r32.add(arr[0]);
    if (arr[1]) r32.add(arr[1]);
  }
  for (const t of raw.thirds ?? []) r32.add(t);
  knockout.r32 = [...r32];

  const winnersOf = (nos: number[]) =>
    nos.map((n) => resolveMatch(n).winnerId).filter((x): x is string => Boolean(x));

  knockout.r16 = winnersOf(R32_MATCHES);
  knockout.qf = winnersOf(R16_MATCHES);
  knockout.sf = winnersOf(QF_MATCHES);
  knockout.final = winnersOf(SF_MATCHES);
  const champ = resolveMatch(FINAL_NO).winnerId;
  knockout.champion = champ ? [champ] : [];

  return { groups, knockout };
}
