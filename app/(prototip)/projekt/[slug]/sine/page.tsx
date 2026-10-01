import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProjectBySlug } from "@/lib/mock";
import { RailsSwitch } from "@/components/rails-switch";

/** `/projekt/:slug/sine` — „Prebaci na svoje šine" (P3, docs/07 §2.10). */
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
  return { title: project.title, robots: { index: false, follow: false } };
}

export default async function RailsPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (project === undefined) notFound();
  return <RailsSwitch project={project} />;
}
