"use client";

import React, { useId, useRef, useState } from "react";
import { ChartModal } from "@/components/chart-modal";
import type { PerformanceData } from "@/lib/field-velocity/performance";
import type { MeasurementPoint, MeasurementSeries } from "@/lib/field-velocity/schema";
import { usePerformanceHash, navigatePerformance, performanceUrl } from "@/lib/field-velocity/navigation";

const number = (value: number) => new Intl.NumberFormat("en", { maximumSignificantDigits: 7 }).format(value);
const colors = ["var(--accent)", "#087f8c", "#c16b0b", "#cc507b", "#438537", "#8a62bc", "#447dc4"];
export function pointDate(point: MeasurementPoint) {
  return point.datePrecision === "year" ? point.date.slice(0, 4) : point.datePrecision === "month" ? point.date.slice(0, 7) : point.date;
}
export function pointValue(point: MeasurementPoint) {
  const prefix = { approximate: "Approximately ", "at-least": "At least ", "greater-than": "More than " };
  return `${point.qualifier ? prefix[point.qualifier] : ""}${number(point.value)}`;
}

type PlotPoint = { date: string; value: number; label: string; track: string; trackIndex: number; lo?: number; hi?: number; reliable?: boolean };
export type PlotData = { xLabel?: string; title: string; unit: string; scale: "log" | "linear"; line: boolean; points: PlotPoint[]; tracks: { id: string; label: string }[] };

/** Axes always use the full source set; filtering never moves an observation. */
export function chartGeometry(data: PlotData) {
  const left = 100, right = 22, top = 28, bottom = 44, width = 720, height = 300;
  const times = data.points.map(p => Date.parse(p.date));
  const minTime = Math.min(...times), maxTime = Math.max(...times);
  const padding = Math.max((maxTime - minTime) * 0.035, 86400000 * 30);
  const values = data.points.flatMap(p => [p.value, ...(p.lo != null ? [p.lo] : []), ...(p.hi != null ? [p.hi] : [])]);
  const minValue = Math.min(...values), maxValue = Math.max(...values);
  const low = Math.floor(Math.log10(Math.max(minValue, Number.MIN_VALUE))), high = Math.max(low + 1, Math.ceil(Math.log10(maxValue)));
  const magnitude = 10 ** Math.floor(Math.log10(maxValue / 4));
  const step = Math.ceil(maxValue / 4 / magnitude) * magnitude;
  const ticks = data.scale === "log" ? Array.from({ length: high - low + 1 }, (_, i) => 10 ** (low + i)) : [0, 1, 2, 3, 4].map(i => i * step);
  const x = (date: string) => left + (Date.parse(date) - minTime + padding) / (maxTime - minTime + 2 * padding) * (width - left - right);
  const y = (value: number) => top + (1 - (data.scale === "log" ? (Math.log10(value) - low) / (high - low) : value / (step * 4))) * (height - top - bottom);
  return { width, height, left, right, minTime, maxTime, ticks, x, y };
}

