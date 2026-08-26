"use client";

// House rule: any acronym from data/glossary/acronyms.csv rendered in the UI
// gets a tooltip with its expansion + one-line definition on hover. Extend the
// glossary CSV (then re-run scripts/generate-derived.mjs) rather than hardcoding.

import { useState } from "react";
import ACRONYMS from "@/data/acronyms.json";

type Entry = { expansion: string; definition: string };
const GLOSSARY = ACRONYMS as Record<string, Entry>;

export function lookupAcronym(term: string): Entry | null {
  return GLOSSARY[term] ?? null;
}

// Fixed-positioned tooltip so it's never clipped by scroll containers.
export function Abbr({ term }: { term: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const entry = GLOSSARY[term];
  if (!entry) return <>{term}</>;
  return (
    <span
      className="cursor-help border-b border-dotted border-faint"
      tabIndex={0}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top - 6 });
      }}
      onMouseLeave={() => setPos(null)}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top - 6 });
      }}
      onBlur={() => setPos(null)}
    >
      {term}
      {pos && (
        <span
          className="pointer-events-none fixed z-[80] w-56 -translate-x-1/2 -translate-y-full rounded-lg bg-foreground px-3 py-2 text-left shadow-lg"
          style={{ left: pos.x, top: pos.y }}
        >
          <span className="block text-micro font-semibold leading-snug text-background">{entry.expansion}</span>
          <span className="mt-0.5 block text-micro leading-snug text-background/70">{entry.definition}</span>
        </span>
      )}
    </span>
  );
}

// Renders text, tooltipping any acronym it recognises — the whole string, or
// slash-separated parts (e.g. "tDCS/tES").
export function AutoAbbr({ text }: { text: string }) {
  if (!text) return null;
  if (GLOSSARY[text]) return <Abbr term={text} />;
  if (text.includes("/")) {
    const parts = text.split("/");
    return (
      <>
        {parts.map((p, i) => (
          <span key={i}>
            {GLOSSARY[p.trim()] ? <Abbr term={p.trim()} /> : p}
            {i < parts.length - 1 ? "/" : ""}
          </span>
        ))}
      </>
    );
  }
  return <>{text}</>;
}
