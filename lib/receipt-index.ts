/**
 * Popis potvrda o uplati napravljenih u OVOM pregledniku (docs/16 §4.3).
 *
 * Izvor istine su sami ključevi (`mpt-receipt:<sid>`, isti prefiks kao rail):
 * svaki ključ je jedna uplata s potvrdom, pa se popis ne može razići s
 * ključevima. Uz to se pamti mali indeks `{ sid, target, amountCents }` da
 * stranica projekta pokaže samo svoje uplate bez dohvaćanja. Ključ bez zapisa
 * u indeksu (stariji ključevi, uvezeni ključ) dopuni se jednim javnim GET-om.
 *
 * ⚠️ Bez viema: ovaj modul ide u paket svake `/beta/<slug>/` stranice.
 */
import { RAIL_API_BASE } from "@/lib/beta-projects";

/** Isti prefiks kao rail (`STORE_PREFIX`). */
export const RECEIPT_STORE_PREFIX = "mpt-receipt:";
/** Javlja promjenu ključa ili indeksa u istoj kartici (`storage` stiže samo iz drugih). */
export const RECEIPT_KEY_EVENT = "domovina-energy:receipt-key";
const INDEX_KEY = "domovina-energy:potvrde";

export interface ReceiptIndexEntry {
  sid: string;
  /** Safe primatelja, malim slovima; `null` dok nije poznat. */
  target: string | null;
  amountCents: number | null;
  /** Unix sekunde, iz ključa. */
  createdAt: number;
}

type Meta = Record<string, { target: string; amountCents: number }>;

function readMeta(storage: Storage): Meta {
  try {
    const raw = storage.getItem(INDEX_KEY);
    const m: unknown = raw ? JSON.parse(raw) : {};
    return m !== null && typeof m === "object" ? (m as Meta) : {};
  } catch {
    return {};
  }
}

/** Sve potvrde iz preglednika, najnovije prve. Nikad ne baca. */
export function listLocalReceipts(storage: Storage | null): ReceiptIndexEntry[] {
  if (storage === null) return [];
  try {
    const meta = readMeta(storage);
    const out: ReceiptIndexEntry[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k === null || !k.startsWith(RECEIPT_STORE_PREFIX)) continue;
      const sid = k.slice(RECEIPT_STORE_PREFIX.length);
      let createdAt = 0;
      try {
        const key = JSON.parse(storage.getItem(k) ?? "{}") as { created_at?: unknown };
        if (typeof key.created_at === "number") createdAt = key.created_at;
      } catch {
        continue;
      }
      const m = meta[sid];
      out.push({ sid, target: m?.target ?? null, amountCents: m?.amountCents ?? null, createdAt });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** Zapamti primatelja i iznos uz `sid`. Vraća `false` kad spremanje ne uspije. */
export function rememberReceipt(
  storage: Storage | null,
  sid: string,
  target: string,
  amountCents: number,
): boolean {
  if (storage === null) return false;
  try {
    const meta = readMeta(storage);
    meta[sid] = { target: target.toLowerCase(), amountCents };
    storage.setItem(INDEX_KEY, JSON.stringify(meta));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(RECEIPT_KEY_EVENT));
    return true;
  } catch {
    return false;
  }
}

/**
 * Ime datoteke ključa: sufiks kaže je li zaključan lozinkom, a vrijeme
 * preuzimanja čini svako preuzimanje zasebnom datotekom (ništa se ne prepiše,
 * a otključana i zaključana kopija se ne zamijene). Rail uvoz čita bilo koje ime.
 */
export function keyBackupFileName(sid: string, locked: boolean, now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  return `mpt-kljuc-${sid}-${locked ? "zakljucan" : "otkljucan"}-${stamp}.json`;
}

export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export type ReceiptStatusKey =
  | "receipt.statusIssued"
  | "receipt.statusAwaiting"
  | "receipt.statusSettling"
  | "receipt.statusUnbound"
  | "receipt.statusNotDelivered"
  | "receipt.statusUnknown";

/**
 * `status` → tekst (docs/16 §3.3). Rail vraća i `confirmed` (forward potvrđen,
 * izravni redak još nije upisan) — za korisnika je to isto što i `settling`.
 */
export function receiptStatusKey(status: string): ReceiptStatusKey {
  if (status === "issued") return "receipt.statusIssued";
  if (status === "awaiting_payment") return "receipt.statusAwaiting";
  if (status === "settling" || status === "confirmed") return "receipt.statusSettling";
  if (status === "unbound_stray") return "receipt.statusUnbound";
  if (status.startsWith("not_delivered:")) return "receipt.statusNotDelivered";
  return "receipt.statusUnknown";
}

export interface PublicReceiptSummary {
  status: string;
  target: string;
  amountCents: number;
  /** Zbroj izravnih redaka (javni GET ne vidi naknadne). */
  directCents: number;
}

/** Javni GET (bez ključa, bez viema): stanje, primatelj i iznos intenta. */
export async function fetchPublicReceiptSummary(
  sid: string,
  fetchFn: typeof fetch = (...a) => fetch(...a),
): Promise<PublicReceiptSummary | null> {
  try {
    const res = await fetchFn(`${RAIL_API_BASE}/${encodeURIComponent(sid)}/receipt`);
    if (!res.ok) return null;
    const b = (await res.json()) as {
      status?: string;
      intent?: { target_address?: string; amount_cents?: number };
      payments?: { kind?: string; amount_cents?: number }[];
    };
    if (typeof b.status !== "string" || typeof b.intent?.target_address !== "string") return null;
    return {
      status: b.status,
      target: b.intent.target_address.toLowerCase(),
      amountCents: b.intent.amount_cents ?? 0,
      directCents: (b.payments ?? []).filter((p) => p.kind === "direct").reduce((s, p) => s + (p.amount_cents ?? 0), 0),
    };
  } catch {
    return null;
  }
}
