import type { Team } from "../tournament";

// Maps an external provider's team (by TLA or name) to our internal team id.
// Our ids are FIFA codes; provider TLAs usually match, but names and a few
// TLAs differ, so we keep an alias table as a fallback.

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z]/g, ""); // keep letters only
}

// Normalized provider-name -> our team id. Covers tricky / non-obvious names.
const NAME_ALIASES: Record<string, string> = {
  mexico: "MEX",
  southafrica: "RSA",
  southkorea: "KOR",
  korearepublic: "KOR",
  czechia: "CZE",
  czechrepublic: "CZE",
  canada: "CAN",
  bosniaandherzegovina: "BIH",
  bosniaherzegovina: "BIH",
  qatar: "QAT",
  switzerland: "SUI",
  brazil: "BRA",
  morocco: "MAR",
  haiti: "HAI",
  scotland: "SCO",
  unitedstates: "USA",
  usa: "USA",
  paraguay: "PAR",
  australia: "AUS",
  turkiye: "TUR",
  turkey: "TUR",
  germany: "GER",
  curacao: "CUW",
  cotedivoire: "CIV",
  ivorycoast: "CIV",
  ecuador: "ECU",
  netherlands: "NED",
  japan: "JPN",
  sweden: "SWE",
  tunisia: "TUN",
  belgium: "BEL",
  egypt: "EGY",
  iran: "IRN",
  iriran: "IRN",
  newzealand: "NZL",
  spain: "ESP",
  capeverde: "CPV",
  caboverde: "CPV",
  saudiarabia: "KSA",
  uruguay: "URU",
  france: "FRA",
  senegal: "SEN",
  iraq: "IRQ",
  norway: "NOR",
  argentina: "ARG",
  algeria: "ALG",
  austria: "AUT",
  jordan: "JOR",
  portugal: "POR",
  drcongo: "COD",
  congodr: "COD",
  democraticrepublicofthecongo: "COD",
  uzbekistan: "UZB",
  colombia: "COL",
  england: "ENG",
  croatia: "CRO",
  ghana: "GHA",
  panama: "PAN",
};

export function buildTeamResolver(teams: Team[]) {
  const byId = new Set(teams.map((t) => t.id.toUpperCase()));
  const byNormName = new Map<string, string>();
  for (const t of teams) byNormName.set(normalize(t.name), t.id);

  return function resolve(
    tla: string | null | undefined,
    name: string | null | undefined,
  ): string | null {
    if (tla && byId.has(tla.toUpperCase())) return tla.toUpperCase();
    if (name) {
      const n = normalize(name);
      if (NAME_ALIASES[n] && byId.has(NAME_ALIASES[n])) return NAME_ALIASES[n];
      if (byNormName.has(n)) return byNormName.get(n)!;
    }
    return null;
  };
}
