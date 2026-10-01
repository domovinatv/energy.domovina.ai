"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { formatDateShort, formatEur, formatEurPrecise, formatPercent, shortAddress } from "@/lib/format";
import {
  BETA_PROJECTS,
  DEFAULT_AMOUNT_EUR,
  MAX_AMOUNT_EUR,
  PRESET_AMOUNTS_EUR,
  buildEpcText,
  formatIban,
  parseAmountEur,
  hasVerifiedSafe,
  gnosisscanAddressUrl,
  gnosisscanTxUrl,
  isPayable,
  remittanceFor,
  type Address,
  type BetaPayment,
  type BetaProject,
} from "@/lib/beta-projects";
import { fetchSafeActivity, type SafeActivity } from "@/lib/beta-chain";

const RECENT_COUNT = 5;
/** Koliko često se lanac ponovno čita dok je kartica vidljiva. */
const REFRESH_MS = 20_000;

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
  return (
    <section id={project.slug} className="scroll-mt-6 rounded-md border border-ink/8 bg-white/60 p-5 sm:p-7">
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

      {hasVerifiedSafe(project) ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <LiveActivity safe={project.safe} goalCents={project.goalCents} />
            <p className="mt-4 text-xs text-inkMuted">
              {t("beta.signers", {
                threshold: project.signers.threshold,
                count: project.signers.owners.length,
              })}
            </p>
          </div>
          {isPayable(project) ? (
            <PayInstructions payment={project.payment} remittance={remittanceFor(project)} safe={project.safe} />
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
          className="h-full rounded-full bg-forest"
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

function LiveActivity({ safe, goalCents }: { safe: Address; goalCents: number | null }) {
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
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controller.abort();
    };
  }, [safe]);

  return (
    <div>
      {state.status === "loading" && <p className="text-sm text-inkMuted">{t("beta.loading")}</p>}
      {state.status === "error" && <p className="text-sm text-inkSoft">{t("beta.chainError")}</p>}
      {state.status === "ready" && (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Fact
              label={t("beta.received")}
              value={`${state.data.truncated ? "≥ " : ""}${formatEurPrecise(state.data.receivedCents)}`}
            />
            <Fact label={t("beta.balance")} value={formatEurPrecise(state.data.balanceCents)} />
          </dl>
          {goalCents !== null && goalCents > 0 && (
            <GoalProgress receivedCents={state.data.receivedCents} goalCents={goalCents} />
          )}
          <h3 className="mt-5 text-xs uppercase tracking-wide text-inkMuted">{t("beta.recent")}</h3>
          {state.data.transfers.length === 0 ? (
            <p className="mt-2 text-sm text-inkSoft">{t("beta.noTransfers")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/8 text-sm">
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

function PayInstructions({
  payment,
  remittance,
  safe,
}: {
  payment: BetaPayment;
  remittance: string;
  safe: Address;
}) {
  const { t } = useT();
  const [preset, setPreset] = useState<number | null>(DEFAULT_AMOUNT_EUR);
  const [custom, setCustom] = useState("");
  const amountEur = preset ?? parseAmountEur(custom);
  const epc =
    amountEur === null
      ? null
      : buildEpcText({
          beneficiaryName: payment.beneficiaryName,
          iban: payment.iban,
          bic: payment.bic,
          remittance,
          amountEur,
        });

  // QR se crta za odabrani iznos. Ključ je sam EPC tekst, pa se nikad ne
  // prikaže QR za iznos koji više nije odabran.
  const [qr, setQr] = useState<{ epc: string; svg: string } | null>(null);
  useEffect(() => {
    if (epc === null) return;
    let live = true;
    // ⚠️ Revolut iOS NE čita gust EPC QR iscrtan sitno: 220 px bez tihe zone
    // nije prolazio, 320 px + 4 modula tihe zone + ECC M jest (pay.domovina.ai
    // memorija feedback_epc_format / pinka 71907a7).
    QRCode.toString(epc, { type: "svg", errorCorrectionLevel: "M", margin: 4 }).then((svg) => {
      if (live) setQr({ epc, svg });
    });
    return () => {
      live = false;
    };
  }, [epc]);
  const svg = qr !== null && qr.epc === epc ? qr.svg : null;

  return (
    <div className="rounded-sm bg-sand p-4 sm:p-5">
      <h3 className="font-medium text-ink">{t("beta.payTitle")}</h3>

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

      <div className="mt-4 flex flex-col gap-5">
        {epc !== null && (
          <div>
            {/* Do 320 px, a na uskom ekranu cijela širina; `crispEdges` sprječava sive rubove modula. */}
            {svg !== null ? (
              <div
                className="aspect-square w-full max-w-[320px] bg-white [&_svg]:h-full [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="aspect-square w-full max-w-[320px] bg-white" />
            )}
            <p className="mt-2 max-w-[320px] text-xs text-inkMuted">
              {t("beta.payQr", { amount: formatEurPrecise(Math.round((amountEur ?? 0) * 100)) })}
            </p>
          </div>
        )}
        <dl className="min-w-0 space-y-2 text-sm">
          <Row label={t("beta.beneficiary")} value={payment.beneficiaryName} />
          <Row label={t("beta.iban")} value={formatIban(payment.iban)} copy={payment.iban.replace(/\s+/g, "")} />
          {payment.bic !== null && <Row label={t("beta.bic")} value={payment.bic} />}
          <Row label={t("beta.reference")} value={remittance} copy={remittance} mono />
          <p className="text-xs text-inkMuted">
            {payment.kind === "rail"
              ? t("beta.referenceRail")
              : payment.routing === "reference"
                ? t("beta.referenceMonerium")
                : t("beta.referenceDirect")}
          </p>
          <Row label={t("beta.safe")} value={shortAddress(safe)} copy={safe} mono />
        </dl>
      </div>
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
