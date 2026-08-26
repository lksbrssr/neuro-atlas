"use client";

// The 2026 milestone timeline. Three stage lanes (capital / clinical /
// commercial) on one shared time axis whose domain is fitted to the DATA —
// earliest event → latest event plus ~5% headroom — so the plot fills its
// container with no dead calendar. "Project to year-end" is an explicit
// toggle that extends the axis and draws the capital run-rate extrapolation
// over a hatched "projected" region. Drag across the plot (or the visible
// brush handles) to summarize a window; the summary lives in a chip above the
// plot. One hover behaviour: a ring on the marker plus a single tooltip.
// Below md the same data renders as a reverse-chronological event list.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import MILESTONES from "@/data/milestones.json";
import { FirmLogo } from "@/components/firm-logo";
import { lookupAcronym } from "@/components/abbr";

type Milestone = (typeof MILESTONES)[number];

const STAGES = [
  { key: "capital", label: "Capital", color: "var(--stage-capital)", soft: "var(--stage-capital-soft)" },
  { key: "clinical", label: "Clinical", color: "var(--stage-clinical)", soft: "var(--stage-clinical-soft)" },
  { key: "commercial", label: "Commercial", color: "var(--stage-commercial)", soft: "var(--stage-commercial-soft)" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const MARKER = 28; // visual + hit target (≥24px, WCAG 2.5.8)
const LOGO = 20;
const ROW_H = 36;
const LANE_LABEL_H = 26;
const LANE_PAD_BOTTOM = 10;
const LANE_GAP = 8;
const MIN_GAP_PX = MARKER + 6; // same-row collision distance
const MIN_PLOT_W = 720; // below this the plot scrolls (narrow-viewport fallback)

const DAY = 86_400_000;
const dateOf = (s: string) => new Date(s + "T00:00:00Z").getTime();
const dated = MILESTONES.filter((m) => m.date);
const DATA_START = Math.min(...dated.map((m) => dateOf(m.date!)));
const DATA_END = Math.max(...dated.map((m) => dateOf(m.date!)));
const YEAR_END = Date.UTC(2026, 11, 31);
const JAN1 = Date.UTC(2026, 0, 1);

// SSR-safe "now" (null on the server; the today-marker appears after mount).
const NOW = Date.now();
const emptySubscribe = () => () => {};
const useNow = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => NOW,
    () => null,
  );

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

// Cumulative tracked capital through 2026 (for the line in the Capital lane).
const CUM_2026 = (() => {
  const caps = MILESTONES.filter((m) => m.stage === "capital" && m.amountUsdM && m.date).sort((a, b) => (a.date! < b.date! ? -1 : 1));
  let s = 0;
  return caps.map((m) => {
    s += m.amountUsdM!;
    return { t: dateOf(m.date!), y: s };
  });
})();

const stageOf = (key: string) => STAGES.find((s) => s.key === key)!;

export function MilestoneTimeline() {
  const [sel, setSel] = useState<Record<StageKey, Set<string>>>({
    capital: new Set(ALL_SUBCATS.capital),
    clinical: new Set(ALL_SUBCATS.clinical),
    commercial: new Set(ALL_SUBCATS.commercial),
  });
  const [openStage, setOpenStage] = useState<StageKey | null>(null);
  const [projected, setProjected] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ m: Milestone; x: number; y: number; below: boolean } | null>(null);
  const [pillTip, setPillTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [selRange, setSelRange] = useState<{ a: number; b: number } | null>(null); // fractions 0..1 of the domain
  const [containerW, setContainerW] = useState(1024);

  const now = useNow();
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const dragEdge = useRef<"a" | "b" | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Axis domain: fitted to the data, not the calendar ──────────────────────
  const span = DATA_END - DATA_START;
  // Extend to "today" only when today is close enough to the data to not
  // create dead space (stale data shouldn't stretch the axis).
  const liveEnd = now != null && now > DATA_END && now - DATA_END <= span * 0.15 ? now : DATA_END;
  const T0 = DATA_START - span * 0.03;
  const T1 = projected ? YEAR_END : liveEnd + span * 0.05;

  const innerW = Math.max(containerW, MIN_PLOT_W);
  const xOf = (t: number) => ((t - T0) / (T1 - T0)) * innerW;
  const fracToT = (f: number) => T0 + f * (T1 - T0);

  const months = useMemo(() => {
    const out: { label: string; t: number; clamped?: boolean }[] = [];
    const d = new Date(T0);
    let y = d.getUTCFullYear();
    let mo = d.getUTCMonth();
    for (;;) {
      const t = Date.UTC(y, mo, 1);
      if (t > T1) break;
      if (t >= T0) out.push({ label: new Date(t).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), t });
      else out.push({ label: new Date(t).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), t: T0, clamped: true });
      mo++;
      if (mo === 12) {
        mo = 0;
        y++;
      }
    }
    return out;
  }, [T0, T1]);

  const matches = useMemo(() => {
    return (m: Milestone) => subcatsOf(m).some((sub) => sel[m.stage as StageKey]?.has(sub));
  }, [sel]);

  // ── Lane layout (px-based greedy row assignment) ────────────────────────────
  const { lanes, totalH, undated } = useMemo(() => {
    let y = 0;
    const lanes = STAGES.filter((s) => sel[s.key].size > 0).map((stage) => {
      const evs = MILESTONES.filter((m) => m.stage === stage.key && m.date && matches(m)).sort((a, b) => (a.date! < b.date! ? -1 : 1));
      const rowLast: number[] = [];
      const placed = evs.map((m) => {
        const x = xOf(dateOf(m.date!));
        let row = rowLast.findIndex((last) => x - last >= MIN_GAP_PX);
        if (row === -1) {
          row = rowLast.length;
          rowLast.push(x);
        } else {
          rowLast[row] = x;
        }
        return { m, x, row };
      });
      const nRows = Math.max(1, rowLast.length);
      const height = LANE_LABEL_H + nRows * ROW_H + LANE_PAD_BOTTOM;
      const top = y;
      y += height + LANE_GAP;
      return { stage, placed, height, top, count: evs.length };
    });
    const undated = MILESTONES.filter((m) => !m.date && matches(m));
    return { lanes, totalH: Math.max(y - LANE_GAP, 140) + 22, undated };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, matches, innerW, T0, T1]);

  const AXIS_TOP = 22; // month labels above the lanes

  // ── Brush aggregates ────────────────────────────────────────────────────────
  const agg = useMemo(() => {
    if (!selRange) return null;
    const [t1, t2] = [fracToT(Math.min(selRange.a, selRange.b)), fracToT(Math.max(selRange.a, selRange.b))];
    const rows = STAGES.filter((s) => sel[s.key].size > 0).map((stage) => {
      const evs = MILESTONES.filter((m) => m.stage === stage.key && m.date && matches(m) && dateOf(m.date) >= t1 && dateOf(m.date) <= t2);
      const usd = evs.reduce((s, m) => s + (m.amountUsdM ?? 0), 0);
      return { stage, count: evs.length, usd };
    });
    const total = rows.reduce((s, r) => s + r.count, 0);
    return { t1, t2, rows, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selRange, sel, matches, T0, T1]);

  const clickGroup = (key: StageKey) => {
    if (openStage !== key) {
      setOpenStage(key);
      return;
    }
    setSel((v) => ({ ...v, [key]: v[key].size === ALL_SUBCATS[key].length ? new Set<string>() : new Set(ALL_SUBCATS[key]) }));
  };
  const toggleSub = (stage: StageKey, sub: string) =>
    setSel((v) => {
      const next = new Set(v[stage]);
      if (next.has(sub)) next.delete(sub);
      else next.add(sub);
      return { ...v, [stage]: next };
    });

  const showTip = (el: HTMLElement, m: Milestone) => {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const x = Math.min(Math.max(r.left + r.width / 2, 132), vw - 132);
    const below = r.top < 230;
    setTip({ m, x, y: below ? r.bottom + 10 : r.top - 10, below });
  };

  const fracOfClientX = (clientX: number) => {
    const r = plotRef.current!.getBoundingClientRect();
    return Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
  };

  // ── Capital cumulative line (+ optional EOY extrapolation) ─────────────────
  const capitalLine = (H: number) => {
    if (CUM_2026.length === 0) return null;
    const last = CUM_2026[CUM_2026.length - 1];
    const ratePerDay = last.y / ((last.t - JAN1) / DAY);
    const yEoy = ratePerDay * ((YEAR_END - JAN1) / DAY);
    const yMax = (projected ? yEoy : last.y) || 1;
    const ys = (v: number) => H - 6 - (v / yMax) * (H - LANE_LABEL_H - 12);
    const pts = [{ t: DATA_START, y: 0 }, ...CUM_2026.map((p) => ({ t: p.t, y: p.y }))];
    return {
      solid: pts.map((p) => `${xOf(p.t).toFixed(1)},${ys(p.y).toFixed(1)}`).join(" "),
      dashed: projected ? `${xOf(last.t).toFixed(1)},${ys(last.y).toFixed(1)} ${xOf(YEAR_END).toFixed(1)},${ys(yEoy).toFixed(1)}` : null,
      eoyLabel: projected ? `≈${fmtUsd(yEoy)} run-rate` : null,
    };
  };

  const needsScroll = innerW > containerW;

  // ── Desktop plot ────────────────────────────────────────────────────────────
  const plot = (
    <div className={`${needsScroll ? "scroll-fade-x overflow-x-auto" : ""} pb-1`}>
      <div
        ref={plotRef}
        className="relative cursor-crosshair select-none"
        style={{ width: innerW, height: AXIS_TOP + totalH }}
        onPointerDown={(e) => {
          if (dragEdge.current) return;
          dragStart.current = fracOfClientX(e.clientX);
          dragged.current = false;
        }}
        onPointerMove={(e) => {
          if (dragEdge.current && selRange) {
            const f = fracOfClientX(e.clientX);
            setSelRange({ ...selRange, [dragEdge.current]: f });
            return;
          }
          if (dragStart.current != null) {
            const f = fracOfClientX(e.clientX);
            if (Math.abs(f - dragStart.current) > 0.005) {
              dragged.current = true;
              setSelRange({ a: dragStart.current, b: f });
            }
          }
        }}
        onPointerUp={() => {
          if (dragStart.current != null && !dragged.current && !dragEdge.current) setSelRange(null);
          dragStart.current = null;
          dragEdge.current = null;
        }}
      >
        {/* Lanes */}
        {lanes.map((l) => {
          const cap = l.stage.key === "capital" ? capitalLine(l.height) : null;
          return (
            <div
              key={l.stage.key}
              className="absolute left-0 right-0 overflow-hidden rounded-lg"
              style={{ top: AXIS_TOP + l.top, height: l.height, background: l.stage.soft, borderLeft: `2px solid ${l.stage.color}` }}
            >
              {cap && (
                <svg className="pointer-events-none absolute inset-0" width={innerW} height={l.height} aria-hidden>
                  <polyline points={cap.solid} fill="none" stroke={l.stage.color} strokeWidth={1.5} opacity={0.45} />
                  {cap.dashed && <polyline points={cap.dashed} fill="none" stroke={l.stage.color} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.75} />}
                </svg>
              )}
              <span className="absolute left-3 top-1.5 flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wider text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: l.stage.color }} aria-hidden />
                {l.stage.label}
                <span className="tnum font-medium text-faint">{l.count}</span>
              </span>
              {cap?.eoyLabel && (
                <span className="tnum absolute right-2 top-1.5 text-micro font-medium text-muted">{cap.eoyLabel}</span>
              )}
            </div>
          );
        })}

        {/* Projected region (toggle on): hatched, clearly not data */}
        {projected && (
          <div
            className="pointer-events-none absolute bottom-0 rounded-r-lg"
            style={{
              top: AXIS_TOP,
              left: xOf(DATA_END) + MARKER / 2 + 2,
              right: 0,
              background: "repeating-linear-gradient(135deg, transparent 0 5px, var(--border) 5px 6px)",
              opacity: 0.7,
            }}
          >
            <span className="absolute right-1 -top-5 text-micro font-medium uppercase tracking-wider text-faint">projected</span>
          </div>
        )}

        {/* Month ticks */}
        {months.map((mo, i) => {
          const x = xOf(mo.t);
          const nearLeftEdge = x < 28;
          return (
            <div key={mo.t} className="absolute bottom-0 top-0" style={{ left: x }}>
              {!mo.clamped && <div className="absolute top-5 bottom-0 border-l border-border/80" />}
              <div className={`absolute top-0 whitespace-nowrap text-micro font-medium uppercase tracking-wider text-faint ${nearLeftEdge ? "left-0" : "-translate-x-1/2"}`}>
                {mo.label}
                {i === 0 && <span className="ml-1 text-faint/80">2026</span>}
              </div>
            </div>
          );
        })}

        {/* Today marker (only when it falls inside the fitted domain) */}
        {now != null && now >= T0 && now <= T1 && (
          <div className="pointer-events-none absolute bottom-0 top-0 z-[6]" style={{ left: xOf(now) }}>
            <div className="absolute top-4 bottom-0 border-l-2 border-dashed" style={{ borderColor: "var(--accent)" }} />
            <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent-foreground)" }}>
              today
            </div>
          </div>
        )}

        {/* Brush selection with draggable handles */}
        {selRange && (
          <>
            <div
              className="pointer-events-none absolute bottom-0 rounded-md"
              style={{
                top: AXIS_TOP,
                left: `${Math.min(selRange.a, selRange.b) * 100}%`,
                width: `${Math.abs(selRange.a - selRange.b) * 100}%`,
                background: "var(--accent-soft)",
                opacity: 0.55,
                zIndex: 3,
              }}
            />
            {(["a", "b"] as const).map((edge) => (
              <div
                key={edge}
                role="separator"
                aria-label={`Adjust window ${edge === "a" ? "start" : "end"}`}
                className="absolute bottom-0 z-[7] w-2.5 -translate-x-1/2 cursor-ew-resize"
                style={{ top: AXIS_TOP, left: `${selRange[edge] * 100}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  dragEdge.current = edge;
                  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (dragEdge.current === edge) setSelRange((r) => (r ? { ...r, [edge]: fracOfClientX(e.clientX) } : r));
                }}
                onPointerUp={() => {
                  dragEdge.current = null;
                }}
              >
                <div className="mx-auto h-full w-0.5 bg-accent" />
              </div>
            ))}
          </>
        )}

        {/* Markers */}
        {lanes.flatMap((l) =>
          l.placed.map(({ m, x, row }) => {
            const top = AXIS_TOP + l.top + LANE_LABEL_H + row * ROW_H;
            const color = l.stage.color;
            const key = `${m.company}-${m.activity}`;
            const isHover = hovered === key;
            return (
              <a
                key={key}
                href={m.sourceUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={(e) => {
                  setHovered(key);
                  showTip(e.currentTarget, m);
                }}
                onMouseLeave={() => {
                  setHovered(null);
                  setTip(null);
                }}
                onFocus={(e) => {
                  setHovered(key);
                  showTip(e.currentTarget, m);
                }}
                onBlur={() => {
                  setHovered(null);
                  setTip(null);
                }}
                onClick={(e) => {
                  if (dragged.current) e.preventDefault();
                }}
                className={`absolute grid -translate-x-1/2 place-items-center rounded-full border-2 bg-surface transition-shadow ${m.sourceUrl ? "cursor-pointer" : "cursor-default"}`}
                style={{
                  left: x,
                  top,
                  width: MARKER,
                  height: MARKER,
                  borderColor: color,
                  boxShadow: isHover ? `0 0 0 3px ${l.stage.soft}, 0 2px 8px rgba(0,0,0,0.18)` : undefined,
                  zIndex: isHover ? 40 : 4,
                }}
                aria-label={`${m.company} — ${m.activity}`}
              >
                <span className="overflow-hidden rounded-full" style={{ width: LOGO, height: LOGO, filter: "grayscale(1)", opacity: 0.85 }}>
                  <FirmLogo src={m.logo} name={m.company} size={LOGO} />
                </span>
              </a>
            );
          }),
        )}
      </div>
    </div>
  );

  // ── Mobile: reverse-chronological grouped list (same data, readable form) ──
  const mobileList = (() => {
    const evs = MILESTONES.filter((m) => m.date && matches(m)).sort((a, b) => (a.date! < b.date! ? 1 : -1));
    const groups: { label: string; items: Milestone[] }[] = [];
    for (const m of evs) {
      const label = new Date(dateOf(m.date!)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      if (groups[groups.length - 1]?.label !== label) groups.push({ label, items: [] });
      groups[groups.length - 1].items.push(m);
    }
    return (
      <div>
        {groups.map((g) => (
          <section key={g.label} className="mb-6">
            <h3 className="mb-2 border-b border-border pb-1.5 text-micro font-semibold uppercase tracking-wider text-muted">{g.label}</h3>
            <ul className="space-y-1">
              {g.items.map((m) => {
                const stage = stageOf(m.stage);
                const row = (
                  <span className="flex items-start gap-3 py-2">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} aria-hidden />
                    <FirmLogo src={m.logo} name={m.company} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-label font-semibold">{m.company}</span>
                      <span className="tnum block text-micro text-muted">
                        {m.activity} · {fmtDate(dateOf(m.date!))}
                      </span>
                      {m.note && <span className="mt-0.5 line-clamp-2 block text-micro text-faint">{m.note}</span>}
                    </span>
                    {m.sourceUrl && <span className="mt-1 text-faint" aria-hidden>↗</span>}
                  </span>
                );
                return (
                  <li key={`${m.company}-${m.activity}`}>
                    {m.sourceUrl ? (
                      <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-lg px-1 hover:bg-surface-raised">
                        {row}
                      </a>
                    ) : (
                      <span className="block px-1">{row}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    );
  })();

  return (
    <div ref={containerRef}>
      {/* Legend + projection toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
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
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label font-medium transition-all ${open ? "border-border-strong bg-surface-raised" : noneOn ? "border-border opacity-50" : "border-border-strong"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
                <span className="tnum text-micro text-faint">{total}</span>
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
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-micro font-medium transition-all ${on ? "border-border-strong" : "border-border opacity-50"}`}
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
                      className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-faint transition-colors hover:border-border-strong hover:text-foreground"
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
        <button
          type="button"
          onClick={() => setProjected((p) => !p)}
          aria-pressed={projected}
          className={`ml-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 text-micro font-medium transition-colors md:flex ${projected ? "border-border-strong bg-surface-raised text-foreground" : "border-border text-muted hover:text-foreground"}`}
        >
          <span className={`h-2 w-2 rounded-full ${projected ? "bg-accent" : "bg-border-strong"}`} aria-hidden />
          Project to year-end
        </button>
      </div>

      {/* Brush summary chip / hint */}
      <div className="mb-2 hidden min-h-6 items-center md:flex">
        {agg && selRange ? (
          <div className="tnum flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-accent-soft px-3 py-1 text-micro font-medium text-accent">
            <span className="font-semibold">
              {fmtDate(agg.t1)} – {fmtDate(agg.t2)}
            </span>
            {agg.rows.map((r) => (
              <span key={r.stage.key}>
                {r.stage.label} {r.count}
                {r.usd > 0 ? ` (${fmtUsd(r.usd)})` : ""}
              </span>
            ))}
            <button type="button" onClick={() => setSelRange(null)} className="font-semibold underline-offset-2 hover:underline">
              clear
            </button>
          </div>
        ) : (
          <span className="ml-auto text-micro text-faint">drag across the timeline to summarize a window</span>
        )}
      </div>

      <div className="hidden md:block">{plot}</div>
      <div className="md:hidden">{mobileList}</div>

      {/* Date-TBD shelf */}
      {undated.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-dashed border-border pt-3">
          <span className="mr-1 text-micro font-semibold uppercase tracking-wider text-faint">date TBD</span>
          {undated.map((m) => (
            <a
              key={`${m.company}-${m.activity}`}
              href={m.sourceUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              onMouseEnter={(e) => showTip(e.currentTarget, m)}
              onMouseLeave={() => setTip(null)}
              onFocus={(e) => showTip(e.currentTarget, m)}
              onBlur={() => setTip(null)}
              className={`grid place-items-center rounded-full border-2 border-dashed bg-surface ${m.sourceUrl ? "cursor-pointer hover:border-solid" : "cursor-default"}`}
              style={{ width: MARKER, height: MARKER, borderColor: stageOf(m.stage).color }}
              aria-label={`${m.company} — ${m.activity} (date TBD)`}
            >
              <FirmLogo src={m.logo} name={m.company} size={LOGO} />
            </a>
          ))}
        </div>
      )}

      {pillTip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-micro font-medium text-background shadow-lg"
          style={{ left: pillTip.x, top: pillTip.y }}
        >
          {pillTip.text}
        </div>
      )}

      {/* The single tooltip (full-colour logo lives here, where it's legible) */}
      {tip && (
        <div
          className={`pointer-events-none fixed z-50 w-60 -translate-x-1/2 rounded-xl bg-foreground p-3 shadow-2xl ${tip.below ? "" : "-translate-y-full"}`}
          style={{ left: tip.x, top: tip.y }}
          role="tooltip"
        >
          <div className="mb-1 flex items-center gap-2">
            <FirmLogo src={tip.m.logo} name={tip.m.company} size={20} />
            <span className="text-label font-semibold text-background">{tip.m.company}</span>
            <span className="ml-auto flex items-center gap-1 text-micro font-semibold uppercase tracking-wider text-background/80">
              <span className="h-2 w-2 rounded-full" style={{ background: stageOf(tip.m.stage).color }} aria-hidden />
              {tip.m.stage}
            </span>
          </div>
          <div className="tnum text-micro font-medium text-background/90">
            {tip.m.activity}
            <span className="text-background/60">{" · "}{tip.m.date ? fmtDateFull(tip.m.date) : "2026 · exact date TBD"}</span>
          </div>
          {expandActivity(tip.m.activity).filter(([, ex]) => ex).length > 0 && (
            <div className="mt-1 text-micro leading-snug text-background/60">
              {expandActivity(tip.m.activity)
                .filter(([, ex]) => ex)
                .map(([tok, ex]) => `${tok} — ${ex}`)
                .join(" · ")}
            </div>
          )}
          {tip.m.note && <div className="mt-1.5 text-micro leading-relaxed text-background/75">{tip.m.note}</div>}
          {tip.m.sourceUrl && <div className="mt-1.5 text-micro font-medium text-background/50">click to open source ↗</div>}
        </div>
      )}
    </div>
  );
}
