"use client";

// Zeitstrahl of the Q1+ 2026 BCI milestones (rebuild of the Neurotech Futures ×
// PL Neuro market-memo right column). Left→right time axis, pre-2026 blurred
// out, stage lanes toggleable, hover for details (with acronym expansion),
// click to open the primary source. Undated milestones sit honestly in a
// "date TBD" shelf per lane instead of being faked onto the axis.

import { useMemo, useRef, useState } from "react";
import MILESTONES from "@/data/milestones.json";
import { FirmLogo } from "@/components/firm-logo";
import { lookupAcronym } from "@/components/abbr";

type Milestone = (typeof MILESTONES)[number];

const T0 = Date.UTC(2026, 0, 1);
const T1 = Date.UTC(2026, 4, 15);
const MONTHS = [
  { label: "Jan", t: Date.UTC(2026, 0, 1) },
  { label: "Feb", t: Date.UTC(2026, 1, 1) },
  { label: "Mar", t: Date.UTC(2026, 2, 1) },
  { label: "Apr", t: Date.UTC(2026, 3, 1) },
  { label: "May", t: Date.UTC(2026, 4, 1) },
];

const STAGES = [
  { key: "capital", label: "Capital", color: "var(--positive)", soft: "var(--positive-soft)" },
  { key: "clinical", label: "Clinical", color: "var(--negative)", soft: "var(--negative-soft)" },
  { key: "commercial", label: "Commercial", color: "var(--warning)", soft: "var(--warning-soft)" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const LANE_H = 92;
const PLOT_TOP = 26; // month label row

function pct(dateStr: string): number {
  const t = new Date(dateStr + "T00:00:00Z").getTime();
  return Math.min(Math.max((t - T0) / (T1 - T0), 0), 1) * 100;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "FIH/partner" → [["FIH","First in Human"],["partner",null]]
function expandActivity(activity: string): [string, string | null][] {
  return activity
    .split("/")
    .map((tok) => [tok, lookupAcronym(tok.trim())?.expansion ?? null]);
}

export function MilestoneTimeline() {
  const [visible, setVisible] = useState<Set<StageKey>>(new Set(STAGES.map((s) => s.key)));
  const [tip, setTip] = useState<{ m: Milestone; x: number; y: number; below: boolean } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const lanes = useMemo(
    () =>
      STAGES.filter((s) => visible.has(s.key)).map((s) => ({
        ...s,
        dated: MILESTONES.filter((m) => m.stage === s.key && m.date).sort((a, b) =>
          a.date! < b.date! ? -1 : 1,
        ),
        undated: MILESTONES.filter((m) => m.stage === s.key && !m.date),
      })),
    [visible],
  );

  const toggle = (key: StageKey) =>
    setVisible((v) => {
      const next = new Set(v);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else next.add(key);
      return next;
    });

  const showTip = (e: React.MouseEvent<HTMLElement>, m: Milestone) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = e.currentTarget.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const rawX = r.left - w.left + r.width / 2;
    const x = Math.min(Math.max(rawX, 150), w.width - 150);
    const yTop = r.top - w.top;
    const below = yTop < 120;
    setTip({ m, x, y: below ? r.bottom - w.top + 8 : yTop - 8, below });
  };

  const plotH = PLOT_TOP + lanes.length * LANE_H;

  return (
    <div className="card p-5">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STAGES.map((s) => {
          const on = visible.has(s.key);
          const count = MILESTONES.filter((m) => m.stage === s.key).length;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                on ? "border-border-strong" : "border-border opacity-40"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="tnum text-faint">{count}</span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-[11px] text-faint sm:block">
          hover for details · click to open source
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div ref={wrapRef} className="relative min-w-[860px]">
          <div className="flex">
            {/* Pre-2026: history exists, not yet ingested */}
            <div
              className="relative shrink-0 overflow-hidden rounded-l-xl border-r border-dashed border-border-strong bg-surface-raised"
              style={{ width: 116, height: plotH }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2" style={{ filter: "blur(4px)", opacity: 0.35 }} aria-hidden>
                {[52, 72, 44, 64, 56].map((w, i) => (
                  <div key={i} className="h-4 rounded-full bg-faint/60" style={{ width: w }} />
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">pre-2026</div>
                <div className="text-[10px] text-faint">coming soon</div>
              </div>
            </div>

            {/* Plot */}
            <div className="relative flex-1" style={{ height: plotH }}>
              {/* Month gridlines */}
              {MONTHS.map((mo) => {
                const left = ((mo.t - T0) / (T1 - T0)) * 100;
                return (
                  <div key={mo.label} className="absolute bottom-0 top-0" style={{ left: `${left}%` }}>
                    <div className="absolute bottom-0 top-6 border-l border-border" />
                    <div className="absolute top-0.5 -translate-x-1/2 text-[10px] font-medium uppercase tracking-wider text-faint">
                      {mo.label}
                    </div>
                  </div>
                );
              })}

              {/* Lanes */}
              {lanes.map((lane, li) => {
                const top = PLOT_TOP + li * LANE_H;
                return (
                  <div key={lane.key}>
                    {/* lane baseline + label */}
                    <div
                      className="absolute left-0 right-0 border-b border-border/70"
                      style={{ top: top + LANE_H - 1 }}
                    />
                    <div
                      className="absolute left-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ top: top + 4, color: lane.color }}
                    >
                      {lane.label}
                    </div>
                    {lane.dated.map((m, i) => {
                      const left = pct(m.date!);
                      const slot = i % 2; // stagger to reduce overlap
                      const pillTop = top + 18 + slot * 30;
                      const el = (
                        <>
                          <span
                            className="absolute w-px bg-border-strong"
                            style={{ left: `${left}%`, top: pillTop + 22, height: top + LANE_H - (pillTop + 22) - 3 }}
                            aria-hidden
                          />
                          <span
                            className="absolute h-[7px] w-[7px] -translate-x-1/2 rounded-full border-2"
                            style={{ left: `${left}%`, top: top + LANE_H - 6, borderColor: lane.color, background: "var(--surface)" }}
                            aria-hidden
                          />
                        </>
                      );
                      const pill = (
                        <a
                          href={m.sourceUrl ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={(e) => showTip(e, m)}
                          onMouseLeave={() => setTip(null)}
                          className={`absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-surface py-0.5 pl-1 pr-2 shadow-sm transition-transform hover:z-30 hover:scale-105 ${m.sourceUrl ? "cursor-pointer" : "cursor-default"}`}
                          style={{ left: `${left}%`, top: pillTop, borderColor: lane.color }}
                        >
                          <FirmLogo src={m.logo} name={m.company} size={16} />
                          <span className="tnum whitespace-nowrap text-[11px] font-semibold">{m.activity}</span>
                        </a>
                      );
                      return (
                        <span key={`${m.company}-${m.activity}`}>
                          {el}
                          {pill}
                        </span>
                      );
                    })}
                  </div>
                );
              })}

              {/* Tooltip */}
              {tip && (
                <div
                  className={`pointer-events-none absolute z-40 w-72 -translate-x-1/2 rounded-xl bg-foreground p-3 shadow-2xl ${tip.below ? "" : "-translate-y-full"}`}
                  style={{ left: tip.x, top: tip.y }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <FirmLogo src={tip.m.logo} name={tip.m.company} size={18} />
                    <span className="text-[13px] font-semibold text-background">{tip.m.company}</span>
                    <span
                      className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-background/90"
                      style={{ background: STAGES.find((s) => s.key === tip.m.stage)?.color }}
                    >
                      {tip.m.stage}
                    </span>
                  </div>
                  <div className="tnum text-[12px] font-medium text-background/90">
                    {tip.m.activity}
                    <span className="text-background/60">
                      {" · "}
                      {tip.m.date ? fmtDate(tip.m.date) : "Jan–Apr 2026 · exact date TBD"}
                    </span>
                  </div>
                  {expandActivity(tip.m.activity).filter(([, ex]) => ex).length > 0 && (
                    <div className="mt-1 text-[10px] leading-snug text-background/60">
                      {expandActivity(tip.m.activity)
                        .filter(([, ex]) => ex)
                        .map(([tok, ex]) => `${tok} — ${ex}`)
                        .join(" · ")}
                    </div>
                  )}
                  <div className="mt-1.5 text-[11px] leading-relaxed text-background/75">
                    {tip.m.note ?? "Details coming soon."}
                  </div>
                  {tip.m.sourceUrl && (
                    <div className="mt-1.5 text-[10px] font-medium text-background/50">
                      click to open source ↗
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date-TBD shelves */}
          {lanes.some((l) => l.undated.length > 0) && (
            <div className="mt-3 space-y-2 border-t border-dashed border-border pt-3">
              {lanes
                .filter((l) => l.undated.length > 0)
                .map((lane) => (
                  <div key={lane.key} className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                      date TBD · <span style={{ color: lane.color }}>{lane.label}</span>
                    </span>
                    {lane.undated.map((m) => (
                      <a
                        key={`${m.company}-${m.activity}`}
                        href={m.sourceUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={(e) => showTip(e, m)}
                        onMouseLeave={() => setTip(null)}
                        className={`flex items-center gap-1.5 rounded-full border border-dashed bg-surface py-0.5 pl-1 pr-2 ${m.sourceUrl ? "cursor-pointer hover:border-solid" : "cursor-default"}`}
                        style={{ borderColor: lane.color }}
                      >
                        <FirmLogo src={m.logo} name={m.company} size={14} />
                        <span className="whitespace-nowrap text-[11px] font-medium text-muted">
                          {m.company} · <span className="tnum font-semibold text-foreground">{m.activity}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
