"use client";

import { useSyncExternalStore } from "react";

export const performanceAnchors = ["performance_curves", "simultaneously-recorded-neurons", "tissue-mapped", "neural-recording-hours", "expectations"] as const;
const changedEvent = "atlas-performance-location";

/** Relative to the actual current origin/path/query; never hardcode a deployment. */
export function performanceUrl(currentUrl: string, anchor: string) {
  if (!(performanceAnchors as readonly string[]).includes(anchor)) throw new Error("Unknown performance anchor");
  const url = new URL(currentUrl);
  url.hash = anchor;
  return url.href;
}

export function navigatePerformance(anchor: string) {
  const url = performanceUrl(window.location.href, anchor);
  if (url === window.location.href) return;
  window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(changedEvent));
}

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  window.addEventListener(changedEvent, callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener(changedEvent, callback);
  };
}
const snapshot = () => window.location.hash;
const serverSnapshot = () => "";
export function usePerformanceHash() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
