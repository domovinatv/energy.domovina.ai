"use client";

/**
 * `/projekt/:slug` — središnji ekran marketplacea (docs/07 §2.3).
 *
 * Struktura tabova posuđena iz `airkuna/tokenizacija` (RealT obrazac), ali
 * BEZ IJEDNOG financijskog obećanja (docs/10 §5: `TokenSlider`, `YieldChip` i
 * `KupovniModal` se odande NE preuzimaju — korektni su tamo, pravno pogrešni
 * ovdje).
 *
 * ⚠️ DVIJE STVARI STOJE IZNAD TABOVA, NE U NJIMA:
 *   1. model financiranja + „Ne nudimo prinos ni udio u dobiti." (docs/07 §2.3)
 *   2. objava sukoba interesa u Modu 1 (P4, docs/14 §4)
 * Unutar taba bi nestale pri prvom prebacivanju, a docs kaže „trajno vidljivo,
 * ne u fusnoti". Tab je fusnota s karticama.
 *
 * Aktivni tab živi u URL-u (`?tab=`), isto kao filtri registra: demo na štandu
 * se pokazuje otvaranjem točne adrese, ne klikanjem kroz pet koraka
 * (docs/07 §4).
 */
import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileText,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  formatDate,
  formatEur,
  formatKwp,
  formatNumber,
  formatPercent,
  formatProduction,
  shortAddress,
} from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock";
import {
  costTotals,
  daysToDeadline,
  exceedsGoal,
  hasLateStep,
  isOpenForContributions,
  milestoneTotals,
  progressPct,
  remainingCents,
  timelineView,
} from "@/lib/project";
import { replaceSearch, searchStore } from "@/lib/url-state";
import type {
  Contribution,
  Plant,
  Project,
  ProjectDocument,
  SafeAccount,
  TimelineStep,
} from "@/lib/types";
import { DemoBadge, GridStatusBadge, StatusBadge } from "./badges";
import { ProgressBar, ProjectStateBadge } from "./project-card";

// ─────────────────────────────────────────────────────────────────────────────
// Tabovi
// ─────────────────────────────────────────────────────────────────────────────

