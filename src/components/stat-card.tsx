type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down";
  footnote?: string;
};

export function StatCard({ label, value, delta, deltaDirection = "up", footnote }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1.5 p-5">
      <span className="text-micro font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="tnum font-display text-3xl sm:text-4xl">
          {value}
        </span>
        {delta && (
          <span
            className={`tnum rounded-full px-1.5 py-0.5 text-micro font-medium ${
              deltaDirection === "up"
                ? "bg-positive-soft text-positive"
                : "bg-negative-soft text-negative"
            }`}
          >
            {deltaDirection === "up" ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      {footnote && <span className="text-micro text-faint">{footnote}</span>}
    </div>
  );
}
