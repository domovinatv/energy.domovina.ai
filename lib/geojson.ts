/**
 * Plant[] → GeoJSON za maplibre.
 *
 * Svojstva su namjerno „ravna" (bez ugniježđenih objekata): maplibre izrazi
 * (`["get", …]`) čitaju samo skalare, a klaster svojstva (`clusterProperties`)
 * zbrajaju samo brojeve.
 */
import type { Feature, FeatureCollection, Point } from "geojson";
import type { Plant } from "./types";

export interface PlantFeatureProperties {
  slug: string;
  name: string;
  county: string;
  location_name: string;
  status: Plant["status"];
  grid_status: Plant["grid_status"];
  owner_type: Plant["owner_type"];
  capacity_kwp: number;
  /** Normalizirani log snage 0..1 — ulaz u `MARKER_RADIUS_EXPRESSION`. */
  logKwp: number;
  /** Ima otvoren projekt. */
  seeking: boolean;
  demo: boolean;
}

// GeoJSON tipovi dolaze iz `geojson` paketa (maplibre ih koristi) — vlastiti
// `readonly` ekvivalenti ne prolaze kroz `map.getSource().setData()`.
export type PlantFeature = Feature<Point, PlantFeatureProperties>;
export type PlantCollection = FeatureCollection<Point, PlantFeatureProperties>;

/** Referentne granice za normalizaciju: 2 kWp → 0, 1.000 kWp → 1. */
const LOG_MIN = Math.log(2);
const LOG_MAX = Math.log(1000);

function normalizedLog(kwp: number): number {
  if (kwp <= 0) return 0;
  const v = (Math.log(kwp) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return Math.min(1, Math.max(0, Math.round(v * 1000) / 1000));
}

/**
 * ⚠️ Značajke bez koordinata se izostavljaju. Isti sigurnosni obrazac kao
 * filtriranje na izvoru u `usePinkaLayer` (docs/08 §2): marker koji ne zna gdje
 * je nema što raditi na karti.
 */
export function plantsToGeoJson(plants: readonly Plant[]): PlantCollection {
  const features: PlantFeature[] = [];
  plants.forEach((plant, index) => {
    const { latitude, longitude } = plant;
    if (latitude === null || longitude === null) return;
    const kwp = plant.capacity_kwp ?? 0;
    features.push({
      type: "Feature",
      // Numerički id je uvjet za `setFeatureState` (hover) u maplibreu.
      id: index + 1,
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: {
        slug: plant.slug,
        name: plant.name,
        county: plant.county ?? "",
        location_name: plant.location_name ?? "",
        status: plant.status,
        grid_status: plant.grid_status,
        owner_type: plant.owner_type,
        capacity_kwp: kwp,
        logKwp: normalizedLog(kwp),
        seeking: plant.campaign_slug !== null,
        demo: plant.demo,
      },
    });
  });
  return { type: "FeatureCollection", features };
}
