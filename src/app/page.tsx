import Link from "next/link";
import { StatCard } from "@/components/stat-card";

const PLATES: {
  href: string;
  title: string;
  status: "live" | "partial" | "planned";
  blurb: string;
}[] = [
  { href: "/progress", title: "Progress", status: "live", blurb: "The 2026 milestone timeline, forecast-market expectations, and the instruments that read the field's pace." },
  { href: "/capital", title: "Capital", status: "partial", blurb: "Funding flows — the 2026 rounds and the money entering implanted BCI." },
  { href: "/ecosystem", title: "Ecosystem", status: "live", blurb: "363 neurotech companies, faceted like a shop: category, stage, country, modality." },
  { href: "/deployment", title: "Deployment", status: "partial", blurb: "Is it reaching humans? Trials, first-in-human events, and the regulatory clock from IDE to approval." },
  { href: "/policy", title: "Policy", status: "partial", blurb: "Geopolitics and regulation: where the field forms — US / China / EU — and under what rules." },
  { href: "/methodology", title: "Methodology", status: "live", blurb: "How this is built, what each reading means, and how to contribute." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
          Neuro Atlas · live field tracker
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          The brain-computer interface field, mapped
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
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
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
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
                <span className="text-sm font-semibold tracking-tight">{p.title}</span>
                <span className="ml-auto text-faint transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="text-xs leading-relaxed text-muted">{p.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
