// Tournament structure for FIFA World Cup 2026 (48 teams, 12 groups of 4).
// Group winners + runners-up + 8 best third-placed teams advance to the
// Round of 32. For the prediction game we keep the knockout as set-based
// "who reaches this round" picks, which is simple to fill in and to score.

export const GROUP_CODES = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
] as const;

export type GroupCode = (typeof GROUP_CODES)[number];

export const TEAMS_PER_GROUP = 4;

// Knockout rounds the user predicts, with how many teams reach each round.
export const KNOCKOUT_ROUNDS = [
  { key: "r16", label: "Son 16", size: 16 },
  { key: "qf", label: "Çeyrek Final", size: 8 },
  { key: "sf", label: "Yarı Final", size: 4 },
  { key: "final", label: "Final", size: 2 },
  { key: "champion", label: "Şampiyon", size: 1 },
] as const;

export type KnockoutKey = (typeof KNOCKOUT_ROUNDS)[number]["key"];

// Shape of a single user's predictions (and of the actual results).
export type GroupsPrediction = Record<string, string[]>; // groupCode -> orderedTeamIds (len 4)
export type KnockoutPrediction = Record<KnockoutKey, string[]>; // roundKey -> teamIds

export type Prediction = {
  groups: GroupsPrediction;
  knockout: KnockoutPrediction;
};

export function emptyKnockout(): KnockoutPrediction {
  return { r16: [], qf: [], sf: [], final: [], champion: [] };
}

export type Team = {
  id: string;
  name: string;
  flag: string;
  group_code: string;
};
