"use client";

// House rule: any acronym from data/glossary/acronyms.csv rendered in the UI
// gets a tooltip with its expansion + one-line definition. Extend the glossary
// CSV (then re-run scripts/generate-derived.mjs) rather than hardcoding.

import { useState } from "react";
import ACRONYMS from "@/data/acronyms.json";

type Entry = { expansion: string; definition: string };
const GLOSSARY = ACRONYMS as Record<string, Entry>;

export function lookupAcronym(term: string): Entry | null {
  return GLOSSARY[term] ?? null;
}

export function Abbr({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];
  if (!entry) return <>{term}</>;
  return (
    <span
      className="relative inline-block cursor-help border-b border-dotted border-faint"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {term}
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-left shadow-lg">
          <span className="block text-[11px] font-semibold leading-snug text-background">
            {entry.expansion}
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-background/70">
            {entry.definition}
          </span>
        </span>
      )}
    </span>
  );
}
