import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getMyPrediction, getTeams, isLocked } from "@/lib/data";
import { PredictionEditor } from "@/components/PredictionEditor";

export const dynamic = "force-dynamic";

export default async function PredictPage() {
  const { user } = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [teams, prediction, locked] = await Promise.all([
    getTeams(),
    getMyPrediction(user.id),
    isLocked(),
  ]);

  if (teams.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">Takımlar henüz yüklenmemiş</h1>
        <p className="mt-2 text-sm text-white/60">
          Yönetici takım/grup verisini ekledikten sonra tahmin yapabilirsin.
        </p>
        <Link href="/" className="btn-ghost mt-4">
          Ana sayfa
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tahminlerim</h1>
      <PredictionEditor
        userId={user.id}
        teams={teams}
        initial={prediction}
        locked={locked}
      />
    </div>
  );
}
