"use client";

/**
 * „Moje uplate iz ovog preglednika" na stranici projekta (docs/16 §4.3): da se
 * do potvrde dođe i bez poznavanja `sid`-a. Popis su ključevi u `localStorage`
 * (`lib/receipt-index.ts`); stanje svake uplate dolazi javnim GET-om s raila.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useT, type MessageKey } from "@/lib/i18n";
import { formatEurPrecise } from "@/lib/format";
import {
  browserStorage,
  fetchPublicReceiptSummary,
  listLocalReceipts,
  RECEIPT_KEY_EVENT,
  receiptStatusKey,
  rememberReceipt,
  type PublicReceiptSummary,
} from "@/lib/receipt-index";

/** Koliko najnovijih uplata dohvaća stanje (javni GET po uplati). */
const MAX_SHOWN = 20;
/** Sklopljeno: stupac uplate ne smije rasti sa svakom uplatom iz ovog preglednika. */
const COLLAPSED = 3;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECEIPT_KEY_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECEIPT_KEY_EVENT, onChange);
  };
}
// String je stabilan snapshot (uspoređuje se po vrijednosti); parsira se u useMemo.
const getSnapshot = () => JSON.stringify(listLocalReceipts(browserStorage()));
const getServerSnapshot = () => "[]";

export function MyReceipts({ safe }: { safe: string }) {
  const { t, locale } = useT();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const all = useMemo(() => (JSON.parse(raw) as ReturnType<typeof listLocalReceipts>).slice(0, MAX_SHOWN), [raw]);
  const sidsKey = all.map((e) => e.sid).join(",");

  const [expanded, setExpanded] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, PublicReceiptSummary | null>>({});
  useEffect(() => {
    if (sidsKey === "") return;
    let live = true;
    const sids = sidsKey.split(",");
    Promise.all(sids.map(async (sid) => [sid, await fetchPublicReceiptSummary(sid)] as const)).then((rows) => {
      if (!live) return;
      setSummaries(Object.fromEntries(rows));
      // Ključevi bez zapisa u indeksu (stariji, uvezeni) dobiju primatelja i iznos.
      const storage = browserStorage();
      for (const [sid, s] of rows) {
        const entry = all.find((e) => e.sid === sid);
        if (s !== null && entry !== undefined && entry.target === null) rememberReceipt(storage, sid, s.target, s.amountCents);
      }
    });
    return () => {
      live = false;
    };
    // `all` se mijenja zajedno sa `sidsKey`; ponovni dohvat samo kad se promijeni popis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidsKey]);

  const target = safe.toLowerCase();
  const mine = all.filter((e) => (e.target ?? summaries[e.sid]?.target) === target);
  if (mine.length === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "hr-HR", { dateStyle: "short", timeStyle: "short" });

  return (
    <section data-my-receipts className="mt-5 border-t border-ink/10 pt-4">
      <h4 className="text-sm font-medium text-ink">{t("receipt.mineTitle")}</h4>
      <p className="mt-1 text-xs text-inkMuted">{t("receipt.mineNote")}</p>
      <ul className="mt-2 divide-y divide-ink/8 text-sm">
        {(expanded ? mine : mine.slice(0, COLLAPSED)).map((e) => {
          const s = summaries[e.sid];
          const cents = e.amountCents ?? s?.amountCents ?? null;
          const statusKey = s ? (receiptStatusKey(s.status).replace("receipt.status", "receipt.short") as MessageKey) : null;
          return (
            <li key={e.sid} data-sid={e.sid} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2">
              <span className="text-inkSoft">
                {e.createdAt > 0 ? dateFmt.format(new Date(e.createdAt * 1000)) : "—"}
                {cents !== null && <span className="ml-2 tabular-nums text-ink">{formatEurPrecise(cents)}</span>}
              </span>
              <span className="flex items-baseline gap-3">
                {statusKey !== null && (
                  <span className={`text-xs ${s?.status === "issued" ? "text-forest" : "text-inkMuted"}`}>{t(statusKey)}</span>
                )}
                <a href={`/beta/potvrda/?sid=${encodeURIComponent(e.sid)}`} className="text-forest underline underline-offset-2">
                  {t("receipt.open")}
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      {!expanded && mine.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm text-forest underline underline-offset-2"
        >
          {t("common.showMore")} ({mine.length - COLLAPSED})
        </button>
      )}
    </section>
  );
}
