/**
 * Pravi projekti — beta MVP na /beta/ (docs/15).
 *
 * Ovo NISU mock podaci: nema `demo` polja jer ništa ovdje nije izmišljeno.
 * Ono što još ne znamo stoji kao `null` i UI to prikazuje kao „u pripremi" —
 * nikad se ne popunjava procjenom.
 *
 * Novac ne prolazi kroz ovu stranicu. Uplatitelj šalje SEPA nalog izravno
 * (Monerium mintuje EURe na Safe projekta), a stranica samo čita Gnosis Chain.
 *
 * Puna adresa lokacije prikazuje se javno — odluka vlasnika (docs/15 §2).
 */


/** EURe (Monerium, V2) na Gnosis Chainu — isti token kao pinka donacije. */
export const EURE_ADDRESS = "0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430";
export const GNOSIS_CHAIN_ID = 100;

/** Rail Safe na pay.domovina.ai: prima mint od Moneriuma i prosljeđuje ga dalje. */
export const RAIL_SAFE_ADDRESS = "0x449aBCEf4e29a7Dd8d98dB451AF2c463561BAf2e";

/**
 * Potpisnici svih triju Safeova — tri MetaMaska iste osobe (docs/15 §6).
 * 2-od-3 ovdje dokazuje mehanizam, ne neovisnu kontrolu; stranica to kaže.
 */
const OWNER_SIGNERS: { owners: Address[]; threshold: number } = {
  owners: [
    "0x4924f440A12ac82F6e06B058a33d7fd8182f1944", // ms-dom-energy-signer
    "0xF3c4d416Fa863F0801605629097ffF07f1d46FB8", // ds-dom-energy-signer
    "0xC2386b03441C6104F8d40E52e74306EAE830A24B", // md-dom-energy-signer
  ],
  threshold: 2,
};

/**
 * Uplata ide PROVJERENIM MPT tokom (pay.domovina.ai): stranica stvori payment
 * intent za odabrani iznos i otvori rail checkout s jedinstvenim EPC QR-om
 * (`mpt:<safe>?sid=`, iznos u QR-u). Rail po `sid` javlja uplatitelju čim Monerium
 * zaprimi SEPA uplatu — prije minta, pa i kad prva uplata s novog IBAN-a čeka
 * provjeru — i zatim prosljeđuje EURe na Safe elektrane.
 * Uvjet: Safe je na payout whitelisti tenanta (mpt.domovina.ai/admin/whitelist).
 */
const MPT_INTENT: BetaPayment = { kind: "mpt-intent" };

/** MPT intent API (pay.domovina.ai backend): `POST` stvara intent, `GET /campaign-qr` služi provjeri. */
export const RAIL_API_BASE = "https://mpt.domovina.ai/api/intents";

export type Address = `0x${string}`;

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Kako uplatitelj plaća. Jedan put, provjeren u produkciji: MPT payment intent
 * (vidi `MPT_INTENT`). Statični opisi plaćanja (`gnosis:<safe>`, `cmp:`) su
 * namjerno izbačeni — bez intenta nema obavijesti uplatitelju (docs/15 §6).
 */
export type BetaPayment = { kind: "mpt-intent" };

export interface BetaProject {
  slug: string;
  /** Mjesto — naslov kartice. */
  place: string;
  /** Puna adresa lokacije; vlasnik ju je odlučio objaviti (1.10.2026., docs/15 §2). */
  address: string;
  county: string;
  /** Ukupna snaga u kW. */
  powerKw: number;
  /** Broj HEP-ODS priključaka (Donja Lomnica ima dva po 10 kW). */
  connections: number;
  /** Na lokaciji radi Gnosis node (docs/15 §1). */
  gnosisNode: boolean;
  /** Safe projekta; `null` dok nije otvoren. */
  safe: Address | null;
  /**
   * Očekivani potpisnici i prag. `npm run deploy` ih uspoređuje s lancem i ruši
   * deploy ako Safe nije deployan ili se ne slaže (`scripts/check-beta.mts`).
   * Bez ovoga projekt nije naplativ — adresa koju nitko nije provjerio ne prima novac.
   */
  signers: { owners: Address[]; threshold: number } | null;
  /** Cilj kampanje u centima (procjena vlasnika, 1.10.2026.); `null` = nije postavljen. */
  goalCents: number | null;
  /** `null` dok Safe nije povezan s načinom uplate. */
  payment: BetaPayment | null;
}

