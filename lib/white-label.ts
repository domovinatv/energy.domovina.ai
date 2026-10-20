/**
 * Bijela etiketa — PLACEHOLDER brend za /sandbox/ (docs/17).
 *
 * Namjerno neutralno: /sandbox/ pokazuje funkcionalnost (kampanja doprinosa na
 * MPT railu), ne izgled. Kad je tok gotov, ovaj objekt postaje konfiguracija po
 * klijentu (ime, logo, boje kao CSS varijable s RGB kanalima, impresum, profil
 * raila) — „blueprint" iz docs/17 §4. Zato ime ne ide izravno u copy ni ovdje
 * ni u komponentama, nego kroz `{brand}` u katalogu.
 */
export const WHITE_LABEL = {
  /** Ime platforme klijenta. Placeholder dok nema stvarnog klijenta. */
  name: "Naziv platforme",
  /** Monogram u zaglavlju umjesto loga. */
  monogram: "NP",
  /**
   * Tko stvarno stoji iza ovog prikaza. Sandbox živi na našem hostu, pa impresum
   * ostaje naš — placeholder brend ne smije izgledati kao stvarna tvrtka.
   */
  poweredBy: "domovina.energy",
} as const satisfies { name: string; monogram: string; poweredBy: string };
