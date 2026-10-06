/**
 * Podaci HEP ODS-a s Moje mreže (mojamreza.hep.hr) za mjerna mjesta elektrana.
 *
 * Shema je TOČNO ono što izvozi Chrome extension iz `stepanic/flutter_moja_mreza`
 * (`extension/uvoz.js`, isti JSON kao `HepUvoz.toJson()` u pluginu). Zato se
 * datoteka iz extensiona kasnije može učitati izravno, bez prepisivanja.
 *
 * Jedina razlika: `korisnik` (ime nositelja) je u shemi neobavezan i u
 * objavljenim podacima izostavljen — JSON završi u JS paketu javne stranice, a
 * ime nije podatak o mjernom mjestu.
 *
 * Datumi su `yyyy-mm-dd`, energija u cijelim kWh (HEP ne daje decimale).
 */

export interface MojaMrezaOcitanje {
  datum: string;
  /** Npr. „Očitanje kupca", „Očitanje od strane ODS-a", „Automatska procjena". */
  opis: string;
  t1_kwh: number;
  t2_kwh: number;
}

export interface MojaMrezaPotrosnja {
  od: string;
  do: string;
  t1_kwh: number;
  t2_kwh: number;
  ukupno_kwh: number;
}

export interface MojaMrezaMjesto {
  /** Obračunsko mjerno mjesto — 10 znamenki. */
  omm: string;
  broj_brojila: string;
  /** Adresa kako je vodi HEP (velika slova, „38/A"). */
  adresa: string;
  tarifni_model: string;
  korisnik?: string;
  /** Najnovije prvo. */
  ocitanja: MojaMrezaOcitanje[];
  /** Najnovije prvo. */
  potrosnja: MojaMrezaPotrosnja[];
}

export interface MojaMrezaUvoz {
  izvor: string;
  /** ISO vrijeme dohvata. */
  dohvaceno: string;
  mjesta: MojaMrezaMjesto[];
}

const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const isStr = (v: unknown): v is string => typeof v === "string";
const isKwh = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isDatum = (v: unknown): v is string => isStr(v) && DATUM_RE.test(v);

function isOcitanje(v: unknown): v is MojaMrezaOcitanje {
  return isRecord(v) && isDatum(v.datum) && isStr(v.opis) && isKwh(v.t1_kwh) && isKwh(v.t2_kwh);
}

function isPotrosnja(v: unknown): v is MojaMrezaPotrosnja {
  return (
    isRecord(v) &&
    isDatum(v.od) &&
    isDatum(v.do) &&
    isKwh(v.t1_kwh) &&
    isKwh(v.t2_kwh) &&
    isKwh(v.ukupno_kwh)
  );
}

function isMjesto(v: unknown): v is MojaMrezaMjesto {
  return (
    isRecord(v) &&
    isStr(v.omm) &&
    /^\d{10}$/.test(v.omm) &&
    isStr(v.broj_brojila) &&
    isStr(v.adresa) &&
    isStr(v.tarifni_model) &&
    (v.korisnik === undefined || isStr(v.korisnik)) &&
    Array.isArray(v.ocitanja) &&
    v.ocitanja.every(isOcitanje) &&
    Array.isArray(v.potrosnja) &&
    v.potrosnja.every(isPotrosnja)
  );
}

/**
 * Provjeri oblik izvoza i vrati jedno mjerno mjesto. Baca pri buildu ako se
 * shema extensiona promijeni — bolje srušen build nego krivi broj na stranici.
 */
export function mjestoIzUvoza(json: unknown, omm: string): { mjesto: MojaMrezaMjesto; dohvaceno: string } {
  if (!isRecord(json) || !isStr(json.dohvaceno) || !Array.isArray(json.mjesta)) {
    throw new Error("Moja mreža: neočekivan oblik izvoza");
  }
  const mjesto = json.mjesta.find((m) => isRecord(m) && m.omm === omm);
  if (!isMjesto(mjesto)) throw new Error(`Moja mreža: OMM ${omm} nema ili mu oblik ne odgovara shemi`);
  return { mjesto, dohvaceno: json.dohvaceno };
}