export const BETA_PROJECTS: readonly BetaProject[] = [
  {
    slug: "lukavec",
    place: "Lukavec",
    address: "Ciglenice 38A, 10412 Lukavec",
    county: "Zagrebačka županija",
    powerKw: 16,
    connections: 1,
    gnosisNode: true,
    safe: "0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173",
    signers: OWNER_SIGNERS,
    goalCents: 1_120_000,
    payment: MPT_INTENT,
  },
  {
    slug: "donja-lomnica",
    place: "Donja Lomnica",
    address: "Školska 5, 10412 Donja Lomnica",
    county: "Zagrebačka županija",
    powerKw: 20,
    connections: 2,
    gnosisNode: true,
    safe: "0x52eaB439F021111A5280fdCF682D1777428578fa",
    signers: OWNER_SIGNERS,
    goalCents: 1_550_000,
    payment: MPT_INTENT,
  },
  {
    slug: "rab",
    place: "Rab",
    address: "Barbat 697, 51280 Rab",
    county: "Primorsko-goranska županija",
    powerKw: 8,
    connections: 1,
    gnosisNode: true,
    safe: "0x7CA5E2Dcd81Aa54bC2f8ee16a1D313734D314F05",
    signers: OWNER_SIGNERS,
    goalCents: 650_000,
    payment: MPT_INTENT,
  },
];

/** Safe postoji i zna se tko ga potpisuje — stanje s lanca smije se prikazati. */
export function hasVerifiedSafe(
  project: BetaProject,
): project is BetaProject & { safe: Address; signers: { owners: Address[]; threshold: number } } {
  return isValidSafe(project.safe) && project.signers !== null;
}

export function isValidSafe(address: string | null): address is Address {
  return address !== null && ADDRESS_RE.test(address) && address.toLowerCase() !== ZERO_ADDRESS;
}

/**
 * Smije li se prikazati uputa za uplatu. Invarijanta iz docs/04 §3.3: projekt
 * bez prave adrese ne smije primati uplate — novac bi otišao u prazno.
 */
export function isPayable(
  project: BetaProject,
): project is BetaProject & { safe: Address; payment: BetaPayment } {
  return (
    isValidSafe(project.safe) &&
    project.payment !== null &&
    project.signers !== null &&
    project.signers.threshold >= 1 &&
    project.signers.threshold <= project.signers.owners.length
  );
}


/**
 * Iznos u EPC QR-u je OBAVEZAN. Bez njega Revolut nakon skeniranja ne popuni
 * pouzdano ni iznos ni opis plaćanja (Matija, 1.10.2026.) — a opis plaćanja je
 * ono po čemu Monerium uplatu šalje na pravi Safe.
 */
export const PRESET_AMOUNTS_EUR = [10, 20, 50, 100] as const;
export const DEFAULT_AMOUNT_EUR = 20;
export const MAX_AMOUNT_EUR = 15_000;

/** „12,50" ili „12.50" → 12.5; prazno, nula, više od dvije decimale ili preko maksimuma → null. */
export function parseAmountEur(input: string): number | null {
  const s = input.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= MAX_AMOUNT_EUR ? n : null;
}

/**
 * EURe ima 18 decimala; u UI-ju računamo u centima (isto kao lib/energy-machine).
 * BigInt jer 18 decimala ne stane u Number bez gubitka.
 */
export function weiToCents(value: string): number {
  return Number(BigInt(value) / 10n ** 16n);
}

export function gnosisscanAddressUrl(address: Address): string {
  return `https://gnosisscan.io/address/${address}#tokentxns`;
}

export function gnosisscanTxUrl(hash: string): string {
  return `https://gnosisscan.io/tx/${hash}`;
}
