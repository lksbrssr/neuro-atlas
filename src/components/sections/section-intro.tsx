// Lightweight sub-section header used inside a grouped plate (below the plate's
// single h1). Keeps the heading hierarchy clean — one h1 per page.
export function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
