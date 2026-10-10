"use client";

/**
 * Ugrađeni MPT checkout: QR, podaci za ručnu uplatu i status uživo — bez
 * odlaska na mpt.domovina.ai. Ponašanje je preslikano iz rail checkouta
 * (`pay.domovina.ai/backend/src/checkout/page.ts`): status uživo preko SSE-a s
 * pollingom kao rezervom (`watchIntentStatus`), uspjeh čim Monerium zaprimi
 * uplatu, kraj na settled / rejected / expired.
 */
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toSVG } from "bwip-js/browser";
import { useT } from "@/lib/i18n";
import { gnosisscanTxUrl } from "@/lib/beta-projects";
import {
  isReceived,
  isTerminal,
  watchIntentStatus,
  type IntentStatus,
  type IntentTransport,
  type PaymentIntent,
} from "@/lib/mpt-intent";
import type { PendingPayment } from "@/lib/pending-payments";

/** PDF417 opcije iz HUB3 v6 — bwip-js ih prima, ali njegovi tipovi ih ne navode. */
const HUB3_PDF417 = { columns: 9, eclevel: 4, rowmult: 3 };

export function IntentPanel({
  intent,
  onClose,
  onPayment,
  copyRow,
}: {
  intent: PaymentIntent;
  onClose: () => void;
  /** Javlja zaprimljenu uplatu (i kasnije hash forwarda) — pribroji se odmah. */
  onPayment: (p: PendingPayment) => void;
  copyRow: (label: string, value: string, copy?: string, mono?: boolean) => React.ReactNode;
}) {
  const { t } = useT();
  const [svg, setSvg] = useState<string | null>(null);
  const [status, setStatus] = useState<IntentStatus>({
    stage: "awaiting_payment",
    forwardTxHash: null,
    reviewExpected: null,
  });
  const [transport, setTransport] = useState<IntentTransport>("poll");
  const [code, setCode] = useState<"qr" | "hub3">("qr");

  // HUB3 PDF417 (pokus, pay.domovina.ai docs/research/aircash/05): parametri
  // iz HUB3 v6 specifikacije — 9 stupaca, ECL 4, redak 3× modul. Dart `barcode`
  // paket daje simbol koji zxing ne čita; bwip-js prolazi i zxing i Apple Vision.
  const hub3Svg = useMemo(() => {
    if (intent.hub3Data === null) return null;
    try {
      return toSVG({ bcid: "pdf417", text: intent.hub3Data, paddingwidth: 4, paddingheight: 4, ...HUB3_PDF417 });
    } catch {
      return null;
    }
  }, [intent.hub3Data]);

  // ⚠️ Revolut iOS NE čita gust EPC QR iscrtan sitno: ≥ 320 px, tiha zona 4
  // modula, ECC M (pay.domovina.ai memorija feedback_epc_format). EPC tekst je
  // railov (`epc_qr_data`), mi ga samo iscrtavamo.
  useEffect(() => {
    let live = true;
    QRCode.toString(intent.epcQrData, { type: "svg", errorCorrectionLevel: "M", margin: 4 }).then((s) => {
      if (live) setSvg(s);
    });
    return () => {
      live = false;
    };
  }, [intent.epcQrData]);

  useEffect(
    () =>
      watchIntentStatus(
        intent,
        (s) => {
          setStatus((prev) => {
            // Kratka vibracija kad uplata prvi put stigne, kao terminal na blagajni
            // (Android; iOS Safari `vibrate` nema pa se tiho preskače).
            if (prev.stage === "awaiting_payment" && (isReceived(s.stage) || s.stage === "settled")) {
              navigator.vibrate?.(60);
            }
            return s;
          });
          if (isReceived(s.stage) || s.stage === "settled") {
            onPayment({
              sid: intent.sid,
              cents: Math.round(Number(intent.amountEur) * 100),
              statusUrl: intent.statusUrl,
              receivedAt: Date.now(),
              txHash: s.stage === "settled" ? s.forwardTxHash : null,
            });
          }
        },
        setTransport,
      ),
    // `onPayment` i ostatak `intent` su stabilni za isti intent; praćenje se veže uz status_url.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intent.statusUrl],
  );

  const stage = status.stage;
  const amount = `${intent.amountEur.replace(".", ",")} €`;

  return (
    // Na mobitelu bez vlastitog okvira i paddinga: svaki piksel ide QR-u (≥ 320 px na 414 px ekranu).
    <div data-transport={transport} className="mt-4 sm:rounded-sm sm:border sm:border-ink/10 sm:bg-white sm:p-5">
      <StageBanner stage={stage} amount={amount} reviewExpected={status.reviewExpected} />

      {stage === "awaiting_payment" && (
        <>
          {hub3Svg !== null && (
            <div role="tablist" className="mt-4 flex max-w-[320px] gap-1 text-sm">
              {(["qr", "hub3"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={code === c}
                  onClick={() => setCode(c)}
                  className={`flex-1 rounded-sm px-3 py-1.5 ${code === c ? "bg-ink text-cream" : "bg-sand text-inkSoft"}`}
                >
                  {c === "qr" ? t("beta.codeQr") : t("beta.codeHub3")}
                </button>
              ))}
            </div>
          )}
          {code === "hub3" && hub3Svg !== null ? (
            <>
              <div
                data-code="hub3"
                className="mt-4 w-full max-w-[320px] bg-white [&_svg]:h-auto [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]"
                dangerouslySetInnerHTML={{ __html: hub3Svg }}
              />
              <p className="mt-2 max-w-[320px] text-xs text-inkMuted">{t("beta.hub3Scan")}</p>
            </>
          ) : (
            <>
              {svg !== null ? (
                <div
                  className="mt-4 aspect-square w-full max-w-[320px] bg-white [&_svg]:h-full [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="mt-4 aspect-square w-full max-w-[320px] bg-sand" />
              )}
              <p className="mt-2 max-w-[320px] text-xs text-inkMuted">{t("beta.intentScan", { amount })}</p>
            </>
          )}
          {/* Revolut iOS od 7.10.2026.: kad stanje pokriva iznos, nakon skeniranja otvara
              ekran „spremno za isplatu" BEZ opisa plaćanja. Format QR-a nije uzrok.
              Od 8.10. rail takvu uplatu veže uz intent po tenantu, točnom iznosu i
              vremenu (pay.domovina.ai ADR 0018, prozor 48 h); kad kandidati vode na
              različite Safeove, parkira je za ručno preusmjeravanje. Zato napomena
              više nije upozorenje. */}
          <p className="mt-3 max-w-[320px] rounded-sm border border-ink/10 bg-sand p-3 text-xs text-inkSoft">
            {t("beta.revolutReference")}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            {copyRow(t("beta.beneficiary"), intent.beneficiaryName)}
            {copyRow(t("beta.iban"), intent.iban.replace(/(.{4})/g, "$1 ").trim(), intent.iban)}
            {intent.bic !== null && copyRow(t("beta.bic"), intent.bic)}
            {copyRow(t("beta.amount"), amount, intent.amountEur)}
            {copyRow(t("beta.reference"), intent.memo, intent.memo, true)}
          </dl>
          <p className="mt-2 text-xs text-inkMuted">{t("beta.referenceExact")}</p>
        </>
      )}

      {stage === "settled" && status.forwardTxHash !== null && (
        <a
          href={gnosisscanTxUrl(status.forwardTxHash)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-forest underline underline-offset-2"
        >
          {t("beta.intentTx")}
        </a>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-4 block text-sm text-inkSoft underline underline-offset-2"
      >
        {isTerminal(stage) || isReceived(stage) ? t("beta.intentNew") : t("beta.intentCancel")}
      </button>
    </div>
  );
}

/**
 * Trenutak „blagajne": rail javi „zaprimljeno" ~1 s nakon „Send" u banci (i za
 * uplatu bez opisa — pay.domovina.ai ADR 0018, `sid_resolved`), a novac stigne
 * na Safe ~15 s kasnije. Zato je uspjeh odmah velik i zelen, a ostatak puta se
 * vidi kao koraci koji se sami odrade.
 */
function StageBanner({
  stage,
  amount,
  reviewExpected,
}: {
  stage: IntentStatus["stage"];
  amount: string;
  reviewExpected: boolean | null;
}) {
  const { t } = useT();
  if (stage === "awaiting_payment") {
    return <p className="text-sm font-medium text-ink">{t("beta.intentAwaiting", { amount })}</p>;
  }
  if (stage === "rejected") return <p className="text-sm font-medium text-rust">{t("beta.intentRejected")}</p>;
  if (stage === "expired") return <p className="text-sm font-medium text-inkSoft">{t("beta.intentExpired")}</p>;
  // received_processing → 1, minted / forwarding → 2, settled → 3 gotova koraka.
  const doneSteps = stage === "received_processing" ? 1 : stage === "settled" ? 3 : 2;
  const steps = [t("beta.stepReceived"), t("beta.stepMinted"), t("beta.stepSettled")];
  return (
    <div role="status" className="animate-fade-in rounded-sm bg-forest/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-9 w-9 shrink-0 text-forest" />
        <p className="font-display text-lg font-semibold leading-tight text-forest">
          {t("beta.intentReceived", { amount })}
        </p>
      </div>
      <ol className="mt-3 space-y-1.5 text-sm">
        {steps.map((label, i) => {
          const done = i < doneSteps;
          const current = i === doneSteps;
          return (
            <li key={label} className={`flex items-center gap-2 ${done ? "text-ink" : "text-inkMuted"}`}>
              {done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-forest" />
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className={`h-2 w-2 rounded-full ${current ? "animate-pulse bg-forest" : "border border-ink/30"}`} />
                </span>
              )}
              {label}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-inkSoft">
        {stage === "settled" ? t("beta.intentSettledSub") : t("beta.intentReceivedSub")}
      </p>
      {stage === "received_processing" && reviewExpected === true && (
        <p className="mt-2 text-xs text-inkSoft">{t("beta.intentReviewNote")}</p>
      )}
    </div>
  );
}

function CheckCircle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" className="stroke-cream" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
