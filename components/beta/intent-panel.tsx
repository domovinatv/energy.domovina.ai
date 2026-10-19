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
import { useMediaQuery } from "@/lib/media-query";
import { gnosisscanTxUrl } from "@/lib/beta-projects";
import {
  isReceived,
  isTerminal,
  watchIntentStatus,
  type IntentStatus,
  type IntentStep,
  type IntentTransport,
  type PaymentIntent,
} from "@/lib/mpt-intent";
import type { PendingPayment } from "@/lib/pending-payments";
import type { ReceiptKey } from "@/lib/receipt-keys";
import { downloadFile } from "@/lib/download";
import { formatDuration, formatTimeOfDay } from "@/lib/format";
import { keyBackupFileName } from "@/lib/receipt-index";

/** PDF417 opcije iz HUB3 v6 — bwip-js ih prima, ali njegovi tipovi ih ne navode. */
const HUB3_PDF417 = { columns: 9, eclevel: 4, rowmult: 3 };

export function IntentPanel({
  intent,
  receipt,
  onClose,
  onPayment,
  copyRow,
}: {
  intent: PaymentIntent;
  /**
   * Intent s potvrdom o uplati (docs/16): ključ iz kojeg je izveden `intent.sid`.
   * `saved = false` → preglednik ga nije spremio, pa se QR pokaže tek nakon
   * preuzimanja datoteke ključa.
   */
  receipt: { key: ReceiptKey; saved: boolean } | null;
  onClose: () => void;
  /** Javlja zaprimljenu uplatu (i kasnije hash forwarda) — pribroji se odmah. */
  onPayment: (p: PendingPayment) => void;
  copyRow: (label: string, value: string, copy?: string, mono?: boolean) => React.ReactNode;
}) {
  const { t } = useT();
  const [svg, setSvg] = useState<string | null>(null);
  const [status, setStatus] = useState<IntentStatus>({
    stage: "awaiting_payment",
    steps: [],
    forwardTxHash: null,
    reviewExpected: null,
    forwardOwed: false,
  });
  const [transport, setTransport] = useState<IntentTransport>("poll");
  const [code, setCode] = useState<"qr" | "hub3">("qr");
  const [keyDownloaded, setKeyDownloaded] = useState(false);
  const wide = useMediaQuery("(min-width: 1536px)");
  // Bez spremljenog ključa uplata bi nadživjela ključ: QR tek nakon preuzimanja.
  const qrBlocked = receipt !== null && !receipt.saved && !keyDownloaded;

  // HUB3 PDF417 (pokus, pay.domovina.ai docs/research/aircash/05): parametri
  // iz HUB3 v6 specifikacije — 9 stupaca, ECL 4, redak 3× modul. Dart `barcode`
  // paket daje simbol koji zxing ne čita; bwip-js prolazi i zxing i Apple Vision.
  // U modu s potvrdom HUB3 se ne nudi: opis uplatnice ne nosi `sid`, pa takva
  // uplata nikad ne dobiva izravnu potvrdu (docs/16 §4.1).
  const hub3Svg = useMemo(() => {
    if (intent.hub3Data === null || receipt !== null) return null;
    try {
      return toSVG({ bcid: "pdf417", text: intent.hub3Data, paddingwidth: 4, paddingheight: 4, ...HUB3_PDF417 });
    } catch {
      return null;
    }
  }, [intent.hub3Data, receipt]);

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
              ...(s.stage === "minted" || s.stage === "forwarding" ? { minted: true } : {}),
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
  const showQr = stage === "awaiting_payment" && !qrBlocked;
  // Široki stupac uplate (2xl, beta-page): QR lijevo, sve ostalo desno — panel ne
  // mora biti visok koliko QR i podaci zajedno. Ispod 2xl redoslijed je kao prije.
  const split = wide && showQr;

  const qrBlock = (
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
    </>
  );

  return (
    // Na mobitelu bez vlastitog okvira i paddinga: svaki piksel ide QR-u (≥ 320 px na 414 px ekranu).
    <div
      data-transport={transport}
      className={`mt-4 sm:rounded-sm sm:border sm:border-ink/10 sm:bg-white sm:p-5 ${
        split ? "grid grid-cols-[320px_minmax(0,1fr)] gap-x-6" : ""
      }`}
    >
      {split && <div className="[&>:first-child]:mt-0">{qrBlock}</div>}
      <div>
        <StageBanner status={status} amount={amount} />

        {receipt !== null && stage === "awaiting_payment" && (
          <div className="mt-4 max-w-[320px] rounded-sm border border-forest/30 bg-forest/5 p-3 text-xs text-inkSoft">
            <p className={receipt.saved ? "" : "font-medium text-rust"}>
              {receipt.saved ? t("receipt.keySaved") : t("receipt.keyNotSaved")}
            </p>
            <p className="mt-1">{t("receipt.keyWarning")}</p>
            <button
              type="button"
              onClick={() => {
                // Isti oblik kao `keyFileJson` u lib/receipt-keys.ts; ovdje bez importa,
                // da viem ne uđe u paket svake /beta/ stranice.
                downloadFile(keyBackupFileName(receipt.key.sid, false), JSON.stringify(receipt.key, null, 2));
                setKeyDownloaded(true);
              }}
              className="mt-2 text-sm font-medium text-forest underline underline-offset-2"
            >
              {t("receipt.keyDownload")}
            </button>
            {keyDownloaded && <span className="ml-2 text-forest">{t("receipt.keyDownloaded")}</span>}
            {intent.hub3Data !== null && <p className="mt-2">{t("receipt.hub3Hidden")}</p>}
          </div>
        )}

        {showQr && (
          <>
            {!split && qrBlock}
            {/* Revolut nakon skeniranja QR-a ostavlja Reference prazno (format QR-a nije
                uzrok). Od 15.10.2026. rail je u izravnom načinu (pay.domovina.ai ADR 0025):
                opis `gnosis:<Safe> sid:<sid>` je ono što Moneriumu kaže da minta ravno u
                Safe elektrane. Bez opisa novac sleti na glavni Safe i do elektrane stiže
                tek nakon ručnog 2/3 prijenosa, pa je napomena opet upozorenje. */}
            {receipt !== null ? (
              // Za potvrdu iznos i vrijeme NISU dokaz (rail ADR 0022): sidro nastaje samo kad
              // opis platitelja nosi sid (`mpt:`, a od ADR 0025 i `gnosis:`; receipts/link.ts).
              // Sam sid u opisu ne vrijedi — zato se kopira cijela referenca.
              <div data-receipt-reference className="mt-3 max-w-[320px] rounded-sm border border-solar/60 bg-solar-soft p-3 text-xs text-ink">
                <p className="text-sm font-medium">{t("receipt.referenceTitle")}</p>
                <p className="mt-1">{t("receipt.referenceText")}</p>
                <dl className="mt-2 text-sm">{copyRow(t("beta.reference"), intent.memo, intent.memo, true)}</dl>
              </div>
            ) : (
              <p data-revolut-reference className="mt-3 max-w-[320px] rounded-sm border border-solar/60 bg-solar-soft p-3 text-xs text-ink">
                {t("beta.revolutReference")}
              </p>
            )}
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

        {receipt !== null && (isReceived(stage) || stage === "settled") && (
          <a
            href={`/beta/potvrda/?sid=${encodeURIComponent(intent.sid)}`}
            className="mt-4 inline-block rounded-sm bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-forest-700"
          >
            {t("receipt.open")}
          </a>
        )}

        {/* S railovim koracima link na forward stoji uz korak „Prijenos na Safe". */}
        {stage === "settled" && status.forwardTxHash !== null && status.steps.length === 0 && (
          <a
            href={gnosisscanTxUrl(status.forwardTxHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-sm text-forest underline underline-offset-2"
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
    </div>
  );
}

/**
 * Trenutak „blagajne": rail javi „zaprimljeno" ~1 s nakon „Send" u banci (i za
 * uplatu bez opisa — pay.domovina.ai ADR 0018, `sid_resolved`), a novac stigne
 * na Safe ~10 s kasnije. Zato je uspjeh odmah velik i zelen, a ostatak puta se
 * vidi kao koraci koji se sami odrade.
 *
 * Koraci su railovi (`status.steps`, SSE): svaki nosi vrijeme iz Moneriuma ili
 * lanca i hash transakcije, pa uplatitelj vidi gdje mu je novac i koliko koji
 * korak traje — umjesto deset sekundi tišine. Stariji rail bez `steps` dobiva
 * prijašnja tri koraka.
 */
function StageBanner({ status, amount }: { status: IntentStatus; amount: string }) {
  const { t } = useT();
  const { stage } = status;
  // Sat za „traje 5 s" / „čekam već 42 s"; staje kad više nema što čekati.
  const now = useNow(!isTerminal(stage));
  const [mountedAt] = useState(() => Date.now());
  if (stage === "awaiting_payment") {
    const waited = (now - mountedAt) / 1000;
    return (
      <div>
        <p className="text-sm font-medium text-ink">{t("beta.intentAwaiting", { amount })}</p>
        {waited >= 5 && (
          <p className="mt-1 flex items-center gap-2 text-xs text-inkMuted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-forest" />
            {t("beta.intentWaitingFor", { duration: formatDuration(waited) })}
          </p>
        )}
      </div>
    );
  }
  if (stage === "rejected") return <p className="text-sm font-medium text-rust">{t("beta.intentRejected")}</p>;
  if (stage === "expired") return <p className="text-sm font-medium text-inkSoft">{t("beta.intentExpired")}</p>;
  const owed = status.forwardOwed && stage !== "settled";
  const forwarding = status.steps.find((s) => s.key === "forwarding");
  const midForward = stage !== "settled" && forwarding !== undefined && !owed &&
    status.steps.some((s) => s.key === "minted" && s.status === "proven");
  return (
    <div role="status" className="animate-fade-in rounded-sm bg-forest/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-9 w-9 shrink-0 text-forest" />
        <p className="font-display text-lg font-semibold leading-tight text-forest">
          {t("beta.intentReceived", { amount })}
        </p>
      </div>
      {status.steps.length > 0 ? (
        <RailSteps steps={status.steps} stage={stage} owed={owed} now={now} />
      ) : (
        <FallbackSteps stage={stage} owed={owed} />
      )}
      <p className="mt-3 text-xs text-inkSoft">
        {stage === "settled"
          ? t("beta.intentSettledSub")
          : owed
            ? t("beta.intentOwedSub")
            : stage === "received_processing"
              ? t("beta.stepHintProcessing")
              : midForward
                ? t("beta.stepHintForwarding")
                : t("beta.intentReceivedSub")}
      </p>
      {stage === "received_processing" && status.reviewExpected === true && (
        <p className="mt-2 text-xs text-inkSoft">{t("beta.intentReviewNote")}</p>
      )}
    </div>
  );
}

/** Trenutno vrijeme u ms, osvježava se svake sekunde dok je `active`. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function RailSteps({
  steps,
  stage,
  owed,
  now,
}: {
  steps: readonly IntentStep[];
  stage: IntentStatus["stage"];
  owed: boolean;
  now: number;
}) {
  const { t, locale } = useT();
  const start = steps.find((s) => s.key === "payment")?.at ?? null;
  // Korak koji se upravo odvija: rail ga označi `in_progress`, a kad ne zna
  // (forward još nije krenuo), to je prvi `waiting` iza dokazanog.
  const currentIdx = steps.findIndex((s, i) =>
    s.status === "in_progress" || (s.status === "waiting" && i > 0 && steps[i - 1]!.status === "proven"));
  const label = (s: IntentStep) => {
    switch (s.key) {
      case "payment":
        return t("beta.stepReceived");
      case "processing":
        return s.status === "proven" ? t("beta.stepProcessed") : t("beta.stepProcessing");
      case "minted":
        return t("beta.stepMinted");
      case "forwarding":
        return owed ? t("beta.stepOwed") : t("beta.stepForwarding");
      case "settled":
        return t("beta.stepSettled");
    }
  };
  return (
    <ol className="mt-3 space-y-1.5 text-sm">
      {steps.map((s, i) => {
        const done = s.status === "proven";
        const current = i === currentIdx && stage !== "settled";
        // Trajanje tekućeg koraka mjeri se od zadnjeg dokazanog, po satu preglednika.
        const prevAt = steps.slice(0, i).reverse().find((p) => p.at !== null)?.at ?? null;
        const tx = s.key === "minted" || s.key === "forwarding" ? s.txHashes.at(-1) : undefined;
        return (
          <li key={s.key} data-step={s.key} data-step-status={s.status} className={done ? "text-ink" : "text-inkMuted"}>
            <div className="flex items-center gap-2">
              {done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-forest" />
              ) : s.status === "failed" ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-rust" />
                </span>
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className={`h-2 w-2 rounded-full ${current ? "animate-pulse bg-forest" : "border border-ink/30"}`} />
                </span>
              )}
              <span className="min-w-0 flex-1">{label(s)}</span>
              {done && s.at !== null && (
                <span className="shrink-0 font-mono text-xs tabular-nums text-inkMuted">
                  {formatTimeOfDay(s.at, locale)}
                  {start !== null && s.key !== "payment" && s.at > start && ` · +${formatDuration(s.at - start)}`}
                </span>
              )}
              {current && prevAt !== null && !owed && (
                <span className="shrink-0 text-xs tabular-nums text-inkMuted">
                  {t("beta.stepRunning", { duration: formatDuration(now / 1000 - prevAt) })}
                </span>
              )}
            </div>
            {tx !== undefined && (
              <a
                href={gnosisscanTxUrl(tx)}
                target="_blank"
                rel="noreferrer"
                className="ml-6 text-xs text-forest underline underline-offset-2"
              >
                {t("beta.stepTx")} {tx.slice(0, 10)}…
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Rail bez `status.steps`: received_processing → 1, minted / forwarding → 2, settled → 3. */
function FallbackSteps({ stage, owed }: { stage: IntentStatus["stage"]; owed: boolean }) {
  const { t } = useT();
  const doneSteps = stage === "received_processing" ? 1 : stage === "settled" ? 3 : 2;
  // Treći korak dok nije gotov ne smije glasiti kao činjenica („Na Safeu elektrane").
  const steps = [
    t("beta.stepReceived"),
    t("beta.stepMinted"),
    stage === "settled" ? t("beta.stepSettled") : owed ? t("beta.stepOwed") : t("beta.stepForwarding"),
  ];
  return (
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
