import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            {/* Minimal brain-wave mark */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-8 4 16 3-8h6" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            State of BCI
          </span>
          <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            Preview
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
