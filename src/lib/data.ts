import { createClient } from "./supabase/server";
import { scorePrediction } from "./scoring";
import { emptyKnockout, type Prediction, type Team } from "./tournament";

export async function getTeams(): Promise<Team[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, name, flag, group_code")
    .order("group_code")
    .order("name");
  return (data ?? []) as Team[];
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
    knockout: { ...emptyKnockout(), ...((data?.knockout ?? {}) as object) },
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

export async function getMyPrediction(userId: string): Promise<Prediction> {
  const supabase = createClient();
  const { data } = await supabase
    .from("predictions")
    .select("groups, knockout")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    groups: (data?.groups ?? {}) as Prediction["groups"],
    knockout: { ...emptyKnockout(), ...((data?.knockout ?? {}) as object) },
  };
}

export type LeaderboardRow = {
  userId: string;
  name: string;
  total: number;
  groupPoints: number;
  knockoutPoints: number;
};

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = createClient();
  const [{ data: preds }, results, { data: profiles }] = await Promise.all([
    supabase.from("predictions").select("user_id, groups, knockout"),
    getResults(),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameById.set(p.id as string, (p.display_name as string) || "Anonim");
  }

  const rows: LeaderboardRow[] = (preds ?? []).map((p) => {
    const prediction = {
      groups: (p.groups ?? {}) as Prediction["groups"],
      knockout: (p.knockout ?? {}) as Prediction["knockout"],
    };
    const score = scorePrediction(prediction, results);
    const knockoutPoints = Object.values(score.knockout).reduce(
      (a, b) => a + b,
      0,
    );
    return {
      userId: p.user_id as string,
      name: nameById.get(p.user_id as string) ?? "Anonim",
      total: score.total,
      groupPoints: score.groupExact + score.groupAdvance,
      knockoutPoints,
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