/** HEP „CIGLENICE 38/A, LUKAVEC" i naše „Ciglenice 38A, 10412 Lukavec" su ista adresa. */
export function normalizirajAdresu(adresa: string): string[] {
  return adresa
    .toLocaleUpperCase("hr-HR")
    .replace(/\b\d{5}\b/g, " ")
    .replace(/(\d)\s*\/\s*([A-ZČĆŽŠĐ])\b/g, "$1$2")
    .split(/[\s,]+/)
    .filter(Boolean);
}

export function istaAdresa(hep: string, nasa: string): boolean {
  const a = normalizirajAdresu(hep);
  const b = normalizirajAdresu(nasa);
  return a.length === b.length && a.every((w, i) => w === b[i]);
}

/**
 * Koliko vjerovati broju potrošnje u razdoblju:
 * - `izmjereno`: oba ruba su stvarna stanja brojila;
 * - `procjena`: završno stanje je HEP-ova procjena ili ga nema;
 * - `korekcija`: završno stanje je stvarno, a početno je bila procjena — u
 *   razdoblje je ušla razlika svih prethodnih procjena (otud „skokovi").
 */
export type VrstaRazdoblja = "izmjereno" | "procjena" | "korekcija";

const PROCJENA_RE = /procjen|procijenjen/i;

function dan(datum: string, pomak: number): string {
  const d = new Date(`${datum}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + pomak);
  return d.toISOString().slice(0, 10);
}

/**
 * Je li stanje na rubu razdoblja stvarno očitano; `null` ako stanja nema.
 * HEP rub vodi na oba dana: rujan (1.–30.9.) zatvara ODS-ovim očitanjem od
 * 1.10., pa se gledaju oba datuma.
 */
function izmjerenoNaRubu(ocitanja: readonly MojaMrezaOcitanje[], datumi: readonly string[]): boolean | null {
  const naRubu = ocitanja.filter((o) => datumi.includes(o.datum));
  if (naRubu.length === 0) return null;
  return naRubu.some((o) => !PROCJENA_RE.test(o.opis));
}

export function vrstaRazdoblja(p: MojaMrezaPotrosnja, ocitanja: readonly MojaMrezaOcitanje[]): VrstaRazdoblja {
  const kraj = izmjerenoNaRubu(ocitanja, [p.do, dan(p.do, 1)]);
  if (kraj !== true) return "procjena";
  const pocetak = izmjerenoNaRubu(ocitanja, [dan(p.od, -1), p.od]);
  return pocetak === false ? "korekcija" : "izmjereno";
}

export interface RazdobljeZaPrikaz extends MojaMrezaPotrosnja {
  vrsta: VrstaRazdoblja;
}

/** Razdoblja unutar zadnjih 12 mjeseci od najnovijeg obračuna, najstarije prvo. */
export function zadnjih12Mjeseci(mjesto: MojaMrezaMjesto): RazdobljeZaPrikaz[] {
  const najnovije = mjesto.potrosnja.reduce<string | null>((max, p) => (max === null || p.do > max ? p.do : max), null);
  if (najnovije === null) return [];
  const d = new Date(`${najnovije}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  const od = dan(d.toISOString().slice(0, 10), 1);
  return mjesto.potrosnja
    .filter((p) => p.od >= od)
    .sort((a, b) => a.od.localeCompare(b.od))
    .map((p) => ({ ...p, vrsta: vrstaRazdoblja(p, mjesto.ocitanja) }));
}

/** Najnovije STVARNO očitanje (ne procjena) — ono se smije prikazati kao stanje brojila. */
export function zadnjeOcitanje(mjesto: MojaMrezaMjesto): MojaMrezaOcitanje | null {
  return (
    [...mjesto.ocitanja]
      .filter((o) => !PROCJENA_RE.test(o.opis))
      .sort((a, b) => b.datum.localeCompare(a.datum))[0] ?? null
  );
}
