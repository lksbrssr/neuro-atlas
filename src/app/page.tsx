import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {/* Hero */}
        <section className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
            Live field tracker
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The state of brain-computer interfaces
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Devices, clinical trials, funding, and performance milestones across
            the BCI field — in one place. Data modules are landing soon.
          </p>
        </section>

        {/* Headline stats — placeholder values */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="People implanted"
            value="—"
            footnote="Cumulative, chronic implants"
          />
          <StatCard
            label="Active clinical trials"
            value="—"
            footnote="Recruiting or enrolling"
          />
          <StatCard
            label="Capital raised"
            value="—"
            footnote="Disclosed, trailing 12 months"
          />
          <StatCard
            label="Bits per second"
            value="—"
            footnote="Best demonstrated decoding rate"
          />
        </section>

        {/* Main panels */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PlaceholderPanel
              title="Field trajectory"
              description="Time-series charts: implants, trial starts, funding rounds, and decoding performance over time."
              height="h-72"
            />
          </div>
          <PlaceholderPanel
            title="Latest signals"
            description="A feed of recent milestones — approvals, first-in-human events, papers, and raises."
            height="h-72"
          />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PlaceholderPanel
            title="Company landscape"
            description="Sortable table of BCI companies — modality, stage, funding, and headcount."
          />
          <PlaceholderPanel
            title="Modality map"
            description="Invasive vs. minimally invasive vs. non-invasive — where the field's bets are placed."
          />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-faint sm:px-6">
          <span>State of BCI — a work in progress.</span>
          <span className="tnum">v0.1</span>
        </div>
      </footer>
    </>
  );
}
