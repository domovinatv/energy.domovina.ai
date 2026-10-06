import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaProjectPage } from "@/components/beta/beta-page";
import { BETA_PROJECTS } from "@/lib/beta-projects";

/**
 * `/beta/<slug>/` — jedna prava elektrana (docs/15): slike, uplata, uplate s
 * lanca i mjerno mjesto HEP ODS. Popis je na `/beta/`.
 *
 * ⚠️ NE dodavati `export const dynamicParams = false` — ruši prerenderirane
 * rute na OpenNextu (opennextjs-cloudflare #611, docs/06 §5).
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return BETA_PROJECTS.map((p) => ({ slug: p.slug }));
}

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = BETA_PROJECTS.find((p) => p.slug === slug);
  if (project === undefined) return { title: "404" };
  return {
    title: `${project.place} · ${project.powerKw} kW`,
    description: `Sunčana elektrana ${project.place}, ${project.address}. Uplate javno vidljive na Gnosis Chainu.`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!BETA_PROJECTS.some((p) => p.slug === slug)) notFound();
  return <BetaProjectPage slug={slug} />;
}
