// Lightweight sub-section header used inside a grouped plate (below the plate's
// single h1). Keeps the heading hierarchy clean — one h1 per page.
export function SectionIntro({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-title">{title}</h2>
      {children && <p className="mt-2 max-w-[72ch] text-body text-muted">{children}</p>}
    </div>
  );
}
