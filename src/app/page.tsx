import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getLeaderboard, getMyPrediction, getResults } from "@/lib/data";
import { scorePrediction } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Dünya Kupası 2026{" "}
          <span className="text-emerald-400">tahmin ligi</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          12 grubun sıralamasını ve eleme turlarını tahmin et. Gerçek sonuçlar
          açıklandıkça puanların otomatik işlensin, arkadaşlarınla aynı
          sıralamada kapış.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">
            Hemen başla
          </Link>
          <Link href="/leaderboard" className="btn-ghost">
            Sıralamayı gör
          </Link>
        </div>
        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          <div className="card">
            <div className="text-2xl">📊</div>
            <h3 className="mt-2 font-semibold">Grup sıralaması</h3>
            <p className="mt-1 text-sm text-white/60">
              Her grupta takımları 1’den 4’e sırala.
            </p>
          </div>
          <div className="card">
            <div className="text-2xl">🏆</div>
            <h3 className="mt-2 font-semibold">Eleme turları</h3>
            <p className="mt-1 text-sm text-white/60">
              Son 16’dan şampiyona kadar kimler geçecek seç.
            </p>
          </div>
          <div className="card">
            <div className="text-2xl">⚡</div>
            <h3 className="mt-2 font-semibold">Canlı puan</h3>
            <p className="mt-1 text-sm text-white/60">
              Sonuçlar girildikçe sıralama anında güncellenir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [prediction, results, leaderboard] = await Promise.all([
    getMyPrediction(user.id),
    getResults(),
    getLeaderboard(),
  ]);
  const score = scorePrediction(prediction, results);
  const myRank =
    leaderboard.findIndex((r) => r.userId === user.id) + 1 || null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Merhaba 👋</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-sm text-white/60">Toplam puanın</div>
          <div className="mt-1 text-3xl font-bold text-emerald-400">
            {score.total}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-white/60">Sıralaman</div>
          <div className="mt-1 text-3xl font-bold">
            {myRank ? `#${myRank}` : "—"}
          </div>
          <div className="text-xs text-white/50">
            {leaderboard.length} oyuncu arasında
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-white/60">Kırılım</div>
          <div className="mt-1 text-sm">
            Grup: <strong>{score.groupExact + score.groupAdvance}</strong>
          </div>
          <div className="text-sm">
            Eleme:{" "}
            <strong>
              {Object.values(score.knockout).reduce((a, b) => a + b, 0)}
            </strong>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/predict" className="btn-primary">
          Tahminlerini düzenle
        </Link>
        <Link href="/leaderboard" className="btn-ghost">
          Sıralamaya git
        </Link>
      </div>
    </div>
  );
}
