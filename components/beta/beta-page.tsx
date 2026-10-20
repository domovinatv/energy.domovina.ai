"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { formatDateShort, formatEur, formatEurPrecise, formatNumber, formatPercent } from "@/lib/format";
import {
  BETA_PROJECTS,
  DEFAULT_AMOUNT_EUR,
  MAX_AMOUNT_EUR,
  PRESET_AMOUNTS_EUR,
  parseAmountEur,
  hasVerifiedSafe,
  isPayable,
  PHOTO_WIDTHS,
  type Address,
  type BetaPhotos,
  type BetaProject,
} from "@/lib/beta-projects";
import { fetchSafeActivity, type SafeActivity } from "@/lib/beta-chain";
import { createPaymentIntent, type IntentResult, type PaymentIntent } from "@/lib/mpt-intent";
import type { ReceiptKey } from "@/lib/receipt-keys";
import { browserStorage, rememberReceipt } from "@/lib/receipt-index";
import { MyReceipts } from "@/components/beta/my-receipts";
import { IntentPanel } from "@/components/beta/intent-panel";
import { HepMeter, hepYearKwh } from "@/components/beta/hep-meter";
import { BETA_HEP } from "@/lib/beta-hep";
import { justArrivedRemainingMs, unconfirmedCents, type PendingPayment } from "@/lib/pending-payments";
import { removePending, savePending, usePending } from "@/lib/pending-store";
import { fetchIntent, fetchIntentStatus } from "@/lib/mpt-intent";
import { withViewTransition } from "@/lib/view-transition";
import { RAIL_ITALK, explorerAddressUrl, explorerTxUrl, isRailConfigured, type RailProfile } from "@/lib/rail-profile";

const RECENT_COUNT = 5;
/** Koliko često se lanac ponovno čita dok je kartica vidljiva. */
const REFRESH_MS = 20_000;
/** Koliko često se provjerava zaprimljena uplata koja još nije na lancu. */
const PENDING_CHECK_MS = 15_000;
/** Ponovna čitanja lanca nakon forwarda, dok ga gnosisscan ne indeksira. */
const SETTLE_RETRY_MS = [3_000, 8_000];

/** `/beta/` — popis elektrana. Sve o jednoj elektrani je na `/beta/<slug>/`. */
export function BetaPage() {
  const { t } = useT();
  const router = useRouter();
  // Stari linkovi `/beta/#lukavec` (prije zasebnih ruta) vode na stranicu elektrane.
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    if (BETA_PROJECTS.some((p) => p.slug === slug)) router.replace(`/beta/${slug}/`);
  }, [router]);
  return (
    <div className="container-wide py-10 sm:py-14">
      <h1 className="font-display text-display-md font-semibold text-ink">{t("beta.title")}</h1>
      <p className="mt-4 max-w-3xl text-inkSoft">{t("beta.intro")}</p>
      <p className="mt-3 max-w-3xl text-sm text-inkMuted">{t("beta.who")}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BETA_PROJECTS.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-3xl text-sm text-inkMuted">
        {t("beta.notInvestment", { brand: BRAND.name })}
      </p>
      <p className="mt-3 text-sm">
        <Link href="/" className="text-forest underline underline-offset-2">
          {t("beta.prototypeLink")}
        </Link>
      </p>
    </div>
  );
}

/** `/beta/<slug>/` — jedna elektrana: slike, uplata, uplate s lanca, HEP ODS. */
export function BetaProjectPage({ slug }: { slug: string }) {
  const { t } = useT();
  const project = BETA_PROJECTS.find((p) => p.slug === slug);
  if (project === undefined) return null;
  return (
    <div className="container-wide py-8 sm:py-12 xl:py-3">
      <Link href="/beta/" className="text-sm text-forest underline underline-offset-2">
        {t("beta.backToList")}
      </Link>
      <div className="mt-4 xl:mt-3">
        <ProjectSection project={project} />
      </div>
      {/* Na desktopu ista napomena stoji u prvom stupcu, unutar ekrana (ProjectSection). */}
      <p className="mt-10 max-w-3xl text-sm text-inkMuted xl:hidden">
        {t("beta.notInvestment", { brand: BRAND.name })}
      </p>
    </div>
  );
}

