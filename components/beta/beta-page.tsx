"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { formatDateShort, formatEur, formatEurPrecise, formatPercent, shortAddress } from "@/lib/format";
import {
  BETA_PROJECTS,
  DEFAULT_AMOUNT_EUR,
  MAX_AMOUNT_EUR,
  PRESET_AMOUNTS_EUR,
  parseAmountEur,
  hasVerifiedSafe,
  gnosisscanAddressUrl,
  gnosisscanTxUrl,
  isPayable,
  PHOTO_WIDTHS,
  type Address,
  type BetaPhotos,
  type BetaProject,
} from "@/lib/beta-projects";
import { fetchSafeActivity, type SafeActivity } from "@/lib/beta-chain";
import { createPaymentIntent, type IntentResult, type PaymentIntent } from "@/lib/mpt-intent";
import { IntentPanel } from "@/components/beta/intent-panel";
import { unconfirmedCents, type PendingPayment } from "@/lib/pending-payments";
import { removePending, savePending, usePending } from "@/lib/pending-store";
import { fetchIntentStatus } from "@/lib/mpt-intent";

const RECENT_COUNT = 5;
/** Koliko često se lanac ponovno čita dok je kartica vidljiva. */
const REFRESH_MS = 20_000;
/** Koliko često se provjerava zaprimljena uplata koja još nije na lancu. */
const PENDING_CHECK_MS = 15_000;
/** Ponovna čitanja lanca nakon forwarda, dok ga gnosisscan ne indeksira. */
const SETTLE_RETRY_MS = [3_000, 8_000];

