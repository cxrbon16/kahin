"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  GROUP_CODES,
  KNOCKOUT_ROUNDS,
  type KnockoutKey,
  type Prediction,
  type Team,
} from "@/lib/tournament";

type Props = {
  userId: string;
  teams: Team[];
  initial: Prediction;
  locked: boolean;
};

const ROUND_KEYS = KNOCKOUT_ROUNDS.map((r) => r.key);

export function PredictionEditor({ userId, teams, initial, locked }: Props) {
  const router = useRouter();
  const teamById = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.id, t);
    return m;
  }, [teams]);

  const teamsByGroup = useMemo(() => {
    const m = new Map<string, Team[]>();
    for (const code of GROUP_CODES) m.set(code, []);
    for (const t of teams) m.get(t.group_code)?.push(t);
    return m;
  }, [teams]);

  // Build initial group ordering: use saved order, then append any missing
  // teams so every group always has its 4 teams in some order.
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

  const [knockout, setKnockout] = useState<Record<KnockoutKey, string[]>>(() => ({
    r16: initial.knockout.r16 ?? [],
    qf: initial.knockout.qf ?? [],
    sf: initial.knockout.sf ?? [],
    final: initial.knockout.final ?? [],
    champion: initial.knockout.champion ?? [],
  }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function move(code: string, index: number, dir: -1 | 1) {
    if (locked) return;
    setGroups((prev) => {
      const arr = [...prev[code]];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, [code]: arr };
    });
    setSaved(false);
  }

  function poolFor(roundIndex: number): string[] {
    if (roundIndex === 0) return teams.map((t) => t.id);
    return knockout[ROUND_KEYS[roundIndex - 1]];
  }

  function toggleKo(roundIndex: number, teamId: string) {
    if (locked) return;
    const key = ROUND_KEYS[roundIndex];
    const size = KNOCKOUT_ROUNDS[roundIndex].size;
    setKnockout((prev) => {
      const next: Record<KnockoutKey, string[]> = { ...prev };
      const current = prev[key];
      if (current.includes(teamId)) {
        // Deselect here and remove from every deeper round too.
        for (let i = roundIndex; i < ROUND_KEYS.length; i++) {
          next[ROUND_KEYS[i]] = next[ROUND_KEYS[i]].filter((id) => id !== teamId);
        }
      } else {
        if (size === 1) {
          next[key] = [teamId];
        } else if (current.length < size) {
          next[key] = [...current, teamId];
        }
      }
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("predictions").upsert({
      user_id: userId,
      groups,
      knockout,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-10 pb-24">
      {locked && (
        <div className="card border-amber-400/40 bg-amber-400/10 text-sm text-amber-200">
          Tahminler kilitlendi — turnuva başladı, artık değişiklik yapılamaz.
        </div>
      )}

      {/* Group stage */}
      <section>
        <h2 className="mb-1 text-xl font-bold">Grup sıralamaları</h2>
        <p className="mb-4 text-sm text-white/60">
          Her grupta takımları bitiş sırasına göre diz. İlk 2 (yeşil) bir üst
          tura çıkar.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROUP_CODES.map((code) => (
            <div key={code} className="card">
              <h3 className="mb-2 font-semibold">{code} Grubu</h3>
              <ol className="space-y-1">
                {groups[code].map((teamId, i) => {
                  const team = teamById.get(teamId);
                  const advances = i < 2;
                  return (
                    <li
                      key={teamId}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                        advances ? "bg-emerald-500/15" : "bg-white/5"
                      }`}
                    >
                      <span className="w-4 text-white/50">{i + 1}</span>
                      <span className="text-lg">{team?.flag}</span>
                      <span className="flex-1">{team?.name}</span>
                      <span className="flex gap-1">
                        <button
                          onClick={() => move(code, i, -1)}
                          disabled={locked || i === 0}
                          className="rounded bg-white/10 px-1.5 disabled:opacity-30"
                          aria-label="Yukarı"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => move(code, i, 1)}
                          disabled={locked || i === groups[code].length - 1}
                          className="rounded bg-white/10 px-1.5 disabled:opacity-30"
                          aria-label="Aşağı"
                        >
                          ▼
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Knockout */}
      <section>
        <h2 className="mb-1 text-xl font-bold">Eleme turları</h2>
        <p className="mb-4 text-sm text-white/60">
          Her turda kimlerin yükseleceğini seç. Bir üst turun seçenekleri, bir
          alt turda seçtiğin takımlardan oluşur.
        </p>
        <div className="space-y-5">
          {KNOCKOUT_ROUNDS.map((round, roundIndex) => {
            const pool = poolFor(roundIndex);
            const selected = knockout[round.key];
            return (
              <div key={round.key} className="card">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{round.label}</h3>
                  <span className="text-xs text-white/50">
                    {selected.length} / {round.size}
                  </span>
                </div>
                {pool.length === 0 ? (
                  <p className="text-sm text-white/50">
                    Önce bir önceki turu doldur.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pool.map((teamId) => {
                      const team = teamById.get(teamId);
                      const isOn = selected.includes(teamId);
                      const full =
                        !isOn && round.size > 1 && selected.length >= round.size;
                      return (
                        <button
                          key={teamId}
                          onClick={() => toggleKo(roundIndex, teamId)}
                          disabled={locked || full}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                            isOn
                              ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                              : "border-white/15 bg-black/20 text-white/80 hover:border-white/30"
                          } ${full ? "opacity-40" : ""}`}
                        >
                          <span>{team?.flag}</span>
                          <span>{team?.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sticky save bar */}
      {!locked && (
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-pitchdark/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3">
            {error && <span className="text-sm text-red-400">{error}</span>}
            {saved && (
              <span className="text-sm text-emerald-300">Kaydedildi ✓</span>
            )}
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Kaydediliyor…" : "Tahminleri kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
