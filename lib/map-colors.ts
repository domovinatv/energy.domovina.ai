/**
 * Boje za maplibre.
 *
 * ⚠️ JEDINA dopuštena iznimka od pravila „nikad hex u komponenti"
 * (docs/09 §6.1): maplibre paint properties ne čitaju Tailwind. Isti je
 * kompromis već napravljen u `karta-hrvatske/.../usePinkaLayer.ts`
 * (`PINKA_CORAL`). Zato uz SVAKU boju stoji iz kojeg tokena dolazi — ako se
 * token promijeni u tailwind.config.ts, mijenja se i ovdje.
 *
 * Semantika je iz docs/09 §3 i mora biti ISTA na karti, kartici i badgeu.
 *
 * Napomena o nesuglasju: docs/08 §3.1 kaže „zajednica → zelena", docs/09 §3
 * kaže `teal`. Slijedi se docs/09 jer je SSOT dizajn sustava — inače bi se
 * zajednica i „traži suradnju" (forest) sudarile u istoj zelenoj.
 */
import type { ExpressionSpecification } from "maplibre-gl";

/** `solar.DEFAULT` — jantar. Nosi PODATAK, nikad CTA (docs/09 §2). */
export const SOLAR = "#E8A33D";
/** `forest.DEFAULT` — primarni akcent; ovdje „traži suradnju". */
export const FOREST = "#2D6A4F";
/** `teal.DEFAULT` — zajednica. */
export const TEAL = "#0F4C5C";
/** `inkMuted` — planirana / izvan pogona. */
export const INK_MUTED = "#6B6B6B";
/** `rust` — upozorenje (bez priključka). */
export const RUST = "#9B2226";
/** `ink` — tekst na klasteru. */
export const INK = "#1A1A1A";
/** `cream` — obrub markera i podloga klastera. */
export const CREAM = "#FBF8F3";
/** `sandDeep` — podloga klastera. */
export const SAND_DEEP = "#F0E6D2";

// Izrazi su tipizirani kao maplibre `ExpressionSpecification` (tip se briše pri
// buildu) — bez `as const`, jer maplibre traži promjenjive nizove.

/**
 * Boja markera, po prioritetu značenja:
 *   1. traži suradnju (ima otvoren projekt) → forest
 *   2. zajednica → teal
 *   3. u pogonu / u izgradnji → solar
 *   4. planirana / izvan pogona → inkMuted
 *
 * Izražena kao maplibre `case` izraz nad svojstvima značajke.
 */
export const MARKER_COLOR_EXPRESSION: ExpressionSpecification = [
  "case",
  ["get", "seeking"], FOREST,
  ["==", ["get", "owner_type"], "community"], TEAL,
  ["==", ["get", "status"], "operational"], SOLAR,
  ["==", ["get", "status"], "under_construction"], SOLAR,
  INK_MUTED,
];

/**
 * Polumjer markera ∝ log(kWp), interpoliran po zoomu.
 *
 * ⚠️ Raspon je od ~3 kWp (krov) do stotina kWp, pa LINEARNO skaliranje pojede
 * kartu (docs/08 §3.1). `logKwp` je predizračunat u svojstvima značajke jer
 * maplibre `ln` izrazi ne rade u svim verzijama stila.
 *
 * ⚠️ Izraz koji čita `["zoom"]` smije stajati SAMO kao vrh `step`/`interpolate`
 * izraza. Zato se prsten ne može napisati kao `["+", MARKER_RADIUS, 5]` —
 * maplibre to odbija s „zoom expression may only be used as input to a
 * top-level step or interpolate expression". Umjesto toga se odmak upiše u
 * svaku točku, a oba izraza nastaju iz istog izvora da ne mogu razići.
 */

/** [zoom, polumjer pri logKwp=0, polumjer pri logKwp=1] */
const RADIUS_STOPS: ReadonlyArray<readonly [number, number, number]> = [
  [5, 3, 6.5],
  [9, 4.5, 11],
  [13, 7, 18],
];

function radiusExpression(offset: number): ExpressionSpecification {
  const stops = RADIUS_STOPS.flatMap(([zoom, small, large]) => [
    zoom,
    ["interpolate", ["linear"], ["get", "logKwp"], 0, small + offset, 1, large + offset],
  ]);
  return ["interpolate", ["linear"], ["zoom"], ...stops] as ExpressionSpecification;
}

export const MARKER_RADIUS_EXPRESSION: ExpressionSpecification = radiusExpression(0);

/** Prsten oko onih koje traže suradnju — isti izraz, pomaknut prema van. */
export const MARKER_RING_RADIUS_EXPRESSION: ExpressionSpecification = radiusExpression(5);

/** Obrub: deblji kad je elektrana bez priključka — upozorenje (docs/09 §3). */
export const MARKER_STROKE_COLOR_EXPRESSION: ExpressionSpecification = [
  "case",
  ["==", ["get", "grid_status"], "not_requested"], RUST,
  ["==", ["get", "grid_status"], "rejected"], RUST,
  CREAM,
];
