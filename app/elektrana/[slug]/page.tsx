import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { PLANTS, getPlantBySlug, getProjectForPlant } from "@/lib/mock";
import { PlantDetail } from "@/components/plant-detail";
import type { Plant } from "@/lib/types";

/**
 * Statički export traži popis svih ruta unaprijed.
 *
 * ⚠️ NE dodavati `export const dynamicParams = false` — ruši prerenderirane
 * rute na OpenNextu (opennextjs-cloudflare #611, docs/06 §5).
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return PLANTS.map((plant) => ({ slug: plant.slug }));
}

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plant = getPlantBySlug(slug);
  if (plant === undefined) return { title: "404" };
  return {
    title: plant.name,
    description:
      plant.description ??
      `${plant.name}${plant.county !== null ? ` · ${plant.county}` : ""} — ${BRAND.name}`,
    // Closed beta se ne indeksira (docs/12 §3).
    robots: { index: false, follow: false },
  };
}

/** Najbliže elektrane, po zračnoj udaljenosti. Kontekst, ne preporuka. */
function nearbyPlants(plant: Plant, limit: number): Plant[] {
  const { latitude, longitude } = plant;
  if (latitude === null || longitude === null) return [];
  return PLANTS.filter(
    (p) => p.slug !== plant.slug && p.latitude !== null && p.longitude !== null,
  )
    .map((p) => ({
      plant: p,
      d: Math.hypot((p.latitude ?? 0) - latitude, (p.longitude ?? 0) - longitude),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.plant);
}

export default async function PlantPage({ params }: Props) {
  const { slug } = await params;
  const plant = getPlantBySlug(slug);
  if (plant === undefined) notFound();

  const project = getProjectForPlant(plant) ?? null;

  return <PlantDetail plant={plant} project={project} nearby={nearbyPlants(plant, 6)} />;
}