/** Redoslijed iz docs/07 §2.3, doslovno. Slug je hrvatski jer je i URL javan. */
const TABS = [
  { slug: "pregled", key: "overview" },
  { slug: "elektrana", key: "plant" },
  { slug: "financiranje", key: "funding" },
  { slug: "racun", key: "account" },
  { slug: "situacije", key: "milestones" },
  { slug: "knjiga", key: "ledger" },
  { slug: "dokumenti", key: "documents" },
  { slug: "tijek", key: "timeline" },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

function isTabSlug(value: string | null): value is TabSlug {
  return TABS.some((tab) => tab.slug === value);
}

export interface ProjectDetailProps {
  readonly project: Project;
  readonly plant: Plant | null;
  readonly safe: SafeAccount | undefined;
  readonly contributions: readonly Contribution[];
  readonly documents: readonly ProjectDocument[];
  readonly timeline: readonly TimelineStep[];
}

export function ProjectDetail(props: ProjectDetailProps) {
  const { project, plant, safe } = props;
  const { t, locale } = useT();

  const search = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.getSnapshot,
    searchStore.getServerSnapshot,
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const raw = params.get("tab");
  const active: TabSlug = isTabSlug(raw) ? raw : "pregled";

  const setTab = useCallback((slug: TabSlug) => {
    const next = new URLSearchParams(window.location.search);
    if (slug === "pregled") next.delete("tab");
    else next.set("tab", slug);
    replaceSearch(next);
  }, []);

  const pct = progressPct(project);
  const open = isOpenForContributions(project);
  const days = daysToDeadline(project, DEMO_NOW);

  return (
    <article className="container-content py-6 sm:py-10">
      <Link
        href="/karta/"
        className="inline-flex items-center gap-1.5 text-sm text-inkMuted transition-colors hover:text-forest"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("project.back")}
      </Link>

      <header className="mt-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <ProjectStateBadge project={project} />
          {project.demo ? <DemoBadge /> : null}
        </div>
        <h1 className="mt-3 font-display text-display-md font-semibold text-ink">
          {project.title}
        </h1>
        <p className="mt-2 text-sm text-inkMuted">
          {t("project.holder")}: <span className="text-inkSoft">{project.holder_name}</span>
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="min-w-0 lg:order-2">
          <FundingSummary
            project={project}
            pct={pct}
            open={open}
            days={days}
            contributors={props.contributions.length}
          />
        </div>

        <div className="min-w-0 lg:order-1">
          {/*
            ⚠️ TRAJNO VIDLJIVO (docs/07 §2.3). Stoji iznad tabova i vidi se bez
            obzira koji je tab otvoren.
          */}
          <LegalBoundary project={project} safe={safe} />

          <TabList active={active} onSelect={setTab} />

          <div className="mt-6">
            {active === "pregled" ? <OverviewTab {...props} /> : null}
            {active === "elektrana" ? <PlantTab plant={plant} /> : null}
            {active === "financiranje" ? <FundingTab project={project} /> : null}
            {active === "racun" ? <AccountTab project={project} safe={safe} /> : null}
            {active === "situacije" ? <MilestonesTab project={project} /> : null}
            {active === "knjiga" ? (
              <LedgerTab project={project} contributions={props.contributions} />
            ) : null}
            {active === "dokumenti" ? <DocumentsTab documents={props.documents} /> : null}
            {active === "tijek" ? <TimelineTab timeline={props.timeline} /> : null}
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-inkMuted">
        {t("demo.noChain")} {t("timeline.asOf", { date: formatDate(DEMO_NOW, locale) })}
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trajni dijelovi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Model + granica + sukob interesa.
 *
 * ⚠️ Ovo je pravni sadržaj, ne uvod. Ne premještati u tab i ne skraćivati:
 * rečenica „Ne nudimo prinos ni udio u dobiti." je doslovna i stoji u
 * `APPROVED_NEGATIONS` (lib/forbidden-words.ts) — svaka izmjena mora pasti na
 * lintu i proći kroz svjesnu odluku.
 */
function LegalBoundary({
  project,
  safe,
}: {
  readonly project: Project;
  readonly safe: SafeAccount | undefined;
}) {
  const { t } = useT();
  return (
    <section className="rounded-md border border-forest/25 bg-forest/6 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
        {t("model.label")}
      </h2>
      <p className="mt-1 font-display text-base font-semibold text-ink">
        {project.model === "donation" ? t("model.donation") : t("model.community")}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-inkSoft">
        {project.model === "donation" ? t("model.donationExplain") : t("model.communityExplain")}
      </p>
      <p className="mt-2 text-sm font-medium text-ink">{t("model.noPromise")}</p>

      <div className="mt-3 border-t border-forest/15 pt-3">
        <p className="text-sm font-medium text-ink">
          {project.mode === "integrated" ? t("project.mode.integrated") : t("project.mode.byo")}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-inkSoft">
          {project.mode === "integrated"
            ? t("project.mode.integratedExplain")
            : t("project.mode.byoExplain")}
        </p>
      </div>

      {/*
        ⚠️ P4 (docs/14 §4): sukob interesa je strukturni — istovremeno smo
        platforma i izvođač koji naplaćuje. Priznaje se PRVI, trajno na stranici
        projekta, ne u uvjetima korištenja.
      */}
      {project.mode === "integrated" && project.contractor !== null && safe !== undefined ? (
        <p className="mt-3 rounded-sm bg-cream/80 p-3 text-sm leading-relaxed text-inkSoft">
          {t("conflict.disclosure", {
            contractor: project.contractor,
            threshold: safe.threshold,
            owners: safe.owners.length,
          })}
        </p>
      ) : null}
    </section>
  );
}

/** Napredak, rok i poziv na doprinos. Na mobitelu ide iznad tabova. */
function FundingSummary({
  project,
  pct,
  open,
  days,
  contributors,
}: {
  readonly project: Project;
  readonly pct: number;
  readonly open: boolean;
  readonly days: number | null;
  readonly contributors: number;
}) {
  const { t, locale } = useT();
  return (
    <section className="rounded-md border border-ink/8 bg-white/60 p-4">
      <ProgressBar pct={pct} label={t("project.raised")} />
      <p className="mt-3 font-display text-xl font-semibold text-ink">
        {formatEur(project.raised_cents)}
      </p>
      <p className="text-sm text-inkMuted">
        {t("plant.raisedOf", {
          raised: formatEur(project.raised_cents),
          goal: formatEur(project.goal_cents),
        })}{" "}
        ({pct} %)
      </p>

      <dl className="mt-4 space-y-2 border-t border-ink/8 pt-3 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-inkMuted">{t("project.remaining")}</dt>
          <dd className="font-medium text-ink">{formatEur(remainingCents(project))}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-inkMuted">{t("project.contributors")}</dt>
          <dd className="font-medium text-ink">{formatNumber(contributors)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-inkMuted">{t("project.minContribution")}</dt>
          <dd className="font-medium text-ink">{formatEur(project.min_contribution_cents)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-inkMuted">{t("project.deadline")}</dt>
          <dd className="font-medium text-ink">
            {project.deadline === null
              ? t("project.noDeadline")
              : `${formatDate(project.deadline, locale)}${
                  days !== null && days >= 0 ? ` · ${t("project.daysLeft", { days })}` : ""
                }`}
          </dd>
        </div>
      </dl>

      {open ? (
        <Link
          href={`/projekt/${project.slug}/doprinos/`}
          className="mt-4 flex w-full items-center justify-center rounded-sm bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-700"
        >
          {t("project.contribute")}
        </Link>
      ) : (
        <div className="mt-4 rounded-sm border border-dashed border-ink/15 bg-sand p-3">
          <p className="text-sm font-medium text-inkSoft">{t("project.closed")}</p>
          <p className="mt-1 text-sm text-inkMuted">{t("project.closedHint")}</p>
        </div>
      )}
    </section>
  );
}

function TabList({
  active,
  onSelect,
}: {
  readonly active: TabSlug;
  readonly onSelect: (slug: TabSlug) => void;
}) {
  const { t } = useT();
  return (
    <div
      role="tablist"
      aria-label={t("project.tab.overview")}
      className="mt-6 flex snap-x gap-1 overflow-x-auto border-b border-ink/8 pb-px"
    >
      {TABS.map((tab) => {
        const selected = tab.slug === active;
        return (
          <button
            key={tab.slug}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tab.slug)}
            className={`shrink-0 snap-start whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
              selected
                ? "border-forest font-medium text-forest-800"
                : "border-transparent text-inkMuted hover:text-forest"
            }`}
          >
            {t(`project.tab.${tab.key}`)}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zajednički gradivni dijelovi tabova
// ─────────────────────────────────────────────────────────────────────────────

function TabHeading({ title, intro }: { readonly title: string; readonly intro?: string }) {
  return (
    <header className="mb-3">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {intro !== undefined ? (
        <p className="mt-1 text-sm leading-relaxed text-inkMuted">{intro}</p>
      ) : null}
    </header>
  );
}

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/8 py-2.5 last:border-b-0">
      <dt className="text-sm text-inkMuted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function Panel({ children }: { readonly children: React.ReactNode }) {
  return <dl className="rounded-md border border-ink/8 bg-white/60 px-4">{children}</dl>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Pregled
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({ project, plant }: ProjectDetailProps) {
  const { t } = useT();
  return (
    <section>
      <TabHeading title={t("project.tab.overview")} />
      <Panel>
        <Row label={t("project.holder")}>{project.holder_name}</Row>
        <Row label={t("owner.label")}>{t(`owner.${project.holder_type}`)}</Row>
        {project.holder_oib !== null ? (
          <Row label={t("project.holderOib")}>{project.holder_oib}</Row>
        ) : null}
        <Row label={t("project.goal")}>{formatEur(project.goal_cents)}</Row>
        <Row label={t("project.siteRightLabel")}>{t(`project.siteRight.${project.site_right}`)}</Row>
        {project.max_coowners !== null ? (
          <Row label={t("project.maxCoowners")}>{formatNumber(project.max_coowners)}</Row>
        ) : null}
        {plant !== null ? (
          <Row label={t("nav.registry")}>
            <Link
              href={`/elektrana/${plant.slug}/`}
              className="text-forest underline underline-offset-2"
            >
              {plant.name}
            </Link>
          </Row>
        ) : null}
      </Panel>

      {/* E6 — dokaz prava na lokaciju je uvjet za objavu, ne detalj. */}
      <p className="mt-3 text-xs leading-relaxed text-inkMuted">{t("project.siteRightNote")}</p>

      {/* K2 — gornja granica suvlasnika i zašto postoji (docs/13 §5.1). */}
      {project.max_coowners !== null ? (
        <p className="mt-3 rounded-md border border-ink/8 bg-sand p-3 text-sm leading-relaxed text-inkSoft">
          {t("project.maxCoownersNote")}
        </p>
      ) : null}

      {/* E5 — izjava o namjeni viška. Obavezna prije prelaska cilja. */}
      {project.surplus_intent !== null ? (
        <section className="mt-4 rounded-md border border-ink/8 bg-white/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
            {t("project.surplusTitle")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-inkSoft">{project.surplus_intent}</p>
        </section>
      ) : exceedsGoal(project) ? (
        <p className="mt-4 rounded-md bg-rust/10 p-3 text-sm text-rust">
          {t("wizard.surplusHint")}
        </p>
      ) : null}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Elektrana
// ─────────────────────────────────────────────────────────────────────────────

function PlantTab({ plant }: { readonly plant: Plant | null }) {
  const { t, locale } = useT();
  if (plant === null) {
    return (
      <section>
        <TabHeading title={t("project.tab.plant")} />
        <p className="text-sm text-inkMuted">{t("plant.notFoundHint")}</p>
      </section>
    );
  }

  return (
    <section>
      <TabHeading title={plant.name} />
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={plant.status} />
        <GridStatusBadge status={plant.grid_status} />
      </div>

      <Panel>
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
        <Row label={t("plant.location")}>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {[plant.location_name, plant.county].filter((v) => v !== null).join(" · ")}
          </span>
        </Row>
        {plant.grid_requested_at !== null ? (
          <Row label={t("grid.label")}>
            {t("grid.requestedAt", { date: formatDate(plant.grid_requested_at, locale) })}
          </Row>
        ) : null}
        {plant.tech.panels !== undefined ? (
          <Row label={t("plant.tech.panels")}>{plant.tech.panels}</Row>
        ) : null}
        {plant.tech.inverters !== undefined ? (
          <Row label={t("plant.tech.inverters")}>{plant.tech.inverters}</Row>
        ) : null}
        {plant.tech.mounting !== undefined ? (
          <Row label={t("plant.tech.mounting")}>{plant.tech.mounting}</Row>
        ) : null}
      </Panel>

      {/* ⚠️ docs/05 §7: proizvodnja je PROCJENA i to mora pisati. */}
      {plant.annual_production_kwh !== null ? (
        <p className="mt-2 text-xs leading-relaxed text-inkMuted">
          {t("plant.productionDisclaimer")}
        </p>
      ) : null}

      {plant.grid_status === "not_requested" || plant.grid_status === "rejected" ? (
        <p className="mt-3 rounded-md bg-rust/10 p-3 text-sm text-rust">{t("grid.warning")}</p>
      ) : null}

      <Link
        href={`/elektrana/${plant.slug}/`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-forest underline underline-offset-2"
      >
        {t("project.toPlant")}
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Financiranje (P5, docs/14 §3.1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Ovaj tab je cijena tvrdnje da ne uzimamo postotak od prikupljenog.
 * Marža stoji kao zasebna, označena stavka — ne utopljena u „ostalo" i ne
 * izostavljena iz zbroja (docs/14 §3.1, P8).
 */
function FundingTab({ project }: { readonly project: Project }) {
  const { t } = useT();
  const totals = costTotals(project);
  const matchesGoal = totals.total_cents === project.goal_cents;

  return (
    <section>
      <TabHeading title={t("funding.title")} intro={t("funding.intro")} />

      <div className="overflow-x-auto rounded-md border border-ink/8 bg-white/60">
        <table className="w-full min-w-[22rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-left text-xs uppercase tracking-[0.1em] text-inkMuted">
              <th scope="col" className="px-4 py-2.5 font-medium">
                {t("funding.item")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                {t("funding.amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.items.map((item) => {
              const isMargin = item.is_contractor_margin === true;
              return (
                <tr
                  key={item.label}
                  className={`border-b border-ink/8 last:border-b-0 ${
                    isMargin ? "bg-solar-soft" : ""
                  }`}
                >
                  <th scope="row" className="px-4 py-2.5 text-left font-normal text-inkSoft">
                    {item.label}
                    {isMargin ? (
                      <span className="ml-2 rounded-full bg-cream/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-solar-ink">
                        {t("funding.margin")}
                      </span>
                    ) : null}
                  </th>
                  <td className="px-4 py-2.5 text-right font-medium text-ink">
                    {formatEur(item.amount_cents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/12">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">
                {t("funding.total")}
              </th>
              <td className="px-4 py-2.5 text-right font-semibold text-ink">
                {formatEur(totals.total_cents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {matchesGoal ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-700">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
          {t("funding.matchesGoal")}
        </p>
      ) : null}

      {totals.margin_cents > 0 ? (
        <section className="mt-4 rounded-md border border-ink/8 bg-sand p-4">
          <h3 className="text-sm font-medium text-ink">
            {t("funding.margin")}: {formatEur(totals.margin_cents)}
          </h3>
          <p className="mt-0.5 text-xs text-inkMuted">
            {t("funding.marginShare", { share: formatPercent(totals.margin_share, 1) })}
          </p>
          {/* ⚠️ P8 (docs/14 §3.1): „0 %" se nikad ne piše bez ove rečenice. */}
          <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("funding.marginNote")}</p>
        </section>
      ) : (
        <section className="mt-4 rounded-md border border-ink/8 bg-sand p-4">
          <h3 className="text-sm font-medium text-ink">{t("funding.noMargin")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("funding.noMarginNote")}</p>
        </section>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Račun
// ─────────────────────────────────────────────────────────────────────────────

function AccountTab({
  project,
  safe,
}: {
  readonly project: Project;
  readonly safe: SafeAccount | undefined;
}) {
  const { t } = useT();
  if (safe === undefined) {
    return (
      <section>
        <TabHeading title={t("account.title")} />
        <p className="text-sm text-inkMuted">{t("account.explorerDemo")}</p>
      </section>
    );
  }

  return (
    <section>
      <TabHeading title={t("account.title")} />

      <Panel>
        <Row label={t("account.address")}>
          <span title={safe.address} className="font-mono text-xs">
            {shortAddress(safe.address)}
          </span>
        </Row>
        <Row label={t("account.chain")}>{safe.chain}</Row>
        <Row label={t("account.threshold")}>
          {t("account.thresholdValue", {
            threshold: safe.threshold,
            owners: safe.owners.length,
          })}
        </Row>
        <Row label={t("account.signers")}>
          {safe.platform_signer_count === 0
            ? t("account.noOurSigners")
            : t("account.ourSigners", { count: safe.platform_signer_count })}
        </Row>
      </Panel>

      {/*
        Popis potpisnika. U mocku nema pridruživanja adrese osobi, pa se „naš"
        označava po broju iz `platform_signer_count` — prvih N. Kad stigne pravi
        Safe (B7), oznaka dolazi iz podataka, ne iz redoslijeda.
      */}
      <ul className="mt-3 space-y-1.5">
        {safe.owners.map((owner, i) => {
          const ours = i < safe.platform_signer_count;
          return (
            <li
              key={owner}
              className="flex items-center justify-between gap-3 rounded-sm border border-ink/8 bg-white/60 px-3 py-2 text-xs"
            >
              <span title={owner} className="font-mono text-inkMuted">
                {shortAddress(owner)}
              </span>
              {ours ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-solar-soft px-2 py-0.5 font-medium text-solar-ink">
                  <Users aria-hidden="true" className="h-3 w-3" />
                  {project.contractor ?? t("footer.about")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* ⚠️ docs/14 §4: multisig nije ukras nego glavna zaštita od sukoba interesa. */}
      <p className="mt-3 rounded-md border border-ink/8 bg-sand p-3 text-sm leading-relaxed text-inkSoft">
        {t("account.whyThreshold")}
      </p>

      <p className="mt-3 text-xs text-inkMuted">
        {safe.deployed ? t("account.deployed") : t("account.counterfactual")}
      </p>

      {/*
        ⚠️ docs/04 §6: NE renderirati lažni „provjeri na Gnosisscanu" link koji
        vodi u prazno. To je jedina stvar u prototipu koja bi na sajmu djelovala
        kao prijevara umjesto kao maketa. Umjesto poveznice — objašnjenje.
      */}
      <p className="mt-2 rounded-md border border-dashed border-ink/15 bg-sand p-3 text-xs leading-relaxed text-inkMuted">
        {t("account.explorerDemo")}
      </p>

      {/* P3 (docs/07 §2.10): poveznica stoji VIDLJIVO, ne iza postavki. */}
      <div className="mt-4 rounded-md border border-forest/25 bg-forest/6 p-4">
        <Link
          href={`/projekt/${project.slug}/sine/`}
          className="text-sm font-medium text-forest-800 underline underline-offset-2"
        >
          {t("account.switchRails")}
        </Link>
        <p className="mt-1 text-sm text-inkSoft">{t("account.switchRailsHint")}</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Situacije (P6)
// ─────────────────────────────────────────────────────────────────────────────

function MilestonesTab({ project }: { readonly project: Project }) {
  const { t, locale } = useT();
  const totals = milestoneTotals(project.milestones);

  return (
    <section>
      <TabHeading title={t("milestones.title")} intro={t("milestones.intro")} />

      <ol className="space-y-2">
        {project.milestones.map((milestone) => {
          const released = milestone.released_at !== null;
          return (
            <li
              key={milestone.key}
              className={`rounded-md border p-3 ${
                released ? "border-forest/25 bg-forest/6" : "border-ink/8 bg-white/60"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">{milestone.label}</p>
                <p className="text-sm font-medium text-ink">
                  {formatEur(milestone.amount_cents)}
                </p>
              </div>
              <p className="mt-1 text-xs text-inkMuted">
                {released
                  ? t("milestones.releasedAt", {
                      date: formatDate(milestone.released_at, locale),
                    })
                  : t("milestones.notReleased")}
              </p>
            </li>
          );
        })}
      </ol>

      <Panel>
        <Row label={t("milestones.released")}>{formatEur(totals.released_cents)}</Row>
        <Row label={t("milestones.pending")}>{formatEur(totals.pending_cents)}</Row>
        <Row label={t("funding.total")}>{formatEur(totals.total_cents)}</Row>
      </Panel>
      <p className="mt-2 text-xs text-inkMuted">
        {t("milestones.progress", {
          done: totals.released_count,
          total: project.milestones.length,
        })}
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Knjiga doprinosa
// ─────────────────────────────────────────────────────────────────────────────

function LedgerTab({
  project,
  contributions,
}: {
  readonly project: Project;
  readonly contributions: readonly Contribution[];
}) {
  const { t, locale } = useT();

  if (contributions.length === 0) {
    return (
      <section>
        <TabHeading title={t("ledger.title")} intro={t("ledger.intro")} />
        <p className="text-sm text-inkMuted">{t("ledger.empty")}</p>
      </section>
    );
  }

  return (
    <section>
      <TabHeading title={t("ledger.title")} intro={t("ledger.intro")} />

      <ul className="space-y-2">
        {contributions.map((c) => (
          <li key={c.id} className="rounded-md border border-ink/8 bg-white/60 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-ink">
                {c.contributor_display}
                {c.contributor_verified ? (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700">
                    <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                    {t("ledger.verified")}
                  </span>
                ) : null}
              </p>
              <p className="text-sm font-semibold text-ink">{formatEur(c.amount_cents)}</p>
            </div>

            {c.message !== null ? (
              <p className="mt-1 text-sm leading-relaxed text-inkSoft">{c.message}</p>
            ) : null}

            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-inkMuted">
              <span>{formatDate(c.created_at, locale)}</span>
              <span>{t(`ledger.rail.${c.rail}`)}</span>
              {/*
                ⚠️ Udio je u PROIZVEDENOJ ENERGIJI i glasu, nikad u dobiti
                (docs/05 §5). Label to mora nositi, ne samo brojka.
              */}
              {c.share_basis_points !== null ? (
                <span className="text-inkSoft">
                  {t("ledger.share")}: {t("ledger.shareValue", { bp: c.share_basis_points })}
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-inkMuted">
        {t("ledger.count", { count: contributions.length })}
        {project.demo ? ` · ${t("ledger.txDemo")}` : ""}
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Dokumenti
// ─────────────────────────────────────────────────────────────────────────────

function DocumentsTab({ documents }: { readonly documents: readonly ProjectDocument[] }) {
  const { t, locale } = useT();

  if (documents.length === 0) {
    return (
      <section>
        <TabHeading title={t("documents.title")} intro={t("documents.intro")} />
        <p className="text-sm text-inkMuted">{t("documents.empty")}</p>
      </section>
    );
  }

  return (
    <section>
      <TabHeading title={t("documents.title")} intro={t("documents.intro")} />

      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.key}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-ink/8 bg-white/60 p-3"
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.1em] text-inkMuted">
                {t(`documents.kind.${doc.kind}`)}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">{doc.label}</p>
              <p className="mt-0.5 text-xs text-inkMuted">
                {doc.issued_at === null
                  ? t("documents.noDate")
                  : t("documents.issuedAt", { date: formatDate(doc.issued_at, locale) })}
              </p>
            </div>
            {/*
              ⚠️ `url === null` ⇒ dokument NIJE priložen, i to piše tim riječima.
              Poveznica na nepostojeći PDF je ista klasa greške kao lažni
              „provjeri na Gnosisscanu" link (docs/04 §6).
            */}
            {doc.url === null ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink/6 px-2.5 py-1 text-[11px] text-inkMuted">
                <FileText aria-hidden="true" className="h-3 w-3" />
                {t("documents.missing")}
              </span>
            ) : (
              <a
                href={doc.url}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-medium text-forest-800 underline underline-offset-2"
              >
                <FileText aria-hidden="true" className="h-3 w-3" />
                {t("documents.attached")}
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-inkMuted">{t("documents.missingHint")}</p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Tijek (K1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Kašnjenje se VIDI (docs/13 §K1, docs/14 §5.2). Kad smo mi izvođač,
 * kašnjenje je naše neispunjenje ugovora, a dokumentirani rokovi i njihove
 * izmjene su ono što se gleda u sporu. Zato korak nosi i plan i ostvarenje —
 * da se razlika ne može sakriti prepisivanjem plana.
 */
function TimelineTab({ timeline }: { readonly timeline: readonly TimelineStep[] }) {
  const { t, locale } = useT();
  const steps = timelineView(timeline, DEMO_NOW);
  const late = hasLateStep(timeline, DEMO_NOW);

  return (
    <section>
      <TabHeading title={t("timeline.title")} intro={t("timeline.intro")} />

      {late ? (
        <p className="mb-3 flex items-start gap-2 rounded-md bg-rust/10 p-3 text-sm leading-relaxed text-rust">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {t("timeline.lateBanner")}
        </p>
      ) : null}

      <ol className="space-y-2">
        {steps.map(({ step, state, drift_days }) => {
          const tone =
            state === "done"
              ? "border-forest/25 bg-forest/6"
              : state === "late"
                ? "border-rust/30 bg-rust/6"
                : "border-ink/8 bg-white/60";
          return (
            <li key={step.key} className={`rounded-md border p-3 ${tone}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">{t(`timeline.step.${step.key}`)}</p>
                <p
                  className={`text-xs font-medium ${
                    state === "late" ? "text-rust" : "text-inkMuted"
                  }`}
                >
                  {state === "done"
                    ? t("timeline.actual", { date: formatDate(step.actual, locale) })
                    : state === "late"
                      ? t("timeline.lateBy", { days: drift_days ?? 0 })
                      : state === "unscheduled"
                        ? t("timeline.unscheduled")
                        : t("timeline.pending")}
                </p>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-inkMuted">
                {step.planned !== null ? (
                  <span>{t("timeline.planned", { date: formatDate(step.planned, locale) })}</span>
                ) : null}
                {state === "done" && drift_days !== null ? (
                  <span className={drift_days > 0 ? "text-rust" : "text-teal-700"}>
                    {drift_days > 0
                      ? t("timeline.driftLate", { days: drift_days })
                      : drift_days < 0
                        ? t("timeline.driftEarly", { days: -drift_days })
                        : t("timeline.onTime")}
                  </span>
                ) : null}
              </p>

              {step.note !== null ? (
                <p className="mt-1.5 text-sm leading-relaxed text-inkSoft">{step.note}</p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-inkMuted">
        {t("timeline.asOf", { date: formatDate(DEMO_NOW, locale) })}
      </p>
    </section>
  );
}
