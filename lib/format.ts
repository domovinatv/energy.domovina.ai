/**
 * Formatiranje — CLAUDE.md §Konvencije.
 *
 * Iznosi uvijek hr-HR EUR. Energija: kWp (snaga) · kWh/MWh (proizvodnja) ·
 * MW (agregat). Nikad `toLocaleString` bez eksplicitnog lokala — na tuđem
 * mobitelu na sajmu default nije hrvatski.
 */

const HR = "hr-HR";

const eurFormatter = new Intl.NumberFormat(HR, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurPreciseFormatter = new Intl.NumberFormat(HR, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Iznos iz centa u EUR, bez decimala. */
export function formatEur(cents: number): string {
  return eurFormatter.format(cents / 100);
}

/** Iznos iz centa u EUR, s dvije decimale — za male iznose i naknade. */
export function formatEurPrecise(cents: number): string {
  return eurPreciseFormatter.format(cents / 100);
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(HR, { maximumFractionDigits }).format(value);
}

/** Snaga pojedine elektrane — kWp. */
export function formatKwp(kwp: number): string {
  return `${formatNumber(kwp, kwp < 100 ? 1 : 0)} kWp`;
}

/**
 * Agregat snage — MW iznad 1.000 kWp, inače kWp. Registar zbraja tisuće
 * elektrana pa je „1.482 MW" čitljivije od „1.482.000 kWp".
 */
export function formatAggregateCapacity(kwpTotal: number): string {
  if (kwpTotal >= 1000) return `${formatNumber(kwpTotal / 1000, 1)} MW`;
  return formatKwp(kwpTotal);
}

/** Proizvodnja — MWh iznad 1.000 kWh, inače kWh. */
export function formatProduction(kwh: number): string {
  if (kwh >= 1_000_000) return `${formatNumber(kwh / 1000, 0)} MWh`;
  if (kwh >= 10_000) return `${formatNumber(kwh / 1000, 1)} MWh`;
  return `${formatNumber(kwh)} kWh`;
}

export function formatPercent(fraction: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(HR, {
    style: "percent",
    maximumFractionDigits,
  }).format(fraction);
}

/**
 * Datumi prate JEZIK SUČELJA, za razliku od iznosa.
 *
 * Iznosi su uvijek hr-HR jer je valuta euro u Hrvatskoj i format je dio
 * konvencije (CLAUDE.md §Konvencije). Datum nije — „8. ožujka 2026." usred
 * engleske rečenice je greška, a uz to razbija interpunkciju: hrvatski datum
 * već završava točkom, engleski ne.
 */
type DateLocale = "hr" | "en";

const DATE_LOCALE: Record<DateLocale, string> = { hr: HR, en: "en-GB" };

/** ISO datum → 15. rujna 2026. Prazan ulaz vraća prazan string, ne „Invalid Date". */
export function formatDate(iso: string | null, locale: DateLocale = "hr"): string {
  if (iso === null || iso === "") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Kratki datum — 15.9.2026. */
export function formatDateShort(iso: string | null, locale: DateLocale = "hr"): string {
  if (iso === null || iso === "") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
}

/** Skraćena `0x…` adresa za prikaz. Puna adresa ide u `title`/copy gumb. */
export function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
