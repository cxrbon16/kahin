import { getSessionUser } from "@/lib/auth";
import { getLeaderboard, getResults, resultsPublished } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { user } = await getSessionUser();
  const [rows, results] = await Promise.all([getLeaderboard(), getResults()]);
  const published = resultsPublished(results);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Sıralama</h1>
        <span className="text-sm text-white/50">{rows.length} oyuncu</span>
      </div>

      {!published && (
        <div className="card mb-4 border-sky-400/30 bg-sky-400/10 text-sm text-sky-200">
          Henüz gerçek sonuç girilmedi. Maçlar oynandıkça puanlar burada
          görünecek.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card text-sm text-white/60">
          Henüz tahmin yapan yok. İlk sen ol!
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Oyuncu</th>
                <th className="px-4 py-3 text-right">Grup</th>
                <th className="px-4 py-3 text-right">Eleme</th>
                <th className="px-4 py-3 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isMe = user?.id === row.userId;
                return (
                  <tr
                    key={row.userId}
                    className={`border-t border-white/5 ${
                      isMe ? "bg-emerald-500/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-white/70">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {row.name}
                      {isMe && (
                        <span className="ml-2 text-xs text-emerald-300">
                          (sen)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {row.groupPoints}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {row.knockoutPoints}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-emerald-400">
                      {row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