function CurvePlot({ data, compact = false }: { data: PlotData; compact?: boolean }) {
  const [track, setTrack] = useState("");
  const [hovered, setHovered] = useState<PlotPoint | null>(null);
  const [focused, setFocused] = useState<PlotPoint | null>(null);
  const active = focused ?? hovered;
  const readoutId = useId();
  const g = chartGeometry(data);
  const points = data.points.filter(p => !track || p.track === track);
  const clusters: PlotPoint[][] = [];
  for (const point of points) {
    const group = clusters.find(c => Math.abs(g.x(c[0].date) - g.x(point.date)) < 12 && Math.abs(g.y(c[0].value) - g.y(point.value)) < 12);
    if (group) group.push(point); else clusters.push([point]);
  }
  return <div className={compact ? "pc-preview" : "pc-plot"}>
    {!compact && data.tracks.length > 1 && <label className="pc-track-select">Dataset / track
      <select value={track} onChange={e => setTrack(e.target.value)}>
        <option value="">All tracks</option>
        {data.tracks.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <span>Isolate a track · axes stay fixed</span>
    </label>}
    <div className="pc-chart-scroll" role={compact ? undefined : "region"} aria-label={compact ? undefined : `${data.title} chart`} tabIndex={compact ? undefined : 0}>
      <svg viewBox={`0 0 ${g.width} ${g.height}`} aria-hidden={compact || undefined} role={compact ? undefined : "img"} aria-label={compact ? undefined : `${data.title}. ${data.scale} ${data.unit} axis. ${data.line ? "Historical frontier checkpoints." : "Separate observations; no connecting growth line."}`}>
        <text x={g.left} y={16}>{data.unit} · {data.scale} scale</text>
        {g.ticks.map(tick => <g key={tick}>
          <line x1={g.left} x2={g.width - g.right} y1={g.y(tick)} y2={g.y(tick)} stroke="var(--border-strong)" strokeDasharray="3 5" />
          <text x={g.left - 9} y={g.y(tick) + 4} textAnchor="end">{number(tick)}</text>
        </g>)}
        {data.line && <polyline data-frontier-line="true" points={points.map(p => `${g.x(p.date)},${g.y(p.value)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />}
        {points.filter(p => p.lo != null && p.hi != null).map(p => <line key={`interval:${p.date}`} data-confidence={compact ? undefined : p.date} x1={g.x(p.date)} x2={g.x(p.date)} y1={g.y(p.lo!)} y2={g.y(p.hi!)} stroke="var(--accent)" strokeWidth={compact ? 2 : 3} opacity={.4} />)}
        {points.map((p, i) => <circle key={`${p.track}:${p.date}:${i}`} data-curve-point={compact ? undefined : `${p.track}:${p.date}`} data-value={compact ? undefined : p.value} cx={g.x(p.date)} cy={g.y(p.value)} r={active === p ? 7 : 5} data-under-indexed={p.reliable === false || undefined} fill={p.reliable === false ? "var(--surface)" : colors[p.trackIndex % colors.length]} stroke={p.reliable === false ? colors[p.trackIndex % colors.length] : "var(--surface)"} strokeWidth={1.5}
          tabIndex={compact ? undefined : 0} role={compact ? undefined : "img"} aria-label={compact ? undefined : p.label} aria-describedby={!compact && active === p ? readoutId : undefined}
          onFocus={compact ? undefined : () => setFocused(p)} onBlur={compact ? undefined : () => setFocused(null)} onMouseEnter={compact ? undefined : () => setHovered(p)} onMouseLeave={compact ? undefined : () => setHovered(null)} />)}
        {!compact && clusters.filter(c => c.length > 1).map(c => <text key={`${c[0].track}:${c[0].date}`} x={Math.min(g.width - 100, g.x(c[0].date))} y={g.y(c[0].value) + 20}>{c.length} checkpoints</text>)}
        <text x={g.left} y={g.height - 20}>{new Date(g.minTime).getUTCFullYear()}</text>
        <text x={g.width - g.right} y={g.height - 20} textAnchor="end">{new Date(g.maxTime).getUTCFullYear()}</text>
        <text x={(g.width + g.left - g.right) / 2} y={g.height - 3} textAnchor="middle">{data.xLabel ?? (data.line ? "Year · historical frontier" : "Date · source basis varies")}</text>
      </svg>
    </div>
    {!compact && <p className="pc-point-readout" id={readoutId} role="status">{active?.label ?? "Hover or tab to any marker for its value, date and source. All observations also appear in the source table below."}</p>}
    {!compact && <p className="pc-chart-note">{data.line ? "Lines connect selected frontier checkpoints, not annual observations." : "Source checkpoints · no pooled growth curve. Nearby markers are counted, never moved."}</p>}
    {!compact && <ul className="pc-legend">{data.tracks.map((t, i) => <li key={t.id}><span style={{ background: colors[i % colors.length] }} />{t.label}</li>)}</ul>}
  </div>;
}

export function CurveCard({ id, title, eyebrow, coverage, plot, children }: { id: string; title: string; eyebrow: string; coverage: string; plot?: PlotData; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const hash = usePerformanceHash();
  const open = hash === `#${id}`;
  const [copyStatus, setCopyStatus] = useState("");
  const share = <div className="pc-share">
    <a href={`#${id}`} aria-label={`Direct link to ${title}`} onClick={event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigatePerformance(id); }
    }}>Direct link ↗</a>
    <button type="button" aria-label={`Copy link to ${title}`} onClick={async () => {
      try {
        await navigator.clipboard.writeText(performanceUrl(window.location.href, id));
        setCopyStatus("Link copied");
      } catch { setCopyStatus("Copy unavailable — use the direct link"); }
    }}>Copy link</button>
    <span role="status">{copyStatus}</span>
  </div>;
  return <article className="pc-card card" data-performance-card={id}>
    <button ref={ref} type="button" className="pc-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => navigatePerformance(id)}>
      <span className="pc-eyebrow">{eyebrow}</span>
      <span className="pc-card-title">{title}</span>
      <span className="pc-coverage">{coverage}</span>
      {plot && <CurvePlot data={plot} compact />}
      <span className="pc-expand">View chart, definitions &amp; sources <span aria-hidden="true">↗</span></span>
    </button>
    <div className="pc-card-share">{share}</div>
    {open && <ChartModal id={id} title={title} returnFocus={ref}>
      {share}
      {plot && <CurvePlot data={plot} />}
      {children}
    </ChartModal>}
  </article>;
}

function MeasurementCard({ series }: { series: MeasurementSeries }) {
  const points = series.tracks.flatMap((t, trackIndex) => t.points.map(p => ({ ...p, track: t.id, trackIndex, label: `${p.label}: ${pointValue(p)} ${series.unit}; ${pointDate(p)} (${p.datePrecision} precision, ${p.dateBasis}). ${p.sourceLabel}` })));
  const plot: PlotData = { title: series.title, unit: series.unit, scale: series.scale, line: false, points, tracks: series.tracks };
  return <CurveCard id={series.id} title={series.title} eyebrow={series.lens === "data-supply" ? "Data supply" : "Capability"} coverage={series.coverage} plot={plot}>
    <section className="pc-methodology" aria-label={`${series.title} definitions and methodology`}>
      <h4>Definitions &amp; methodology</h4>
      <p>{series.description}</p>
      <p className="pc-caveat">{series.caveat}</p>
      <p>Source checked {series.checkedAt}. Year/month coordinates are plotting anchors, not exact event dates. No sums or interpolated observations.</p>
      <dl>{series.tracks.map(t => <div key={t.id}><dt>{t.label}</dt><dd>{t.definition}</dd></div>)}</dl>
    </section>
    <div className="pc-table-scroll" role="region" aria-label={`${series.title} source data`} tabIndex={0}>
      <table>
        <caption>Sources &amp; chart data · {points.length} observations</caption>
        <thead><tr><th scope="col">Dataset / release</th><th scope="col">Date &amp; basis</th><th scope="col">Value ({series.unit})</th><th scope="col">Source &amp; context</th></tr></thead>
        <tbody>{series.tracks.flatMap(t => t.points.map(p => <tr key={`${t.id}:${p.date}`} data-source-observation={`${t.id}:${p.date}`}>
          <th scope="row">{p.label}<small>{t.label}</small></th>
          <td>{pointDate(p)}<small>{p.datePrecision} precision · {p.dateBasis}</small></td>
          <td className="tnum">{pointValue(p)} {series.unit}</td>
          <td><a href={p.sourceUrl} target="_blank" rel="noreferrer">{p.sourceLabel} ↗</a><p>{p.note}</p></td>
        </tr>))}</tbody>
      </table>
    </div>
  </CurveCard>;
}

type Provenance = { providerCommit: string; sha256: string; exportGeneratedAt: string; source: { repository: string } };
export function PerformanceCurves({ data, provenance }: { data: PerformanceData; provenance: Provenance }) {
  const r = data.record;
  const reading = r.state === "reading";
  const neuronPlot: PlotData | undefined = reading ? {
    title: r.metric!, unit: "neurons", scale: r.seriesScale!, line: true,
    tracks: [{ id: "neuron-frontier", label: "Selected simultaneous-recording frontier" }],
    points: r.series!.map(p => ({ date: `${p.x}-01-01`, value: p.y, track: "neuron-frontier", trackIndex: 0, label: `${p.x}: ${number(p.y)} neurons (year precision); shared Stevenson sources below` })),
  } : undefined;
  return <section className="performance-curves" id="performance_curves" aria-labelledby="performance-title">
    <header className="pc-section-header"><div><p className="pc-eyebrow">Neurotech · capability &amp; data supply</p><h2 id="performance-title">Performance curves</h2></div><span className="pc-bounded">Selected sourced checkpoints</span></header>
    <p className="pc-intro">Recording capability, mapped tissue and neural data supply. Different units and coverage, not a single score for the field. Expand a card to inspect definitions, dates and source evidence.</p>
    <div className="pc-grid">
      <CurveCard id="simultaneously-recorded-neurons" title={reading ? r.metric! : "Simultaneously recorded neurons"} eyebrow={reading ? "Historical series" : r.state.replaceAll("_", " ")} coverage={reading ? `${r.window} · selected recording frontier, not a current maximum or a human-only BCI series.` : (r.blocker ?? r.reason ?? "No reading available.")} plot={neuronPlot}>
        {reading ? <>
          <section className="pc-methodology" aria-label="Neuron curve definitions and methodology">
            <h4>Definitions &amp; methodology</h4><p>{data.definition.description}</p>
            <p className="pc-reading">{r.value}</p>
            <p>Historical trend: {r.trend}. This retained series does not establish the current frontier or current acceleration.</p>
            <p className="pc-caveat">Simultaneously recorded neurons are not electrode channels, participant counts or recording-hours. The source supplies year-level frontier checkpoints, not an annual series. No post-2014 points are inferred.</p>
            <p>Last observation {r.measuredAt} (year precision). Source checked {r.checkedAt}. Historical series; observation date is not the export date.</p>
            <p>{data.methodology.stocksAndFlows}</p>
          </section>
          <div className="pc-table-scroll" role="region" aria-label="Neuron frontier source data" tabIndex={0}>
            <table><caption>Sources &amp; chart data · {r.series!.length} observations</caption>
              <thead><tr><th scope="col">Year</th><th scope="col">Simultaneously recorded neurons</th><th scope="col">Source basis</th></tr></thead>
              <tbody>{r.series!.map(p => <tr key={String(p.x)} data-source-observation={`neuron-frontier:${p.x}`}><th scope="row">{p.x}</th><td className="tnum">{number(p.y)}</td><td>Selected frontier checkpoint · year precision</td></tr>)}</tbody>
            </table>
          </div>
          <ul className="pc-sources">{r.sources!.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul>
        </> : <p>{r.candidateMetric ?? r.reason}</p>}
      </CurveCard>
      {data.measurements.map(s => <MeasurementCard key={s.id} series={s} />)}
      <article className="pc-card card pc-placeholder" data-coming-soon="channel-count-frontier" aria-labelledby="channel-count-title">
        <span className="pc-eyebrow">Planned capability metric</span>
        <h3 className="pc-card-title" id="channel-count-title">Channel count frontier</h3>
        <p className="pc-coverage">Maximum simultaneously recorded channels in a human, over time. Not yet wired; channels are not recorded neurons.</p>
        <div className="pc-preview pc-placeholder-preview">
          {/* Decorative placeholder only: no observations, values or inferred frontier. */}
          <svg viewBox="0 0 720 300" aria-hidden="true" focusable="false">
            <path d="M100 28V256H698 M100 85H698 M100 142H698 M100 199H698" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
            <path d="M112 240C240 236 260 206 350 198S490 136 540 120S650 72 684 42" fill="none" stroke="var(--accent)" strokeWidth="5" />
          </svg>
          <span className="pc-coming-soon-label">Coming soon</span>
        </div>
        <p className="pc-chart-note">Source series not assembled yet. Preview is illustrative, not data.</p>
      </article>
    </div>
    <details className="pc-provenance"><summary>Export &amp; source provenance</summary>
      <p>Bounded, committed PL R&amp;D snapshot. Refreshed deliberately from a validated provider export, not an automatically updating feed.</p>
      <p>Export assembled <time dateTime={provenance.exportGeneratedAt}>{provenance.exportGeneratedAt}</time>. Observation and source-check dates above remain separate.</p>
      <p><a href={`${provenance.source.repository}/tree/${provenance.providerCommit}`} target="_blank" rel="noreferrer">Provider revision {provenance.providerCommit} ↗</a></p>
      <p>Export SHA-256: <code>{provenance.sha256}</code></p>
    </details>
  </section>;
}
