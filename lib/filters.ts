/**
 * Filtriranje registra — JEDNO mjesto istine za „koje elektrane se trenutno
 * gledaju".
 *
 * ⚠️ docs/07 §2.1: karta i popis moraju gledati ISTI filtrirani skup.
 * Najčešća greška u ovom obrascu je da filtar mijenja popis, a ne kartu. Zato
 * filtriranje NIJE u komponenti karte ni u komponenti popisa — obje dobivaju
 * gotov niz iz `filterPlants`, izračunat jednom iznad njih.
 */
import type { GridStatus, Plant, PlantStatus } from "./types";

export interface KwpBucket {
  readonly key: string;
  readonly label: string;
  readonly min: number;
  /** null = bez gornje granice. */
  readonly max: number | null;
}

/**
 * Rasponi snage. Raspon je logaritamski širok (krov od 5 kWp ↔ poslovni objekt
 * od nekoliko stotina), pa su i pragovi logaritamski.
 */
export const KWP_BUCKETS: readonly KwpBucket[] = [
  { key: "do-10", label: "do 10 kWp", min: 0, max: 10 },
  { key: "10-50", label: "10–50 kWp", min: 10, max: 50 },
  { key: "50-200", label: "50–200 kWp", min: 50, max: 200 },
  { key: "200-plus", label: "200 kWp i više", min: 200, max: null },
] as const;

export interface PlantFilters {
  readonly county: string | null;
  readonly status: PlantStatus | null;
  readonly gridStatus: GridStatus | null;
  readonly kwpBucket: string | null;
  /** Samo elektrane koje imaju otvoren projekt — „traže suradnju". */
  readonly seekingPartners: boolean;
  readonly search: string;
}

export const EMPTY_FILTERS: PlantFilters = {
  county: null,
  status: null,
  gridStatus: null,
  kwpBucket: null,
  seekingPartners: false,
  search: "",
};

export function hasActiveFilters(filters: PlantFilters): boolean {
  return (
    filters.county !== null ||
    filters.status !== null ||
    filters.gridStatus !== null ||
    filters.kwpBucket !== null ||
    filters.seekingPartners ||
    filters.search.trim() !== ""
  );
}

function matchesKwp(plant: Plant, bucketKey: string | null): boolean {
  if (bucketKey === null) return true;
  const bucket = KWP_BUCKETS.find((b) => b.key === bucketKey);
  if (bucket === undefined) return true;
  const kwp = plant.capacity_kwp;
  if (kwp === null) return false;
  if (kwp < bucket.min) return false;
  if (bucket.max !== null && kwp >= bucket.max) return false;
  return true;
}

/** Normalizacija za pretragu — dijakritika ne smije biti prepreka. */
function foldCroatian(input: string): string {
  const map: Record<string, string> = {
    č: "c", ć: "c", đ: "d", š: "s", ž: "z",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Jedini filtar u aplikaciji. I karta i popis pozivaju isti rezultat — ne
 * svaka svoj.
 */
export function filterPlants(
  plants: readonly Plant[],
  filters: PlantFilters,
): Plant[] {
  const needle = foldCroatian(filters.search.trim());
  return plants.filter((plant) => {
    if (filters.county !== null && plant.county !== filters.county) return false;
    if (filters.status !== null && plant.status !== filters.status) return false;
    if (filters.gridStatus !== null && plant.grid_status !== filters.gridStatus) return false;
    if (!matchesKwp(plant, filters.kwpBucket)) return false;
    if (filters.seekingPartners && plant.campaign_slug === null) return false;
    if (needle !== "") {
      const haystack = foldCroatian(
        `${plant.name} ${plant.location_name ?? ""} ${plant.county ?? ""}`,
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistika iznad karte — docs/07 §2.1
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistryStats {
  readonly count: number;
  /** Zbroj kWp. Prikazuje se kao MW agregat (`formatAggregateCapacity`). */
  readonly totalKwp: number;
  readonly operational: number;
  readonly seekingPartners: number;
  /** Koliko ih čeka mrežu — `requested` ili `not_requested`. */
  readonly awaitingGrid: number;
}

export function computeStats(plants: readonly Plant[]): RegistryStats {
  let totalKwp = 0;
  let operational = 0;
  let seekingPartners = 0;
  let awaitingGrid = 0;

  for (const plant of plants) {
    totalKwp += plant.capacity_kwp ?? 0;
    if (plant.status === "operational") operational += 1;
    if (plant.campaign_slug !== null) seekingPartners += 1;
    if (plant.grid_status === "requested" || plant.grid_status === "not_requested") {
      awaitingGrid += 1;
    }
  }

  return {
    count: plants.length,
    totalKwp: Math.round(totalKwp * 10) / 10,
    operational,
    seekingPartners,
    awaitingGrid,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep-linkovi — docs/06 §6: demo na štandu se pokazuje otvaranjem točne
// stranice, ne klikanjem kroz pet koraka.
// ─────────────────────────────────────────────────────────────────────────────

export function filtersToSearchParams(filters: PlantFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.county !== null) params.set("zupanija", filters.county);
  if (filters.status !== null) params.set("status", filters.status);
  if (filters.gridStatus !== null) params.set("mreza", filters.gridStatus);
  if (filters.kwpBucket !== null) params.set("snaga", filters.kwpBucket);
  if (filters.seekingPartners) params.set("suradnja", "1");
  if (filters.search.trim() !== "") params.set("q", filters.search.trim());
  return params;
}

const PLANT_STATUS_SET = new Set<string>([
  "planned",
  "under_construction",
  "operational",
  "decommissioned",
]);

const GRID_STATUS_SET = new Set<string>([
  "not_applicable",
  "not_requested",
  "requested",
  "approved",
  "connected",
  "rejected",
]);

export function filtersFromSearchParams(
  params: URLSearchParams,
  counties: readonly string[],
): PlantFilters {
  const county = params.get("zupanija");
  const status = params.get("status");
  const grid = params.get("mreza");
  const bucket = params.get("snaga");
  return {
    county: county !== null && counties.includes(county) ? county : null,
    status: status !== null && PLANT_STATUS_SET.has(status) ? (status as PlantStatus) : null,
    gridStatus: grid !== null && GRID_STATUS_SET.has(grid) ? (grid as GridStatus) : null,
    kwpBucket:
      bucket !== null && KWP_BUCKETS.some((b) => b.key === bucket) ? bucket : null,
    seekingPartners: params.get("suradnja") === "1",
    search: params.get("q") ?? "",
  };
}
