/**
 * Zaprimljene uplate po Safeu, u `localStorage` — da uplatitelj koji osvježi
 * stranicu ili se vrati sutra i dalje vidi da je njegov novac stigao, iako EURe
 * kod prve uplate s novog IBAN-a na lancu sjedne tek nakon nekoliko sati.
 *
 * `localStorage` je vanjsko stanje, pa se čita kroz `useSyncExternalStore`
 * (CLAUDE.md, dnevnik §7.6). `getServerSnapshot` vraća prazno: prerenderirani
 * HTML nikad ne sadrži tuđe uplate i hidracija se poklapa.
 *
 * Ovo vidi SAMO uplatitelj u svom pregledniku. Da bi zaprimljenu uplatu vidjeli
 * svi posjetitelji, rail treba javni zbroj po Safeu (docs/15 §6).
 */
import { useSyncExternalStore } from "react";
import { upsertPending, type PendingPayment } from "@/lib/pending-payments";

const PREFIX = "domovina-energy:pending:";
const EVENT = "domovina-energy:pending-changed";
/** Starije od ovoga se briše — do tada je uplata davno na lancu ili odbijena. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY: readonly PendingPayment[] = [];

// Isti niz za iste podatke, inače useSyncExternalStore renderira u petlji.
const cache = new Map<string, { raw: string | null; value: readonly PendingPayment[] }>();

function read(safe: string): readonly PendingPayment[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIX + safe.toLowerCase());
  } catch {
    return EMPTY;
  }
  const hit = cache.get(safe);
  if (hit && hit.raw === raw) return hit.value;
  let value: readonly PendingPayment[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      value = (parsed as PendingPayment[]).filter((p) => Date.now() - p.receivedAt < MAX_AGE_MS);
    }
  } catch {
    value = EMPTY;
  }
  cache.set(safe, { raw, value });
  return value;
}

function write(safe: string, list: readonly PendingPayment[]): void {
  try {
    window.localStorage.setItem(PREFIX + safe.toLowerCase(), JSON.stringify(list));
  } catch {
    // Privatni prozor ili pun storage: prikaz radi do osvježavanja, i to je dovoljno.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function savePending(safe: string, payment: PendingPayment): void {
  write(safe, upsertPending(read(safe), payment));
}

export function removePending(safe: string, sid: string): void {
  write(
    safe,
    read(safe).filter((p) => p.sid !== sid),
  );
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function usePending(safe: string): readonly PendingPayment[] {
  return useSyncExternalStore(
    subscribe,
    () => read(safe),
    () => EMPTY,
  );
}
