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
    <header className="mb-8 sm:mb-10">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{question}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>
          {s.label}
        </span>
      </div>
      <h1 className="max-w-5xl text-balance text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold leading-[0.94] tracking-[-0.05em]">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      )}
    </header>
  );
}
