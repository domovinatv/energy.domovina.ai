"use client";

/**
 * Širina prozora kao VANJSKO stanje.
 *
 * ⚠️ `useSyncExternalStore` je zadani odgovor na vanjsko stanje u statičkom
 * exportu — ovo je četvrti put u ovom repou (jezik, filtri, nacrt čarobnjaka,
 * sada i `matchMedia`). `setState` u efektu ruši lint
 * (`react-hooks/set-state-in-effect`) i lomi hidraciju (dnevnik §7.6).
 *
 * ⚠️ MOBILE-FIRST (CLAUDE.md §Konvencije): `getServerSnapshot` vraća `false`.
 * Prerenderirani HTML je uvijek uži prikaz, pa se hidracija poklapa, a širi se
 * uključuje tek kad preglednik potvrdi da prozor to nosi. Obrnuto bi značilo da
 * mobitel na sajmu na trenutak dobije layout za laptop.
 */
import { useSyncExternalStore } from "react";

interface QueryStore {
  readonly subscribe: (onChange: () => void) => () => void;
  readonly getSnapshot: () => boolean;
}

/**
 * Po jedan spremnik za svaki upit, da `useSyncExternalStore` dobije STABILNE
 * reference. Nove funkcije pri svakom renderu natjerale bi ga na ponovnu
 * pretplatu u petlji.
 */
const stores = new Map<string, QueryStore>();

function storeFor(query: string): QueryStore {
  const existing = stores.get(query);
  if (existing !== undefined) return existing;

  const store: QueryStore = {
    subscribe(onChange) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    getSnapshot() {
      return window.matchMedia(query).matches;
    },
  };
  stores.set(query, store);
  return store;
}

const getServerSnapshot = (): boolean => false;

export function useMediaQuery(query: string): boolean {
  const store = storeFor(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}

/**
 * Granica na kojoj se dijagram prebacuje s Mermaida na React Flow (docs/06 §5).
 * Ista vrijednost kao Tailwindov `lg`, pa se prijelom poklapa s ostatkom
 * stranice.
 */
export const DIAGRAM_BREAKPOINT = "(min-width: 1024px)";
