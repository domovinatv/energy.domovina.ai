/**
 * Tržišne brojke — SSOT za svaki broj koji se pojavi u UI-ju.
 *
 * CLAUDE.md pravilo 2: nijedna brojka se ne piše izravno u copy ili komponentu.
 * Svaka živi ovdje, cituje docs/02-trziste-hrvatska.md ili docs/13-konkurencija.md,
 * i nosi izvor + datum provjere.
 *
 * ⚠️ DUG PROVJERE (docs/2026-09-15-istrazivacki-dnevnik.md §3): tvrdnje V1–V8
 * NISU potvrđene i NE SMIJU ući u javni copy. Zato ovdje nemaju `value` — stoje
 * u `PENDING_VERIFICATION`, gdje ih se ne može formatirati u UI ni greškom.
 * Kad se oznaka ⚠️ makne u docs/02, brojka se seli gore i briše dolje.
 */

/** Jedna provjerena tvrdnja. `value` postoji samo za potvrđene brojke. */
export interface Fact<T> {
  readonly value: T;
  /** Izvor, onako kako se navodi u docs/02 §Izvori. */
  readonly source: string;
  /** Datum provjere (ISO). Tvrdnja bez datuma smatra se neprovjerenom. */
  readonly verifiedAt: string;
  /** Gdje tvrdnja živi u bazi znanja. */
  readonly doc: string;
  /** Ograničenje koje se mora prenijeti zajedno s brojkom. */
  readonly caveat?: string;
}

const f = <T,>(fact: Fact<T>): Fact<T> => fact;

const PD = "Poslovni dnevnik (prenosi HOPS/HEP podatke)";
const CHECKED = "2026-09-15";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Solar u Hrvatskoj — docs/02 §1
// ─────────────────────────────────────────────────────────────────────────────

/** Ukupna instalirana snaga FN elektrana, MW. Solar je prvi put prestigao vjetar. */
export const INSTALLED_CAPACITY_MW = f({
  value: 1500,
  source: PD,
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
  caveat: "Približno, početak 2026.",
});

/** Novoinstalirano u 12 mjeseci (prosinac 2024. → prosinac 2025.), MW. */
export const ADDED_CAPACITY_MW_12M = f({
  value: 417,
  source: "Udruga Obnovljivi izvori energije Hrvatske (OIEH)",
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
});

/**
 * Broj FN elektrana na mreži HEP-ODS-a (veljača 2026.).
 *
 * Ovo je nazivnik za poštenu formulaciju o pokrivenosti registra (docs/08 §4):
 * „44.000 elektrana u Hrvatskoj, N na ovoj karti". Prešutjeti razliku nije opcija.
 */
export const PLANTS_ON_GRID = f({
  value: 44000,
  source: "HEP-ODS preko Poslovnog dnevnika",
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
  caveat: "Približno, veljača 2026.",
});

/** Udio poduzetničkog segmenta u instaliranoj snazi na distribuciji. */
export const BUSINESS_SEGMENT_SHARE = f({
  value: 0.75,
  source: "HEP-ODS preko Poslovnog dnevnika",
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
});

/** Proizvodnja iz FN, MWh — rast ~20× u deset godina. */
export const PV_PRODUCTION_MWH_2015 = f({
  value: 53_000,
  source: PD,
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
});

