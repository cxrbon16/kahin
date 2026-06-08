import {
  GROUP_CODES,
  KNOCKOUT_ROUNDS,
  TEAMS_PER_GROUP,
  type KnockoutKey,
  type Prediction,
} from "./tournament";

// Scoring configuration. Tune freely — all points live here.
export const POINTS = {
  groupExactPosition: 3, // predicted team finishes in the exact group position
  groupAdvance: 1, // bonus: predicted team is in the top 2 (advances) regardless of exact slot
  knockout: {
    r32: 1,
    r16: 2,
    qf: 4,
    sf: 7,
    final: 12,
    champion: 25,
  } satisfies Record<KnockoutKey, number>,
} as const;

export type ScoreBreakdown = {
  groupExact: number;
  groupAdvance: number;
  knockout: Record<KnockoutKey, number>;
  total: number;
};

function safeGroups(p: Partial<Prediction> | null | undefined) {
  return (p?.groups ?? {}) as Record<string, string[]>;
}

function safeKnockout(p: Partial<Prediction> | null | undefined) {
  return (p?.knockout ?? {}) as Record<string, string[]>;
}

// Compares one prediction against the actual results and returns a breakdown.
export function scorePrediction(
  prediction: Partial<Prediction> | null | undefined,
  results: Partial<Prediction> | null | undefined,
): ScoreBreakdown {
  const predGroups = safeGroups(prediction);
  const resGroups = safeGroups(results);
  const predKo = safeKnockout(prediction);
  const resKo = safeKnockout(results);

  let groupExact = 0;
  let groupAdvance = 0;

  for (const g of GROUP_CODES) {
    const pred = predGroups[g] ?? [];
    const actual = resGroups[g] ?? [];
    if (actual.length === 0) continue; // group not decided yet

    for (let pos = 0; pos < TEAMS_PER_GROUP; pos++) {
      const team = pred[pos];
      if (!team) continue;
      if (actual[pos] === team) {
        groupExact += POINTS.groupExactPosition;
      }
    }

    // Advancement bonus: top 2 teams correctly predicted as top 2 (order-agnostic).
    const predTop2 = new Set((pred.slice(0, 2)).filter(Boolean));
    const actualTop2 = new Set(actual.slice(0, 2).filter(Boolean));
    for (const t of predTop2) {
      if (actualTop2.has(t)) groupAdvance += POINTS.groupAdvance;
    }
  }

  const knockout = {} as Record<KnockoutKey, number>;
  for (const round of KNOCKOUT_ROUNDS) {
    const pred = new Set((predKo[round.key] ?? []).filter(Boolean));
    const actual = new Set((resKo[round.key] ?? []).filter(Boolean));
    let pts = 0;
    if (actual.size > 0) {
      for (const t of pred) {
        if (actual.has(t)) pts += POINTS.knockout[round.key];
      }
    }
    knockout[round.key] = pts;
  }

  const koTotal = Object.values(knockout).reduce((a, b) => a + b, 0);
  const total = groupExact + groupAdvance + koTotal;

  return { groupExact, groupAdvance, knockout, total };
}
