"use client";

// Timeline of the Q1+ 2026 BCI milestones. Each stage that has any subcategory
// selected gets its own horizontal LANE, tinted in the stage color, and its
// events live in that lane (staggered into rows when they'd overlap). One shared
// month axis runs across all lanes. The legend's group pills expand inline into
// their subcategories (with a collapse ✕ to close again); clicking an open group
// toggles all its subcategories. Hovering the plot magnifies nearby logos like
// the macOS dock. Undated milestones sit in a "date TBD" shelf.

import { useMemo, useState } from "react";
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

const PLOT_TOP = 24;
const LANE_LABEL_H = 18;
const ROW_H = 34;
const MARKER = 26;
const LANE_PAD_BOTTOM = 12;
const LANE_GAP = 8;
const MIN_GAP_PCT = 4.2;
const DOCK_RADIUS = 92;
const DOCK_MAX = 0.55;

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

function expandActivity(activity: string): [string, string | null][] {
  return activity
    .split("/")
    .map((tok) => [tok, lookupAcronym(tok.trim())?.expansion ?? null]);
}

function subcatOf(token: string): string {
  return token.trim().startsWith("$") ? "$" : token.trim();
}
function subcatsOf(m: Milestone): string[] {
  return Array.from(new Set(m.activity.split("/").map(subcatOf)));
}
function subcatLabel(sub: string): string {
  return sub === "$" ? "$ amount" : sub;
}

