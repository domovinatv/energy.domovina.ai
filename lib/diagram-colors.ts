/**
 * Boje za dijagram toka novca.
 *
 * ⚠️ DRUGA instanca iste dopuštene iznimke kao `lib/map-colors.ts`
 * (docs/09 §6.1): ni React Flow ni Mermaid ne čitaju Tailwind. React Flow crta
 * u SVG-u kroz inline stil, Mermaid generira vlastiti CSS iz teme koju mu se
 * preda. Zato uz SVAKU boju stoji iz kojeg tokena dolazi — ako se token
 * promijeni u `tailwind.config.ts`, mijenja se i ovdje.
 *
 * Semantika je ista kao na karti (docs/09 §3), da isti pojam nema dvije boje na
 * istoj stranici:
 *   forest — mi i naš korak u toku
 *   teal   — zajednica i njezin račun
 *   solar  — novac koji je u pokretu; nosi PODATAK, nikad CTA (docs/09 §2)
 *   rust   — odbijen korak
 */

/** `cream` — podloga dijagrama i tekst na tamnom. */
export const CREAM = "#FBF8F3";
/** `sand` — podloga neaktivnog čvora. */
export const SAND = "#F5EFE6";
/** `sandDeep` — obrub neaktivnog čvora. */
export const SAND_DEEP = "#F0E6D2";
/** `ink` — tekst. */
export const INK = "#1A1A1A";
/** `inkSoft` — pomoćni tekst. */
export const INK_SOFT = "#3A3A3A";
/** `inkMuted` — prigušeni čvor izvan scenarija. */
export const INK_MUTED = "#6B6B6B";
/** `forest.DEFAULT` — naš korak u toku. */
export const FOREST = "#2D6A4F";
/** `teal.DEFAULT` — račun zajednice. */
export const TEAL = "#0F4C5C";
/** `solar.DEFAULT` — korak koji se upravo odigrava. */
export const SOLAR = "#E8A33D";
/** `solar.soft` — podloga koraka koji se upravo odigrava. */
export const SOLAR_SOFT = "#FBF0DC";
/**
 * `solar.ink` — jantar je pretaman za tekst na svijetlom, pa tekst ide u ovoj
 * varijanti (docs/09 §2 imenuje jantar kao poznatu zamku kontrasta).
 */
export const SOLAR_INK = "#7A4F08";
/** `rust` — odbijen korak. */
export const RUST = "#9B2226";
/** `border` — obrub, ista vrijednost kao token `border`. */
export const BORDER = "rgba(26, 26, 26, 0.12)";

/**
 * Isti obrub, ali kao NEPROZIRNI heks — `ink` 12 % spljošten preko `sand`.
 *
 * ⚠️ MERMAID NE PODNOSI `rgba()` U `classDef`. Zarez ondje razdvaja svojstva,
 * pa `stroke:rgba(26, 26, 26, 0.12)` razbije parser i **cijeli dijagram tiho
 * ostane prazan** — bez greške u konzoli i bez ijednog znaka na stranici.
 * Ista klasa tihog kvara kao maplibre worker pod Turbopackom (CLAUDE.md
 * §Naučene zamke): stranica izgleda ispravno, samo dijagrama nema.
 *
 * Zato svaka boja koja ide u Mermaid mora biti heks bez zareza. Uzorak
 * `toMermaid` to čuva testom, a `money-flow-mermaid.tsx` kvar prikazuje umjesto
 * da ga prešuti.
 */
export const BORDER_SOLID = "#DBD5CE";
