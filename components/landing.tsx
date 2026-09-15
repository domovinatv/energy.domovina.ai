"use client";

/**
 * Landing — jedanaest sekcija + podnožje iz `app/layout.tsx` (docs/06 §1).
 *
 * Cilj: posjetitelj s GEF-a u 90 sekundi razumije što je ovo, zašto je zakonito
 * i zašto nema provizije — pa ostavi kontakt ili ode na kartu (docs/06).
 *
 * ⚠️ NIJEDNA BROJKA NIJE OVDJE (docs/06 §4.4). Tržišne dolaze iz `lib/facts.ts`
 * (koji citira docs/02 i docs/13, s izvorom i datumom), stope iz `lib/fees.ts`.
 * Brojka bez izvora je neprovjerena i ne ide u UI.
 *
 * ⚠️ Riječ „crowdfunding" se NE koristi u heroju ni u navigaciji (docs/01 §1.1).
 * Nosiva priča su energetske zajednice. Niže smije stajati „zajedničko
 * financiranje" kao pojašnjenje mehanike, nikad kao obećanje modela.
 *
 * ⚠️ „0 %" se nikad ne piše samo (docs/14 §3.1) — napomena da smo izvođač je
 * dio `components/fee-calculator.tsx`, pa se ne može izgubiti premještanjem
 * sekcije.
 */
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleCheck,
  FileText,
  KeyRound,
  Scale,
  Users,
  Wrench,
} from "lucide-react";
import {
  COMMUNITY_REGISTRATION_COST_EUR,
  COMMUNITY_REGISTRATION_MONTHS,
  ENERGY_COMMUNITIES_REGISTERED,
  FIRST_SHARING_COMMUNITY,
  INSTALLED_CAPACITY_MW,
  PLANTS_ON_GRID,
  RENEWABLE_ENERGY_COMMUNITIES_REGISTERED,
  RIPPLE_ENERGY,
  SUN_EXCHANGE_CELL_OWNERS,
  ZEZ_SUNCE,
} from "@/lib/facts";
import { formatEur, formatNumber } from "@/lib/format";
import { useT, type MessageKey } from "@/lib/i18n";
import { FeeCalculator } from "./fee-calculator";
import { LandingMap } from "./landing-map";
import { MoneyFlow } from "./money-flow";
import { WaitingList } from "./waiting-list";

/**
 * Omot sekcije — broj, naslov, uvod.
 *
 * Svaka sekcija ima `id`, pa je svaka deep-linkabilna sa štanda (docs/06 §6).
 * Deep-linkovi su tako posljedica strukture, ne dodatan posao — isti izbor kao
 * filtri u URL-u (dnevnik §6.1).
 */