export function BetaPage() {
  const { t } = useT();
  return (
    <div className="container-content py-10 sm:py-14">
      <h1 className="font-display text-display-md font-semibold text-ink">{t("beta.title")}</h1>
      <p className="mt-4 max-w-3xl text-inkSoft">{t("beta.intro")}</p>
      <p className="mt-3 max-w-3xl text-sm text-inkMuted">{t("beta.who")}</p>

      <div className="mt-10 grid gap-6">
        {BETA_PROJECTS.map((project) => (
          <ProjectSection key={project.slug} project={project} />
        ))}
      </div>

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

function ProjectSection({ project }: { project: BetaProject }) {
  const { t } = useT();
  // Uplate koje je Monerium ZAPRIMIO (SEPA), a lanac ih još ne pokazuje — pribrajaju
  // se odmah i preživljavaju osvježavanje stranice (lib/pending-store).
  const pending = usePending(project.safe ?? "");
  // Povećanje odmah ponovno pročita lanac (kad rail javi forward).
  const [refreshKey, setRefreshKey] = useState(0);
  const onPayment = (p: PendingPayment) => {
    if (project.safe === null) return;
    savePending(project.safe, p);
    if (p.txHash !== null) setRefreshKey((k) => k + 1);
  };
  return (
    <section id={project.slug} className="scroll-mt-6 rounded-md border border-ink/8 bg-white/60 p-4 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div>
          <p className="inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-forest">
            {t("beta.campaign")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{project.place}</h2>
          <p className="mt-1 text-sm text-inkSoft">{project.address}</p>
        </div>
        <p className="text-sm text-inkMuted">{project.county}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <Fact label={t("beta.power")} value={`${project.powerKw} kW`} />
        <Fact label={t("beta.goal")} value={project.goalCents === null ? "—" : formatEur(project.goalCents)} />
        <p className="col-span-2 text-inkSoft sm:self-end">
          {t("beta.connections", { count: project.connections })}
          {project.gnosisNode ? ` · ${t("beta.node")}` : ""}
        </p>
      </dl>
      {project.goalCents === null && <p className="mt-2 text-xs text-inkMuted">{t("beta.goalPending")}</p>}

      {project.photos !== null && <ProjectPhotos photos={project.photos} place={project.place} />}

      {hasVerifiedSafe(project) ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <PendingWatcher safe={project.safe} pending={pending} onSettled={() => setRefreshKey((k) => k + 1)} />
          <div>
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
            <PayWithIntent safe={project.safe} onPayment={onPayment} />
          ) : (
            <div className="rounded-sm bg-sandDeep px-4 py-3 text-sm text-inkSoft">
              <p>{t("beta.payPending")}</p>
              <p className="mt-2 text-xs text-inkMuted">{t("beta.safe")}</p>
              <p className="break-all font-mono text-xs text-ink">{project.safe}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 rounded-sm bg-sandDeep px-4 py-3 text-sm text-inkSoft">{t("beta.pending")}</p>
      )}
    </section>
  );
}

/**
 * Prije · vizualizacija · poslije. Oznaka „AI vizualizacija" stoji NA slici, ne
 * u potpisu — potpis se na mobitelu lako preskoči, a render pokraj prave snimke
 * bez oznake bio bi obmana (CLAUDE.md, pravilo 3).
 */
function ProjectPhotos({ photos, place }: { photos: BetaPhotos; place: string }) {
  const { t } = useT();
  const slots = [
    { key: "before", base: photos.before, caption: t("beta.photoBefore"), pending: t("beta.photoBeforePending") },
    { key: "render", base: photos.render, caption: t("beta.photoRender"), pending: t("beta.photoRenderPending") },
    { key: "after", base: photos.after, caption: t("beta.photoAfter"), pending: t("beta.photoAfterPending") },
  ] as const;
  return (
    <ol className="mt-6 grid gap-4 sm:grid-cols-3">
      {slots.map((slot, i) => (
        <li key={slot.key}>
          <figure>
            <div className="relative aspect-video overflow-hidden rounded-sm bg-sandDeep">
              {slot.base === null ? (
                <p className="flex h-full items-center justify-center px-4 text-center text-sm text-inkMuted">
                  {slot.pending}
                </p>
              ) : (
                <a href={`${slot.base}-1600.webp`} target="_blank" rel="noreferrer" className="block h-full">
                  {/* Statički export: next/image ovdje ne optimizira (images.unoptimized), pa običan img sa srcset. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${slot.base}-800.webp`}
                    srcSet={PHOTO_WIDTHS.map((w) => `${slot.base}-${w}.webp ${w}w`).join(", ")}
                    sizes="(min-width: 640px) 33vw, 100vw"
                    alt={t(`beta.photoAlt.${slot.key}`, { place })}
                    loading="lazy"
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
              <span className="text-inkMuted">{i + 1}. </span>
              {slot.caption}
            </figcaption>
            {slot.key === "render" && slot.base !== null && (
              <p className="mt-1 text-xs text-inkMuted">{t("beta.photoRenderNote")}</p>
            )}
          </figure>
        </li>
      ))}
    </ol>
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
function PendingWatcher({
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

/** Iznos koji se „odbroji" do nove vrijednosti — uplatitelj vidi da se njegov novac pribrojio. */
function AnimatedEur({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents);
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
  return <>{formatEurPrecise(shown)}</>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-inkMuted">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: SafeActivity };

function LiveActivity({
  safe,
  goalCents,
  pending,
  refreshKey,
}: {
  safe: Address;
  goalCents: number | null;
  pending: readonly PendingPayment[];
  refreshKey: number;
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
      fetchSafeActivity(safe, signal).then(
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
  }, [safe, refreshKey]);

  const chainHashes = state.status === "ready" ? state.data.transfers.map((tr) => tr.hash) : [];
  const extraCents = state.status === "ready" ? unconfirmedCents(pending, chainHashes) : 0;
  // Zaprimljene uplate koje lanac (ili gnosisscan indeks) još ne pokazuje — idu na
  // vrh popisa odmah, da popis ne kasni za porukom „uplata je stigla".
  const onChain = new Set(chainHashes.map((h) => h.toLowerCase()));
  const unconfirmed = [...pending]
    .filter((p) => p.txHash === null || !onChain.has(p.txHash.toLowerCase()))
    .reverse();
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
              <dd className="mt-0.5 font-display text-xl font-semibold text-ink">
                {state.data.truncated ? "≥ " : ""}
                <AnimatedEur cents={receivedCents} />
              </dd>
            </div>
            <Fact label={t("beta.balance")} value={formatEurPrecise(state.data.balanceCents)} />
          </dl>
          {goalCents !== null && goalCents > 0 && (
            <GoalProgress receivedCents={receivedCents} goalCents={goalCents} />
          )}
          {latest !== undefined && (
            // key = sid: svaka nova uplata ponovno pokrene animaciju oznake.
            <p
              key={latest.sid}
              className="mt-3 inline-block animate-beta-arrived rounded-full bg-forest px-3 py-1 text-sm font-medium text-cream"
            >
              {t("beta.justArrived", { amount: formatEurPrecise(latest.cents) })}
            </p>
          )}
          {extraCents > 0 && (
            <p className="mt-2 text-xs text-inkMuted">
              {t("beta.includesUnconfirmed", { amount: formatEurPrecise(extraCents) })}
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
                      {p.txHash === null ? t("beta.rowReceived") : t("beta.rowIndexing")}
                    </span>
                  </span>
                  {p.txHash === null ? (
                    <span className="font-medium text-ink">{formatEurPrecise(p.cents)}</span>
                  ) : (
                    <a
                      href={gnosisscanTxUrl(p.txHash)}
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
                    href={gnosisscanTxUrl(tr.hash)}
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
        href={gnosisscanAddressUrl(safe)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm text-forest underline underline-offset-2"
      >
        {t("beta.viewOnChain")}
      </a>
    </div>
  );
}

/**
 * Uplata preko MPT payment intenta (lib/beta-projects.ts, `MPT_INTENT`).
 * Iznos se bira ovdje jer je OBAVEZAN u EPC QR-u — bez njega Revolut ne popuni
 * opis plaćanja. QR, opis `mpt:<safe>?sid=` i potvrdu uživo daje rail checkout.
 */
function PayWithIntent({ safe, onPayment }: { safe: Address; onPayment: (p: PendingPayment) => void }) {
  const { t } = useT();
  const [preset, setPreset] = useState<number | null>(DEFAULT_AMOUNT_EUR);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<IntentResult | null>(null);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const amountEur = preset ?? parseAmountEur(custom);

  async function pay() {
    if (amountEur === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await createPaymentIntent(safe, amountEur);
    setBusy(false);
    if (result.ok) setIntent(result.intent);
    else setError(result);
  }

  return (
    <div className="rounded-sm bg-sand p-3 sm:p-5">
      <h3 className="font-medium text-ink">{t("beta.payTitle")}</h3>

      {intent !== null ? (
        <IntentPanel
          intent={intent}
          onClose={() => setIntent(null)}
          onPayment={onPayment}
          copyRow={(label, value, copy, mono) => <Row label={label} value={value} copy={copy} mono={mono} />}
        />
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
      <p className="mt-2 text-xs text-inkMuted">{t("beta.payHow")}</p>
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

      <dl className="mt-4 text-sm">
        <Row label={t("beta.safe")} value={shortAddress(safe)} copy={safe} mono />
      </dl>
    </div>
  );
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
