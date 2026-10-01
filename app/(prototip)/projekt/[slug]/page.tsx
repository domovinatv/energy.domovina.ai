import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import {
  PROJECTS,
  SAFES,
  getContributionsForProject,
  getDocumentsForProject,
  getPlantForProject,
  getProjectBySlug,
  getTimelineForProject,
} from "@/lib/mock";
import { ProjectDetail } from "@/components/project-detail";

/**
 * `/projekt/:slug` — detalj projekta (docs/07 §2.3).
 *
 * ⚠️ NE dodavati `export const dynamicParams = false` — ruši prerenderirane
 * rute na OpenNextu (opennextjs-cloudflare #611, docs/06 §5).
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (project === undefined) return { title: "404" };
  return {
    title: project.title,
    description: `${project.title} — ${project.holder_name} · ${BRAND.name}`,
    // Closed beta se ne indeksira (docs/12 §3).
    robots: { index: false, follow: false },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (project === undefined) notFound();

  return (
    <ProjectDetail
      project={project}
      plant={getPlantForProject(project) ?? null}
      safe={SAFES[project.slug]}
      contributions={getContributionsForProject(project.slug)}
      documents={getDocumentsForProject(project.slug)}
      timeline={getTimelineForProject(project.slug)}
    />
  );
}
