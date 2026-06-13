import { POINTS } from "@/lib/scoring";
import { KNOCKOUT_ROUNDS } from "@/lib/tournament";

// Explains how points are awarded. Values are read straight from POINTS, so
// this stays in sync if the scoring config ever changes.
export function ScoringInfo() {
  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-lg font-bold">Puanlama nasıl çalışır?</h2>
        <p className="mt-1 text-sm text-white/60">
          Puanların gerçek sonuçlara göre otomatik işlenir. Grup puanları maçlar
          oynandıkça anlık güncellenir; grup tamamlanınca kesinleşir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Group stage */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">
            Grup aşaması
          </h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="py-1.5 text-white/70">
                  Takımı doğru sırada bilmek
                </td>
                <td className="py-1.5 text-right font-semibold">
                  {POINTS.groupExactPosition} puan
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-white/70">
                  Üst 2’ye kalanı bilmek (sıra fark etmez)
                </td>
                <td className="py-1.5 text-right font-semibold">
                  +{POINTS.groupAdvance} puan
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-white/40">
            Her grupta 4 sıra için ayrı ayrı değerlendirilir.
          </p>
        </div>

        {/* Knockout */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">
            Eleme turları
          </h3>
          <p className="mb-2 text-xs text-white/50">
            Bir takımın ulaştığı her tur için, o takımı oraya taşıdıysan puan
            alırsın.
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/10">
              {KNOCKOUT_ROUNDS.map((r) => (
                <tr key={r.key}>
                  <td className="py-1.5 text-white/70">{r.label}</td>
                  <td className="py-1.5 text-right font-semibold">
                    {POINTS.knockout[r.key]} puan
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-white/40">
        Daha ileri turlar daha değerli: doğru şampiyon tek başına{" "}
        {POINTS.knockout.champion} puan. Tahminler ilk maçın başladığı an
        kilitlenir.
      </p>
    </section>
  );
}
