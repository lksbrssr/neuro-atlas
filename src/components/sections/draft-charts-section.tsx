"use client";

import { DRAFT_CHARTS, DRAFT_CHART_CATEGORIES } from "@/data/draft-charts";
import { setPerformanceFocusReturn, navigatePerformance } from "@/lib/field-velocity/navigation";

function MetricsChartLink({ anchor, note }: { anchor: "tissue-mapped" | "neural-recording-hours"; note: string }) {
  return <a
    className="draft-chart-link"
    href={`#${anchor}`}
    onClick={event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        setPerformanceFocusReturn(event.currentTarget);
        navigatePerformance(anchor);
      }
    }}
  >
    {note} <span aria-hidden="true">↗</span>
  </a>;
}

/** Definition-only proposals: no measurements, coordinates, forecasts, or source claims. */
export function DraftChartsSection() {
  return <section className="draft-charts" aria-labelledby="draft-charts-title">
    <header className="draft-charts-header">
      <p className="pc-eyebrow">Candidate measurement definitions</p>
      <h2 id="draft-charts-title">Draft charts</h2>
      <span className="pc-bounded">Definition drafts · no observations</span>
    </header>
    <p className="draft-charts-intro">
      Nineteen proposed chart definitions, organized by measurement family. These cards describe
      axes, units, and the conditions required for a comparable series; they do not present
      observations, forecasts, or a field-wide score.
    </p>

    <div className="draft-charts-groups">
      {DRAFT_CHART_CATEGORIES.map(category => {
        const charts = DRAFT_CHARTS.filter(chart => chart.category === category);
        return <section key={category} className="draft-chart-group" data-draft-chart-category={category} aria-labelledby={`draft-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-title`}>
          <h3 id={`draft-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-title`}>{category}</h3>
          <div className="draft-chart-grid">
            {charts.map(chart => <article key={chart.title} className="draft-chart-card card" data-draft-chart-card={chart.title}>
              <div className="draft-chart-card-header">
                <span className="pc-eyebrow">Definition draft</span>
                <span className="draft-chart-readiness" data-draft-chart-readiness>{chart.readiness}</span>
              </div>
              <h4>{chart.title}</h4>
              <dl>
                <div><dt>Proposed axes</dt><dd>{chart.axes}</dd></div>
                <div><dt>Definition</dt><dd>{chart.definition}</dd></div>
                <div><dt>Comparability condition</dt><dd>{chart.constraint}</dd></div>
              </dl>
              {chart.metricsAnchor && chart.metricsNote && <MetricsChartLink anchor={chart.metricsAnchor} note={chart.metricsNote} />}
            </article>)}
          </div>
        </section>;
      })}
    </div>
  </section>;
}
