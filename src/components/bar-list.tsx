export function BarList({
  items,
  unit = "",
}: {
  items: { label: string; value: number; hint?: string }[];
  unit?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-label text-foreground">{i.label}</span>
            <span className="tnum shrink-0 text-label font-medium text-muted">
              {i.value.toLocaleString()}
              {unit}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
          {i.hint && <div className="mt-0.5 text-micro text-faint">{i.hint}</div>}
        </li>
      ))}
    </ul>
  );
}
