"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { formatDateShort, formatEur, formatEurPrecise, shortAddress } from "@/lib/format";
import {
  BETA_PROJECTS,
  formatIban,
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

export function BetaPage({ qrBySlug }: { qrBySlug: Readonly<Record<string, string>> }) {
  const { t } = useT();
  return (
    <div className="container-content py-10 sm:py-14">
      <h1 className="font-display text-display-md font-semibold text-ink">{t("beta.title")}</h1>
      <p className="mt-4 max-w-3xl text-inkSoft">{t("beta.intro")}</p>
      <p className="mt-3 max-w-3xl text-sm text-inkMuted">{t("beta.who")}</p>

      <div className="mt-10 grid gap-6">
        {BETA_PROJECTS.map((project) => (
          <ProjectSection key={project.slug} project={project} qrSvg={qrBySlug[project.slug] ?? null} />
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

function ProjectSection({ project, qrSvg }: { project: BetaProject; qrSvg: string | null }) {
  const { t } = useT();
  return (
    <section id={project.slug} className="scroll-mt-6 rounded-md border border-ink/8 bg-white/60 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-display text-2xl font-semibold text-ink">{project.place}</h2>
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

      {isPayable(project) ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <LiveActivity safe={project.safe} goalCents={project.goalCents} />
          <PayInstructions payment={project.payment} remittance={remittanceFor(project)} safe={project.safe} qrSvg={qrSvg} />
        </div>
      ) : (
        <p className="mt-6 rounded-sm bg-sandDeep px-4 py-3 text-sm text-inkSoft">{t("beta.pending")}</p>
      )}
    </section>
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

  useEffect(() => {
    const controller = new AbortController();
    fetchSafeActivity(safe, controller.signal).then(
      (data) => setState({ status: "ready", data }),
      () => {
        if (!controller.signal.aborted) setState({ status: "error" });
      },
    );
    return () => controller.abort();
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
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sandDeep" aria-hidden="true">
              <div
                className="h-full bg-forest"
                style={{ width: `${Math.min(100, (state.data.receivedCents / goalCents) * 100)}%` }}
              />
            </div>
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
  qrSvg,
}: {
  payment: BetaPayment;
  remittance: string;
  safe: Address;
  qrSvg: string | null;
}) {
  const { t } = useT();
  return (
    <div className="rounded-sm bg-sand p-4 sm:p-5">
      <h3 className="font-medium text-ink">{t("beta.payTitle")}</h3>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row">
        {qrSvg !== null && (
          <div className="shrink-0">
            {/* SVG generira biblioteka `qrcode` pri buildu iz našeg EPC teksta. */}
            <div className="h-44 w-44 bg-white p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="mt-2 max-w-44 text-xs text-inkMuted">{t("beta.payQr")}</p>
          </div>
        )}
        <dl className="min-w-0 space-y-2 text-sm">
          <Row label={t("beta.beneficiary")} value={payment.beneficiaryName} />
          <Row label={t("beta.iban")} value={formatIban(payment.iban)} copy={payment.iban.replace(/\s+/g, "")} />
          {payment.bic !== null && <Row label={t("beta.bic")} value={payment.bic} />}
          <Row label={t("beta.reference")} value={remittance} copy={remittance} mono />
          <p className="text-xs text-inkMuted">
            {payment.kind === "rail" ? t("beta.referenceRail") : t("beta.referenceDirect")}
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
