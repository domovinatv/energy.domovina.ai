/**
 * Potvrda o uplati — ugovor s railom (pay.domovina.ai ADR 0022, docs/16 §3).
 *
 *   POST /api/intents                 + `sid` izveden iz ključa (createReceiptIntent)
 *   GET  /api/intents/:sid/receipt    javno: samo izravna uplata
 *   POST /api/intents/:sid/receipt    vlasnik (potpis ključem): + naknadne uplate
 *
 * Referentni klijent je railov `receipts/client/main.ts`; poruka za potpis i
 * kanonski JSON moraju biti točno njegovi.
 */
import { privateKeyToAccount } from "viem/accounts";
import { RAIL_API_BASE, type Address } from "@/lib/beta-projects";
import { createPaymentIntent, type IntentResult } from "@/lib/mpt-intent";
import { newReceiptKey, type ReceiptKey, type ReceiptKeyStore } from "@/lib/receipt-keys";

export interface ReceiptAnchor {
  anchor_id: number;
  root: string;
  proof: string[];
  ots_available: boolean;
  anchored_at: number;
}

export interface ReceiptPayment {
  kind: "direct" | "lazy";
  order_id: string;
  tx_hash: string | null;
  amount_cents: number;
  placed_at: string | null;
  leaf_hash: string;
  anchor: ReceiptAnchor | null;
}

export interface Receipt {
  version: string;
  sid: string;
  chain_id: number;
  status: string;
  intent: {
    amount_cents: number;
    currency: string;
    label: string | null;
    target_address: string;
    tenant_id: string | null;
    created_at: number;
    paid_at: number | null;
  };
  forward_tx_hash: string | null;
  /** Danas `null`: PaymentRegistry nije deployan (docs/16 §6). */
  payment_registry: string | null;
  payments: ReceiptPayment[];
  lazy_included: boolean;
  /** Samo u odgovoru na potpisani POST. */
  owner?: string;
  salt?: string;
}

export type ReceiptResult = { ok: true; receipt: Receipt } | { ok: false; error: string };

const RAIL_ORIGIN = new URL(RAIL_API_BASE).origin;

export const otsUrl = (anchorId: number) => `${RAIL_ORIGIN}/api/receipts/anchors/${anchorId}.ots`;

/** Točan tekst koji vlasnik potpisuje (EIP-191 `personal_sign`), rail `receiptRequestMessage`. */
export function receiptRequestMessage(sid: string, ts: number): string {
  return `MPT potvrda o uplati\nsid: ${sid}\nvrijeme: ${ts}`;
}

export async function signedReceiptRequest(key: ReceiptKey, sid: string, ts: number) {
  const account = privateKeyToAccount(key.pk);
  const signature = await account.signMessage({ message: receiptRequestMessage(sid, ts) });
  return { owner: account.address, salt: key.salt, ts, signature };
}

export interface ReceiptDeps {
  fetch: typeof fetch;
  nowS: () => number;
}

const browserDeps = (): ReceiptDeps => ({
  fetch: (...a) => fetch(...a),
  nowS: () => Math.floor(Date.now() / 1000),
});

/** S ključem potpisani POST (izravne + naknadne uplate), bez ključa javni GET. */
export async function fetchReceipt(
  sid: string,
  key: ReceiptKey | null,
  deps: ReceiptDeps = browserDeps(),
): Promise<ReceiptResult> {
  const url = `${RAIL_API_BASE}/${encodeURIComponent(sid)}/receipt`;
  let res: Response;
  try {
    res =
      key === null
        ? await deps.fetch(url)
        : await deps.fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(await signedReceiptRequest(key, sid, deps.nowS())),
          });
  } catch {
    return { ok: false, error: "network" };
  }
  const b = (await res.json().catch(() => ({}))) as Partial<Receipt> & { error?: string };
  if (res.ok && b.version !== undefined && Array.isArray(b.payments)) return { ok: true, receipt: b as Receipt };
  return { ok: false, error: b.error ?? `http_${res.status}` };
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

/**
 * Kanonski JSON kao rail (`canonical`): ključevi sortirani na svakoj razini,
 * bez razmaka, `undefined` izostavljen.
 */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
    .join(",")}}`;
}

/** Javni dio potvrde — ono što ide u „Preuzmi potvrdu (JSON)" i na ispis (rail `publicPart`). */
export function receiptPublicPart(rc: Receipt, key: ReceiptKey | null) {
  return {
    version: rc.version,
    sid: rc.sid,
    chain_id: rc.chain_id,
    owner: rc.owner ?? key?.owner ?? null,
    salt: rc.salt ?? key?.salt ?? null,
    intent: rc.intent,
    payment_registry: rc.payment_registry,
    payments: rc.payments,
  };
}

export type ReceiptIntentResult = IntentResult & { key: ReceiptKey | null; saved: boolean };

/**
 * Intent s potvrdom: novi ključ se SPREMA PRIJE POST-a (uplata nikad ne smije
 * nadživjeti svoj ključ); na `409 sid_already_exists` jedan novi ključ i još
 * jedan pokušaj (docs/16 §3.2). `saved = false` → UI traži preuzimanje
 * datoteke prije prikaza QR-a.
 */
export async function createReceiptIntent(
  target: Address,
  amountEur: number,
  store: ReceiptKeyStore,
  create: typeof createPaymentIntent = createPaymentIntent,
  makeKey: () => ReceiptKey = newReceiptKey,
): Promise<ReceiptIntentResult> {
  let last: IntentResult = { ok: false, reason: "unknown" };
  for (let attempt = 0; attempt < 2; attempt++) {
    const key = makeKey();
    const saved = store.save(key);
    last = await create(target, amountEur, { receiptSid: key.sid });
    if (last.ok || last.reason !== "sid_conflict") return { ...last, key, saved };
  }
  return { ...last, key: null, saved: false };
}