function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "cream",
}: {
  readonly id: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly lead?: string;
  readonly children?: React.ReactNode;
  readonly tone?: "cream" | "sand";
}) {
  return (
    <section
      id={id}
      // `scroll-mt` drži naslov ispod ljepljivog zaglavlja kad se dođe s
      // deep-linka; bez toga prvi redak završi pod trakom.
      className={`scroll-mt-24 py-14 sm:py-20 ${tone === "sand" ? "bg-sand" : ""}`}
    >
      <div className="container-content">
        {eyebrow === undefined ? null : <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-3 max-w-3xl font-display text-display-md font-semibold text-ink">
          {title}
        </h2>
        {lead === undefined ? null : (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-inkSoft">{lead}</p>
        )}
        {children}
      </div>
    </section>
  );
}

/** Brojka + objašnjenje. Brojka uvijek dolazi iz `lib/facts.ts`. */
function Figure({
  value,
  label,
  note,
}: {
  readonly value: string;
  readonly label: string;
  readonly note?: string;
}) {
  return (
    <div className="rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft">
      <p className="font-display text-display-md font-semibold leading-none text-forest-800">
        {value}
      </p>
      <p className="mt-3 text-sm font-medium text-ink">{label}</p>
      {note === undefined ? null : (
        <p className="mt-1.5 text-sm leading-relaxed text-inkMuted">{note}</p>
      )}
    </div>
  );
}

export function Landing() {
  const { t } = useT();

  // ── 8 · Za koga: četiri segmenta, svaki sa svojim CTA-om (docs/01 §3) ────
  const audiences: ReadonlyArray<{
    readonly key: string;
    readonly icon: React.ReactNode;
    readonly title: MessageKey;
    readonly pain: MessageKey;
    readonly offer: MessageKey;
    readonly cta: MessageKey;
    readonly href: string;
  }> = [
    {
      key: "community",
      icon: <Users aria-hidden="true" className="h-5 w-5 text-forest" />,
      title: "audience.community.title",
      pain: "audience.community.pain",
      offer: "audience.community.offer",
      cta: "audience.community.cta",
      href: "/zajednice/",
    },
    {
      key: "holder",
      icon: <Building2 aria-hidden="true" className="h-5 w-5 text-forest" />,
      title: "audience.holder.title",
      pain: "audience.holder.pain",
      offer: "audience.holder.offer",
      cta: "audience.holder.cta",
      href: "/novi-projekt/",
    },
    {
      key: "contributor",
      icon: <CircleCheck aria-hidden="true" className="h-5 w-5 text-forest" />,
      title: "audience.contributor.title",
      pain: "audience.contributor.pain",
      offer: "audience.contributor.offer",
      cta: "audience.contributor.cta",
      href: "/karta/?suradnja=1",
    },
    {
      key: "owner",
      icon: <Wrench aria-hidden="true" className="h-5 w-5 text-forest" />,
      title: "audience.owner.title",
      pain: "audience.owner.pain",
      offer: "audience.owner.offer",
      cta: "audience.owner.cta",
      href: "/karta/",
    },
  ];

  return (
    <>
      {/* ── 1 · Hero (docs/01 §1.1) ─────────────────────────────────────── */}
      <section className="scroll-mt-24 py-16 sm:py-24" id="pocetak">
        <div className="container-content">
          <p className="eyebrow">{t("landing.hero.eyebrow")}</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-lg font-semibold text-ink">
            {t("landing.hero.title", {
              communities: formatNumber(ENERGY_COMMUNITIES_REGISTERED.value),
            })}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-inkSoft">
            {t("landing.hero.lede")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/karta/"
              className="inline-flex items-center gap-1.5 rounded-sm bg-forest px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-700"
            >
              {t("landing.hero.ctaMap")}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/novi-projekt/"
              className="inline-flex items-center gap-1.5 rounded-sm border border-ink/12 bg-white px-5 py-2.5 text-sm font-medium text-inkSoft transition-colors hover:border-forest hover:text-forest"
            >
              {t("landing.hero.ctaProject")}
            </Link>
          </div>

          {/*
            ⚠️ Odricanje stoji U HEROJU, ne na dnu (docs/06 §3). Publika na
            GEF-u ima ljude koji znaju za ECSPR; ako to ne kažemo mi, kažu oni.
          */}
          <p className="mt-8 max-w-2xl rounded-md border border-ink/8 bg-white/70 p-4 text-sm leading-relaxed text-inkSoft">
            {t("model.noPromise")} {t("landing.hero.disclaimer")}
          </p>
        </div>
      </section>

      {/* ── 2 · Problem (docs/02 §3) ────────────────────────────────────── */}
      <Section
        id="problem"
        tone="sand"
        eyebrow={t("landing.problem.eyebrow")}
        title={t("landing.problem.title")}
        lead={t("landing.problem.lead")}
      >
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            value={formatNumber(PLANTS_ON_GRID.value)}
            label={t("landing.problem.plantsLabel")}
            note={t("landing.problem.plantsNote", {
              mw: formatNumber(INSTALLED_CAPACITY_MW.value),
            })}
          />
          <Figure
            value={formatNumber(ENERGY_COMMUNITIES_REGISTERED.value)}
            label={t("landing.problem.communitiesLabel")}
            note={t("landing.problem.communitiesNote", {
              zoe: formatNumber(RENEWABLE_ENERGY_COMMUNITIES_REGISTERED.value),
            })}
          />
          <Figure
            value={formatEur(COMMUNITY_REGISTRATION_COST_EUR.value * 100)}
            label={t("landing.problem.costLabel")}
            note={t("landing.problem.costNote")}
          />
          <Figure
            value={t("landing.problem.monthsValue", {
              months: formatNumber(COMMUNITY_REGISTRATION_MONTHS.value),
            })}
            label={t("landing.problem.monthsLabel")}
            note={t("landing.problem.monthsNote", {
              place: FIRST_SHARING_COMMUNITY.value.place,
            })}
          />
        </div>

        {/*
          ⚠️ ZEZ Sunce je PARTNER, ne konkurent (docs/13 §2.2). Potražnja je
          dokazana, alat nije — i to je cijeli naš prostor. Tvrdnja je
          provjerljiva i citira se poimence, kao i Ripple niže.
        */}
        <p className="mt-6 max-w-3xl rounded-md border border-ink/8 bg-white/70 p-4 text-sm leading-relaxed text-inkSoft">
          {t("landing.problem.demandProof", {
            amount: formatEur(ZEZ_SUNCE.value.raisedEur * 100),
            days: formatNumber(ZEZ_SUNCE.value.days),
            members: formatNumber(ZEZ_SUNCE.value.members),
          })}
        </p>
      </Section>

      {/* ── 3 · Karta ───────────────────────────────────────────────────── */}
      <Section
        id="karta"
        eyebrow={t("landing.map.eyebrow")}
        title={t("landing.map.title")}
        lead={t("landing.map.lead")}
      >
        <LandingMap />
      </Section>

      {/* ── 4 · Kako radi (docs/06 §2) ──────────────────────────────────── */}
      <Section
        id="kako-radi"
        tone="sand"
        eyebrow={t("landing.flow.eyebrow")}
        title={t("landing.flow.title")}
        lead={t("landing.flow.lead")}
      >
        <MoneyFlow />
      </Section>

      {/* ── 5 · Zašto 0 % (docs/04 §4, docs/14 §3.1) ────────────────────── */}
      <Section
        id="zasto-nula"
        eyebrow={t("landing.fees.eyebrow")}
        title={t("landing.fees.title")}
        lead={t("landing.fees.lead")}
      >
        <FeeCalculator />
      </Section>

      {/* ── 6 · Modeli (docs/03 §2, §3) ─────────────────────────────────── */}
      <Section
        id="modeli"
        tone="sand"
        eyebrow={t("landing.models.eyebrow")}
        title={t("landing.models.title")}
        lead={t("landing.models.lead")}
      >
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-forest/25 bg-white/70 p-5 shadow-soft">
            <p className="eyebrow">{t("model.donation")}</p>
            <h3 className="mt-3 font-display text-lg font-semibold text-ink">
              {t("landing.models.donationTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("model.donationExplain")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-inkMuted">
              {t("landing.models.donationWho")}
            </p>
          </div>

          <div className="rounded-lg border border-teal/30 bg-white/70 p-5 shadow-soft">
            <p className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-teal">
              {t("model.community")}
            </p>
            <h3 className="mt-3 font-display text-lg font-semibold text-ink">
              {t("landing.models.communityTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("model.communityExplain")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-inkMuted">
              {t("landing.models.communityWho")}
            </p>
          </div>
        </div>

        {/*
          ⚠️ Ovo je jedina sekcija koja eksplicitno kaže ŠTO NE RADIMO
          (docs/06 §3). Protuintuitivno, ali „ne obećavamo prinos" je razlog
          povjerenja, a ne isprika — i razlikuje nas od svake platforme koja isto
          obećava bez licence. Ista dva modela stoje onemogućena i u čarobnjaku
          (E2), pa je ovo prikaz pravila, ne marketing.
        */}
        <div className="mt-6 rounded-lg border border-ink/12 bg-white/70 p-5">
          <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Scale aria-hidden="true" className="h-5 w-5 text-inkMuted" />
            {t("wizard.modelDisabledTitle")}
          </h3>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                {t("wizard.modelC")}
                <span className="rounded-full bg-sandDeep px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-inkMuted">
                  {t("wizard.disabled")}
                </span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-inkSoft">
                {t("wizard.modelCWhy")}
              </dd>
            </div>
            <div>
              <dt className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                {t("wizard.modelD")}
                <span className="rounded-full bg-sandDeep px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-inkMuted">
                  {t("wizard.disabled")}
                </span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-inkSoft">
                {t("wizard.modelDWhy")}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-inkSoft">
            {t("landing.models.boundary")}
          </p>
        </div>
      </Section>

      {/* ── 7 · Provjereno (docs/04 §5, docs/13 §4.1) ───────────────────── */}
      <Section
        id="provjereno"
        eyebrow={t("landing.proof.eyebrow")}
        title={t("landing.proof.title")}
        lead={t("landing.proof.lead")}
      >
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["proof.eid", <KeyRound key="i" aria-hidden="true" className="h-5 w-5" />],
              ["proof.safe", <Users key="i" aria-hidden="true" className="h-5 w-5" />],
              ["proof.ledger", <FileText key="i" aria-hidden="true" className="h-5 w-5" />],
              ["proof.exit", <ArrowRight key="i" aria-hidden="true" className="h-5 w-5" />],
            ] as ReadonlyArray<readonly [string, React.ReactNode]>
          ).map(([key, icon]) => (
            <div
              key={key}
              className="rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft"
            >
              <span className="inline-flex text-forest">{icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-ink">
                {t(`landing.${key}.title` as MessageKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-inkSoft">
                {t(`landing.${key}.body` as MessageKey)}
              </p>
            </div>
          ))}
        </div>

        {/*
          ⚠️ CLAUDE.md pravilo 3: prototip se deklarira kao prototip. Ova je
          sekcija najizloženija, jer nabraja ono što se „može provjeriti" — a u
          zatvorenoj beti eID i račun projekta još su simulirani. Napomena stoji
          uz tvrdnje, ne na dnu stranice.
        */}
        <p className="mt-6 max-w-3xl rounded-md border border-sandDeep bg-sand p-4 text-sm leading-relaxed text-inkSoft">
          {t("landing.proof.prototypeNote")}
        </p>

        {/*
          ⚠️ Ripple Energy se citira POIMENCE (K5, docs/13 §4.1): platforma je
          otišla u stečajnu upravu, a njezine zadruge rade dalje — imovina nikad
          nije bila Rippleova. To je dokaz teze na stvarnom slučaju, a ne naša
          tvrdnja o sebi. Uz njega ide i Sun Exchange, jer objašnjava zašto naš
          trošak po članu mora biti blizu nule (docs/13 §5.1).
        */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-ink/12 bg-white/70 p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              {t("landing.proof.rippleTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("landing.proof.rippleBody", {
                members: formatNumber(RIPPLE_ENERGY.value.kirkHillMembers),
              })}
            </p>
          </div>
          <div className="rounded-lg border border-ink/12 bg-white/70 p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              {t("landing.proof.sunexTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("landing.proof.sunexBody", {
                owners: formatNumber(SUN_EXCHANGE_CELL_OWNERS.value),
              })}
            </p>
          </div>
        </div>
      </Section>

      {/* ── 8 · Za koga (docs/01 §3) ────────────────────────────────────── */}
      <Section
        id="za-koga"
        tone="sand"
        eyebrow={t("landing.audience.eyebrow")}
        title={t("landing.audience.title")}
        lead={t("landing.audience.lead")}
      >
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience.key}
              className="flex flex-col rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft"
            >
              <span className="inline-flex">{audience.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                {t(audience.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-inkMuted">
                {t(audience.pain)}
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-inkSoft">
                {t(audience.offer)}
              </p>
              <Link
                href={audience.href}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-forest underline underline-offset-4 hover:text-forest-700"
              >
                {t(audience.cta)}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 9 · Otvoreni kod (docs/04 §4.1, docs/14 §3) ─────────────────── */}
      <Section
        id="otvoreni-kod"
        eyebrow={t("landing.open.eyebrow")}
        title={t("landing.open.title")}
        lead={t("landing.open.lead")}
      >
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-ink">
              {t("landing.open.codeTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("landing.open.codeBody")}
            </p>
            {/*
              ⚠️ NEMA POVEZNICE NA REPO, i to je namjerno: repo još nije javan.
              Poveznica u prazno je ista klasa greške kao lažni „provjeri na
              pregledniku blokova" link (docs/04 §6, CLAUDE.md pravilo 3).
            */}
            <p className="mt-2 text-sm leading-relaxed text-inkMuted">
              {t("landing.open.codePending")}
            </p>
          </div>
          <div className="rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-ink">
              {t("landing.open.labelTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-inkSoft">
              {t("landing.open.labelBody")}
            </p>
          </div>
        </div>
      </Section>

      {/* ── 10 · Roadmap (docs/11) ──────────────────────────────────────── */}
      <Section
        id="plan"
        tone="sand"
        eyebrow={t("landing.roadmap.eyebrow")}
        title={t("landing.roadmap.title")}
        lead={t("landing.roadmap.lead")}
      >
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {(["done", "now", "next"] as const).map((phase) => (
            <div
              key={phase}
              className={`rounded-lg border p-5 ${
                phase === "now"
                  ? "border-forest/30 bg-forest/6"
                  : "border-ink/8 bg-white/70"
              }`}
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-inkMuted">
                {t(`landing.roadmap.${phase}` as MessageKey)}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-inkSoft">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden="true" className="text-inkMuted">
                      ·
                    </span>
                    {t(`landing.roadmap.${phase}${n}` as MessageKey)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* ⚠️ docs/00 §6: roadmap ne nosi datume koji su prošli. Zato faze, a
            ne kvartali — kvartal koji prođe tiho laže. */}
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-inkMuted">
          {t("landing.roadmap.note")}
        </p>
      </Section>

      {/* ── 11 · Pilot / kontakt (K4, docs/13 §7) ───────────────────────── */}
      <Section
        id="kontakt"
        eyebrow={t("landing.contact.eyebrow")}
        title={t("landing.contact.title")}
        lead={t("landing.contact.lead")}
      >
        <div className="mt-8 max-w-2xl">
          {/* ⚠️ Trajna lista čekanja (K4): stoji i kad projekt JEST otvoren. */}
          <WaitingList />
        </div>
      </Section>
    </>
  );
}
