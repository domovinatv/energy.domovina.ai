import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SandboxCampaignPage } from "@/components/sandbox/sandbox-page";
import { SANDBOX_CAMPAIGNS } from "@/lib/sandbox-campaigns";
import { WHITE_LABEL } from "@/lib/white-label";

/**
 * `/sandbox/<slug>/` — jedna sandbox kampanja (docs/17).
 *
 * ⚠️ NE dodavati `export const dynamicParams = false` — ruši prerenderirane
 * rute na OpenNextu (opennextjs-cloudflare #611, docs/06 §5).
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return SANDBOX_CAMPAIGNS.map((c) => ({ slug: c.slug }));
}

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = SANDBOX_CAMPAIGNS.find((c) => c.slug === slug);
  if (campaign === undefined) return { title: "404" };
  return { title: { absolute: `${campaign.title.hr} · Sandbox · ${WHITE_LABEL.name}` } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!SANDBOX_CAMPAIGNS.some((c) => c.slug === slug)) notFound();
  return <SandboxCampaignPage slug={slug} />;
}
