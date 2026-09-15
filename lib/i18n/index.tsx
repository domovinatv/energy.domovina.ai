"use client";

/**
 * i18n — HR je izvor istine, EN je izveden i tipiziran prema njemu.
 *
 * UZOR: `pinka-finance/landing/lib/i18n/` i `pinka-finance/energy/lib/i18n.tsx`
 * (docs/10 §1, §3), ali bez pinkinog `I18nProvider` — ovaj repo je izoliran.
 *
 * Statički export nema rutiranje po jeziku, pa je prekidač klijentski, a izbor
 * se pamti u `localStorage`. `localStorage` je VANJSKI izvor, pa se čita kroz
 * `useSyncExternalStore`: `getServerSnapshot` vraća "hr", što znači da je
 * prerenderirani HTML uvijek hrvatski i hidracija se poklapa.
 *
 * Kad landing dobije jezične rute (Faza 1d), ugovor `useT()` → `t(key, vars)`
 * ostaje isti.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { hr, type Catalog, type MessageKey } from "./hr";
import { en } from "./en";

export type Locale = "hr" | "en";

const CATALOGS: Record<Locale, Catalog> = { hr, en };

const STORAGE_KEY = "domovina-energy:locale";

/** HR je zadani i jedini jezik prerenderiranog HTML-a. */
const DEFAULT_LOCALE: Locale = "hr";

function isLocale(value: string | null): value is Locale {
  return value === "hr" || value === "en";
}

// ── localStorage kao vanjski izvor ──────────────────────────────────────────
// `storage` događaj hvata promjenu u drugoj kartici; vlastiti događaj hvata
// promjenu u ovoj.
const LOCALE_EVENT = "domovina-energy:locale-changed";

const localeStore = {
  subscribe(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    window.addEventListener(LOCALE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(LOCALE_EVENT, onChange);
    };
  },
  getSnapshot(): Locale {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return isLocale(stored) ? stored : DEFAULT_LOCALE;
    } catch {
      // Privatni način rada ili blokirani kolačići — HR ostaje zadani.
      return DEFAULT_LOCALE;
    }
  },
  getServerSnapshot(): Locale {
    return DEFAULT_LOCALE;
  },
  write(next: Locale): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Izbor se ne pamti, ali stranica radi.
    }
    window.dispatchEvent(new Event(LOCALE_EVENT));
  },
};

interface I18nValue {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly t: (key: MessageKey, vars?: Readonly<Record<string, string | number>>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** `{ime}` se zamjenjuje vrijednošću; nepoznata varijabla ostaje doslovno. */
function interpolate(
  template: string,
  vars: Readonly<Record<string, string | number>> | undefined,
): string {
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );

  // `lang` na <html> je vanjski sustav (DOM), pa ide u efekt — to je točno ono
  // za što efekti postoje.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    localeStore.write(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const catalog = CATALOGS[locale];
    return {
      locale,
      setLocale,
      t: (key, vars) => interpolate(catalog[key] ?? hr[key] ?? key, vars),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx === null) {
    throw new Error("useT se mora koristiti unutar <I18nProvider>");
  }
  return ctx;
}

export type { MessageKey };
