"use client";

// Timeline of the Q1+ 2026 BCI milestones (rebuild of the Neurotech Futures ×
// PL Neuro market-memo right column). ONE shared time axis — stage is encoded
// by marker color only (no separate lanes, no double encoding). Markers are
// logo-only; all detail lives in the hover card (fixed-positioned so it can
// never be clipped by the card frame). The legend's stage pills expand into
// their subcategories (FIH, IDE, pivotal, …) so you can filter by stage OR by
// any subset of subcategories. Undated milestones sit honestly in a "date TBD"
// shelf instead of being faked onto the axis.

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
  { key: "capital", label: "Capital", color: "var(--positive)" },
  { key: "clinical", label: "Clinical", color: "var(--negative)" },
  { key: "commercial", label: "Commercial", color: "var(--warning)" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const PLOT_TOP = 26; // month label row
const ROW_H = 40; // stagger row height
const MARKER = 26; // logo marker diameter
const MIN_GAP_PCT = 4.2; // min horizontal distance (in % of plot) before wrapping to a new row

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

// Subcategory bucket for an activity token: dollar amounts collapse into one
// "$" bucket (individual raise sizes aren't categories); everything else is
// its own token (FIH, IDE, pivotal, JV, grant, …).
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
  // Selected subcategories per stage (default: everything). A stage with an
  // empty selection is hidden entirely — that's how you switch a stage off.
  const [sel, setSel] = useState<Record<StageKey, Set<string>>>({
    capital: new Set(ALL_SUBCATS.capital),
    clinical: new Set(ALL_SUBCATS.clinical),
    commercial: new Set(ALL_SUBCATS.commercial),
  });
  const [expanded, setExpanded] = useState<Set<StageKey>>(new Set());
  const [tip, setTip] = useState<{ m: Milestone; x: number; y: number; below: boolean } | null>(null);

  const matches = (m: Milestone) =>
    subcatsOf(m).some((sub) => sel[m.stage as StageKey]?.has(sub));

  const dated = useMemo(() => {
    const list = MILESTONES.filter((m) => m.date && matches(m)).sort((a, b) =>
      a.date! < b.date! ? -1 : 1,
    );
    // Greedy stagger: place each marker on the first row with enough horizontal room.
    const rowLast: number[] = [];
    return list.map((m) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const undated = useMemo(() => MILESTONES.filter((m) => !m.date && matches(m)), [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const nRows = Math.max(1, ...dated.map((d) => d.row + 1));
  const plotH = PLOT_TOP + nRows * ROW_H + 26; // + baseline zone

  const toggleExpand = (key: StageKey) =>
    setExpanded((v) => {
      const next = new Set(v);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleSub = (stage: StageKey, sub: string) =>
    setSel((v) => {
      const next = new Set(v[stage]);
      if (next.has(sub)) next.delete(sub);
      else next.add(sub);
      return { ...v, [stage]: next };
    });

  const toggleAll = (stage: StageKey) =>
    setSel((v) => ({
      ...v,
      [stage]: v[stage].size === ALL_SUBCATS[stage].length ? new Set<string>() : new Set(ALL_SUBCATS[stage]),
    }));

  // Fixed-position hover card (viewport coordinates) — escapes the card frame
  // and the horizontal scroll container, so it can never be clipped.
  const showTip = (e: React.MouseEvent<HTMLElement>, m: Milestone) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const x = Math.min(Math.max(r.left + r.width / 2, 156), vw - 156);
    const below = r.top < 190;
    setTip({ m, x, y: below ? r.bottom + 8 : r.top - 8, below });
  };

  const stageColor = (key: string) => STAGES.find((s) => s.key === key)?.color;

  return (
    <div className="card p-5">
      {/* Legend: stage pills expand into their subcategories */}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {STAGES.map((s) => {
          const total = MILESTONES.filter((m) => m.stage === s.key).length;
          const on = sel[s.key].size > 0;
          const open = expanded.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleExpand(s.key)}
              aria-expanded={open}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                open ? "border-border-strong bg-surface-raised" : on ? "border-border-strong" : "border-border opacity-40"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="tnum text-faint">{total}</span>
              <span className={`text-[9px] text-faint transition-transform duration-300 ${open ? "rotate-90" : ""}`} aria-hidden>
                ▸
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-[11px] text-faint sm:block">
          click a stage for subcategories · hover a logo for details · click to open source
        </span>
      </div>

      {/* Subcategory chips (animated expand/collapse per stage) */}
      {STAGES.map((s) => {
        const open = expanded.has(s.key);
        const allOn = sel[s.key].size === ALL_SUBCATS[s.key].length;
        return (
          <div
            key={s.key}
            inert={!open}
            className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 py-1.5 pl-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>
                  {s.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAll(s.key)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                    allOn ? "border-border-strong bg-surface-raised" : "border-border text-muted"
                  }`}
                >
                  all
                </button>
                {ALL_SUBCATS[s.key].map((sub) => {
                  const on = sel[s.key].has(sub);
                  const count = MILESTONES.filter((m) => m.stage === s.key && subcatsOf(m).includes(sub)).length;
                  const expansion = lookupAcronym(sub)?.expansion;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSub(s.key, sub)}
                      aria-pressed={on}
                      title={expansion ?? undefined}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                        on ? "border-border-strong" : "border-border opacity-40"
                      }`}
                      style={on ? { borderColor: s.color } : undefined}
                    >
                      {subcatLabel(sub)}
                      <span className="tnum text-faint">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <div className="mt-3 overflow-x-auto pb-2">
        <div className="relative min-w-[860px]">
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

            {/* Plot — one shared axis; color encodes stage */}
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

              {/* Shared baseline */}
              <div className="absolute left-0 right-0 border-b border-border/70" style={{ top: plotH - 1 }} />

              {/* Markers: logo-only, ringed in the stage color */}
              {dated.map(({ m, left, row }) => {
                const top = PLOT_TOP + row * ROW_H;
                const color = stageColor(m.stage);
                return (
                  <span key={`${m.company}-${m.activity}`}>
                    <span
                      className="absolute w-px bg-border-strong"
                      style={{ left: `${left}%`, top: top + MARKER, height: plotH - (top + MARKER) - 5 }}
                      aria-hidden
                    />
                    <span
                      className="absolute h-[7px] w-[7px] -translate-x-1/2 rounded-full border-2"
                      style={{ left: `${left}%`, top: plotH - 4, borderColor: color, background: "var(--surface)" }}
                      aria-hidden
                    />
                    <a
                      href={m.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      onMouseEnter={(e) => showTip(e, m)}
                      onMouseLeave={() => setTip(null)}
                      className={`absolute grid -translate-x-1/2 place-items-center rounded-full border-2 bg-surface shadow-sm transition-transform hover:z-30 hover:scale-110 ${m.sourceUrl ? "cursor-pointer" : "cursor-default"}`}
                      style={{ left: `${left}%`, top, width: MARKER, height: MARKER, borderColor: color }}
                      aria-label={`${m.company} — ${m.activity}`}
                    >
                      <FirmLogo src={m.logo} name={m.company} size={18} />
                    </a>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Date-TBD shelf: logo-only, dashed ring = no confirmed date */}
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
                  className={`grid place-items-center rounded-full border-2 border-dashed bg-surface ${m.sourceUrl ? "cursor-pointer hover:border-solid" : "cursor-default"}`}
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

      {/* Hover card — fixed to the viewport so the card frame can never clip it */}
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
