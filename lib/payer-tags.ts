/**
 * Javna oznaka uplatitelja na popisu uplata: inicijali + zadnje 4 znamenke
 * IBAN-a („M. S. ··0160"). Uplatitelj na bilo kojem ekranu (mobitel, TV na
 * štandu) prepozna svoju uplatu čim je Monerium zaprimi, a ime i IBAN ne
 * izlaze s raila.
 *
 * Izvor je rail `GET /api/payers/:address` (pay.domovina.ai, migracija 0032),
 * uključen po tenantu (`RailProfile.payerTags`). Rail šalje i `ref` =
 * SHA-256(sid)[:16], da preglednik koji zna svoj sid prepozna svoj redak bez
 * objave sida.
 */
import type { RailProfile } from "@/lib/rail-profile";

export interface PayerTag {
  /** „M. S. ··0160"; `null` kad rail ne zna ni ime ni IBAN. */
  label: string | null;
  cents: number;
  /** Kad je Monerium zaprimio uplatu (ms); `null` ako rail ne zna. */
  receivedAt: number | null;
  minted: boolean;
  /** Svi hashevi uplate na lancu (mint, forward), mala slova. */
  txHashes: string[];
  ref: string | null;
}

/**
 * Koliko dugo se zaprimljena uplata koje nema na lancu broji i prikazuje. Prva
 * uplata s novog IBAN-a čeka do ~8 h; dulje od dana znači da je riješena izvan
 * raila, i takav redak ne smije trajno napuhavati zbroj.
 */
export const RAIL_PENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

export function payersUrl(rail: RailProfile, safe: string): string {
  return `${rail.apiBase.replace(/\/intents$/, "/payers")}/${safe}`;
}

export function payerLabel(initials: unknown, last4: unknown): string | null {
  const parts = [
    typeof initials === "string" && initials !== "" ? initials : null,
    typeof last4 === "string" && /^[0-9A-Z]{4}$/.test(last4) ? `··${last4}` : null,
  ].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(" ") : null;
}

function parseTag(raw: unknown): PayerTag | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.amount_cents !== "number" || !Number.isSafeInteger(r.amount_cents)) return null;
  const at = typeof r.received_at === "string" ? Date.parse(r.received_at) : NaN;
  return {
    label: payerLabel(r.initials, r.iban_last4),
    cents: r.amount_cents,
    receivedAt: Number.isNaN(at) ? null : at,
    minted: r.state === "minted",
    txHashes: Array.isArray(r.tx_hashes)
      ? r.tx_hashes.filter((h): h is string => typeof h === "string").map((h) => h.toLowerCase())
      : [],
    ref: typeof r.ref === "string" ? r.ref : null,
  };
}

export function parsePayerTags(body: unknown): PayerTag[] {
  const data = typeof body === "object" && body !== null ? (body as { data?: unknown }).data : undefined;
  return Array.isArray(data) ? data.map(parseTag).filter((t): t is PayerTag => t !== null) : [];
}

export async function fetchPayerTags(safe: string, signal: AbortSignal, rail: RailProfile): Promise<PayerTag[]> {
  if (!rail.payerTags) return [];
  const res = await fetch(payersUrl(rail, safe), { signal });
  if (!res.ok) throw new Error(`payers ${res.status}`);
  return parsePayerTags(await res.json());
}

/** Isti izračun kao rail `payerRef`. */
export async function payerRef(sid: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sid));
  return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Oznaka po hashu prijenosa na lancu. */
export function tagsByHash(tags: readonly PayerTag[]): Map<string, PayerTag> {
  const map = new Map<string, PayerTag>();
  for (const tag of tags) for (const h of tag.txHashes) map.set(h, tag);
  return map;
}

/**
 * Uplate koje je rail zaprimio, a nema ih na lancu ni u uplatiteljevom
 * localStorageu (`ownRefs`) — njih vide svi ostali ekrani. Bez `receivedAt` ili
 * starije od RAIL_PENDING_WINDOW_MS se ne prikazuju.
 */
export function railOnlyPending(
  tags: readonly PayerTag[],
  chainTxHashes: readonly string[],
  ownRefs: ReadonlySet<string>,
  now: number,
): PayerTag[] {
  const onChain = new Set(chainTxHashes.map((h) => h.toLowerCase()));
  return tags.filter(
    (t) =>
      !t.txHashes.some((h) => onChain.has(h)) &&
      !(t.ref !== null && ownRefs.has(t.ref)) &&
      t.receivedAt !== null &&
      now - t.receivedAt < RAIL_PENDING_WINDOW_MS,
  );
}
