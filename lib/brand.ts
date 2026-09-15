/**
 * Ime proizvoda i adrese — docs/12 §5.
 *
 * Ime se NIKAD ne hardkodira u copy ni u komponentu. Prelazak s
 * `energy.domovina.ai` na `domovina.energy` mora biti jedna izmjena ovdje.
 *
 * Isti obrazac kao `config/brands/` u airkuna/tokenizacija — priprema i za
 * bijelu etiketu kasnije (docs/10 §5).
 */
export const BRAND = {
  /** Ime proizvoda u copyju. */
  name: "domovina.energy",
  /** Gdje stvarno živi sada (closed beta). */
  liveUrl: "https://energy.domovina.ai",
  /** Rezervirano za javno lansiranje. */
  publicUrl: "https://domovina.energy",
  stage: "closed-beta",
} as const satisfies {
  name: string;
  liveUrl: string;
  publicUrl: string;
  stage: "closed-beta" | "public";
};

/**
 * Impresum — doslovno iz docs/03 §7. Ne prepisivati po sjećanju.
 */
export const OPERATOR = {
  legalName: "ITalk d.o.o. za informacijske tehnologije",
  shortName: "ITalk d.o.o.",
  address: "IX. Južna obala 20, 10000 Zagreb",
  oib: "54872935051",
  mbs: "081042440",
  euid: "HRSR.081042440",
  court: "Trgovački sud u Zagrebu",
  director: "Matija Stepanić",
} as const;

/** Adresa na kojoj prototip trenutno živi, bez sheme — za prikaz u traci. */
export const LIVE_HOST = BRAND.liveUrl.replace(/^https?:\/\//, "");

/** Je li ovo još zatvorena beta s demo podacima (docs/12 §3). */
export const IS_CLOSED_BETA = BRAND.stage === "closed-beta";
