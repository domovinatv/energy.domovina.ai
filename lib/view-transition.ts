"use client";

import { flushSync } from "react-dom";

/**
 * Promjena rasporeda kao animacija (View Transitions API): elementi s
 * `view-transition-name` glatko promijene veličinu i položaj, ostatak se pretopi.
 * `flushSync` je nužan — preglednik snima „novo" stanje čim se callback vrati,
 * pa React mora nacrtati promjenu sinkrono. Bez API-ja (stariji Firefox) ili uz
 * `prefers-reduced-motion` promjena je trenutna, kao prije.
 */
export function withViewTransition(update: () => void): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
