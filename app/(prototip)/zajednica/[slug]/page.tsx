import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  COMMUNITIES,
  getCommunityBySlug,
  getMembersForCommunity,
  getPlantsForCommunity,
  getProjectsForCommunity,
} from "@/lib/mock";
import { CommunityDetail } from "@/components/community-detail";

/** `/zajednica/:slug` — detalj zajednice (docs/07 §2.5). */
export function generateStaticParams(): Array<{ slug: string }> {
  return COMMUNITIES.map((community) => ({ slug: community.slug }));
}

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const community = getCommunityBySlug(slug);
  if (community === undefined) return { title: "404" };
  return { title: community.name, robots: { index: false, follow: false } };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const community = getCommunityBySlug(slug);
  if (community === undefined) notFound();

  return (
    <CommunityDetail
      community={community}
      members={getMembersForCommunity(slug)}
      plants={getPlantsForCommunity(slug)}
      projects={getProjectsForCommunity(slug)}
    />
  );
}
