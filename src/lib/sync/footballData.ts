// Minimal typed client for football-data.org v4.
// Docs: https://docs.football-data.org/general/v4/index.html
// Free tier includes the World Cup (competition code "WC"); register for a
// free token and set FOOTBALL_DATA_API_KEY.

const BASE = "https://api.football-data.org/v4";

export type FdTeam = {
  id: number | null;
  name: string | null;
  tla: string | null;
};

export type FdStandingRow = {
  position: number;
  team: FdTeam;
  playedGames: number;
};

export type FdStanding = {
  stage: string;
  type: string; // "TOTAL" | "HOME" | "AWAY"
  group: string | null; // e.g. "GROUP_A"
  table: FdStandingRow[];
};

export type FdMatch = {
  id: number;
  stage: string; // "GROUP_STAGE" | "LAST_16" | "QUARTER_FINALS" | "SEMI_FINALS" | "FINAL" | ...
  status: string; // "SCHEDULED" | "TIMED" | "IN_PLAY" | "FINISHED" | ...
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null };
};

function competition(): string {
  return process.env.FOOTBALL_DATA_COMPETITION || "WC";
}

async function fdGet<T>(path: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is not set.");

  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data ${path} -> ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function fetchStandings(): Promise<FdStanding[]> {
  const data = await fdGet<{ standings: FdStanding[] }>(
    `/competitions/${competition()}/standings`,
  );
  return data.standings ?? [];
}

export async function fetchMatches(): Promise<FdMatch[]> {
  const data = await fdGet<{ matches: FdMatch[] }>(
    `/competitions/${competition()}/matches`,
  );
  return data.matches ?? [];
}
