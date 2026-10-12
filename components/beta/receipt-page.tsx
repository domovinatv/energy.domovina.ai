"use client";

/**
 * `/beta/potvrda/?sid=…` — potvrda o uplati (docs/16 §4 #7). Predložak teksta i
 * rasporeda je railova stranica `mpt.domovina.ai/potvrda/:sid`
 * (`pay.domovina.ai/backend/src/receipts/client/main.ts`).
 *
 * Statički export: `sid` dolazi iz upita, ne iz dinamičke rute. Ključ se čita
 * iz istog `localStorage`-a u kojem ga je napravio `PayWithIntent`; s ključem
 * se potvrda traži potpisanim POST-om (vidi i naknadno potvrđene uplate), bez
 * njega javnim GET-om (samo izravna).
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { useT, type MessageKey } from "@/lib/i18n";
import { searchStore } from "@/lib/url-state";
import { formatDateShort, formatEurPrecise } from "@/lib/format";
import { BETA_PROJECTS, gnosisscanTxUrl } from "@/lib/beta-projects";
import { downloadFile } from "@/lib/download";
// Samo tip: sam modul (pdf-lib, fontkit) se učitava dinamički u loadPdfAssets.
import type * as ReceiptPdf from "@/lib/receipt-pdf";
import { isReceiptSid } from "@/lib/receipt-sid";
import {
  canonicalJson,
  fetchReceipt,
  otsUrl,
  receiptPublicPart,
  receiptStatusKey,
  recipientLabel,
  type Receipt,
  type ReceiptAnchor,
  type ReceiptResult,
} from "@/lib/receipt-api";
import {
  encryptKey,
  isKeyFor,
  keyFileJson,
  keyFileName,
  parseKeyFile,
  RECEIPT_KEY_EVENT,
  RECEIPT_STORE_PREFIX,
  receiptKeyStore,
  type ReceiptKey,
} from "@/lib/receipt-keys";

/**
 * pdf-lib, fontkit i tri fonta (~0,8 MB) — učitaju se jednom, u pozadini, čim se
 * otvori potvrda, ne na klik: „Preuzmi PDF" tada radi i bez mreže (PDF nastaje
 * isključivo u pregledniku). Neuspjelo učitavanje se ne pamti, klik pokuša ponovno.
 */
let pdfAssets: Promise<{
  buildReceiptPdf: typeof ReceiptPdf.buildReceiptPdf;
  receiptPdfFileName: typeof ReceiptPdf.receiptPdfFileName;
  fonts: ReceiptPdf.ReceiptPdfFonts;
}> | null = null;

