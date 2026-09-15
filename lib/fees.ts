/**
 * Stope naknada — SSOT za svaku usporedbu „koliko bi ovo danas koštalo".
 *
 * KOPIJA iz /Users/ms/git/pinka-finance/landing/lib/fees.ts, preuzeto 15.9.2026.
 * (docs/10 §3). Nijedna stopa se ne piše izravno u copy ni u komponentu.
 *
 * Primarni izvor (provjereno 8.8.2026.): analiza isplativosti „Isplativost — ZEF
 * Wallet kao companion za zef.hr", nacrt 0.1, 2.7.2026., Zadruga za etično
 * financiranje.
 *
 *  - kartica, Stripe EEA domestic: 1,5 % + 0,25 € po transakciji (srpanj 2026.)
 *  - kartica, izvan EEA: 3,25 % + 0,25 €
 *  - SEPA: fiksna naknada POŠILJATELJA po nalogu u klasičnim hrvatskim bankama
 *    (ZABA, PBZ, Erste, OTP, HPB) — 0,25–0,40 € po transakciji
 *
 * ⚠️ NAPOMENA O IZVORU: taj je dokument interni nacrt druge organizacije i
 * izričito nije financijski ni pravni savjet — osnovica se opisuje riječima, ali
 * se dokument NE linka javno (docs/10 §6).
 *
 * ⚠️ POZNATI NESKLAD U OBITELJI: `mpt-landing/src/lib/market-fees.ts` tvrdi da je
 * SEPA raspon 0,25–0,45 €. Točno je 0,25–**0,40** €; mpt.hr treba isti ispravak.
 * Ne prenositi grešku (CLAUDE.md pravilo 2).
 *
 * Ovo su ulazi u USPOREDBU. Mi sami ne uzimamo postotak od prikupljenog.
 *
 * ⚠️ „0 %" se nikad ne piše samo (docs/14 §3.1): ne uzimamo postotak od
 * prikupljenog, ali zarađujemo kao izvođač — to mora stajati u istom vidnom
 * polju. Vidi `PLATFORM_TAKE_PCT` niže.
 */

export const CARD_FEE_PCT = 0.015;
export const CARD_FEE_FIXED = 0.25;

/** Kartice izvan EEA — zabilježeno za buduću upotrebu, danas se ne prikazuje. */
export const CARD_FEE_PCT_INTL = 0.0325;

export const SEPA_FEE_MIN = 0.25;
export const SEPA_FEE_MAX = 0.4;

/** Naknada platforme za nove autore (Patreon) — izvor airKUNA SSOT, kolovoz 2025. */
export const CREATOR_PLATFORM_FEE_PCT = 0.1;

/**
 * Naš postotak od prikupljenog. Nula, i to je trajna odluka (docs/14 §3):
 * provizija na prikupljena sredstva ruši i tvrdnju i pravno pozicioniranje.
 * Prihod je marža na izvedbi, koja je javna u razradi troška projekta.
 */
export const PLATFORM_TAKE_PCT = 0;

/** Referentni iznosi koji se ponavljaju kroz copy. */
export const MICRO_AMOUNT = 2;
export const REFERENCE_AMOUNT = 100;

/**
 * Iznosi koji stoje jedan uz drugi u tablici transparentnosti. Raspon 1 → 100 €
 * je cijela poanta: fiksna komponenta je nevidljiva na 100 € i brutalna na 1 €,
 * što postotni prikaz skriva.
 */
export const COMPARISON_AMOUNTS = [1, 2, 10, 100] as const;

/** Naknada kartičnog procesora na jednu uplatu (Stripe EEA domestic). */
export const cardFee = (amount: number): number =>
  amount * CARD_FEE_PCT + CARD_FEE_FIXED;

/** Gornja granica fiksne naknade za nalog u klasičnoj hrvatskoj banci. */
export const sepaFeeMax = (): number => SEPA_FEE_MAX;

/** Koliko od `amount` ostane nakon naknade, u postotku zaokruženom na 1 decimalu. */
export const retainedPct = (amount: number, fee: number): number =>
  Math.round(((amount - fee) / amount) * 1000) / 10;
