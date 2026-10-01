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
 * ⚠️ Javno se prikazuje samo MJESTO. Puna adresa lokacije stoji u docs/15, ne ovdje.
 */

import { BRAND } from "@/lib/brand";

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
 * Monerium račun ITalk d.o.o. (Business). Isti IBAN za sve tri elektrane:
 * opis plaćanja `gnosis:<safe>` Moneriumu kaže na koji povezani Safe mintati.
 * ⚠️ Isti IBAN koristi i pay.domovina.ai rail (s `cmp:`/`mpt:` opisima) — vidi
 * docs/15 §7 prije prve uplate treće osobe.
 */
const ITALK_MONERIUM: BetaPayment = {
  kind: "monerium",
  routing: "reference",
  iban: "EE707777000162921128",
  beneficiaryName: "ITalk d.o.o.",
  bic: "LHVBEE22",
};

/** Baza za `GET /api/intents/campaign-qr` — služi samo provjeri prije deploya. */
export const RAIL_API_BASE = "https://mpt.domovina.ai/api/intents";

export type Address = `0x${string}`;

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Kako uplatitelj plaća. Oba puta završavaju istim: EURe na Safeu projekta.
 *
 * - `rail`: isti tok kao donacije podcastima (domovina.ai/c/…/doniraj). IBAN je
 *   zajednički IBAN tenanta na pay.domovina.ai, a opis plaćanja `cmp:<safe>?id=`
 *   govori railu kamo proslijediti. Kampanja MORA biti registrirana na railu,
 *   inače se svaka uplata odbije — to provjerava `scripts/check-beta.mts`.
 * - `monerium`: Safe je povezan s Monerium profilom vlasnika.
 *   - `routing: "reference"` — JEDAN IBAN profila za sve elektrane; opis plaćanja
 *     `gnosis:<safe>` govori Moneriumu na koji povezani Safe mintati
 *     (help.monerium.com/article/14-redirect-incoming-payments). Odabrano za betu.
 *   - `routing: "iban"` — IBAN je vezan baš za ovaj Safe; opis je slobodan.
 */
export type BetaPayment =
  | {
      kind: "rail";
      campaignId: string;
      iban: string;
      beneficiaryName: string;
      bic: string | null;
    }
  | {
      kind: "monerium";
      routing: "reference" | "iban";
      iban: string;
      beneficiaryName: string;
      bic: string | null;
    };

export interface BetaProject {
  slug: string;
  /** Samo mjesto — nikad ulica ni kućni broj. */
  place: string;
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
  /** Cilj u centima; `null` dok nema ponude izvođača. */
  goalCents: number | null;
  /** `null` dok Safe nije povezan s načinom uplate. */
  payment: BetaPayment | null;
}

export const BETA_PROJECTS: readonly BetaProject[] = [
  {
    slug: "lukavec",
    place: "Lukavec",
    county: "Zagrebačka županija",
    powerKw: 16,
    connections: 1,
    gnosisNode: true,
    safe: "0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173",
    signers: OWNER_SIGNERS,
    goalCents: null,
    payment: ITALK_MONERIUM,
  },
  {
    slug: "donja-lomnica",
    place: "Donja Lomnica",
    county: "Zagrebačka županija",
    powerKw: 20,
    connections: 2,
    gnosisNode: true,
    safe: "0x52eaB439F021111A5280fdCF682D1777428578fa",
    signers: OWNER_SIGNERS,
    goalCents: null,
    payment: ITALK_MONERIUM,
  },
  {
    slug: "rab",
    place: "Rab",
    county: "Primorsko-goranska županija",
    powerKw: 8,
    connections: 1,
    gnosisNode: true,
    safe: "0x7CA5E2Dcd81Aa54bC2f8ee16a1D313734D314F05",
    signers: OWNER_SIGNERS,
    goalCents: null,
    payment: ITALK_MONERIUM,
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

/** Opis plaćanja koji ide u SEPA nalog i u EPC QR. */
export function remittanceFor(project: BetaProject & { safe: Address; payment: BetaPayment }): string {
  if (project.payment.kind === "rail") {
    // Isti format kao pay.domovina.ai `GET /campaign-qr` (backend/src/intents/api.ts).
    return `cmp:${project.safe.toLowerCase()}?id=${project.payment.campaignId}`;
  }
  if (project.payment.routing === "reference") {
    // Format iz Monerium pomoći: `{chain}:{address}`.
    return `gnosis:${project.safe}`;
  }
  return `${BRAND.name} ${project.place}`;
}

/**
 * EPC069-12 tekst za QR kod (SEPA Credit Transfer). Preslikano iz
 * pay.domovina.ai `backend/src/intents/epc.ts` — isti raspored od deset redaka,
 * pa bankovne aplikacije koje čitaju donacijski QR čitaju i ovaj.
 * Iznos prazan → uplatitelj ga upisuje sam.
 */
export function buildEpcText(args: {
  beneficiaryName: string;
  iban: string;
  bic: string | null;
  remittance: string;
  amountEur?: number | null;
}): string {
  const version = args.bic ? "002" : "001";
  const amount = args.amountEur && args.amountEur > 0 ? `EUR${args.amountEur.toFixed(2)}` : "";
  return [
    "BCD",
    version,
    "1",
    "SCT",
    args.bic ?? "",
    args.beneficiaryName,
    args.iban.replace(/\s+/g, ""),
    amount,
    "OTHR",
    args.remittance.slice(0, 140),
  ].join("\n");
}

/** IBAN u skupinama po četiri znaka, za čitanje naglas i prepisivanje. */
export function formatIban(iban: string): string {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
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
