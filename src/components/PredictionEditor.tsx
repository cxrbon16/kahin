"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FINAL_NO,
  makeBracket,
  QF_MATCHES,
  R16_MATCHES,
  R32_MATCHES,
  SF_MATCHES,
} from "@/lib/bracket";
import { BracketTree } from "@/components/BracketTree";
import {
  BEST_THIRDS,
  GROUP_CODES,
  type RawPrediction,
  type Team,
} from "@/lib/tournament";

type Props = {
  userId: string;
  teams: Team[];
  initial: RawPrediction;
  locked: boolean;
};

const KO_MATCHES = [
  ...R32_MATCHES,
  ...R16_MATCHES,
  ...QF_MATCHES,
  ...SF_MATCHES,
  FINAL_NO,
];

export function PredictionEditor({ userId, teams, initial, locked }: Props) {
  const router = useRouter();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const teamsByGroup = useMemo(() => {
    const m = new Map<string, Team[]>();
    for (const code of GROUP_CODES) m.set(code, []);
    for (const t of teams) m.get(t.group_code)?.push(t);
    return m;
  }, [teams]);

  const [groups, setGroups] = useState<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {};
    for (const code of GROUP_CODES) {
      const all = (teamsByGroup.get(code) ?? []).map((t) => t.id);
      const saved = (initial.groups[code] ?? []).filter((id) => all.includes(id));
      const missing = all.filter((id) => !saved.includes(id));
      out[code] = [...saved, ...missing];
    }
    return out;
  });

  // Chosen best-thirds, stored as group codes (stable across reordering).
  const [thirdGroups, setThirdGroups] = useState<Set<string>>(
    () =>
      new Set(
        (initial.thirds ?? [])
          .map((id) => teamById.get(id)?.group_code)
          .filter((g): g is string => Boolean(g)),
      ),
  );

  const [winners, setWinners] = useState<Record<string, string>>(
    () => initial.winners ?? {},
  );

  const [drag, setDrag] = useState<{ code: string; from: number } | null>(null);
  const [over, setOver] = useState<{ code: string; index: number } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const thirdsIds = useMemo(
    () => [...thirdGroups].map((g) => groups[g]?.[2]).filter(Boolean) as string[],
    [thirdGroups, groups],
  );

  // Count valid picked winners (validated against current participants).
  const pickedCount = useMemo(() => {
    const { resolveMatch } = makeBracket(groups, thirdsIds, winners, teamById);
    return KO_MATCHES.reduce(
      (a, n) => a + (resolveMatch(n).winnerId ? 1 : 0),
      0,
    );
  }, [groups, thirdsIds, winners, teamById]);

  function touch() {
    setDirty(true);
    setSaved(false);
  }

  function reorder(code: string, from: number, to: number) {
    if (locked || from === to) return;
    setGroups((prev) => {
      const arr = [...prev[code]];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return { ...prev, [code]: arr };
    });
    touch();
  }

  function move(code: string, index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= 4) return;
    reorder(code, index, to);
  }

  function toggleThird(code: string) {
    if (locked) return;
    setThirdGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else if (next.size < BEST_THIRDS) next.add(code);
      return next;
    });
    touch();
  }

  function pickWinner(matchNo: number, teamId: string) {
    if (locked) return;
    setWinners((prev) => ({ ...prev, [matchNo]: teamId }));
    touch();
  }

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("predictions").upsert({
      user_id: userId,
      groups,
      knockout: { thirds: thirdsIds, winners },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      setDirty(false);
      router.refresh();
    }
  }

  const thirdsDone = thirdGroups.size === BEST_THIRDS;

  return (
    <div className="space-y-10 pb-28">
      {locked && (
        <div className="card border-amber-400/40 bg-amber-400/10 text-sm text-amber-200">
          Tahminler kilitlendi — turnuva başladı, artık değişiklik yapılamaz.
        </div>
      )}

      {/* 1. Group standings */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">1 · Grup sıralamaları</h2>
          <p className="text-sm text-white/60">
            Takımları sürükle ya da okları kullan. İlk 2 doğrudan Son 32’ye
            çıkar.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROUP_CODES.map((code) => (
            <div key={code} className="card">
              <h3 className="mb-3 font-semibold">{code} Grubu</h3>
              <ul className="space-y-1.5">
                {groups[code].map((teamId, i) => {
                  const team = teamById.get(teamId);
                  const advances = i < 2;
                  const isOver = over?.code === code && over.index === i;
                  return (
                    <li key={teamId}>
                      {i === 2 && (
                        <div className="my-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                          <span className="h-px flex-1 bg-white/15" />
                          eleme çizgisi
                          <span className="h-px flex-1 bg-white/15" />
                        </div>
                      )}
                      <div
                        draggable={!locked}
                        onDragStart={() => setDrag({ code, from: i })}
                        onDragEnter={() => setOver({ code, index: i })}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (drag && drag.code === code) reorder(code, drag.from, i);
                          setDrag(null);
                          setOver(null);
                        }}
                        onDragEnd={() => {
                          setDrag(null);
                          setOver(null);
                        }}
                        className={`group flex items-center gap-2 rounded-lg border px-2 py-2 transition ${
                          advances
                            ? "border-emerald-400/30 bg-emerald-500/15"
                            : "border-white/10 bg-white/5"
                        } ${isOver ? "ring-2 ring-emerald-400" : ""} ${
                          locked ? "" : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <span className="select-none text-white/30 group-hover:text-white/60">
                          ⠿
                        </span>
                        <span
                          className={`grid h-5 w-5 place-items-center rounded text-xs font-bold ${
                            advances
                              ? "bg-emerald-400 text-emerald-950"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-lg">{team?.flag}</span>
                        <span className="flex-1 truncate text-sm">{team?.name}</span>
                        <span className="flex flex-col">
                          <button
                            onClick={() => move(code, i, -1)}
                            disabled={locked || i === 0}
                            className="leading-none text-white/40 hover:text-white disabled:opacity-20"
                            aria-label="Yukarı"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => move(code, i, 1)}
                            disabled={locked || i === 3}
                            className="leading-none text-white/40 hover:text-white disabled:opacity-20"
                            aria-label="Aşağı"
                          >
                            ▼
                          </button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Best thirds */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">2 · En iyi 8 üçüncü</h2>
            <p className="text-sm text-white/60">
              12 grubun 3.’sünden, Son 32’ye çıkacağını düşündüğün 8’ini seç.
            </p>
          </div>
          <span
            className={`text-sm ${thirdsDone ? "text-emerald-300" : "text-white/50"}`}
          >
            {thirdGroups.size} / {BEST_THIRDS}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GROUP_CODES.map((code) => {
            const team = teamById.get(groups[code][2]);
            const on = thirdGroups.has(code);
            const full = !on && thirdGroups.size >= BEST_THIRDS;
            return (
              <button
                key={code}
                onClick={() => toggleThird(code)}
                disabled={locked || full}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  on
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : "border-white/15 bg-black/20 hover:border-white/30"
                } ${full ? "opacity-40" : ""}`}
              >
                <span className="text-xs text-white/40">{code}3</span>
                <span className="text-lg">{team?.flag}</span>
                <span className="flex-1 truncate text-left">{team?.name}</span>
                {on && <span className="text-emerald-300">✓</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Bracket */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">3 · Eleme ağacı</h2>
          <p className="text-sm text-white/60">
            {thirdsDone
              ? "Her maçta kazanacağını düşündüğün takıma dokun; bir üst tura otomatik taşınır."
              : "Ağacı doldurmak için önce 8 üçüncüyü seç. Grup 1.–2.’leri çoktan yerleşti."}
          </p>
        </div>
        <BracketTree
          teams={teams}
          groups={groups}
          thirds={thirdsIds}
          winners={winners}
          editable={!locked}
          onPick={pickWinner}
        />
      </section>

      {/* Sticky progress + save bar */}
      {!locked && (
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-pitchdark/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <div className="hidden flex-1 sm:block">
              <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                <span>Eleme maçları</span>
                <span>
                  {pickedCount} / {KO_MATCHES.length}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{
                    width: `${Math.round((pickedCount / KO_MATCHES.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 sm:flex-none">
              {error && <span className="text-sm text-red-400">{error}</span>}
              {saved && !dirty && (
                <span className="text-sm text-emerald-300">Kaydedildi</span>
              )}
              {dirty && (
                <span className="hidden text-xs text-amber-300 sm:inline">
                  Kaydedilmemiş değişiklik
                </span>
              )}
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? "Kaydediliyor…" : "Tahminleri kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
