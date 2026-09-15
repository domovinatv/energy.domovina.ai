"use client";

/**
 * `/zajednica/:slug` — detalj zajednice (docs/07 §2.5).
 *
 * ⚠️ ZAHTJEV E9 (docs/03 §8, §5.3): vidljiv disclaimer da platforma NE OSNIVA
 * zajednicu, uz stvarni trošak i trajanje. Obećanje „osnujemo vam zajednicu"
 * bilo bi netočno i lako oborivo pred publikom na GEF-u koja to zna — a 20.000 €
 * i 6+ mjeseci su prepreka koju softver ne miče.
 *
 * ⚠️ K7 (docs/13 §6): registar članova vodi ZADRUGA, ne mi. Ovdje se prikazuje
 * samo ono što je potrebno da bude jasno tko potpisuje i koliki je čiji udio u
 * proizvedenoj energiji.
 */
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import {
  COMMUNITY_REGISTRATION_COST_EUR,
  COMMUNITY_REGISTRATION_MONTHS,
} from "@/lib/facts";
import { formatDate, formatEur, formatNumber, shortAddress } from "@/lib/format";
import type { Community, Member, Plant, Project } from "@/lib/types";
import { DemoBadge } from "./badges";
import { RegistrationTrack } from "./communities";
import { PlantCard } from "./plant-card";
import { ProjectCard } from "./project-card";

export interface CommunityDetailProps {
  readonly community: Community;
  readonly members: readonly Member[];
  readonly plants: readonly Plant[];
  readonly projects: readonly Project[];
}

export function CommunityDetail({ community, members, plants, projects }: CommunityDetailProps) {
  const { t, locale } = useT();
  const registered = community.registration_state === "registered";

  return (
    <article className="container-content py-6 sm:py-10">
      <Link
        href="/zajednice/"
        className="inline-flex items-center gap-1.5 text-sm text-inkMuted transition-colors hover:text-forest"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("community.back")}
      </Link>

      <header className="mt-4 max-w-3xl">
        {community.demo ? <DemoBadge /> : null}
        <h1 className="mt-3 font-display text-display-md font-semibold text-ink">
          {community.name}
        </h1>
        <p className="mt-2 text-sm text-inkMuted">
          {t(`community.legalForm.${community.legal_form}`)}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="min-w-0 space-y-8">
          {/* Traka registracije — `idea`/`preparing` su normalna stanja. */}
          <section className="rounded-md border border-ink/8 bg-white/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
              {t("community.registration")}
            </h2>
            <div className="mt-2">
              <RegistrationTrack state={community.registration_state} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t(`community.stateHint.${community.registration_state}`)}
            </p>
            <p className="mt-3 border-t border-ink/8 pt-3 text-sm text-inkMuted">
              {t("community.oib")}:{" "}
              <span className="text-inkSoft">{community.oib ?? t("community.noOib")}</span>
            </p>
          </section>

          {/* Članovi (K7 — prikazujemo, ne vodimo evidenciju umjesto zadruge). */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("community.members")}
            </h2>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-inkMuted">
                {t("community.memberCount", { count: 0 })}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-ink/8 bg-white/60 px-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {member.person_ref}
                      </span>
                      <span className="block text-xs text-inkMuted">
                        {t(`community.role.${member.role}`)} ·{" "}
                        {t("community.joined")} {formatDate(member.joined_at, locale)}
                      </span>
                    </span>
                    {/* ⚠️ Udio u ENERGIJI i glasu, nikad u dobiti (docs/03 §3). */}
                    <span className="text-right text-xs text-inkSoft">
                      <span className="block text-inkMuted">{t("community.share")}</span>
                      <span className="font-medium">
                        {t("ledger.shareValue", { bp: member.share_basis_points })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs leading-relaxed text-inkMuted">
              {t("community.membersNote")}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("community.projects")}
            </h2>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-inkMuted">{t("community.noProjects")}</p>
            ) : (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <li key={project.slug} className="flex">
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("community.plants")}
            </h2>
            {plants.length === 0 ? (
              <p className="mt-2 text-sm text-inkMuted">{t("community.noPlants")}</p>
            ) : (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {plants.map((plant) => (
                  <li key={plant.slug} className="flex">
                    <PlantCard plant={plant} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-md border border-ink/8 bg-white/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
              {t("community.safe")}
            </h2>
            <p className="mt-2 font-mono text-xs text-inkSoft" title={community.safe_address}>
              {shortAddress(community.safe_address)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-inkMuted">{t("demo.noChain")}</p>
          </section>

          <section className="rounded-md border border-ink/8 bg-white/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
              {t("community.statute")}
            </h2>
            <p className="mt-2 text-sm text-inkSoft">
              {community.statute_url === null
                ? t("community.statuteMissing")
                : t("documents.attached")}
            </p>
          </section>

          <CommunityGuide registered={registered} />
        </aside>
      </div>
    </article>
  );
}

/** Što platforma rješava, a što ne — docs/03 §5.3, doslovno iz tablice. */
const SOLVES: readonly MessageKey[] = [
  "community.solves.capital",
  "community.solves.proof",
  "community.solves.control",
];

const NOT_SOLVES: readonly MessageKey[] = [
  "community.notSolves.founding",
  "community.notSolves.grid",
  "community.notSolves.billing",
];

/**
 * Vodič sa STVARNIM troškom i trajanjem (E9).
 *
 * ⚠️ Brojke dolaze iz lib/facts.ts i citiraju docs/02 §3 — nikad se ne pišu
 * izravno u copy (CLAUDE.md pravilo 2). Uz obje stoji ograničenje: to su DONJE
 * granice, ne procjene.
 */
function CommunityGuide({ registered }: { readonly registered: boolean }) {
  const { t, locale } = useT();
  return (
    <section className="rounded-md border border-solar/40 bg-solar-soft p-4">
      <h2 className="font-display text-base font-semibold text-ink">
        {t("community.guideTitle")}
      </h2>

      <dl className="mt-3 space-y-1.5 text-sm text-solar-ink">
        <div>
          <dt className="sr-only">{t("community.guideTitle")}</dt>
          <dd className="font-medium">
            {t("community.guideCost", {
              amount: formatEur(COMMUNITY_REGISTRATION_COST_EUR.value * 100),
            })}
          </dd>
        </div>
        <div>
          <dd className="font-medium">
            {t("community.guideMonths", {
              months: formatNumber(COMMUNITY_REGISTRATION_MONTHS.value),
            })}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-solar-ink">
        {t("community.guideSource", {
          source: COMMUNITY_REGISTRATION_COST_EUR.source,
          date: formatDate(COMMUNITY_REGISTRATION_COST_EUR.verifiedAt, locale),
        })}
      </p>

      {/* ⚠️ E9 — ovo je rečenica koju se ne smije ublažiti. */}
      <p className="mt-3 rounded-sm bg-cream/80 p-3 text-sm leading-relaxed text-inkSoft">
        {t("community.guideNote")}
      </p>

      {!registered ? (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-solar-ink">
            {t("community.guideSolves")}
          </h3>
          <ul className="mt-1.5 space-y-1 text-sm text-inkSoft">
            {SOLVES.map((key) => (
              <li key={key} className="flex items-start gap-1.5">
                <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                {t(key)}
              </li>
            ))}
          </ul>

          <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-solar-ink">
            {t("community.notSolves")}
          </h3>
          <ul className="mt-1.5 space-y-1 text-sm text-inkSoft">
            {NOT_SOLVES.map((key) => (
              <li key={key} className="flex items-start gap-1.5">
                <X aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rust" />
                {t(key)}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
