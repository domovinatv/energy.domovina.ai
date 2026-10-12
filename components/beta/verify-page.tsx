"use client";

/**
 * `/beta/provjera/` — neovisna provjera potvrde o uplati (docs/16 §7).
 *
 * Korisnik učita PDF i/ili JSON potvrde i po želji ključ; sve se čita samo u
 * pregledniku. Koraci su railovi (`lib/receipt-verify.ts`), mrežni izvori nisu
 * rail (`lib/receipt-verify-net.ts`). Rezultat se preuzima kao PDF (ispisiv,
 * s JSON privicima) i kao JSON (strojno čitljiv).
 */
import { useEffect, useState } from "react";
import { bytesToHex, sha256 } from "viem";
import { useT, type MessageKey } from "@/lib/i18n";
import { formatEurPrecise } from "@/lib/format";
import { downloadFile } from "@/lib/download";
import { pdfAttachments } from "@/lib/pdf-attachments";
import { loadPdfFonts } from "@/lib/pdf-fonts";
import { parseKeyFile, type ReceiptKey } from "@/lib/receipt-keys";
import { asReceipt, verifyReceipt, type CheckStatus, type ReceiptInput, type VerifyReport } from "@/lib/receipt-verify";
import { browserVerifyNet } from "@/lib/receipt-verify-net";
import { verifyReportFileName } from "@/lib/verify-report-name";
import type * as VerifyPdf from "@/lib/verify-pdf";

// Generator PDF-a izvještaja (fontkit) učita se u pozadini po otvaranju stranice,
// ne u početnom paketu; do klika je već u memoriji, pa radi i bez mreže.
let verifyPdfModule: Promise<typeof VerifyPdf> | null = null;
const loadVerifyPdf = () => {
  verifyPdfModule ??= import("@/lib/verify-pdf").catch((e: unknown) => {
    verifyPdfModule = null;
    throw e;
  });
  return verifyPdfModule;
};

type Kind = "receipt" | "pdf" | "pdfNoJson" | "key" | "keyLocked" | "unknown";

interface LoadedFile {
  id: string;
  name: string;
  sha256: string;
  kind: Kind;
  /** Točni bajtovi JSON-a potvrde (iz datoteke ili iz privitka PDF-a). */
  receiptBytes?: Uint8Array;
  receipt?: ReceiptInput;
  keyText?: string;
}

const KIND_KEY: Record<Kind, MessageKey> = {
  receipt: "verify.kindReceipt",
  pdf: "verify.kindPdf",
  pdfNoJson: "verify.kindPdfNoJson",
  key: "verify.kindKey",
  keyLocked: "verify.kindKeyLocked",
  unknown: "verify.kindUnknown",
};

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

async function classify(file: File): Promise<LoadedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base = { id: `${file.name}:${file.size}:${file.lastModified}`, name: file.name, sha256: bytesToHex(sha256(bytes, "bytes")).slice(2) };
  if (new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") {
    try {
      for (const a of await pdfAttachments(bytes)) {
        const receipt = asReceipt(parseJson(a.data));
        if (receipt !== null) return { ...base, kind: "pdf", receipt, receiptBytes: a.data };
      }
    } catch {
      // Nečitljiv PDF: isto kao PDF bez privitka.
    }
    return { ...base, kind: "pdfNoJson" };
  }
  const json = parseJson(bytes);
  const receipt = asReceipt(json);
  if (receipt !== null) return { ...base, kind: "receipt", receipt, receiptBytes: bytes };
  if (json !== null && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const text = new TextDecoder().decode(bytes);
    if (typeof o.encrypted_key === "string" || typeof o.ct === "string") return { ...base, kind: "keyLocked", keyText: text };
    if (typeof o.pk === "string") return { ...base, kind: "key", keyText: text };
  }
  return { ...base, kind: "unknown" };
}