const ALL_SUBCATS: Record<StageKey, string[]> = (() => {
  const out = { capital: [], clinical: [], commercial: [] } as Record<StageKey, string[]>;
  for (const s of STAGES) {
    const set = new Set<string>();
    for (const m of MILESTONES) if (m.stage === s.key) subcatsOf(m).forEach((x) => set.add(x));
    out[s.key] = Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  return out;
})();

export function MilestoneTimeline() {
  const [sel, setSel] = useState<Record<StageKey, Set<string>>>({
    capital: new Set(ALL_SUBCATS.capital),
    clinical: new Set(ALL_SUBCATS.clinical),
    commercial: new Set(ALL_SUBCATS.commercial),
  });
  const [openStage, setOpenStage] = useState<StageKey | null>(null);
  const [dock, setDock] = useState<{ x: number; y: number; w: number } | null>(null);
  const [tip, setTip] = useState<{ m: Milestone; x: number; y: number; below: boolean } | null>(null);

  const matches = (m: Milestone) =>
    subcatsOf(m).some((sub) => sel[m.stage as StageKey]?.has(sub));

  // One lane per stage that has any subcategory selected.
  const { lanes, totalH, undated } = useMemo(() => {
    let y = PLOT_TOP;
    const lanes = STAGES.filter((s) => sel[s.key].size > 0).map((stage) => {
      const evs = MILESTONES.filter((m) => m.stage === stage.key && m.date && matches(m)).sort((a, b) =>
        a.date! < b.date! ? -1 : 1,
      );
      const rowLast: number[] = [];
      const placed = evs.map((m) => {
        const left = pct(m.date!);
        let row = rowLast.findIndex((last) => left - last >= MIN_GAP_PCT);
        if (row === -1) {
          row = rowLast.length;
          rowLast.push(left);
        } else {
          rowLast[row] = left;
        }
        return { m, left, row };
      });
      const nRows = Math.max(1, ...placed.map((p) => p.row + 1));
      const height = LANE_LABEL_H + nRows * ROW_H + LANE_PAD_BOTTOM;
      const top = y;
      y += height + LANE_GAP;
      return { stage, placed, height, top };
    });
    const undated = MILESTONES.filter((m) => !m.date && matches(m));
    return { lanes, totalH: Math.max(y, PLOT_TOP + 48), undated };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const clickGroup = (key: StageKey) => {
    if (openStage !== key) {
      setOpenStage(key);
      return;
    }
    setSel((v) => ({
      ...v,
      [key]: v[key].size === ALL_SUBCATS[key].length ? new Set<string>() : new Set(ALL_SUBCATS[key]),
    }));
  };

  const toggleSub = (stage: StageKey, sub: string) =>
    setSel((v) => {
      const next = new Set(v[stage]);
      if (next.has(sub)) next.delete(sub);
      else next.add(sub);
      return { ...v, [stage]: next };
    });

  const showTip = (e: React.MouseEvent<HTMLElement>, m: Milestone) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const x = Math.min(Math.max(r.left + r.width / 2, 156), vw - 156);
    const below = r.top < 190;
    setTip({ m, x, y: below ? r.bottom + 8 : r.top - 8, below });
  };

  const stageColor = (key: string) => STAGES.find((s) => s.key === key)?.color;

  // 2D macOS-dock scale for a marker at (leftPct, absY), given the cursor.
  const dockScale = (leftPct: number, absY: number) => {
    if (!dock) return 1;
    const mx = (leftPct / 100) * dock.w;
    const dist = Math.hypot(mx - dock.x, absY - dock.y);
    return 1 + DOCK_MAX * Math.max(0, 1 - dist / DOCK_RADIUS);
  };

  return (
    <div className="card p-5">
      {/* Legend: group pills expand inline into subcategories; ✕ collapses */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {STAGES.map((s) => {
          const subs = ALL_SUBCATS[s.key];
          const selected = sel[s.key];
          const total = MILESTONES.filter((m) => m.stage === s.key).length;
          const open = openStage === s.key;
          const noneOn = selected.size === 0;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => clickGroup(s.key)}
                aria-expanded={open}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  open
                    ? "border-border-strong bg-surface-raised"
                    : noneOn
                      ? "border-border opacity-40"
                      : "border-border-strong"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
                <span className="tnum text-faint">{total}</span>
                {!open && (
                  <span className="text-[9px] text-faint" aria-hidden>▸</span>
                )}
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 pr-1">
                    <span className="mx-0.5 h-5 w-px shrink-0 bg-border-strong" aria-hidden />
                    {subs.map((sub) => {
                      const on = selected.has(sub);
                      const count = MILESTONES.filter(
                        (m) => m.stage === s.key && subcatsOf(m).includes(sub),
                      ).length;
                      const expansion = lookupAcronym(sub)?.expansion;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSub(s.key, sub)}
                          aria-pressed={on}
                          title={expansion ?? undefined}
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                            on ? "border-border-strong" : "border-border opacity-40"
                          }`}
                          style={on ? { borderColor: s.color } : undefined}
                        >
                          {subcatLabel(sub)}
                          <span className="tnum text-faint">{count}</span>
                        </button>
                      );
                    })}
                    {/* Collapse */}
                    <button
                      type="button"
                      onClick={() => setOpenStage(null)}
                      aria-label={`Collapse ${s.label}`}
                      title="Collapse"
                      className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-faint transition-colors hover:border-border-strong hover:text-foreground"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <span className="ml-auto hidden text-[11px] text-faint sm:block">
          click a stage for subcategories · hover a logo for details · click to open source
        </span>
      </div>

      <div className="mt-3 overflow-x-auto pb-2">
        <div className="relative min-w-[860px]">
          <div className="flex">
            {/* Pre-2026: history exists, not yet ingested */}
            <div
              className="relative shrink-0 overflow-hidden rounded-l-xl border-r border-dashed border-border-strong bg-surface-raised"
              style={{ width: 116, height: totalH }}
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

            {/* Plot: tinted lanes + shared month axis; hover magnifies logos */}
            <div
              className="relative flex-1"
              style={{ height: totalH }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDock({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width });
              }}
              onMouseLeave={() => setDock(null)}
            >
              {/* Lane backgrounds (tinted per stage) */}
              {lanes.map((l) => (
                <div
                  key={l.stage.key}
                  className="absolute left-0 right-0 overflow-hidden rounded-xl"
                  style={{ top: l.top, height: l.height, background: l.stage.soft }}
                >
                  <span
                    className="absolute left-2.5 top-1.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: l.stage.color }}
                  >
                    {l.stage.label}
                  </span>
                </div>
              ))}

              {/* Month gridlines + labels (above lane tints, below markers) */}
              {MONTHS.map((mo) => {
                const left = ((mo.t - T0) / (T1 - T0)) * 100;
                return (
                  <div key={mo.label} className="absolute bottom-0 top-0" style={{ left: `${left}%`, zIndex: 1 }}>
                    <div className="absolute bottom-0 top-5 border-l border-border/70" />
                    <div className="absolute top-0 -translate-x-1/2 text-[10px] font-medium uppercase tracking-wider text-faint">
                      {mo.label}
                    </div>
                  </div>
                );
              })}

              {/* Markers */}
              {lanes.flatMap((l) =>
                l.placed.map(({ m, left, row }) => {
                  const top = l.top + LANE_LABEL_H + row * ROW_H;
                  const scale = dockScale(left, top + MARKER / 2);
                  const color = l.stage.color;
                  return (
                    <a
                      key={`${m.company}-${m.activity}`}
                      href={m.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      onMouseEnter={(e) => showTip(e, m)}
                      onMouseLeave={() => setTip(null)}
                      className={`absolute grid place-items-center rounded-full border-2 bg-surface shadow-sm transition-transform duration-75 ease-out hover:z-30 ${m.sourceUrl ? "cursor-pointer" : "cursor-default"}`}
                      style={{
                        left: `${left}%`,
                        top,
                        width: MARKER,
                        height: MARKER,
                        borderColor: color,
                        transform: `translateX(-50%) scale(${scale.toFixed(3)})`,
                        transformOrigin: "center",
                        zIndex: scale > 1.02 ? Math.round(scale * 20) : 2,
                      }}
                      aria-label={`${m.company} — ${m.activity}`}
                    >
                      <FirmLogo src={m.logo} name={m.company} size={18} />
                    </a>
                  );
                }),
              )}
            </div>
          </div>

          {undated.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed border-border pt-3">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-faint">date TBD</span>
              {undated.map((m) => (
                <a
                  key={`${m.company}-${m.activity}`}
                  href={m.sourceUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={(e) => showTip(e, m)}
                  onMouseLeave={() => setTip(null)}
                  className={`grid place-items-center rounded-full border-2 border-dashed bg-surface transition-transform hover:scale-110 ${m.sourceUrl ? "cursor-pointer hover:border-solid" : "cursor-default"}`}
                  style={{ width: MARKER, height: MARKER, borderColor: stageColor(m.stage) }}
                  aria-label={`${m.company} — ${m.activity} (date TBD)`}
                >
                  <FirmLogo src={m.logo} name={m.company} size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {tip && (
        <div
          className={`pointer-events-none fixed z-50 w-72 -translate-x-1/2 rounded-xl bg-foreground p-3 shadow-2xl ${tip.below ? "" : "-translate-y-full"}`}
          style={{ left: tip.x, top: tip.y }}
        >
          <div className="mb-1 flex items-center gap-2">
            <FirmLogo src={tip.m.logo} name={tip.m.company} size={18} />
            <span className="text-[13px] font-semibold text-background">{tip.m.company}</span>
            <span
              className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-background/90"
              style={{ background: stageColor(tip.m.stage) }}
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
  );
}
