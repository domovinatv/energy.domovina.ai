"use client";

/**
 * Ugrađeni MPT checkout: QR, podaci za ručnu uplatu i status uživo — bez
 * odlaska na mpt.domovina.ai. Ponašanje je preslikano iz rail checkouta
 * (`pay.domovina.ai/backend/src/checkout/page.ts`): status uživo preko SSE-a s
 * pollingom kao rezervom (`watchIntentStatus`), uspjeh čim Monerium zaprimi
 * uplatu, kraj na settled / rejected / expired.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
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
          setStatus(s);
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
          {svg !== null ? (
            <div
              className="mt-4 aspect-square w-full max-w-[320px] bg-white [&_svg]:h-full [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="mt-4 aspect-square w-full max-w-[320px] bg-sand" />
          )}
          <p className="mt-2 max-w-[320px] text-xs text-inkMuted">{t("beta.intentScan", { amount })}</p>
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
  const sub =
    stage === "received_processing"
      ? t("beta.intentReceivedSub")
      : stage === "settled"
        ? t("beta.intentSettledSub")
        : t("beta.intentMintingSub");
  return (
    <div className="rounded-sm bg-forest/10 px-4 py-3">
      <p className="font-display text-lg font-semibold text-forest">{t("beta.intentReceived", { amount })}</p>
      <p className="mt-1 text-sm text-inkSoft">{sub}</p>
      {stage === "received_processing" && reviewExpected === true && (
        <p className="mt-2 text-sm text-inkSoft">{t("beta.intentReviewNote")}</p>
      )}
    </div>
  );
}
