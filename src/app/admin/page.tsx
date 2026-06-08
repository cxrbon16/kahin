import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getResults, getTeams, isLocked } from "@/lib/data";
import { AdminResultsEditor } from "@/components/AdminResultsEditor";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, isAdmin } = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const [teams, results, locked] = await Promise.all([
    getTeams(),
    getResults(),
    isLocked(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Yönetim — gerçek sonuçlar</h1>
      <p className="mb-6 text-sm text-white/60">
        Sonuçlar otomatik çekilir ve herkes otomatik puanlanır. İstersen aşağıdan
        elle de düzenleyebilirsin (otomatik senkron bir sonraki çalışmada
        üzerine yazar).
      </p>
      <div className="mb-8">
        <SyncButton />
      </div>
      <AdminResultsEditor teams={teams} initial={results} locked={locked} />
    </div>
  );
}