const MARK: Record<CheckStatus, string> = { ok: "✓", fail: "✗", warn: "!", pending: "…", skip: "–" };
const MARK_CLASS: Record<CheckStatus, string> = {
  ok: "bg-forest text-cream",
  fail: "bg-rust text-cream",
  warn: "bg-solar text-ink",
  pending: "bg-sand text-inkSoft",
  skip: "bg-sand text-inkMuted",
};

export function VerifyPage() {
  const { t, locale } = useT();
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [password, setPassword] = useState("");
  const [network, setNetwork] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [dragging, setDragging] = useState(false);

  // PDF izvještaja mora nastati i bez mreže: fontovi odmah u memoriju.
  useEffect(() => {
    loadPdfFonts().catch(() => {});
    loadVerifyPdf().catch(() => {});
  }, []);

  async function add(list: FileList | null) {
    if (list === null) return;
    const loaded = await Promise.all([...list].map(classify));
    setFiles((prev) => [...prev.filter((f) => !loaded.some((l) => l.id === f.id)), ...loaded]);
    setReport(null);
    setError(null);
  }

  const receiptFile = files.find((f) => f.receipt !== undefined);
  const keyFile = files.find((f) => f.kind === "key" || f.kind === "keyLocked");

  async function run() {
    setError(null);
    setReport(null);
    if (receiptFile?.receipt === undefined) {
      setError(files.some((f) => f.kind === "pdfNoJson") ? t("verify.errPdfNoJson") : t("verify.errNoReceipt"));
      return;
    }
    setRunning(true);
    try {
      let receipt = receiptFile.receipt;
      let key: ReceiptKey | null = null;
      if (keyFile?.keyText !== undefined) {
        try {
          key = await parseKeyFile(receipt.sid, keyFile.keyText, password);
        } catch (e) {
          const msg = e instanceof Error && e.message === "wrong_key" ? t("receipt.importWrongKey") : t("receipt.importBadFile");
          setError(t("verify.errKey", { error: msg }));
          setRunning(false);
          return;
        }
        // Javna potvrda (GET) nema vlasnika i salt; ključ ih daje.
        if (receipt.owner === null || receipt.salt === null) receipt = { ...receipt, owner: key.owner.toLowerCase(), salt: key.salt };
      }
      setReport(await verifyReceipt(receipt, { key, net: network ? browserVerifyNet() : null }));
    } finally {
      setRunning(false);
    }
  }

  const inputs = files.filter((f) => f.kind !== "unknown").map((f) => ({ name: f.name, sha256: f.sha256 }));
  const verifyUrl = typeof window === "undefined" ? "" : `${window.location.origin}/beta/provjera/`;

  async function downloadPdf() {
    if (report === null) return;
    const { buildVerifyPdf } = await loadVerifyPdf();
    const bytes = await buildVerifyPdf(report, inputs, receiptFile?.receiptBytes ?? null, await loadPdfFonts(), {
      t,
      formatEur: formatEurPrecise,
      generatedAt: new Date().toLocaleString(locale === "en" ? "en-GB" : "hr-HR"),
      verifyUrl,
    });
    downloadFile(verifyReportFileName(report.sid, "pdf"), new Uint8Array(bytes), "application/pdf");
  }

  const pendingAny = report?.checks.some((c) => c.status === "pending") ?? false;

  return (
    <div className="container-content max-w-3xl py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("verify.title")}</h1>
      <p className="mt-2 text-sm text-inkSoft">{t("verify.intro")}</p>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void add(e.dataTransfer.files);
        }}
        className={`mt-6 rounded-sm border-2 border-dashed p-4 sm:p-6 ${dragging ? "border-forest bg-forest/5" : "border-ink/15 bg-white"}`}
      >
        <h2 className="font-medium text-ink">{t("verify.dropTitle")}</h2>
        <p className="mt-1 text-sm text-inkSoft">{t("verify.dropHint")}</p>
        <label className="mt-3 inline-block cursor-pointer rounded-sm border border-ink/15 bg-sand px-4 py-2 text-sm text-ink">
          {t("verify.choose")}
          <input
            type="file"
            multiple
            accept=".pdf,.json,application/pdf,application/json"
            className="sr-only"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-3 divide-y divide-ink/8 text-sm">
            {files.map((f) => (
              <li key={f.id} data-kind={f.kind} className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
                <span className="min-w-0 break-all text-ink">{f.name}</span>
                <span className="flex items-baseline gap-3">
                  <span className={`text-xs ${f.kind === "unknown" || f.kind === "pdfNoJson" ? "text-rust" : "text-inkMuted"}`}>
                    {t(KIND_KEY[f.kind])}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles((prev) => prev.filter((x) => x.id !== f.id));
                      setReport(null);
                    }}
                    className="text-xs text-inkSoft underline"
                  >
                    {t("verify.remove")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {keyFile?.kind === "keyLocked" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("verify.password")}
            aria-label={t("verify.password")}
            className="mt-3 w-full max-w-xs rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm"
          />
        )}
        <label className="mt-4 flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" checked={network} onChange={(e) => setNetwork(e.target.checked)} className="mt-0.5 h-4 w-4 accent-forest" />
          <span>
            {t("verify.network")}
            <span className="mt-0.5 block text-xs text-inkMuted">{t("verify.networkHint")}</span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || files.length === 0}
          className="mt-4 rounded-sm bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-forest-700 disabled:opacity-50"
        >
          {running ? t("verify.running") : t("verify.run")}
        </button>
        {error !== null && <p className="mt-3 text-sm text-rust">{error}</p>}
      </section>

      {report !== null && (
        <section data-result={report.result} className="mt-6">
          <div className={`rounded-sm p-4 ${report.result === "ok" ? "bg-forest/10" : "bg-rust/10"}`}>
            <p className={`font-display text-lg font-semibold ${report.result === "ok" ? "text-forest" : "text-rust"}`}>
              {report.result === "ok" ? t("verify.resultOk") : t("verify.resultFail")}
            </p>
            {report.payments === 0 && <p className="mt-1 text-sm font-medium text-ink">{t("verify.resultEmpty")}</p>}
            {pendingAny && <p className="mt-1 text-sm text-inkSoft">{t("verify.resultPending")}</p>}
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("receipt.sid")}</dt>
              <dd className="break-all font-mono text-xs text-ink">{report.sid}</dd>
              <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("receipt.owner")}</dt>
              <dd className="break-all font-mono text-xs text-ink">{report.owner ?? "—"}</dd>
              <dt className="text-xs uppercase tracking-wide text-inkMuted">{t("receipt.total")}</dt>
              <dd className="text-ink">
                {formatEurPrecise(report.total_cents)} · {report.payments} {t("verify.paymentsCount").toLowerCase()}
              </dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void downloadPdf()}
                className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
              >
                {t("verify.downloadPdf")}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadFile(verifyReportFileName(report.sid, "json"), JSON.stringify({ ...report, inputs }, null, 2))
                }
                className="rounded-sm border border-ink/15 bg-white px-4 py-2 text-sm text-ink"
              >
                {t("verify.downloadJson")}
              </button>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {report.checks.map((c, i) => (
              <li key={c.id} data-check={c.id} data-status={c.status} className="rounded-sm border border-ink/10 bg-white p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${MARK_CLASS[c.status]}`}
                  >
                    {MARK[c.status]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {i + 1}. {t(`verify.step.${c.id}` as MessageKey, c.vars)}
                      <span className="ml-2 text-xs font-normal text-inkMuted">{t(`verify.status.${c.status}` as MessageKey)}</span>
                    </p>
                    <p className="mt-1 text-xs text-inkSoft">{t(`verify.why.${c.id}` as MessageKey)}</p>
                    {c.detail.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-forest">{t("verify.details")}</summary>
                        <pre className="mt-1 whitespace-pre-wrap break-all rounded-sm bg-sand p-2 font-mono text-[11px] text-ink">
                          {c.detail.join("\n")}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