export const PV_PRODUCTION_MWH_2025 = f({
  value: 1_045_000,
  source: PD,
  verifiedAt: CHECKED,
  doc: "docs/02 §1",
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Ekonomika — docs/02 §2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Godišnji specifični prinos u Zagrebu, kWh/kWp.
 *
 * ⚠️ Vrijedi za Zagreb. Dalmacija je osjetno viša — NE koristiti kao jedan broj
 * za cijelu Hrvatsku (docs/02 §2). Ulaz u procjenu, nikad tvrdnja platforme.
 */
export const SPECIFIC_YIELD_ZAGREB_KWH_PER_KWP = f({
  value: 1393,
  source: "energetska-ucinkovitost.hr",
  verifiedAt: CHECKED,
  doc: "docs/02 §2",
  caveat: "Vrijedi za Zagreb; Dalmacija je osjetno viša.",
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Energetske zajednice — docs/02 §3. Razlog zašto platforma postoji.
// ─────────────────────────────────────────────────────────────────────────────

/** Registrirane energetske zajednice u RH (prosinac 2025.). Hero nosi ovu brojku. */
export const ENERGY_COMMUNITIES_REGISTERED = f({
  value: 3,
  source: "tportal, potvrđuju ZEZ i H-Alter",
  verifiedAt: CHECKED,
  doc: "docs/02 §3",
});

/** Zajednice obnovljive energije (ZOE): nijedna, pet godina nakon zakona. */
export const RENEWABLE_ENERGY_COMMUNITIES_REGISTERED = f({
  value: 0,
  source: "H-Alter",
  verifiedAt: CHECKED,
  doc: "docs/02 §3",
});

/** Trošak registracije zajednice, EUR. Može premašiti ovaj iznos. */
export const COMMUNITY_REGISTRATION_COST_EUR = f({
  value: 20_000,
  source: "Zelena energetska zadruga (ZEZ)",
  verifiedAt: CHECKED,
  doc: "docs/02 §3",
  caveat: "Donja granica — može premašiti.",
});

/** Trajanje registracije zajednice, mjeseci. Više od toga. */
export const COMMUNITY_REGISTRATION_MONTHS = f({
  value: 6,
  source: "Zelena energetska zadruga (ZEZ)",
  verifiedAt: CHECKED,
  doc: "docs/02 §3",
  caveat: "Donja granica — traje više od šest mjeseci.",
});

/** Prva zajednica u RH koja stvarno dijeli struju. */
export const FIRST_SHARING_COMMUNITY = f({
  value: { place: "Špičkovina (Zabok)", since: "2026-06-01" },
  source: "financije.hr",
  verifiedAt: CHECKED,
  doc: "docs/02 §3",
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mreža kao usko grlo — docs/02 §4
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Proizvodni projekti realiziraju se u prosjeku toliko puta brže od jačanja
 * prijenosne i distribucijske mreže. Zato je `grid_status` prvorazredno stanje
 * u podatkovnom modelu, a ne rubni slučaj (docs/05 §2.2).
 */
export const GRID_LAG_FACTOR = f({
  value: 3,
  source: "HGK preko Poslovnog dnevnika",
  verifiedAt: CHECKED,
  doc: "docs/02 §4",
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Green Energy Fair 2026 — docs/02 §5. Prvi javni rok.
// ─────────────────────────────────────────────────────────────────────────────

export const GEF_2026 = f({
  value: {
    from: "2026-10-28",
    to: "2026-10-29",
    venue: "Arena Zagreb",
    exhibitorsAnnounced: 120,
  },
  source: "zg-gef.com",
  verifiedAt: CHECKED,
  doc: "docs/02 §5",
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Presedani iz konkurencije — docs/13, potvrđeno u dnevniku §2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ZEZ Sunce: potražnja je dokazana, alat nije. 140.000 € u desetak dana kroz
 * Google obrazac. Partner, ne konkurent (docs/13 §2).
 */
export const ZEZ_SUNCE = f({
  value: {
    members: 127,
    raisedEur: 140_000,
    days: 10,
    roof: "Gradska tržnica, Križevci",
    householdsPowered: 70,
  },
  source: "zez.coop/zez-sunce, potvrda green.hr",
  verifiedAt: CHECKED,
  doc: "docs/13 §2",
});

/**
 * Ripple Energy: platforma je otišla u stečajnu upravu, a njezine zadruge rade
 * dalje — imovina nikad nije bila Rippleova. Dokaz non-custody teze na stvarnom
 * slučaju; citirati poimence (docs/13 §4.1).
 */
export const RIPPLE_ENERGY = f({
  value: {
    graigFathaMembers: 900,
    kirkHillMembers: 5603,
    trustpilotScore: 2.6,
    trustpilotReviews: 710,
  },
  source: "thenews.coop, potvrde solarpowerportal.co.uk i windpowermonthly.com",
  verifiedAt: CHECKED,
  doc: "docs/13 §4",
  caveat: "Graig Fatha: 900+ članova.",
});

/**
 * Sun Exchange: propao na trošku administriranja ~10.000 suvlasnika. Bez
 * provizije naš trošak po članu mora biti ~0 (docs/13 §5.1).
 */
export const SUN_EXCHANGE_CELL_OWNERS = f({
  value: 10_000,
  source: "post-mortem na sunexchange.com",
  verifiedAt: CHECKED,
  doc: "docs/13 §5",
  caveat: "Približno.",
});

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ DUG PROVJERE — docs/dnevnik §3. Ovdje NEMA vrijednosti, i to je namjerno.
// ─────────────────────────────────────────────────────────────────────────────

/** Neprovjerena tvrdnja. Bez `value` — ne može se formatirati u UI. */
export interface PendingClaim {
  readonly claim: string;
  readonly why: string;
  readonly how: string;
}

/**
 * V1–V8: tvrdnje koje NISU potvrđene. Ništa odavde ne ide u javni copy.
 * Brojka se seli u potvrđeni dio tek kad se oznaka ⚠️ makne u docs/02 ili docs/13.
 */
export const PENDING_VERIFICATION: Readonly<Record<string, PendingClaim>> = {
  V1: {
    claim: "OIEKPP ne pokriva ~44.000 krovnih prosumera",
    why: "Logično, ali nije provjereno u podacima. Određuje smije li registar biti diferencijator.",
    how: "Otvoriti JIZ-01 na oie-aplikacije.mingo.hr/pregledi/ i pogledati broj i tip zapisa.",
  },
  V2: {
    claim: "Ukupna neto proizvodnja RH 14.760 GWh (2024.)",
    why: "Jedini izvor je tehnoeko.com.hr — sekundaran.",
    how: "DZS ili HEP godišnje izvješće.",
  },
  V3: {
    claim: "Cijena struje 0,176 €/kWh (2026.), +12,7 %",
    why: "Portal, ne HERA.",
    how: "HERA tarifni modeli.",
  },
  V4: {
    claim: "FZOEU poticaj 600 €/kW, max 50 % troška",
    why: "Ovisi o aktualnom natječaju (blokada B11).",
    how: "Otvoriti aktualni FZOEU natječaj.",
  },
  V5: {
    claim: "Povrat ulaganja 5–7 godina",
    why: "Izvor su prodavači; neutralniji izvor kaže ~15 godina.",
    how: "Ne citirati kao tvrdnju — samo kao izlaz kalkulatora s korisnikovim ulazima.",
  },
  V6: {
    claim: "Globalno tržište 415,8 M USD (2025.)",
    why: "Komercijalni izvještaj iza plaćanja.",
    how: "Koristiti samo kao red veličine.",
  },
  V7: {
    claim: "Segment kućanstava 35.345 elektrana / 275 MW",
    why: "Presjek je stariji od ostalih brojki u istoj tablici.",
    how: "Uskladiti na isti datum ili izbaciti.",
  },
  V8: {
    claim: "bettervest, Ecco Nova, Lumo — opsezi",
    why: "Nisu otvarani u istraživačkom krugu od 15.9.2026.",
    how: "Otvoriti ako zatreba usporedba.",
  },
} as const;
