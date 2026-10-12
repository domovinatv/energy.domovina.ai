"use client";

/**
 * Zastavica za potvrdu o uplati (docs/16 §4, §5.1; pravilo `docs/12` §2.1:
 * nedovršeno ide iza zastavice, ne na `main` bez nje).
 *
 * `?potvrda=1` je uključi i zapamti u `localStorage`, `?potvrda=0` je ugasi.
 * Čita se kroz `useSyncExternalStore`; `getServerSnapshot` je `false`, pa je
 * prerenderirani HTML uvijek bez potvrde i hidracija se poklapa.
 */
import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "domovina-energy:potvrda";
const PARAM = "potvrda";
const EVENT = "domovina-energy:potvrda-flag";

function stored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** URL ima prednost pred zapamćenim, da `?potvrda=0` ugasi i prije zapisa. */
export function receiptFlagFrom(search: string, remembered: string | null): boolean {
  const param = new URLSearchParams(search).get(PARAM);
  if (param !== null) return param === "1";
  return remembered === "1";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const getSnapshot = () => receiptFlagFrom(window.location.search, stored());
const getServerSnapshot = () => false;

export function useReceiptFlag(): boolean {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Zapamti izbor iz URL-a, da preživi navigaciju na stranicu projekta.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(PARAM);
    if (param === null) return;
    try {
      if (param === "1") window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // Privatni način: zastavica vrijedi dok je parametar u URL-u.
    }
  }, []);
  return on;
}
