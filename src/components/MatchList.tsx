"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveSlot, type ResolvedSlot } from "@/lib/bracket";
import { SCHEDULE, STAGE_LABELS, type Match, type Stage } from "@/lib/schedule";
import type { Team } from "@/lib/tournament";

type Props = {
  teams: Team[];
  groups: Record<string, string[]>;
};

const FILTERS: { key: Stage | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "group", label: "Grup" },
  { key: "r32", label: "Son 32" },
  { key: "r16", label: "Son 16" },
  { key: "qf", label: "Çeyrek" },
  { key: "sf", label: "Yarı" },
  { key: "final", label: "Final" },
];

function fmtDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function countdown(target: number, now: number): string {
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d > 0) return `${d} gün ${h} saat`;
  if (h > 0) return `${h} saat ${m} dk`;
  return `${m} dk`;
}

export function MatchList({ teams, groups }: Props) {
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(
    () =>
      [...SCHEDULE].sort(
        (a, b) =>
          new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime(),
      ),
    [],
  );

  const nextMatch = useMemo(
    () => sorted.find((m) => new Date(m.kickoffUTC).getTime() >= now) ?? null,
    [sorted, now],
  );

  const filtered = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((m) => m.stage === filter)),
    [sorted, filter],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  function R({ s }: { s: ResolvedSlot }) {
    if (s.team) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <span>{s.team.flag}</span>
          <span>{s.team.name}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-white/60">
        <span className="rounded bg-white/10 px-1.5 text-xs font-semibold">
          {s.label}
        </span>
        {s.sub && <span className="text-xs text-white/40">{s.sub}</span>}
      </span>
    );
  }

  function row(m: Match) {
    return {
      a: resolveSlot(m.a, groups, teamById),
      b: resolveSlot(m.b, groups, teamById),
    };
  }

  return (
    <div className="space-y-6">
      {/* Featured next match */}
      {nextMatch && (
        <div className="card border-emerald-400/40 bg-emerald-500/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Sıradaki maç
            </span>
            <span className="text-sm font-medium text-emerald-200">
              {countdown(new Date(nextMatch.kickoffUTC).getTime(), now)} sonra
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 text-lg font-semibold">
            <span className="flex-1 text-right">
              <R s={row(nextMatch).a} />
            </span>
            <span className="text-white/40">—</span>
            <span className="flex-1 text-left">
              <R s={row(nextMatch).b} />
            </span>
          </div>
          <div className="mt-3 text-center text-sm text-white/70">
            {fmtDay(nextMatch.date)} · {nextMatch.timeLocal} (yerel) ·{" "}
            {nextMatch.timeET} ET
            <br />
            {nextMatch.venue}, {nextMatch.city}, {nextMatch.country}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === f.key
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                : "border-white/15 text-white/70 hover:border-white/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      <div className="space-y-5">
        {byDate.map(([date, matches]) => (
          <div key={date}>
            <h3 className="mb-2 text-sm font-semibold text-white/80">
              {fmtDay(date)}
            </h3>
            <div className="card divide-y divide-white/10 p-0">
              {matches.map((m) => {
                const r = row(m);
                const isNext = nextMatch?.no === m.no;
                return (
                  <div
                    key={m.no}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                      isNext ? "bg-emerald-500/10" : ""
                    }`}
                  >
                    <div className="w-14 shrink-0 text-white/50">
                      {m.timeLocal}
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2 text-right">
                      <R s={r.a} />
                    </div>
                    <div className="shrink-0 text-white/30">—</div>
                    <div className="flex flex-1 items-center gap-2">
                      <R s={r.b} />
                    </div>
                    <div className="hidden w-48 shrink-0 text-right text-xs text-white/40 sm:block">
                      <span className="rounded bg-white/10 px-1.5 py-0.5">
                        {STAGE_LABELS[m.stage]}
                        {m.group ? ` ${m.group}` : ""}
                      </span>
                      <div className="mt-0.5 truncate">{m.city}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
