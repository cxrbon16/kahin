import { createClient } from "./supabase/server";
import { scorePrediction, type ScoreBreakdown } from "./scoring";
import { reachedFromRaw } from "./bracket";
import {
  emptyReached,
  type KnockoutKey,
  type Prediction,
  type RawPrediction,
  type Team,
} from "./tournament";

export async function getTeams(): Promise<Team[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, name, flag, group_code")
    .order("group_code")
    .order("name");
  return (data ?? []) as Team[];
}

export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]));
}

export async function getResults(): Promise<Prediction> {
  const supabase = createClient();
  const { data } = await supabase
    .from("results")
    .select("groups, knockout")
    .eq("id", 1)
    .single();
  return {
    groups: (data?.groups ?? {}) as Prediction["groups"],
    knockout: { ...emptyReached(), ...((data?.knockout ?? {}) as object) },
  };
}

export async function isLocked(): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("results")
    .select("locked")
    .eq("id", 1)
    .single();
  return Boolean(data?.locked);
}

// Any player's raw bracket prediction (groups + chosen thirds + match winners).
export async function getRawPrediction(userId: string): Promise<RawPrediction> {
  const supabase = createClient();
  const { data } = await supabase
    .from("predictions")
    .select("groups, knockout")
    .eq("user_id", userId)
    .maybeSingle();
  const ko = (data?.knockout ?? {}) as { thirds?: string[]; winners?: Record<string, string> };
  return {
    groups: (data?.groups ?? {}) as RawPrediction["groups"],
    thirds: ko.thirds ?? [],
    winners: ko.winners ?? {},
  };
}

// Convenience alias for the signed-in user's own prediction.
export const getMyRawPrediction = getRawPrediction;

export async function getProfileName(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return (data?.display_name as string) || null;
}

export function scoreRaw(
  raw: RawPrediction,
  results: Prediction,
  teams: Team[],
): ScoreBreakdown {
  return scorePrediction(reachedFromRaw(raw, teamMap(teams)), results);
}

export type LeaderboardRow = {
  userId: string;
  name: string;
  total: number;
  groupPoints: number;
  rounds: Record<KnockoutKey, number>;
};

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = createClient();
  const [{ data: preds }, results, { data: profiles }, teams] = await Promise.all([
    supabase.from("predictions").select("user_id, groups, knockout"),
    getResults(),
    supabase.from("profiles").select("id, display_name"),
    getTeams(),
  ]);

  const byId = teamMap(teams);
  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameById.set(p.id as string, (p.display_name as string) || "Anonim");
  }

  const rows: LeaderboardRow[] = (preds ?? []).map((p) => {
    const ko = (p.knockout ?? {}) as { thirds?: string[]; winners?: Record<string, string> };
    const raw: RawPrediction = {
      groups: (p.groups ?? {}) as RawPrediction["groups"],
      thirds: ko.thirds ?? [],
      winners: ko.winners ?? {},
    };
    const score = scorePrediction(reachedFromRaw(raw, byId), results);
    return {
      userId: p.user_id as string,
      name: nameById.get(p.user_id as string) ?? "Anonim",
      total: score.total,
      groupPoints: score.groupExact + score.groupAdvance,
      rounds: score.knockout,
    };
  });

  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return rows;
}

// Has the admin entered any actual results yet?
export function resultsPublished(results: Prediction): boolean {
  const anyGroup = Object.values(results.groups ?? {}).some(
    (g) => Array.isArray(g) && g.length > 0,
  );
  const anyKo = Object.values(results.knockout ?? {}).some(
    (g) => Array.isArray(g) && g.length > 0,
  );
  return anyGroup || anyKo;
}
