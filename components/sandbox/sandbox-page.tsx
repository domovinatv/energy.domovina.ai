"use client";

/**
 * /sandbox/ — kampanja doprinosa na MPT railu, pod placeholder brendom (docs/17).
 *
 * Isti dijelovi kao /beta/ (`LiveActivity`, `PayWithIntent`, `PendingWatcher`,
 * `IntentPanel`), samo s profilom raila `italk-sandbox`: Monerium sandbox i
 * Chiado. Kod koji miče novac je dakle onaj isti koji radi s pravim novcem;
 * razlikuje se samo GDJE (lib/rail-profile).
 */
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { formatEur } from "@/lib/format";
import { SANDBOX_CAMPAIGNS, type SandboxCampaign } from "@/lib/sandbox-campaigns";
import { WHITE_LABEL } from "@/lib/white-label";
import { explorerAddressUrl } from "@/lib/rail-profile";
import { usePending, savePending } from "@/lib/pending-store";
import type { PendingPayment } from "@/lib/pending-payments";
import { CardProgress, LiveActivity, PayWithIntent, PendingWatcher } from "@/components/beta/beta-page";

function DemoBadge() {
  const { t } = useT();
  return (
    <span className="inline-block rounded-full bg-solar px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink">
      {t("sandbox.badge")}
    </span>
  );
}

/** `/sandbox/` — popis kampanja. */
export function SandboxListPage() {
  const { t, locale } = useT();
  return (
    <div className="container-wide py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{t("sandbox.title", { brand: WHITE_LABEL.name })}</h1>
      <p className="mt-4 max-w-3xl text-inkSoft">{t("sandbox.intro")}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SANDBOX_CAMPAIGNS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/sandbox/${c.slug}/`}
              className="block rounded-md border border-ink/10 bg-white p-5 hover:border-ink/25"
            >
              <DemoBadge />
              <h2 className="mt-3 text-xl font-semibold text-ink">{c.title[locale]}</h2>
              <p className="mt-1 text-sm text-inkSoft">{c.organizer[locale]}</p>
              <CardProgress safe={c.safe} goalCents={c.goalCents} rail={c.rail} />
            </Link>
          </li>
        ))}
      </ul>

      <HowItWorks />
    </div>
  );
}

/** `/sandbox/<slug>/` — jedna kampanja: opis, prikupljeno uživo, doprinos. */
export function SandboxCampaignPage({ slug }: { slug: string }) {
  const { t } = useT();
  const campaign = SANDBOX_CAMPAIGNS.find((c) => c.slug === slug);
  if (campaign === undefined) return null;
  return (
    <div className="container-wide py-8 sm:py-12">
      <Link href="/sandbox/" className="text-sm text-inkSoft underline underline-offset-2">
        {t("sandbox.backToList")}
      </Link>
      <div className="mt-4">
        <CampaignSection campaign={campaign} />
      </div>
      <HowItWorks />
    </div>
  );
}

function CampaignSection({ campaign }: { campaign: SandboxCampaign }) {
  const { t, locale } = useT();
  const { safe, rail } = campaign;
  const pending = usePending(safe);
  const [refreshKey, setRefreshKey] = useState(0);
  const onPayment = (p: PendingPayment) => {
    savePending(safe, p);
    if (p.txHash !== null) setRefreshKey((k) => k + 1);
  };
  return (
    <section className="rounded-md border border-ink/10 bg-white p-4 sm:p-7 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_420px] xl:gap-x-10">
      <div>
        <DemoBadge />
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{campaign.title[locale]}</h1>
        <p className="mt-1 text-sm text-inkSoft">{campaign.organizer[locale]}</p>
        <p className="mt-4 max-w-prose text-inkSoft">{campaign.summary[locale]}</p>

        <dl className="mt-5 text-sm">
          <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("sandbox.goal")}</dt>
          <dd className="mt-0.5 text-xl font-semibold text-ink">{formatEur(campaign.goalCents)}</dd>
        </dl>

        <h2 className="mt-6 text-xs uppercase tracking-wide text-inkMuted">{t("sandbox.uses")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-inkSoft">
          {campaign.uses.map((u) => (
            <li key={u.hr}>{u[locale]}</li>
          ))}
        </ul>

        <a
          href="#uplata"
          className="mt-6 block rounded-sm bg-forest px-4 py-2.5 text-center text-sm font-medium text-cream hover:bg-forest-700 xl:hidden"
        >
          {t("sandbox.payJump")}
        </a>
      </div>

      <div className="mt-8 xl:mt-0">
        <PendingWatcher safe={safe} pending={pending} onSettled={() => setRefreshKey((k) => k + 1)} />
        <LiveActivity safe={safe} goalCents={campaign.goalCents} pending={pending} refreshKey={refreshKey} rail={rail} />
        <div className="mt-5 rounded-sm bg-sand px-4 py-3 text-xs text-inkSoft">
          <p>
            {t("sandbox.signers", {
              threshold: campaign.signers.threshold,
              count: campaign.signers.owners.length,
              chain: rail.chainName,
            })}
          </p>
          <a
            href={explorerAddressUrl(rail, safe)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all font-mono text-ink underline decoration-ink/20 underline-offset-2"
          >
            {safe}
          </a>
        </div>
      </div>

      <div id="uplata" className="mt-8 scroll-mt-4 xl:mt-0 xl:self-start">
        <PayWithIntent safe={safe} onPayment={onPayment} onOpenChange={() => undefined} rail={rail} />
      </div>
    </section>
  );
}

/** Što se stvarno događa iza gumba — isti put kao prava uplata, osim banke. */
function HowItWorks() {
  const { t } = useT();
  const steps = [t("sandbox.how1"), t("sandbox.how2"), t("sandbox.how3"), t("sandbox.how4")];
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="text-lg font-semibold text-ink">{t("sandbox.howTitle")}</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-inkSoft">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-inkMuted">{t("sandbox.howReal")}</p>
    </section>
  );
}
