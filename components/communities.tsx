"use client";

/**
 * `/zajednice` — popis (docs/07 §2.5).
 *
 * ⚠️ „Ono što nitko drugi nema": zajednica je vidljiva I PRIJE nego pravno
 * postoji. `idea` i `preparing` su NORMALNA I VIDLJIVA stanja, ne greška ni
 * prazan zapis (docs/05 §6, docs/03 §5.3) — cijela je poanta pratiti zajednicu
 * dok nastaje, jer je upravo to razdoblje u kojem ljudi odustanu.
 */
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { ENERGY_COMMUNITIES_REGISTERED } from "@/lib/facts";
import { formatNumber } from "@/lib/format";
import { COMMUNITIES, getMembersForCommunity, getPlantsForCommunity } from "@/lib/mock";
import type { Community } from "@/lib/types";
import { DemoBadge } from "./badges";

/** Traka registracije — ista četiri stanja, istim redom, na popisu i na detalju. */
const REGISTRATION_ORDER: readonly Community["registration_state"][] = [
  "idea",
  "preparing",
  "filed",
  "registered",
];

export function RegistrationTrack({
  state,
}: {
  readonly state: Community["registration_state"];
}) {
  const { t } = useT();
  const reached = REGISTRATION_ORDER.indexOf(state);

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {REGISTRATION_ORDER.map((step, i) => {
        const done = i <= reached;
        return (
          <li
            key={step}
            aria-current={i === reached ? "step" : undefined}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              i === reached
                ? "bg-forest text-cream"
                : done
                  ? "bg-forest/10 text-forest-800"
                  : "bg-ink/6 text-inkMuted"
            }`}
          >
            {t(`community.state.${step}`)}
          </li>
        );
      })}
    </ol>
  );
}

export function CommunitiesList() {
  const { t } = useT();

  return (
    <div className="container-content py-6 sm:py-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-display-md font-semibold text-ink">
          {t("communities.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">{t("communities.lede")}</p>
        {/*
          ⚠️ Brojka „3 registrirane" dolazi iz lib/facts.ts i citira docs/02 §3 —
          nikad se ne piše izravno u copy (CLAUDE.md pravilo 2).
        */}
        <p className="mt-3 text-sm text-inkMuted">
          {t("communities.count", {
            registered: formatNumber(ENERGY_COMMUNITIES_REGISTERED.value),
            shown: formatNumber(COMMUNITIES.length),
          })}
        </p>
      </header>

      {COMMUNITIES.length === 0 ? (
        <p className="mt-8 text-sm text-inkMuted">{t("communities.empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITIES.map((community) => {
            const members = getMembersForCommunity(community.slug);
            const plants = getPlantsForCommunity(community.slug);
            return (
              <li key={community.slug} className="flex">
                <Link
                  href={`/zajednica/${community.slug}/`}
                  className="card-base group flex flex-col gap-3 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {community.demo ? <DemoBadge /> : null}
                  </div>

                  <h2 className="font-display text-lg font-semibold leading-tight text-ink">
                    {community.name}
                  </h2>
                  <p className="text-sm text-inkMuted">
                    {t(`community.legalForm.${community.legal_form}`)}
                  </p>

                  <div className="mt-auto space-y-2 pt-2">
                    <RegistrationTrack state={community.registration_state} />
                    <p className="text-xs leading-relaxed text-inkMuted">
                      {t(`community.stateHint.${community.registration_state}`)}
                    </p>
                  </div>

                  <dl className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/8 pt-3 text-xs text-inkMuted">
                    <div className="flex gap-1.5">
                      <dt>{t("community.members")}:</dt>
                      <dd className="font-medium text-inkSoft">{members.length}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>{t("community.plants")}:</dt>
                      <dd className="font-medium text-inkSoft">{plants.length}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
