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
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="tnum text-2xl font-semibold tracking-tight sm:text-3xl">
          {value}
        </span>
        {delta && (
          <span
            className={`tnum rounded-full px-1.5 py-0.5 text-xs font-medium ${
              deltaDirection === "up"
                ? "bg-positive-soft text-positive"
                : "bg-negative-soft text-negative"
            }`}
          >
            {deltaDirection === "up" ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      {footnote && <span className="text-xs text-faint">{footnote}</span>}
    </div>
  );
}
