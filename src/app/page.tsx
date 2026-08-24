import Link from "next/link";
import { StatCard } from "@/components/stat-card";

const PLATES: {
  href: string;
  title: string;
  status: "live" | "partial" | "planned";
  blurb: string;
}[] = [
  { href: "/milestones", title: "Milestones", status: "live", blurb: "The 2026 timeline — every tracked deal, first-in-human, and approval on one axis." },
  { href: "/landscape", title: "Landscape", status: "live", blurb: "363 neurotech companies, faceted like a shop: category, stage, country, modality." },
  { href: "/velocity", title: "Velocity", status: "live", blurb: "Is the field speeding up? Five instruments, read honestly — including what's unwired." },
  { href: "/capital", title: "Capital", status: "partial", blurb: "Funding flows: venture vs. non-dilutive vs. public vs. strategic." },
  { href: "/pipeline", title: "Pipeline", status: "partial", blurb: "Trials, first-in-human events, and the regulatory clock from IDE to approval." },
  { href: "/geopolitics", title: "Geopolitics", status: "partial", blurb: "US / China / EU: where capital, trials, approvals, and IP are forming." },
  { href: "/expectations", title: "Expectations", status: "partial", blurb: "What forecast markets imply about when BCI milestones arrive." },
  { href: "/people", title: "People", status: "planned", blurb: "Talent stock, AI↔neuro flows, and the field's founder genealogy." },
  { href: "/access", title: "Access", status: "planned", blurb: "Patients reached vs. addressable — the field's most damning gap." },
  { href: "/methodology", title: "Methodology", status: "live", blurb: "How this is built, what each reading means, and how to contribute." },
];

const STATUS_DOT: Record<string, string> = {
  live: "bg-positive",
  partial: "bg-warning",
  planned: "border border-border-strong",
};

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
          The plates
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="card group flex flex-col p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status]}`} aria-hidden />
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