function loadPdfAssets() {
  pdfAssets ??= (async () => {
    const mod = await import("@/lib/receipt-pdf");
    const load = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`font ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    };
    const [regular, semibold, display] = await Promise.all([
      load(mod.RECEIPT_PDF_FONT_URLS.regular),
      load(mod.RECEIPT_PDF_FONT_URLS.semibold),
      load(mod.RECEIPT_PDF_FONT_URLS.display),
    ]);
    return {
      buildReceiptPdf: mod.buildReceiptPdf,
      receiptPdfFileName: mod.receiptPdfFileName,
      fonts: { regular, semibold, display },
    };
  })().catch((e: unknown) => {
    pdfAssets = null;
    throw e;
  });
  return pdfAssets;
}

function subscribeKey(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECEIPT_KEY_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECEIPT_KEY_EVENT, onChange);
  };
}

/** Sirovi zapis ključa (string je stabilan snapshot; parsira se u `useMemo`). */
function useStoredKeyRaw(sid: string): string | null {
  return useSyncExternalStore(
    subscribeKey,
    () => {
      try {
        return window.localStorage.getItem(RECEIPT_STORE_PREFIX + sid);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

export function ReceiptPage() {
  const { t } = useT();
  const search = useSyncExternalStore(searchStore.subscribe, searchStore.getSnapshot, searchStore.getServerSnapshot);
  const sid = new URLSearchParams(search).get("sid") ?? "";
  if (search === "") return <Shell>{null}</Shell>;
  if (!isReceiptSid(sid)) {
    return (
      <Shell>
        <p className="text-sm text-rust">{t("receipt.noSid")}</p>
      </Shell>
    );
  }
  return <ReceiptView key={sid} sid={sid} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="container-content max-w-3xl py-8 print:max-w-none print:py-0">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("receipt.title")}</h1>
      {children}
    </div>
  );
}

function ReceiptView({ sid }: { sid: string }) {
  const { t } = useT();
  const raw = useStoredKeyRaw(sid);
  const key = useMemo<ReceiptKey | null>(() => {
    if (raw === null) return null;
    try {
      const k: unknown = JSON.parse(raw);
      return isKeyFor(sid, k) ? k : null;
    } catch {
      return null;
    }
  }, [raw, sid]);

  // Rezultat se veže uz zahtjev koji ga je dao; drugačiji zahtjev = „učitavam".
  const [attempt, setAttempt] = useState(0);
  const request = `${key?.owner ?? "-"}:${attempt}`;
  const [loaded, setLoaded] = useState<{ request: string; result: ReceiptResult } | null>(null);
  useEffect(() => {
    let live = true;
    fetchReceipt(sid, key).then((result) => {
      if (live) setLoaded({ request, result });
    });
    return () => {
      live = false;
    };
  }, [sid, key, request]);

  const result = loaded?.request === request ? loaded.result : null;

  return (
    <Shell>
      {result === null ? (
        <p className="mt-4 text-sm text-inkSoft">{t("receipt.loading")}</p>
      ) : !result.ok ? (
        <div className="mt-4">
          <p className="text-sm text-rust">{t("receipt.error", { error: result.error })}</p>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-2 text-sm text-forest underline underline-offset-2"
          >
            {t("receipt.retry")}
          </button>
        </div>
      ) : (
        <ReceiptDocument receipt={result.receipt} receiptKey={key} />
      )}
      {key === null ? <ImportKey sid={sid} /> : <PartB receiptKey={key} />}
    </Shell>
  );
}

function ReceiptDocument({ receipt: rc, receiptKey: key }: { receipt: Receipt; receiptKey: ReceiptKey | null }) {
  const { t, locale } = useT();
  const pub = receiptPublicPart(rc, key);
  const json = canonicalJson(pub);
  const total = rc.payments.reduce((s, p) => s + p.amount_cents, 0);
  const anchors = [
    ...new Map(
      rc.payments.filter((p) => p.anchor !== null).map((p) => [p.anchor!.anchor_id, p.anchor!] as const),
    ).values(),
  ].filter((a: ReceiptAnchor) => a.ots_available);
  const qrText = canonicalJson({ v: 1, sid: rc.sid, owner: pub.owner, salt: pub.salt });
  const statusKey = receiptStatusKey(rc.status);
  const hasRecipients = rc.payments.some((p) => p.target_address);
  const [pdf, setPdf] = useState<"idle" | "busy" | "error">("idle");
  // PDF mora nastati i bez mreže u trenutku klika: modul i fontovi u pozadini odmah.
  useEffect(() => {
    loadPdfAssets().catch(() => {});
  }, []);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          disabled={pdf === "busy"}
          onClick={async () => {
            setPdf("busy");
            try {
              // Sve je već učitano pri otvaranju potvrde (loadPdfAssets), pa klik radi i offline.
              const { buildReceiptPdf, receiptPdfFileName, fonts } = await loadPdfAssets();
              const bytes = await buildReceiptPdf(rc, key, fonts, {
                t,
                formatEur: formatEurPrecise,
                formatDate: (iso) => formatDateShort(iso, locale),
                generatedAt: new Date().toLocaleString(locale === "en" ? "en-GB" : "hr-HR"),
              });
              downloadFile(receiptPdfFileName(rc.sid), new Uint8Array(bytes), "application/pdf");
              setPdf("idle");
            } catch {
              setPdf("error");
            }
          }}
          className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700 disabled:opacity-50"
        >
          {pdf === "busy" ? t("receipt.pdfBusy") : t("receipt.downloadPdf")}
        </button>
        <button
          type="button"
          onClick={() => downloadFile(`mpt-potvrda-${rc.sid}.json`, json)}
          className="rounded-sm border border-ink/15 bg-white px-4 py-2 text-sm text-ink"
        >
          {t("receipt.downloadJson")}
        </button>
      </div>
      {pdf === "error" && <p className="mt-2 text-sm text-rust">{t("receipt.pdfError")}</p>}

      <article className="mt-6 rounded-sm border border-ink/10 bg-white p-4 sm:p-6 print:border-0 print:p-0">
        <p className="text-xs text-inkMuted">MPT · {rc.version}</p>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <Field label={t("receipt.sid")}>
            <code className="break-all font-mono text-xs">{rc.sid}</code>
          </Field>
          <Field label={t("receipt.label")}>{rc.intent.label ?? "—"}</Field>
          <Field label={t("receipt.target")}>
            <code className="break-all font-mono text-xs">{rc.intent.target_address}</code>
          </Field>
          {/* Bez potvrđenih redaka „0,00 €" bi izgledalo kao da uplata nije stigla;
              stanje ispod kaže što se dogodilo (npr. uplata bez reference). */}
          {rc.payments.length > 0 && (
            <Field label={t("receipt.total")}>
              <strong>{formatEurPrecise(total)}</strong>
            </Field>
          )}
          <Field label={t("receipt.owner")}>
            <code className="break-all font-mono text-xs">{pub.owner ?? t("receipt.ownerMissing")}</code>
          </Field>
        </dl>

        <p
          data-status={rc.status}
          className={
            rc.status === "issued"
              ? "mt-4 text-sm text-forest"
              : `mt-4 rounded-sm border p-3 text-sm font-medium ${statusKey === "receipt.statusNotDelivered" ? "border-rust/40 bg-rust/5 text-rust" : "border-solar/50 bg-solar-soft text-ink"}`
          }
        >
          {t(statusKey as MessageKey, { status: rc.status })}
        </p>

        {rc.payments.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-inkMuted">
                <tr>
                  <th className="py-1 pr-3 font-normal">{t("receipt.colDate")}</th>
                  <th className="py-1 pr-3 text-right font-normal">{t("receipt.colAmount")}</th>
                  <th className="py-1 pr-3 font-normal">{t("receipt.colKind")}</th>
                  {hasRecipients && <th className="py-1 pr-3 font-normal">{t("receipt.colRecipient")}</th>}
                  <th className="py-1 pr-3 font-normal">{t("receipt.colTx")}</th>
                  <th className="py-1 font-normal">{t("receipt.colAnchor")}</th>
                </tr>
              </thead>
              <tbody>
                {rc.payments.map((p) => (
                  <tr key={p.leaf_hash} data-kind={p.kind} className="border-t border-ink/8">
                    <td className="py-1.5 pr-3">{formatDateShort(p.placed_at, locale) || "—"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatEurPrecise(p.amount_cents)}</td>
                    <td className="py-1.5 pr-3">{p.kind === "direct" ? t("receipt.kindDirect") : t("receipt.kindLazy")}</td>
                    {hasRecipients && (
                      <td className="py-1.5 pr-3" title={p.target_address ?? undefined}>
                        {recipientLabel(p.target_address, BETA_PROJECTS) ?? "—"}
                      </td>
                    )}
                    <td className="py-1.5 pr-3 font-mono text-xs">
                      {p.tx_hash !== null ? (
                        <a href={gnosisscanTxUrl(p.tx_hash)} target="_blank" rel="noreferrer" className="text-forest underline">
                          {p.tx_hash.slice(0, 12)}…
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-1.5">{p.anchor !== null ? `#${p.anchor.anchor_id}` : t("receipt.anchorPending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rc.payments.some((p) => p.anchor === null) && (
              <p className="mt-2 text-xs text-inkMuted">{t("receipt.anchorNote")}</p>
            )}
          </div>
        )}
        {!rc.lazy_included && <p className="mt-3 text-xs text-inkMuted">{t("receipt.lazyOwnerOnly")}</p>}

        <section className="mt-6">
          <h2 className="font-medium text-ink">{t("receipt.verifyTitle")}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-inkSoft">
            <li>{t("receipt.verify1")}</li>
            <li>{t("receipt.verify2")}</li>
            <li>{t("receipt.verify3")}</li>
            <li>{t("receipt.verify4")}</li>
          </ol>
          {anchors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {anchors.map((a) => (
                <li key={a.anchor_id}>
                  <a href={otsUrl(a.anchor_id)} className="text-forest underline">
                    {t("receipt.anchorLink", { id: a.anchor_id })}
                  </a>{" "}
                  {t("receipt.anchorRoot")} <code className="break-all font-mono">{a.root}</code>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 break-all font-mono text-xs text-inkSoft">salt: {pub.salt ?? "—"}</p>
        </section>

        <section className="mt-6 flex items-center gap-4 print:break-inside-avoid">
          <Qr text={qrText} className="w-40 shrink-0" />
          <p className="text-xs text-inkMuted">{t("receipt.qrNote")}</p>
        </section>

        <section className="mt-6">
          <h2 className="font-medium text-ink">{t("receipt.jsonTitle")}</h2>
          <pre className="mt-2 whitespace-pre-wrap break-all rounded-sm bg-sand p-3 font-mono text-[11px] text-ink">
            {json}
          </pre>
        </section>
      </article>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wide text-inkMuted sm:pt-0.5">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </>
  );
}

function Qr({ text, className }: { text: string; className: string }) {
  const [svg, setSvg] = useState<{ text: string; svg: string } | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 2 }).then((s) => {
      if (live) setSvg({ text, svg: s });
    });
    return () => {
      live = false;
    };
  }, [text]);
  return svg?.text === text ? (
    <div
      className={`aspect-square bg-white [&_svg]:h-full [&_svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg.svg }}
    />
  ) : (
    <div className={`aspect-square bg-sand ${className}`} />
  );
}

function ImportKey({ sid }: { sid: string }) {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="mt-6 rounded-sm border border-ink/10 bg-sand p-4 print:hidden">
      <h2 className="font-medium text-ink">{t("receipt.importTitle")}</h2>
      <p className="mt-1 text-sm text-inkSoft">{t("receipt.importText")}</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("receipt.importPassword")}
        aria-label={t("receipt.importPassword")}
        className="mt-3 w-full max-w-xs rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm"
      />
      <label className="mt-3 block text-sm text-ink">
        <span className="text-xs uppercase tracking-wide text-inkMuted">{t("receipt.importFile")}</span>
        <input
          type="file"
          accept=".json,application/json"
          className="mt-1 block text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const k = await parseKeyFile(sid, await file.text(), password);
              setError(null);
              // Spremanjem se javi RECEIPT_KEY_EVENT i stranica sama prijeđe na potpisani dohvat.
              if (!receiptKeyStore.save(k)) setError(t("receipt.keyNotSaved"));
            } catch (err) {
              setError(err instanceof Error && err.message === "wrong_key" ? t("receipt.importWrongKey") : t("receipt.importBadFile"));
            }
          }}
        />
      </label>
      {error !== null && <p className="mt-2 text-sm text-rust">{t("receipt.importError", { error })}</p>}
    </section>
  );
}

/** Dio B: ključ za ispis/preuzimanje (rail `renderPartB`). Ispisuje se na zasebnoj stranici. */
function PartB({ receiptKey: key }: { receiptKey: ReceiptKey }) {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [locked, setLocked] = useState<string | null>(null);
  const [short, setShort] = useState(false);
  const secret = locked ?? JSON.stringify(key);
  return (
    <article className="mt-8 rounded-sm border border-rust/30 bg-white p-4 sm:p-6 print:break-before-page print:border-0 print:p-0">
      <h2 className="font-display text-xl font-semibold text-ink">{t("receipt.partBTitle")}</h2>
      <p className="mt-2 text-sm font-medium text-rust">{t("receipt.partBWarning")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("receipt.lockPassword")}
          aria-label={t("receipt.lockPassword")}
          className="w-full max-w-xs rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            if (password.length < 8) {
              setShort(true);
              return;
            }
            setShort(false);
            setLocked(JSON.stringify({ encrypted_key: await encryptKey(key, password) }));
          }}
          className="rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink"
        >
          {t("receipt.lock")}
        </button>
        <button
          type="button"
          onClick={() => downloadFile(keyFileName(key.sid), locked ?? keyFileJson(key))}
          className="rounded-sm border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink"
        >
          {t("receipt.downloadKey")}
        </button>
      </div>
      {short && <p className="mt-2 text-sm text-rust">{t("receipt.lockShort")}</p>}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Qr text={secret} className="w-48 shrink-0" />
        <div className="min-w-0">
          <pre className="whitespace-pre-wrap break-all rounded-sm bg-sand p-3 font-mono text-[11px] text-ink">{secret}</pre>
          <p className="mt-2 text-xs text-inkMuted">{locked !== null ? t("receipt.locked") : t("receipt.unlocked")}</p>
        </div>
      </div>
    </article>
  );
}
