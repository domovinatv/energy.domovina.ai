"use client";

/**
 * `/elektrana/:slug` — detalj elektrane (docs/07 §2.2).
 *
 * Polazište je `pinka-finance/energy/app/elektrana/page.tsx` (docs/10 §1),
 * prošireno statusom priključka, tipom vlasnika i karticom projekta.
 *
 * ⚠️ Proizvodnja se prikazuje kao PROCJENA i to piše. Tablica `production` u
 * Fazi 1 ne postoji, a prikaz proizvodnje bez izvora je izmišljanje podataka
 * (docs/05 §7).
 */
import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatDate, formatEur, formatKwp, formatNumber, formatProduction } from "@/lib/format";
import { SAFES } from "@/lib/mock";
import type { Plant, Project } from "@/lib/types";
import { DemoBadge, GridStatusBadge, SeekingBadge, StatusBadge } from "./badges";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/8 py-2.5 last:border-b-0">
      <dt className="text-sm text-inkMuted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function PlantDetail({
  plant,
  project,
  nearby,
}: {
  readonly plant: Plant;
  readonly project: Project | null;
  readonly nearby: readonly Plant[];
}) {
  const { t, locale } = useT();
  const tech = plant.tech;
  const hasTech =
    tech.panels !== undefined || tech.inverters !== undefined || tech.mounting !== undefined;

  return (
    <article className="container-content py-6 sm:py-10">
      <Link
        href="/karta/"
        className="inline-flex items-center gap-1.5 text-sm text-inkMuted transition-colors hover:text-forest"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("plant.back")}
      </Link>

      <header className="mt-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={plant.status} />
          {project !== null ? <SeekingBadge /> : null}
          {plant.demo ? <DemoBadge /> : null}
        </div>
        <h1 className="mt-3 font-display text-display-md font-semibold text-ink">
          {plant.name}
        </h1>
        {plant.location_name !== null || plant.county !== null ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-inkMuted">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {[plant.location_name, plant.county].filter((v) => v !== null).join(" · ")}
          </p>
        ) : null}
        {plant.description !== null ? (
          <p className="mt-4 text-base leading-relaxed text-inkSoft">{plant.description}</p>
        ) : null}
      </header>

      {/* Traka demo napomene — na detalju je izbliza i mora biti nedvosmislena. */}
      {plant.demo ? (
        <p className="mt-6 rounded-md border border-ink/8 bg-sandDeep/60 p-3 text-sm text-inkSoft">
          {t("demo.plantNotice")}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">{t("plant.tech")}</h2>
          <dl className="mt-2 rounded-md border border-ink/8 bg-white/60 px-4">
            {plant.capacity_kwp !== null ? (
              <Row label={t("plant.capacity")}>{formatKwp(plant.capacity_kwp)}</Row>
            ) : null}

            {plant.annual_production_kwh !== null ? (
              <Row label={t("plant.annualProduction")}>
                <span className="inline-flex flex-wrap items-baseline justify-end gap-1.5">
                  {formatProduction(plant.annual_production_kwh)}
                  <span className="rounded-full bg-solar-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-solar-ink">
                    {t("plant.annualProductionEstimate")}
                  </span>
                </span>
              </Row>
            ) : null}

            {plant.commissioning_date !== null ? (
              <Row label={t("plant.commissioned")}>
                {formatDate(plant.commissioning_date, locale)}
              </Row>
            ) : null}

            <Row label={t("owner.label")}>{t(`owner.${plant.owner_type}`)}</Row>

            {hasTech ? (
              <>
                {tech.panels !== undefined ? (
                  <Row label={t("plant.tech.panels")}>{tech.panels}</Row>
                ) : null}
                {tech.inverters !== undefined ? (
                  <Row label={t("plant.tech.inverters")}>{tech.inverters}</Row>
                ) : null}
                {tech.mounting !== undefined ? (
                  <Row label={t("plant.tech.mounting")}>{tech.mounting}</Row>
                ) : null}
              </>
            ) : null}

            {plant.latitude !== null && plant.longitude !== null ? (
              <Row label={t("plant.coordinates")}>
                <Link
                  href={`/karta/?e=${encodeURIComponent(plant.slug)}`}
                  className="text-forest underline underline-offset-2"
                >
                  {plant.latitude.toFixed(4)}, {plant.longitude.toFixed(4)}
                </Link>
              </Row>
            ) : null}
          </dl>

          {plant.annual_production_kwh !== null ? (
            <p className="mt-2 text-xs leading-relaxed text-inkMuted">
              {t("plant.productionDisclaimer")}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4">
          {/* Status priključka je prvorazredno stanje, ne fusnota (docs/05 §2.2). */}
          <section className="rounded-md border border-ink/8 bg-white/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
              {t("grid.label")}
            </h2>
            <div className="mt-2">
              <GridStatusBadge status={plant.grid_status} />
            </div>
            {plant.grid_requested_at !== null ? (
              <p className="mt-2 text-sm text-inkMuted">
                {t("grid.requestedAt", { date: formatDate(plant.grid_requested_at, locale) })}
              </p>
            ) : null}
            {plant.grid_status === "not_requested" || plant.grid_status === "rejected" ? (
              <p className="mt-2 text-sm text-rust">{t("grid.warning")}</p>
            ) : null}
          </section>

          {plant.is_verified ? (
            <p className="inline-flex items-center gap-1.5 rounded-md bg-teal/8 px-3 py-2 text-sm text-teal-700">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              {t("plant.verifiedOwner")}
            </p>
          ) : null}

          {project !== null ? (
            <ProjectCard project={project} />
          ) : (
            <section className="rounded-md border border-dashed border-ink/15 bg-sand p-4">
              <p className="text-sm font-medium text-inkSoft">{t("plant.noProject")}</p>
              <p className="mt-1 text-sm text-inkMuted">{t("plant.noProjectHint")}</p>
            </section>
          )}
        </aside>
      </div>

      {nearby.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-lg font-semibold text-ink">{t("plant.nearby")}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/elektrana/${p.slug}/`}
                  className="flex items-center justify-between gap-3 rounded-md border border-ink/8 bg-white/60 px-3 py-2.5 text-sm transition-colors hover:border-forest/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-inkMuted">
                      {p.location_name ?? p.county}
                    </span>
                  </span>
                  {p.capacity_kwp !== null ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-inkMuted">
                      <Zap aria-hidden="true" className="h-3 w-3" />
                      {formatNumber(p.capacity_kwp, p.capacity_kwp < 100 ? 1 : 0)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

/**
 * Kartica projekta na detalju elektrane.
 *
 * ⚠️ Model financiranja i rečenica o tome da ne nudimo prinos su TRAJNO
 * VIDLJIVI, ne u fusnoti (docs/07 §2.3). Puni ekran projekta dolazi u Fazi 1c;
 * ovdje stoji samo napredak i model, bez ijednog financijskog obećanja.
 */
function ProjectCard({ project }: { readonly project: Project }) {
  const { t } = useT();
  const safe = SAFES[project.slug];
  const pct =
    project.goal_cents > 0
      ? Math.min(100, Math.round((project.raised_cents / project.goal_cents) * 100))
      : 0;

  return (
    <section className="rounded-md border border-forest/25 bg-forest/6 p-4">
      <h2 className="font-display text-base font-semibold text-ink">{project.title}</h2>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-inkSoft">
        {t("plant.raisedOf", {
          raised: formatEur(project.raised_cents),
          goal: formatEur(project.goal_cents),
        })}{" "}
        <span className="text-inkMuted">({pct} %)</span>
      </p>

      <dl className="mt-3 border-t border-forest/15 pt-3">
        <dt className="text-xs uppercase tracking-[0.1em] text-inkMuted">{t("model.label")}</dt>
        <dd className="mt-0.5 text-sm font-medium text-ink">
          {project.model === "donation" ? t("model.donation") : t("model.community")}
        </dd>
      </dl>

      <p className="mt-2 text-xs leading-relaxed text-inkMuted">
        {project.model === "donation" ? t("model.donationExplain") : t("model.communityExplain")}
      </p>
      {/* docs/07 §2.3 — trajno vidljivo, ne u fusnoti. */}
      <p className="mt-2 text-xs font-medium text-inkSoft">{t("model.noPromise")}</p>

      {/*
        ⚠️ docs/14 §4 (P4): u `integrated` modu smo i platforma i izvođač. Sukob
        interesa je strukturni i priznaje se PRVI, trajno na stranici projekta —
        ne u uvjetima korištenja.
      */}
      {project.mode === "integrated" && project.contractor !== null && safe !== undefined ? (
        <p className="mt-3 rounded-sm bg-cream/80 p-2.5 text-xs leading-relaxed text-inkSoft">
          {t("conflict.disclosure", {
            contractor: project.contractor,
            threshold: safe.threshold,
            owners: safe.owners.length,
          })}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-inkMuted">{t("demo.noChain")}</p>
    </section>
  );
}
