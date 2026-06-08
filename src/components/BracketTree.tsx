"use client";

import { useMemo, useState } from "react";
import {
  FINAL_NO,
  LEFT_ROOT,
  makeBracket,
  MATCH_BY_NO,
  RIGHT_ROOT,
  THIRD_PLACE_NO,
  type ResolvedMatch,
  type ResolvedSlot,
} from "@/lib/bracket";
import { STAGE_LABELS } from "@/lib/schedule";
import type { Team } from "@/lib/tournament";

type Props = {
  teams: Team[];
  groups: Record<string, string[]>;
  thirds: string[];
  winners: Record<string, string>;
  editable?: boolean;
  onPick?: (matchNo: number, teamId: string) => void;
};

// Child match numbers feeding a match (its winner-slots), or [] for a leaf.
function childrenOf(no: number): number[] {
  const m = MATCH_BY_NO.get(no);
  if (!m) return [];
  return [m.a, m.b].flatMap((s) => (s.kind === "winner" ? [s.match] : []));
}

export function BracketTree({
  teams,
  groups,
  thirds,
  winners,
  editable = false,
  onPick,
}: Props) {
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const [highlight, setHighlight] = useState<string | null>(null);

  const resolveMatch = useMemo(
    () => makeBracket(groups, thirds, winners, teamById).resolveMatch,
    [groups, thirds, winners, teamById],
  );

  function Slot({ s, matchNo }: { s: ResolvedSlot; matchNo: number }) {
    const r = resolveMatch(matchNo);
    const isWinner = s.team && r.winnerId === s.team.id;
    const isHi = highlight && s.team?.id === highlight;
    return (
      <button
        onClick={() => {
          if (!s.team) return;
          if (editable) onPick?.(matchNo, s.team.id);
          else setHighlight(highlight === s.team.id ? null : s.team.id);
        }}
        className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs transition ${
          isWinner ? "bg-emerald-500/25 font-semibold" : ""
        } ${isHi ? "ring-1 ring-emerald-400" : ""} ${
          s.team && (editable || true) ? "hover:bg-white/10" : ""
        }`}
      >
        {s.team ? (
          <>
            <span>{s.team.flag}</span>
            <span className="flex-1 truncate">{s.team.name}</span>
            {isWinner && <span className="text-emerald-300">✓</span>}
          </>
        ) : (
          <span className="flex items-center gap-1 text-white/40">
            <span className="rounded bg-white/10 px-1.5 text-[10px] font-semibold">
              {s.label}
            </span>
            {s.sub && <span className="text-[10px]">{s.sub}</span>}
          </span>
        )}
      </button>
    );
  }

  function Card({ no }: { no: number }) {
    const m = MATCH_BY_NO.get(no)!;
    return (
      <div className="w-44 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="flex items-center justify-between bg-black/20 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/40">
          <span>{STAGE_LABELS[m.stage]}</span>
          <span>{new Date(m.kickoffUTC).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
        </div>
        <div className="divide-y divide-white/10">
          <Slot s={resolveMatch(no).a} matchNo={no} />
          <Slot s={resolveMatch(no).b} matchNo={no} />
        </div>
      </div>
    );
  }

  function Connector() {
    return (
      <div className="flex w-5 shrink-0 items-center">
        <div className="h-px w-full bg-white/15" />
      </div>
    );
  }

  // Recursively renders a match and its subtree. dir = which side the children
  // sit on (left subtree grows left, right subtree grows right).
  function Node({ no, dir }: { no: number; dir: "left" | "right" }) {
    const kids = childrenOf(no);
    const card = <Card no={no} />;
    if (kids.length === 0) return card;

    const children = (
      <div className="flex flex-col justify-center gap-4">
        {kids.map((c) => (
          <Node key={c} no={c} dir={dir} />
        ))}
      </div>
    );

    return (
      <div className="flex items-center">
        {dir === "left" ? (
          <>
            {children}
            <Connector />
            {card}
          </>
        ) : (
          <>
            {card}
            <Connector />
            {children}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-center justify-center gap-2 px-2">
        <Node no={LEFT_ROOT} dir="left" />
        <Connector />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            Final
          </span>
          <Card no={FINAL_NO} />
          <span className="mt-1 text-[10px] text-white/40">Üçüncülük</span>
          <Card no={THIRD_PLACE_NO} />
        </div>
        <Connector />
        <Node no={RIGHT_ROOT} dir="right" />
      </div>
    </div>
  );
}

export type { ResolvedMatch };
