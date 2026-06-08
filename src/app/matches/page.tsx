import { getResults, getTeams } from "@/lib/data";
import { MatchList } from "@/components/MatchList";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [teams, results] = await Promise.all([getTeams(), getResults()]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Maçlar</h1>
      <p className="mb-6 text-sm text-white/60">
        104 maçın tamamı — tarih, saat ve stadyum. Sıradaki maç en üstte.
      </p>
      <MatchList teams={teams} groups={results.groups ?? {}} />
    </div>
  );
}
