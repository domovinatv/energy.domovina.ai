"use client";

/**
 * URL kao vanjski izvor stanja za filtre registra.
 *
 * Zašto URL, a ne `useState`: deep-linkovi za demo na štandu (docs/06 §6) —
 * odabrani pogled se pokazuje otvaranjem točne adrese, ne klikanjem kroz pet
 * koraka. Kad je URL izvor istine, „podijeli ovaj pogled" i „natrag" rade sami
 * od sebe, bez zrcaljenja stanja u dva smjera.
 *
 * Čita se kroz `useSyncExternalStore`, pa `getServerSnapshot` vraća prazan
 * upit — prerenderirani HTML je uvijek nefiltriran registar i hidracija se
 * poklapa.
 */

/** Vlastiti događaj: `replaceState` ne okida `popstate`. */
const URL_EVENT = "domovina-energy:url-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_EVENT, onChange);
  };
}

function getSnapshot(): string {
  return window.location.search;
}

function getServerSnapshot(): string {
  return "";
}

export const searchStore = { subscribe, getSnapshot, getServerSnapshot };

/**
 * Zamjenjuje upitni dio adrese bez novog unosa u povijest.
 *
 * `replaceState`, a ne `pushState`: pomicanje klizača filtra ne smije napuniti
 * povijest s dvadeset koraka „natrag".
 */
export function replaceSearch(params: URLSearchParams): void {
  const query = params.toString();
  const next = query === "" ? window.location.pathname : `${window.location.pathname}?${query}`;
  if (next === `${window.location.pathname}${window.location.search}`) return;
  window.history.replaceState(null, "", next);
  window.dispatchEvent(new Event(URL_EVENT));
}
