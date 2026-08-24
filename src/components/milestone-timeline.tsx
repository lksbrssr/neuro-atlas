"use client";

// Timeline of the Q1+ 2026 BCI milestones. 2024 and 2025 are slim, always-
// visible context columns (headline capital only). 2026 is the lane timeline:
// it fits the screen by default (Jan–May); the ▸ button expands it to the full
// year (Jan–Dec), which scrolls — the slim years stay pinned, a right-edge fade
// cues the scroll, and a live "today" line marks the present. The right summary
// rail is collapsible. Legend pills expand inline into subcategories (acronyms
// carry a tooltip; ✕ collapses). Undated milestones sit in a "date TBD" shelf.

import { useEffect, useMemo, useRef, useState } from "react";
import MILESTONES from "@/data/milestones.json";
import { FirmLogo } from "@/components/firm-logo";
import { Sparkline } from "@/components/sparkline";
import { lookupAcronym } from "@/components/abbr";

type Milestone = (typeof MILESTONES)[number];

const T0 = Date.UTC(2026, 0, 1);
const T1_FIT = Date.UTC(2026, 4, 15);
const T1_FULL = Date.UTC(2026, 11, 31);

const STAGES = [
  { key: "capital", label: "Capital", color: "#22b8cf", soft: "rgba(34,184,207,0.12)" },
  { key: "clinical", label: "Clinical", color: "#4c6ef5", soft: "rgba(76,110,245,0.12)" },
  { key: "commercial", label: "Commercial", color: "#9775fa", soft: "rgba(151,117,250,0.13)" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const YEARS = [
  { year: 2024, usdM: 260 },
  { year: 2025, usdM: 322 },
];

const PLOT_TOP = 24;
const LANE_LABEL_H = 20;
const ROW_H = 46;
const MARKER = 34;
const LOGO = 24;
const LANE_PAD_BOTTOM = 14;
const LANE_GAP = 8;
const SLIM_W = 74;
const EXPANDED_W = 1500;
const DOCK_RADIUS = 100;
const DOCK_MAX = 0.5;
const SCATTER = [
  [30, 12], [55, 22], [24, 34], [60, 46], [36, 58], [52, 70], [28, 82], [58, 90], [40, 26], [46, 52],
];

const dateOf = (s: string) => new Date(s + "T00:00:00Z").getTime();
function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
function fmtDateFull(dateStr: string): string {
  return new Date(dateOf(dateStr)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function fmtUsd(m: number): string {
  return m >= 1000 ? `$${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)}b` : `$${Math.round(m)}m`;
}
function expandActivity(activity: string): [string, string | null][] {
  return activity.split("/").map((tok) => [tok, lookupAcronym(tok.trim())?.expansion ?? null]);
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

const CUM_2026 = (() => {
  const caps = MILESTONES.filter((m) => m.stage === "capital" && m.amountUsdM && m.date).sort((a, b) =>
    a.date! < b.date! ? -1 : 1,
  );
  let s = 0;
  return caps.map((m) => { s += m.amountUsdM!; return { x: m.date as string, y: s }; });
})();

export function MilestoneTimeline() {
  const [sel, setSel] = useState<Record<StageKey, Set<string>>>({
    capital: new Set(ALL_SUBCATS.capital),
    clinical: new Set(ALL_SUBCATS.clinical),
    commercial: new Set(ALL_SUBCATS.commercial),
  });
  const [openStage, setOpenStage] = useState<StageKey | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const [dock, setDock] = useState<{ x: number; y: number; w: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ m: Milestone; x: number; y: number; below: boolean } | null>(null);
  const [pillTip, setPillTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [selRange, setSelRange] = useState<{ a: number; b: number } | null>(null);

  const plotRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);

  useEffect(() => setNow(Date.now()), []);

  const T1 = expanded ? T1_FULL : T1_FIT;
  const lastMonth = expanded ? 11 : 4;
  const months = Array.from({ length: lastMonth + 1 }, (_, i) => ({
    label: new Date(Date.UTC(2026, i, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    t: Date.UTC(2026, i, 1),
  }));
  const minGap = expanded ? 2.8 : 5.6;
  const pct = (dateStr: string) => Math.min(Math.max((dateOf(dateStr) - T0) / (T1 - T0), 0), 1) * 100;
  const pctToT = (p: number) => T0 + (p / 100) * (T1 - T0);

  const matches = (m: Milestone) => subcatsOf(m).some((sub) => sel[m.stage as StageKey]?.has(sub));

  const { lanes, totalH, undated } = useMemo(() => {
    let y = PLOT_TOP;
    const lanes = STAGES.filter((s) => sel[s.key].size > 0).map((stage) => {
      const evs = MILESTONES.filter((m) => m.stage === stage.key && m.date && matches(m)).sort((a, b) =>
        a.date! < b.date! ? -1 : 1,
      );
      const rowLast: number[] = [];
      const placed = evs.map((m) => {
        const left = pct(m.date!);
        let row = rowLast.findIndex((last) => left - last >= minGap);
        if (row === -1) { row = rowLast.length; rowLast.push(left); } else { rowLast[row] = left; }
        return { m, left, row };
      });
      const nRows = Math.max(1, ...placed.map((p) => p.row + 1));
      const height = LANE_LABEL_H + nRows * ROW_H + LANE_PAD_BOTTOM;
      const top = y;
      y += height + LANE_GAP;
      return { stage, placed, height, top };
    });
    const undated = MILESTONES.filter((m) => !m.date && matches(m));
    return { lanes, totalH: Math.max(y, PLOT_TOP + 120), undated };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, expanded]);

  const agg = useMemo(() => {
    const [t1, t2] = selRange
      ? [pctToT(Math.min(selRange.a, selRange.b)), pctToT(Math.max(selRange.a, selRange.b))]
      : [T0, T1];
    const rows = STAGES.filter((s) => sel[s.key].size > 0).map((stage) => {
      const evs = MILESTONES.filter(
        (m) => m.stage === stage.key && m.date && matches(m) && dateOf(m.date) >= t1 && dateOf(m.date) <= t2,
      );
      const usd = evs.reduce((s, m) => s + (m.amountUsdM ?? 0), 0);
      const rounds = evs.filter((m) => m.amountUsdM).length;
      const byType: Record<string, number> = {};
      evs.forEach((m) => subcatsOf(m).forEach((sub) => { if (sub !== "$") byType[sub] = (byType[sub] ?? 0) + 1; }));
      const breakdown = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(" · ");
      return { stage, count: evs.length, usd, rounds, breakdown };
    });
    return { t1, t2, rows };
  }, [sel, selRange, expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickGroup = (key: StageKey) => {
    if (openStage !== key) { setOpenStage(key); return; }
    setSel((v) => ({ ...v, [key]: v[key].size === ALL_SUBCATS[key].length ? new Set<string>() : new Set(ALL_SUBCATS[key]) }));
  };
  const toggleSub = (stage: StageKey, sub: string) =>
    setSel((v) => {
      const next = new Set(v[stage]);
      if (next.has(sub)) next.delete(sub); else next.add(sub);
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

  const dockScale = (leftPct: number, absY: number) => {
    if (!dock) return 1;
    const mx = (leftPct / 100) * dock.w;
    const dist = Math.hypot(mx - dock.x, absY - dock.y);
    return 1 + DOCK_MAX * Math.max(0, 1 - dist / DOCK_RADIUS);
  };
  const xToPct = (clientX: number) => {
    const r = plotRef.current!.getBoundingClientRect();
    return Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * 100;
  };

  // Faint cumulative-capital line for the Capital lane: solid over the data
  // (Jan–Apr), dotted run-rate extrapolation to the axis end (through EOY when
  // expanded). x in axis-% (0–100), y scaled to the lane height H.
  const capitalLine = (H: number) => {
    const pts = [{ x: 0, y: 0 }, ...CUM_2026.map((p) => ({ x: pct(p.x), y: p.y }))];
    const last = pts[pts.length - 1];
    const slope = last.x > 0 ? last.y / last.x : 0;
    const yEoy = slope * 100;
    const yMax = Math.max(yEoy, last.y) || 1;
    const ys = (v: number) => H - 5 - (v / yMax) * (H - 12);
    return {
      solid: pts.map((p) => `${p.x.toFixed(2)},${ys(p.y).toFixed(2)}`).join(" "),
      dashed: `${last.x.toFixed(2)},${ys(last.y).toFixed(2)} 100,${ys(yEoy).toFixed(2)}`,
    };
  };

  const slimYear = (y: { year: number; usdM: number }) => (
    <div
      key={y.year}
      className="relative shrink-0 overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-raised"
      style={{ width: SLIM_W, height: totalH }}
    >
      <div className="absolute inset-0" style={{ filter: "blur(6px)", opacity: 0.2 }} aria-hidden>
        {SCATTER.map(([x, yy], i) => (
          <span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${yy}%`, width: 12, height: 12, background: STAGES[i % 3].color }} />
        ))}
      </div>
      <div className="absolute inset-x-0 top-4 px-1 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{y.year}</div>
        <div className="tnum text-[13px] font-semibold tracking-tight">{fmtUsd(y.usdM)}</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Legend */}
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
                  open ? "border-border-strong bg-surface-raised" : noneOn ? "border-border opacity-40" : "border-border-strong"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
                <span className="tnum text-faint">{total}</span>
                {!open && <span className="text-[9px] text-faint" aria-hidden>▸</span>}
              </button>

              <div className={`grid transition-all duration-300 ease-out ${open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 pr-1">
                    <span className="mx-0.5 h-5 w-px shrink-0 bg-border-strong" aria-hidden />
                    {subs.map((sub) => {
                      const on = selected.has(sub);
                      const count = MILESTONES.filter((m) => m.stage === s.key && subcatsOf(m).includes(sub)).length;
                      const expansion = lookupAcronym(sub)?.expansion;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSub(s.key, sub)}
                          onMouseEnter={(e) => {
                            if (!expansion) return;
                            const r = e.currentTarget.getBoundingClientRect();
                            setPillTip({ text: expansion, x: r.left + r.width / 2, y: r.top - 6 });
                          }}
                          onMouseLeave={() => setPillTip(null)}
                          aria-pressed={on}
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${on ? "border-border-strong" : "border-border opacity-40"}`}
                          style={on ? { borderColor: s.color } : undefined}
                        >
                          {subcatLabel(sub)}
                          <span className="tnum text-faint">{count}</span>
                        </button>
                      );
                    })}
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
        <span className="ml-auto hidden text-[11px] text-faint md:block">
          drag across to summarize · hover a logo for the name · click to open source
        </span>
      </div>

      <div className="flex gap-2">
        {/* Slim, always-visible year columns */}
        {YEARS.map(slimYear)}

        {/* 2026 — fits the screen; expands to a scrollable full year */}
        <div className="relative min-w-0 flex-1">
          <div className="overflow-x-auto pb-2">
            <div
              ref={plotRef}
              className="relative cursor-crosshair select-none"
              style={{ height: totalH, width: expanded ? EXPANDED_W : "100%", minWidth: expanded ? EXPANDED_W : undefined }}
              onPointerDown={(e) => { dragStart.current = xToPct(e.clientX); dragged.current = false; setSelRange(null); }}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDock({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width });
                if (dragStart.current != null) {
                  const p = xToPct(e.clientX);
                  if (Math.abs(p - dragStart.current) > 0.5) { dragged.current = true; setSelRange({ a: dragStart.current, b: p }); }
                }
              }}
              onPointerUp={() => { if (dragStart.current != null && !dragged.current) setSelRange(null); dragStart.current = null; }}
              onMouseLeave={() => setDock(null)}
            >
              {lanes.map((l) => {
                const cap = l.stage.key === "capital" ? capitalLine(l.height) : null;
                return (
                  <div key={l.stage.key} className="absolute left-0 right-0 overflow-hidden rounded-xl" style={{ top: l.top, height: l.height, background: l.stage.soft }}>
                    {cap && (
                      <svg className="pointer-events-none absolute inset-0" width="100%" height={l.height} viewBox={`0 0 100 ${l.height}`} preserveAspectRatio="none" aria-hidden>
                        <polyline points={cap.solid} fill="none" stroke={l.stage.color} strokeWidth={1} opacity={0.4} vectorEffect="non-scaling-stroke" />
                        <polyline points={cap.dashed} fill="none" stroke={l.stage.color} strokeWidth={1} strokeDasharray="3 3" opacity={0.28} vectorEffect="non-scaling-stroke" />
                      </svg>
                    )}
                    <span className="absolute left-2.5 top-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: l.stage.color }}>{l.stage.label}</span>
                  </div>
                );
              })}

              {selRange && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 rounded-md border-x"
                  style={{ left: `${Math.min(selRange.a, selRange.b)}%`, width: `${Math.abs(selRange.a - selRange.b)}%`, background: "var(--accent-soft)", borderColor: "var(--accent)", opacity: 0.6, zIndex: 3 }}
                />
              )}

              {months.map((mo) => {
                const left = ((mo.t - T0) / (T1 - T0)) * 100;
                return (
                  <div key={mo.label} className="absolute bottom-0 top-0" style={{ left: `${left}%`, zIndex: 1 }}>
                    <div className="absolute bottom-0 top-5 border-l border-border/70" />
                    <div className="absolute top-0 -translate-x-1/2 text-[10px] font-medium uppercase tracking-wider text-faint">{mo.label}</div>
                  </div>
                );
              })}

              {expanded && now != null && (() => {
                const p = ((now - T0) / (T1 - T0)) * 100;
                if (p < 0 || p > 100) return null;
                return (
                  <div className="pointer-events-none absolute bottom-0 top-0" style={{ left: `${p}%`, zIndex: 6 }}>
                    <div className="absolute bottom-0 top-4 border-l-2 border-dashed" style={{ borderColor: "var(--accent)" }} />
                    <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent-foreground)" }}>today</div>
                  </div>
                );
              })()}

              {lanes.flatMap((l) =>
                l.placed.map(({ m, left, row }) => {
                  const top = l.top + LANE_LABEL_H + row * ROW_H;
                  const scale = dockScale(left, top + MARKER / 2);
                  const color = l.stage.color;
                  const key = `${m.company}-${m.activity}`;
                  const isHover = hovered === key;
                  return (
                    <a
                      key={key}
                      href={m.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      onMouseEnter={(e) => { setHovered(key); showTip(e, m); }}
                      onMouseLeave={() => { setHovered(null); setTip(null); }}
                      onClick={(e) => { if (dragged.current) e.preventDefault(); }}
                      className={`absolute flex items-center rounded-full border-2 bg-surface shadow-sm transition-transform duration-100 ease-out ${m.sourceUrl ? "cursor-pointer" : "cursor-default"}`}
                      style={{
                        left: `${left}%`, top, height: MARKER,
                        width: isHover ? "auto" : MARKER,
                        paddingLeft: isHover ? 4 : 0, paddingRight: isHover ? 11 : 0,
                        justifyContent: isHover ? "flex-start" : "center",
                        borderColor: color,
                        transform: `translateX(-50%) scale(${scale.toFixed(3)})`,
                        transformOrigin: "center",
                        zIndex: isHover ? 40 : scale > 1.02 ? Math.round(scale * 20) : 4,
                      }}
                      aria-label={`${m.company} — ${m.activity}`}
                    >
                      <FirmLogo src={m.logo} name={m.company} size={LOGO} />
                      {isHover && <span className="ml-1.5 whitespace-nowrap text-[12px] font-semibold">{m.company}</span>}
                    </a>
                  );
                }),
              )}
            </div>
          </div>

          {/* Right-edge scroll cue (only when expanded/scrollable) */}
          {expanded && (
            <div className="pointer-events-none absolute bottom-2 right-0 top-0 w-12" style={{ background: "linear-gradient(to right, transparent, var(--surface))" }} aria-hidden />
          )}

          {/* Expand / fit toggle */}
          <button
            type="button"
            onClick={() => { setExpanded((e) => !e); setSelRange(null); }}
            aria-label={expanded ? "Fit to screen" : "Expand to full year"}
            title={expanded ? "Fit to screen" : "Expand to full year"}
            className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-surface text-muted shadow-md transition-colors hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {expanded ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
            </svg>
          </button>

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
                  <FirmLogo src={m.logo} name={m.company} size={LOGO} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible summary rail */}
        {railOpen ? (
          <aside className="hidden w-48 shrink-0 lg:block">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">New capital by year</span>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                aria-label="Collapse panel"
                title="Collapse panel"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-faint transition-colors hover:border-border-strong hover:text-foreground"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
            {[...YEARS, { year: 2026, usdM: 653 }].map((c) => (
              <div key={c.year} className="mb-1">
                <div className="tnum flex items-baseline justify-between text-[13px]">
                  <span className="text-muted">{c.year}</span>
                  <span className="font-semibold">{fmtUsd(c.usdM)}</span>
                </div>
                {c.year === 2026 && CUM_2026.length > 1 && (
                  <span className="mt-0.5 block"><Sparkline series={CUM_2026} width={166} height={22} /></span>
                )}
              </div>
            ))}
            <div className="mt-1 text-[10px] text-faint">2026 is Jan–Apr</div>

            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">{selRange ? "Selected window" : "Full period"}</span>
                {selRange && <button type="button" onClick={() => setSelRange(null)} className="text-[10px] font-medium text-accent hover:underline">clear</button>}
              </div>
              <div className="tnum mb-3 text-[11px] text-muted">{fmtDate(agg.t1)} – {fmtDate(agg.t2)}, 2026</div>
              <div className="space-y-3">
                {agg.rows.map((r) => (
                  <div key={r.stage.key}>
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.stage.color }} />
                      <span className="text-[11px] font-semibold">{r.stage.label}</span>
                    </div>
                    {r.stage.key === "capital" ? (
                      <>
                        <div className="tnum text-[15px] font-semibold">{fmtUsd(r.usd)}</div>
                        <div className="text-[10px] text-faint">{r.rounds} round{r.rounds === 1 ? "" : "s"}{r.count > r.rounds ? ` · ${r.count - r.rounds} grant` : ""}</div>
                      </>
                    ) : (
                      <>
                        <div className="tnum text-[15px] font-semibold">{r.count}{r.usd > 0 && <span className="ml-1 text-[11px] font-medium text-muted">· {fmtUsd(r.usd)}</span>}</div>
                        <div className="text-[10px] leading-snug text-faint">{r.breakdown || "—"}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            aria-label="Open summary panel"
            title="Open summary"
            className="hidden shrink-0 items-start justify-center rounded-lg border border-border pt-3 text-faint transition-colors hover:border-border-strong hover:text-foreground lg:flex"
            style={{ width: 22 }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        )}
      </div>

      {pillTip && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-lg" style={{ left: pillTip.x, top: pillTip.y }}>
          {pillTip.text}
        </div>
      )}

      {tip && (
        <div className={`pointer-events-none fixed z-50 w-72 -translate-x-1/2 rounded-xl bg-foreground p-3 shadow-2xl ${tip.below ? "" : "-translate-y-full"}`} style={{ left: tip.x, top: tip.y }}>
          <div className="mb-1 flex items-center gap-2">
            <FirmLogo src={tip.m.logo} name={tip.m.company} size={18} />
            <span className="text-[13px] font-semibold text-background">{tip.m.company}</span>
            <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-background/90" style={{ background: stageColor(tip.m.stage) }}>{tip.m.stage}</span>
          </div>
          <div className="tnum text-[12px] font-medium text-background/90">
            {tip.m.activity}
            <span className="text-background/60">{" · "}{tip.m.date ? fmtDateFull(tip.m.date) : "Jan–Apr 2026 · exact date TBD"}</span>
          </div>
          {expandActivity(tip.m.activity).filter(([, ex]) => ex).length > 0 && (
            <div className="mt-1 text-[10px] leading-snug text-background/60">
              {expandActivity(tip.m.activity).filter(([, ex]) => ex).map(([tok, ex]) => `${tok} — ${ex}`).join(" · ")}
            </div>
          )}
          <div className="mt-1.5 text-[11px] leading-relaxed text-background/75">{tip.m.note ?? "Details coming soon."}</div>
          {tip.m.sourceUrl && <div className="mt-1.5 text-[10px] font-medium text-background/50">click to open source ↗</div>}
        </div>
      )}
    </div>
  );
}
