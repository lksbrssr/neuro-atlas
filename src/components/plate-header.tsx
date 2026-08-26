const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  partial: { label: "Partial data", cls: "bg-warning-soft text-warning" },
  planned: { label: "Coming soon", cls: "bg-accent-soft text-accent" },
};

// Page header: eyebrow question + display h1 (+ optional description at body
// size). A status pill only appears when the page is NOT fully live — "live"
// is the default state and doesn't need announcing.
export function PlateHeader({
  title,
  question,
  status,
  description,
}: {
  title: string;
  /** The single question this plate answers. */
  question: string;
  status: "live" | "partial" | "planned";
  description?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <header className="mb-10">
      <div className="mb-3 flex items-center gap-2.5">
        <p className="text-micro font-medium uppercase tracking-wider text-accent">{question}</p>
        {s && (
          <span className={`rounded-full px-2 py-0.5 text-micro font-semibold uppercase tracking-wider ${s.cls}`}>
            {s.label}
          </span>
        )}
      </div>
      <h1 className="font-display text-display">{title}</h1>
      {description && (
        <p className="mt-3 max-w-[72ch] text-body text-muted">{description}</p>
      )}
    </header>
  );
}
