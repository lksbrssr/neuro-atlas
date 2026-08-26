import { GhostChart } from "@/components/sparkline";

const LENSES: { title: string; blurb: string }[] = [
  {
    title: "Private rounds by stage & OS",
    blurb:
      "Deployed capital broken out by round stage (pre-seed → public) and by opportunity space — so you can see where private money is actually concentrating.",
  },
  {
    title: "Government & grant funding",
    blurb:
      "Non-dilutive flows from the agencies shaping the field — NIH/BRAIN, DARPA, ARIA, Horizon Europe, and China's state programs — sized and tracked over time.",
  },
  {
    title: "Investor composition",
    blurb:
      "Who is writing the checks, by type — deep-tech VC vs. med-tech vs. impact vs. strategic/corporate — and how that mix is shifting.",
  },
  {
    title: "Market-size reconciliation",
    blurb:
      "The competing market-size and total-funding figures side by side, with the definitional gaps that explain why the public numbers disagree.",
  },
];

export function CapitalProvidersSection() {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">Capital providers</h2>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-micro font-semibold uppercase tracking-wider text-accent">
          coming soon
        </span>
      </div>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        The other side of the ledger — who is <span className="font-medium text-foreground">funding</span> the
        field, not just who is receiving. A view of the different types of capital being
        deployed into neurotech, and how that mix is changing.
      </p>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        {LENSES.map((l) => (
          <div key={l.title} className="flex flex-col">
            <h3 className="text-sm font-semibold tracking-tight">{l.title}</h3>
            <div className="my-3 flex justify-center py-1">
              <GhostChart width={200} height={44} />
            </div>
            <p className="text-xs leading-relaxed text-muted">{l.blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
