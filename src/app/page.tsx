import Link from "next/link";
import { StatCard } from "@/components/stat-card";

const PLATES: {
  href: string;
  title: string;
  status: "live" | "partial" | "planned";
  blurb: string;
}[] = [
  { href: "/milestones", title: "Milestones", status: "live", blurb: "The 2026 milestone timeline — capital / clinical / commercial lanes, a drag-to-summarize window." },
  { href: "/ecosystem", title: "Ecosystem", status: "live", blurb: "363 neurotech companies as logo bubbles — group by category, country (on a world map), modality, or stage — plus the capital providers." },
  { href: "/field-velocity", title: "Field velocity", status: "live", blurb: "Is the field speeding up? Instruments that read its underlying pace, read honestly, plus forecast-market expectations." },
  { href: "/regulatory-landscape", title: "Regulatory landscape", status: "partial", blurb: "Geopolitics and regulation: where the field forms — US / China / EU — and under what rules." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mb-10">
        <p className="mb-3 text-micro font-medium uppercase tracking-wider text-accent">
          Neuro Atlas · live field tracker
        </p>
        <h1 className="max-w-3xl font-display text-display">
          The brain-computer interface field, mapped
        </h1>
        <p className="mt-4 max-w-[60ch] text-body text-muted">
          An atlas of the BCI field — milestones, capital, velocity, and the
          people building it. Every number carries a date and a source; where a
          reading isn&apos;t live yet, it says so.
        </p>
      </section>

      {/* Headline stats */}
      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="People implanted"
          value="67"
          footnote="Cumulative iBCI, peer-reviewed count 1998–2024"
        />
        <StatCard
          label="New capital"
          value="$653m"
          delta="102%"
          deltaDirection="up"
          footnote="Jan–Apr 2026 vs. same period 2025"
        />
        <StatCard
          label="Companies tracked"
          value="363"
          footnote="Global neurotech landscape"
        />
        <StatCard
          label="Market approvals"
          value="1"
          footnote="First invasive BCI approval (NMPA, Mar 2026)"
        />
      </section>

      {/* Plate directory */}
      <section>
        <h2 className="mb-4 text-micro font-semibold uppercase tracking-wider text-muted">
          Neuro Atlas Content
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="card group flex flex-col p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-label font-semibold tracking-tight">{p.title}</span>
                <span className="ml-auto text-faint transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="text-micro leading-relaxed text-muted">{p.blurb}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-micro text-faint">
          <Link href="/methodology" className="font-medium text-accent hover:underline">
            Methodology &amp; how to contribute →
          </Link>
        </p>
      </section>
    </>
  );
}
