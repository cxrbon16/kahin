// Tournament structure for FIFA World Cup 2026 (48 teams, 12 groups of 4).
// Top 2 of each group + the 8 best third-placed teams reach the Round of 32,
// then a fixed knockout bracket (see schedule.ts for the feeder tree).

export const GROUP_CODES = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
] as const;

export type GroupCode = (typeof GROUP_CODES)[number];

export const TEAMS_PER_GROUP = 4;
export const BEST_THIRDS = 8; // how many of the 12 third-placed teams advance

// Knockout rounds, with how many teams reach each. Used for scoring and for
// the admin/sync "who reached this round" sets.
export const KNOCKOUT_ROUNDS = [
  { key: "r32", label: "Son 32", size: 32 },
  { key: "r16", label: "Son 16", size: 16 },
  { key: "qf", label: "Çeyrek Final", size: 8 },
  { key: "sf", label: "Yarı Final", size: 4 },
  { key: "final", label: "Final", size: 2 },
  { key: "champion", label: "Şampiyon", size: 1 },
] as const;

export type KnockoutKey = (typeof KNOCKOUT_ROUNDS)[number]["key"];

// "Who reached this round" sets — the shape stored for actual results and used
// by the scorer.
export type ReachedSets = Record<KnockoutKey, string[]>;

export function emptyReached(): ReachedSets {
  return { r32: [], r16: [], qf: [], sf: [], final: [], champion: [] };
}

// Canonical reached-set prediction/result (used by results + scoring).
export type Prediction = {
  groups: Record<string, string[]>; // groupCode -> ordered teamIds (len 4)
  knockout: ReachedSets;
};

// A player's raw bracket prediction as stored in the predictions table:
// group orderings, the 8 chosen best thirds, and the picked winner of every
// knockout match (keyed by match number).
export type RawPrediction = {
  groups: Record<string, string[]>;
  thirds: string[]; // teamIds of the 8 chosen third-placed teams
  winners: Record<string, string>; // matchNo -> winning teamId
};

export function emptyRaw(): RawPrediction {
  return { groups: {}, thirds: [], winners: {} };
}

export type Team = {
  id: string;
  name: string;
  flag: string;
  group_code: string;
};
