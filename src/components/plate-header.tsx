const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-positive-soft text-positive" },
  partial: { label: "Partial data", cls: "bg-warning-soft text-warning" },
  planned: { label: "Coming soon", cls: "bg-accent-soft text-accent" },
};

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
    <header className="mb-8">
      <div className="mb-2 flex items-center gap-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">{question}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>
          {s.label}
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      )}
    </header>
  );
}