/** Kartica na popisu: prva slika, osnovni podaci i koliko je prikupljeno. */
function ProjectCard({ project }: { project: BetaProject }) {
  const { t } = useT();
  const photo = project.photos?.render ?? project.photos?.before ?? null;
  const isRender = photo !== null && photo === project.photos?.render;
  return (
    <Link
      href={`/beta/${project.slug}/`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-ink/8 bg-white/60 transition-shadow hover:shadow-soft"
    >
      <div className="relative aspect-video bg-sandDeep">
        {photo !== null && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${photo}-800.webp`}
            alt={t(isRender ? "beta.photoAlt.render" : "beta.photoAlt.before", { place: project.place })}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        {isRender && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-medium text-cream">
            {t("beta.photoRenderBadge")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="font-display text-xl font-semibold text-ink group-hover:text-forest">{project.place}</h2>
        <p className="mt-1 text-sm text-inkSoft">{project.address}</p>
        <p className="mt-3 text-sm text-ink">
          {project.powerKw} kW
          {project.goalCents !== null && (
            <span className="text-inkMuted"> · {t("beta.goal")} {formatEur(project.goalCents)}</span>
          )}
        </p>
        {hasVerifiedSafe(project) && project.goalCents !== null && project.goalCents > 0 && (
          <CardProgress safe={project.safe} goalCents={project.goalCents} />
        )}
        <span className="mt-auto pt-4 text-sm font-medium text-forest">{t("beta.openProject")}</span>
      </div>
    </Link>
  );
}

/** Prikupljeno na kartici — jedno čitanje lanca, bez osvježavanja (to radi stranica elektrane). */
export function CardProgress({
  safe,
  goalCents,
  rail = RAIL_ITALK,
}: {
  safe: Address;
  goalCents: number;
  rail?: RailProfile;
}) {
  const { t } = useT();
  const pending = usePending(safe);
  const [data, setData] = useState<SafeActivity | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchSafeActivity(safe, controller.signal, rail).then(setData, () => undefined);
    return () => controller.abort();
  }, [safe, rail]);
  if (data === null) return <div className="mt-3 h-2 rounded-full bg-sandDeep" />;
  const received = data.receivedCents + unconfirmedCents(pending, data.transfers.map((tr) => tr.hash));
  const fraction = received / goalCents;
  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-sandDeep">
        <div
          className="h-full rounded-full bg-forest"
          style={{ width: received > 0 ? `max(0.375rem, ${Math.min(100, fraction * 100)}%)` : "0%" }}
        />
      </div>
      <p className="mt-1.5 text-xs text-inkSoft">
        {t("beta.progress", {
          received: formatEurPrecise(received),
          goal: formatEur(goalCents),
          percent: formatPercent(fraction, fraction > 0 && fraction < 0.01 ? 1 : 0),
        })}
      </p>
    </div>
  );
}

function ProjectSection({ project }: { project: BetaProject }) {
  const { t } = useT();
  // Uplate koje je Monerium ZAPRIMIO (SEPA), a lanac ih još ne pokazuje — pribrajaju
  // se odmah i preživljavaju osvježavanje stranice (lib/pending-store).
  const pending = usePending(project.safe ?? "");
  // Povećanje odmah ponovno pročita lanac (kad rail javi forward).
  const [refreshKey, setRefreshKey] = useState(0);
  // Otvoren QR (2xl): uplata dobije dva stupca (QR | podaci) i mjesto HEP stupca; HEP ide ispod.
  const [paying, setPaying] = useState(false);
  const onPayment = (p: PendingPayment) => {
    if (project.safe === null) return;
    savePending(project.safe, p);
    if (p.txHash !== null) setRefreshKey((k) => k + 1);
  };
  const hep = BETA_HEP[project.slug];
  const yearKwh = hep === undefined ? null : hepYearKwh(hep);
  // Desktop bez skrolanja: na xl tri stupca (elektrana | uplate | uplata). Prvi stupac
  // je širok koliko slika 16:9 koja stane u visinu prozora (PhotoViewer). Dok je QR
  // otvoren, na 2xl uplata dobije širi stupac i postane dvostupčana. Mobilni i tablet
  // poredak je nepromijenjen: omotač uplata/plaćanja na xl postaje `contents`, pa su
  // njegova djeca stavke mreže.
  return (
    <section
      className={`rounded-md border border-ink/8 bg-white/60 p-4 sm:p-7 xl:grid xl:grid-cols-[min(calc(max(15rem,100vh_-_36rem)*16/9),calc(100%_-_400px_-_18rem_-_5rem))_minmax(0,1fr)_400px] xl:gap-x-8 2xl:gap-x-10 ${
        paying ? "2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(680px,1.6fr)]" : ""
      }`}
    >
      <div className="[view-transition-name:beta-plant] xl:col-start-1 xl:row-start-1">
        <h1 className="font-display text-display-md font-semibold text-ink">{project.place}</h1>
        <p className="mt-1 text-sm text-inkSoft">{project.address}</p>

        <dl className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-3 text-sm sm:justify-start sm:gap-x-12">
          <Fact label={t("beta.power")} value={`${project.powerKw} kW`} />
          <Fact label={t("beta.goal")} value={project.goalCents === null ? "—" : formatEur(project.goalCents)} />
          {yearKwh !== null && <Fact label={t("beta.yearUse")} value={`${formatNumber(yearKwh)} kWh`} />}
        </dl>
        {project.goalCents === null && <p className="mt-2 text-xs text-inkMuted">{t("beta.goalPending")}</p>}
        {isPayable(project) && (
          <a
            href="#uplata"
            className="mt-5 block rounded-sm bg-forest px-4 py-2.5 text-center text-sm font-medium text-cream hover:bg-forest-700 xl:hidden"
          >
            {t("beta.payJump")}
          </a>
        )}

        {project.photos !== null && <PhotoViewer photos={project.photos} place={project.place} />}
        {hep !== undefined && <HepMeter hep={hep} />}
        <p className="mt-6 hidden text-xs text-inkMuted xl:block">
          {t("beta.notInvestment", { brand: BRAND.name })}
        </p>
      </div>

      {hasVerifiedSafe(project) ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2 xl:contents">
          <PendingWatcher safe={project.safe} pending={pending} onSettled={() => setRefreshKey((k) => k + 1)} />
          <div className="[view-transition-name:beta-activity] xl:col-start-2 xl:row-start-1">
            <LiveActivity
              safe={project.safe}
              goalCents={project.goalCents}
              pending={pending}
              refreshKey={refreshKey}
            />
            <p className="mt-4 text-xs text-inkMuted">
              {t("beta.signers", {
                threshold: project.signers.threshold,
                count: project.signers.owners.length,
              })}
            </p>
          </div>
          {isPayable(project) ? (
            <div
              id="uplata"
              className="scroll-mt-4 [view-transition-name:beta-pay] xl:col-start-3 xl:row-start-1 xl:self-start"
            >
              <PayWithIntent safe={project.safe} onPayment={onPayment} onOpenChange={setPaying} />
            </div>
          ) : (
            <div className="rounded-sm bg-sandDeep px-4 py-3 text-sm text-inkSoft xl:col-start-3 xl:row-start-1 xl:self-start">
              <p>{t("beta.payPending")}</p>
              <p className="mt-2 text-xs text-inkMuted">{t("beta.safe")}</p>
              <p className="break-all font-mono text-xs text-ink">{project.safe}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 rounded-sm bg-sandDeep px-4 py-3 text-sm text-inkSoft xl:col-span-2 xl:col-start-2 xl:row-start-1 xl:mt-0 xl:self-start">
          {t("beta.pending")}
        </p>
      )}
    </section>
  );
}

type PhotoSlot = {
  readonly key: "before" | "render" | "after";
  readonly base: string | null;
  readonly caption: string;
  readonly pending: string;
};

/**
 * Prije · vizualizacija · poslije: jedna velika slika i tri sličice, na svim
 * širinama (na mobitelu tri slike jedna ispod druge guraju uplatu daleko dolje).
 * Oznaka „AI vizualizacija" stoji NA slici i na sličici, ne u potpisu — potpis se
 * na mobitelu lako preskoči, a render pokraj prave snimke bez oznake bio bi
 * obmana (CLAUDE.md, pravilo 3).
 */
function PhotoViewer({ photos, place }: { photos: BetaPhotos; place: string }) {
  const { t } = useT();
  const slots: readonly PhotoSlot[] = [
    { key: "before", base: photos.before, caption: t("beta.photoBefore"), pending: t("beta.photoBeforePending") },
    { key: "render", base: photos.render, caption: t("beta.photoRender"), pending: t("beta.photoRenderPending") },
    { key: "after", base: photos.after, caption: t("beta.photoAfter"), pending: t("beta.photoAfterPending") },
  ];
  const [selected, setSelected] = useState(() => Math.max(0, slots.findIndex((s) => s.base !== null)));
  const slot = slots[selected]!;
  return (
    <figure className="mt-5">
      {/* Visina prati visinu prozora (inače bi stupac gurnuo stranicu u skrolanje), ali se ograničava
          ŠIRINA (visina × 16/9), ne visina: s max-h bi široki stupac (QR zatvoren) odrezao vrh i dno. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-sandDeep xl:max-w-[calc(max(15rem,100vh_-_36rem)*16/9)]">
        {slot.base === null ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-sm text-inkMuted">{slot.pending}</p>
        ) : (
          <a href={`${slot.base}-1600.webp`} target="_blank" rel="noreferrer" className="block h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={slot.base}
              src={`${slot.base}-800.webp`}
              srcSet={PHOTO_WIDTHS.map((w) => `${slot.base}-${w}.webp ${w}w`).join(", ")}
              sizes="(min-width: 1280px) 40vw, 100vw"
              alt={t(`beta.photoAlt.${slot.key}`, { place })}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </a>
        )}
        {slot.key === "render" && slot.base !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-medium text-cream">
            {t("beta.photoRenderBadge")}
          </span>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-inkSoft">
        <span className="text-inkMuted">{selected + 1}. </span>
        {slot.caption}
        {slot.key === "render" && slot.base !== null && (
          <span className="mt-0.5 block text-xs text-inkMuted">{t("beta.photoRenderNote")}</span>
        )}
      </figcaption>
      <ol className="mt-3 grid grid-cols-3 gap-3 xl:grid-cols-[repeat(3,7rem)]">
        {slots.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              aria-pressed={i === selected}
              aria-label={`${i + 1}. ${s.caption}`}
              onClick={() => setSelected(i)}
              className={`relative block aspect-video w-full overflow-hidden rounded-sm bg-sandDeep ring-offset-2 ${
                i === selected ? "ring-2 ring-forest" : "opacity-80 hover:opacity-100"
              }`}
            >
              {s.base === null ? (
                <span className="flex h-full items-center justify-center px-2 text-center text-xs text-inkMuted">
                  {i + 1}. {s.caption}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${s.base}-${PHOTO_WIDTHS[0]}.webp`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
              {s.key === "render" && s.base !== null && (
                <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-px text-[10px] font-medium text-cream">
                  {t("beta.photoRenderBadge")}
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function GoalProgress({ receivedCents, goalCents }: { receivedCents: number; goalCents: number }) {
  const { t } = useT();
  const fraction = receivedCents / goalCents;
  return (
    <div className="mt-4">
      <div
        className="h-3 overflow-hidden rounded-full bg-sandDeep"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goalCents / 100}
        aria-valuenow={receivedCents / 100}
        aria-label={t("beta.goal")}
      >
        {/* Barem tanka crta čim stigne prva uplata, da se pomak vidi i kod malih iznosa. */}
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-1000 ease-out motion-reduce:transition-none"
          style={{ width: receivedCents > 0 ? `max(0.5rem, ${Math.min(100, fraction * 100)}%)` : "0%" }}
        />
      </div>
      <p className="mt-2 text-sm text-inkSoft">
        {t("beta.progress", {
          received: formatEurPrecise(receivedCents),
          goal: formatEur(goalCents),
          percent: formatPercent(fraction, fraction > 0 && fraction < 0.01 ? 1 : 0),
        })}
      </p>
    </div>
  );
}

/**
 * Prati zaprimljene uplate iz localStoragea dok rail ne javi forward na Safe —
 * i kad je panel za plaćanje zatvoren ili je stranica osvježena. Bez hasha
 * forwarda ne bi se znalo kad uplata stigne na lanac, pa bi se zbrojila dvaput.
 */
export function PendingWatcher({
  safe,
  pending,
  onSettled,
}: {
  safe: Address;
  pending: readonly PendingPayment[];
  onSettled: () => void;
}) {
  const open = pending.filter((p) => p.txHash === null);
  const key = open.map((p) => p.sid).join(",");
  useEffect(() => {
    if (open.length === 0) return;
    const controller = new AbortController();
    const check = () => {
      for (const p of open) {
        fetchIntentStatus(p.statusUrl, controller.signal).then(
          (s) => {
            if (s.stage === "settled" && s.forwardTxHash !== null) {
              savePending(safe, { ...p, txHash: s.forwardTxHash });
              onSettled();
            } else if (s.stage === "rejected" || s.stage === "expired") {
              removePending(safe, p.sid);
            }
          },
          () => undefined,
        );
      }
    };
    check();
    const timer = window.setInterval(check, PENDING_CHECK_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
    // Ponovno se veže samo kad se promijeni skup otvorenih uplata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe, key]);
  return null;
}

/**
 * „+X upravo stiglo" samo JUST_ARRIVED_MS nakon što je rail javio uplatu, pa
 * nestane sama — i bez osvježavanja. Uplata ostaje pribrojena i u popisu.
 */
function JustArrived({ payment }: { payment: PendingPayment }) {
  const { t } = useT();
  const [remainingMs] = useState(() => justArrivedRemainingMs(payment, Date.now()));
  const [expired, setExpired] = useState(remainingMs === 0);
  useEffect(() => {
    if (remainingMs === 0) return;
    const timer = window.setTimeout(() => setExpired(true), remainingMs);
    return () => window.clearTimeout(timer);
  }, [remainingMs]);
  if (expired) return null;
  return (
    <p className="mt-3 inline-block animate-beta-arrived rounded-full bg-forest px-3 py-1 text-sm font-medium text-cream">
      {t("beta.justArrived", { amount: formatEurPrecise(payment.cents) })}
    </p>
  );
}

/**
 * Iznos koji se „odbroji" do nove vrijednosti, uz „+X" koji kratko iskoči
 * pokraj njega — isti obrazac kao BalanceDisplay u pay.domovina.ai walletu.
 * Prvo učitavanje se ne animira: animira se samo PROMJENA, tj. nova uplata,
 * pa je vidi svaki posjetitelj, ne samo uplatitelj.
 */
function AnimatedEur({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents);
  // Prethodni cilj u stanju, ne u refu: razlika se računa tijekom rendera
  // (React „adjusting state on prop change"), bez setState u efektu.
  const [prev, setPrev] = useState(cents);
  const [delta, setDelta] = useState<{ key: string; cents: number } | null>(null);
  if (cents !== prev) {
    setPrev(cents);
    if (cents > prev) setDelta({ key: `${prev}-${cents}`, cents: cents - prev });
  }
  useEffect(() => {
    const from = shown;
    if (from === cents) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const duration = reduce ? 0 : 900;
    let frame = 0;
    const step = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (cents - from) * eased));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // `shown` namjerno nije ovisnost: animacija kreće od trenutno prikazanog
    // iznosa samo kad se promijeni cilj.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents]);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      {/* tabular-nums: znamenke iste širine, pa broj ne podrhtava dok se odbrojava. */}
      <span className={`tabular-nums transition-colors duration-300 ${shown !== cents ? "text-forest" : ""}`}>
        {formatEurPrecise(shown)}
      </span>
      {delta !== null && (
        <span
          key={delta.key}
          aria-live="polite"
          className="animate-beta-delta rounded-full bg-forest/10 px-2 py-0.5 font-sans text-xs font-semibold tabular-nums text-forest"
        >
          +{formatEurPrecise(delta.cents)}
        </span>
      )}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-inkMuted">{label}</dt>
      <dd className="mt-0.5 whitespace-nowrap font-display text-lg font-semibold text-ink sm:text-xl">{value}</dd>
    </div>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: SafeActivity };

export function LiveActivity({
  safe,
  goalCents,
  pending,
  refreshKey,
  rail = RAIL_ITALK,
}: {
  safe: Address;
  goalCents: number | null;
  pending: readonly PendingPayment[];
  refreshKey: number;
  rail?: RailProfile;
}) {
  const { t, locale } = useT();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Uplata se pojavi bez ručnog osvježavanja: dok je kartica vidljiva, lanac se
  // ponovno čita svakih REFRESH_MS. Skrivena kartica ne troši upite, a povratak
  // na nju odmah osvježi. Greška pri osvježavanju ne briše već prikazane podatke.
  useEffect(() => {
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      fetchSafeActivity(safe, signal, rail).then(
        (data) => setState({ status: "ready", data }),
        () => {
          if (!signal.aborted) setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
        },
      );
    };
    load();
    // Nakon railova forwarda gnosisscan prijenos indeksira s nekoliko sekundi
    // zakašnjenja, pa prvo čitanje ga često još ne vidi. Dva brza ponovna čitanja
    // umjesto čekanja sljedećih REFRESH_MS.
    const burst = refreshKey > 0 ? SETTLE_RETRY_MS.map((ms) => window.setTimeout(load, ms)) : [];
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      burst.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("visibilitychange", onVisible);
      controller.abort();
    };
  }, [safe, refreshKey, rail]);

  const chainHashes = state.status === "ready" ? state.data.transfers.map((tr) => tr.hash) : [];
  const extraCents = state.status === "ready" ? unconfirmedCents(pending, chainHashes) : 0;
  // Zaprimljene uplate koje lanac (ili gnosisscan indeks) još ne pokazuje — idu na
  // vrh popisa odmah, da popis ne kasni za porukom „uplata je stigla".
  const onChain = new Set(chainHashes.map((h) => h.toLowerCase()));
  const unconfirmed = [...pending]
    .filter((p) => p.txHash === null || !onChain.has(p.txHash.toLowerCase()))
    .reverse();
  // Sve nepotvrđene imaju izdan EURe → napomena ne smije reći „pojavi se kad se izda EURe".
  const allMinted = unconfirmed.length > 0 && unconfirmed.every((p) => p.txHash !== null || p.minted === true);
  const receivedCents = state.status === "ready" ? state.data.receivedCents + extraCents : 0;
  const latest = pending.length > 0 ? pending[pending.length - 1] : undefined;

  return (
    <div>
      {state.status === "loading" && <p className="text-sm text-inkMuted">{t("beta.loading")}</p>}
      {state.status === "error" && <p className="text-sm text-inkSoft">{t("beta.chainError")}</p>}
      {state.status === "ready" && (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("beta.received")}</dt>
              <dd className="mt-0.5 font-display text-3xl font-semibold text-ink">
                {state.data.truncated ? "≥ " : ""}
                <AnimatedEur cents={receivedCents} />
              </dd>
            </div>
            {/* Saldo se razlikuje od uplaćenog tek nakon isplate; dotad bi samo ponovio isti broj. */}
            {state.data.balanceCents !== state.data.receivedCents && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("beta.balance")}</dt>
                <dd className="mt-0.5 font-display text-3xl font-semibold text-ink">
                  <AnimatedEur cents={state.data.balanceCents} />
                </dd>
              </div>
            )}
          </dl>
          {goalCents !== null && goalCents > 0 && (
            <GoalProgress receivedCents={receivedCents} goalCents={goalCents} />
          )}
          {latest !== undefined && (
            // key = sid: svaka nova uplata ponovno pokrene animaciju oznake.
            <JustArrived key={latest.sid} payment={latest} />
          )}
          {extraCents > 0 && (
            <p className="mt-2 text-xs text-inkMuted">
              {t(allMinted ? "beta.includesMinted" : "beta.includesUnconfirmed", {
                amount: formatEurPrecise(extraCents),
              })}
            </p>
          )}
          <h3 className="mt-5 text-xs uppercase tracking-wide text-inkMuted">{t("beta.recent")}</h3>
          {state.data.transfers.length === 0 && unconfirmed.length === 0 ? (
            <p className="mt-2 text-sm text-inkSoft">{t("beta.noTransfers")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/8 text-sm">
              {unconfirmed.map((p) => (
                <li key={p.sid} className="flex items-center justify-between gap-4 bg-forest/5 py-2">
                  <span className="text-inkSoft">
                    {formatDateShort(new Date(p.receivedAt).toISOString(), locale)}
                    <span className="ml-2 text-xs text-forest">
                      {p.txHash !== null
                        ? t("beta.rowIndexing")
                        : p.minted === true
                          ? t("beta.rowMinted")
                          : t("beta.rowReceived")}
                    </span>
                  </span>
                  {p.txHash === null ? (
                    <span className="font-medium text-ink">{formatEurPrecise(p.cents)}</span>
                  ) : (
                    <a
                      href={explorerTxUrl(rail, p.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline decoration-ink/20 underline-offset-2"
                    >
                      {formatEurPrecise(p.cents)}
                    </a>
                  )}
                </li>
              ))}
              {state.data.transfers.slice(0, RECENT_COUNT).map((tr) => (
                <li key={tr.hash + tr.timestamp} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-inkSoft">{formatDateShort(tr.timestamp, locale)}</span>
                  <a
                    href={explorerTxUrl(rail, tr.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-ink underline decoration-ink/20 underline-offset-2"
                  >
                    {formatEurPrecise(tr.cents)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <a
        href={explorerAddressUrl(rail, safe)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm text-forest underline underline-offset-2"
      >
        {rail.sandbox ? t("sandbox.viewOnChain", { chain: rail.chainName }) : t("beta.viewOnChain")}
      </a>
    </div>
  );
}

/**
 * Uplata preko MPT payment intenta (lib/beta-projects.ts, `MPT_INTENT`).
 * Iznos se bira ovdje jer je OBAVEZAN u EPC QR-u — bez njega Revolut ne popuni
 * opis plaćanja. QR, opis `mpt:<safe>?sid=` i potvrdu uživo daje rail checkout.
 */
export function PayWithIntent({
  safe,
  onPayment,
  onOpenChange,
  rail = RAIL_ITALK,
}: {
  safe: Address;
  onPayment: (p: PendingPayment) => void;
  onOpenChange: (open: boolean) => void;
  /**
   * Sandbox (/demo/): bez potvrde o uplati — potvrda se provjerava na Gnosisu i
   * nosi pravni smisao dokaza uplate, a simulirana uplata nije uplata.
   */
  rail?: RailProfile;
}) {
  const { t } = useT();
  const [preset, setPreset] = useState<number | null>(DEFAULT_AMOUNT_EUR);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<IntentResult | null>(null);
  const [intent, setIntentState] = useState<PaymentIntent | null>(null);
  // Otvaranje i zatvaranje QR-a mijenja raspored stupaca — kao animacija, ne skok.
  // Sid ide u adresu (`?uplata=`), pa osvježavanje vrati isti intent umjesto novog.
  const setIntent = (i: PaymentIntent | null) => {
    withViewTransition(() => {
      setIntentState(i);
      onOpenChange(i !== null);
    });
    setIntentParam(i?.sid ?? null);
  };
  // Potvrda o uplati (docs/16): uključena po zadanom, uplatitelj je može isključiti.
  const [wantReceipt, setWantReceipt] = useState(!rail.sandbox);
  const [receipt, setReceipt] = useState<{ key: ReceiptKey; saved: boolean } | null>(null);
  const amountEur = preset ?? parseAmountEur(custom);

  // `?uplata=<sid>` pri učitavanju: isti intent s raila (i ključ potvrde iz ovog
  // preglednika, ako ga ima). Tuđi ili nepostojeći sid samo se makne iz adrese.
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get(INTENT_PARAM);
    if (sid === null) return;
    const controller = new AbortController();
    Promise.all([fetchIntent(sid, safe, controller.signal, rail), import("@/lib/receipt-keys")]).then(
      ([restored, { receiptKeyStore }]) => {
        if (restored === null) {
          setIntentParam(null);
          return;
        }
        const key = receiptKeyStore.load(restored.sid);
        setReceipt(key === null ? null : { key, saved: true });
        setIntentState(restored);
        onOpenChange(true);
      },
      () => undefined,
    );
    return () => controller.abort();
    // Samo pri učitavanju stranice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay() {
    if (amountEur === null || busy) return;
    setBusy(true);
    setError(null);
    if (wantReceipt) {
      // viem (~76 KB gz) se učita tek kad netko traži potvrdu, ne na svakoj /beta/ stranici.
      const [{ createReceiptIntent }, { receiptKeyStore }] = await Promise.all([
        import("@/lib/receipt-api"),
        import("@/lib/receipt-keys"),
      ]);
      const result = await createReceiptIntent(safe, amountEur, receiptKeyStore);
      setBusy(false);
      if (result.ok && result.key !== null) {
        // Za popis „Moje uplate iz ovog preglednika" (lib/receipt-index.ts).
        rememberReceipt(browserStorage(), result.key.sid, safe, Math.round(amountEur * 100));
        setReceipt({ key: result.key, saved: result.saved });
        setIntent(result.intent);
      } else if (!result.ok) setError(result);
      return;
    }
    const result = await createPaymentIntent(safe, amountEur, { rail });
    setBusy(false);
    setReceipt(null);
    if (result.ok) setIntent(result.intent);
    else setError(result);
  }

  return (
    <div className="rounded-sm bg-sand p-3 sm:p-5">
      <h3 className="font-medium text-ink">{t("beta.payTitle")}</h3>

      {intent !== null ? (
        <IntentPanel
          intent={intent}
          receipt={receipt}
          onClose={() => setIntent(null)}
          onPayment={onPayment}
          copyRow={(label, value, copy, mono) => <Row label={label} value={value} copy={copy} mono={mono} />}
          rail={rail}
        />
      ) : !isRailConfigured(rail) ? (
        <p className="mt-3 text-sm text-inkSoft">{t("sandbox.notConfigured")}</p>
      ) : (
      <>
      <fieldset className="mt-3">
        <legend className="text-xs uppercase tracking-wide text-inkMuted">{t("beta.amount")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_AMOUNTS_EUR.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={preset === value}
              onClick={() => {
                setPreset(value);
                setCustom("");
              }}
              className={`rounded-sm border px-3 py-1.5 text-sm font-medium ${
                preset === value ? "border-forest bg-forest text-cream" : "border-ink/15 bg-white text-ink"
              }`}
            >
              {formatEur(value * 100)}
            </button>
          ))}
          <input
            type="text"
            inputMode="decimal"
            placeholder={t("beta.amountCustom")}
            aria-label={t("beta.amountCustom")}
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPreset(null);
            }}
            className="w-32 rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink"
          />
        </div>
        {preset === null && amountEur === null && custom.trim() !== "" && (
          <p className="mt-2 text-xs text-rust">{t("beta.amountInvalid", { max: formatEur(MAX_AMOUNT_EUR * 100) })}</p>
        )}
      </fieldset>

      {!rail.sandbox && (
      <label className="mt-4 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={wantReceipt}
          onChange={(e) => setWantReceipt(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-forest"
        />
        <span>
          <span className="font-medium">{t("receipt.toggle")}</span>
          <span className="mt-1 block text-xs text-inkMuted">{t("receipt.toggleHint")}</span>
        </span>
      </label>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={amountEur === null || busy}
        className="mt-4 w-full rounded-sm bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-forest-700 disabled:opacity-50 sm:w-auto"
      >
        {busy
          ? t("beta.payBusy")
          : t("beta.payButton", { amount: formatEurPrecise(Math.round((amountEur ?? 0) * 100)) })}
      </button>
      <p className="mt-2 text-xs text-inkMuted">{rail.sandbox ? t("sandbox.payHow") : t("beta.payHow")}</p>
      {error !== null && !error.ok && (
        <p className="mt-2 text-sm text-rust">
          {error.reason === "not_whitelisted"
            ? t("beta.payErrorWhitelist")
            : error.reason === "invalid_amount"
              ? t("beta.amountInvalid", { max: formatEur(MAX_AMOUNT_EUR * 100) })
              : t("beta.payErrorGeneric")}
        </p>
      )}
      </>
      )}

      {!rail.sandbox && <MyReceipts safe={safe} />}
    </div>
  );
}

const INTENT_PARAM = "uplata";

/** Sid otvorenog intenta u adresi, bez novog unosa u povijest (Natrag ne vrti QR). */
function setIntentParam(sid: string | null) {
  const url = new URL(window.location.href);
  if (sid === null) url.searchParams.delete(INTENT_PARAM);
  else url.searchParams.set(INTENT_PARAM, sid);
  window.history.replaceState(window.history.state, "", url);
}

function Row({ label, value, copy, mono }: { label: string; value: string; copy?: string; mono?: boolean }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-inkMuted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-x-3">
        <span className={`break-all text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        {copy !== undefined && (
          <button
            type="button"
            className="text-xs text-forest underline underline-offset-2"
            onClick={() => {
              navigator.clipboard.writeText(copy).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        )}
      </dd>
    </div>
  );
}
