"use client";

import React, { useEffect, useRef } from "react";
import { lockModalScroll } from "@/lib/field-velocity/modal-scroll";
import { closePerformance } from "@/lib/field-velocity/navigation";

/** Native top-layer dialog makes the rest of the page inert, without moving it. */
export function ChartModal({ id, title, children, returnFocus }: { id: string; title: string; children: React.ReactNode; returnFocus: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement;
    const trigger = returnFocus.current;
    const releaseScroll = lockModalScroll(document);
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      releaseScroll();
      const target = previous instanceof HTMLElement && previous !== document.body && previous.isConnected ? previous : trigger;
      if (!document.querySelector("dialog[open]")) target?.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return <dialog ref={ref} className="pc-modal" aria-modal="true" aria-labelledby={`${id}-title`}
    onCancel={event => { event.preventDefault(); closePerformance(); }}
    onClick={event => { if (event.target === event.currentTarget) closePerformance(); }}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); closePerformance(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], select:not([disabled]), [tabindex="0"]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    }}>
    <div className="pc-modal-panel">
      <header className="pc-modal-header"><h2 id={`${id}-title`}>{title}</h2><button ref={closeRef} type="button" aria-label={`Close ${title}`} onClick={closePerformance}><span aria-hidden="true">×</span> Close</button></header>
      <div className="pc-detail">{children}</div>
    </div>
  </dialog>;
}
