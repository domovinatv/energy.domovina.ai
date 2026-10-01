/**
 * MPT payment intent iz preglednika — isti ugovor koji koriste rail checkout
 * (`pay.domovina.ai/backend/src/checkout/page.ts`) i domovina.ai/c/…/support.
 * Ništa novo: `POST /api/intents` stvori intent, `GET status_url` se čita svake
 * 2 s (SSE `/stream` je na railu rezerviran i vraća 404).
 *
 * Faze (`intents/stage.ts`): awaiting_payment → received_processing (Monerium je
 * ZAPRIMIO SEPA — „uplata je stigla", i kad prva uplata čeka provjeru) → minted →
 * forwarding → settled (EURe na Safeu elektrane); ili rejected / expired.
 *
 * Preduvjeti na railu: `energy.domovina.ai` u `ALLOWED_ORIGINS` i Safe registriran
 * kao kampanja (whitelist). Nova domena ovdje = nova stavka u CSP-u.
 */
import { RAIL_API_BASE, type Address } from "@/lib/beta-projects";

export interface PaymentIntent {
  sid: string;
  amountEur: string;
  memo: string;
  iban: string;
  beneficiaryName: string;
  bic: string | null;
  /** EPC tekst koji je rail sastavio — QR se crta iz njega, ne iz našeg koda. */
  epcQrData: string;
  statusUrl: string;
  expiresAt: string;
}

export type IntentResult =
  | { ok: true; intent: PaymentIntent }
  | { ok: false; reason: "not_whitelisted" | "invalid_amount" | "network" | "unknown" };

export type IntentStage =
  | "awaiting_payment"
  | "received_processing"
  | "minted"
  | "forwarding"
  | "settled"
  | "rejected"
  | "expired";

export interface IntentStatus {
  stage: IntentStage;
  forwardTxHash: string | null;
  /**
   * Railova procjena (`status.review_expected`): vjerojatno prva uplata s tog
   * IBAN-a, koju Monerium provjerava prije minta (od minute do ~8 h). Procjena
   * iz povijesti naloga, ne Moneriumova odluka — tekst to ne smije zvati „AML".
   */
  reviewExpected: boolean | null;
}

/** Kao checkout: uplata je „stigla" čim je Monerium zaprimi, prije minta. */
export function isReceived(stage: IntentStage): boolean {
  return stage === "received_processing" || stage === "minted" || stage === "forwarding";
}

export function isTerminal(stage: IntentStage): boolean {
  return stage === "settled" || stage === "rejected" || stage === "expired";
}

interface IntentJson {
  sid?: string;
  amount_eur?: string;
  memo?: string;
  iban?: string;
  beneficiary_name?: string;
  bic?: string | null;
  epc_qr_data?: string;
  status_url?: string;
  expires_at?: string;
  state?: string;
  forward_tx_hash?: string | null;
  status?: { stage?: IntentStage; review_expected?: boolean | null };
  error?: string;
}

export async function createPaymentIntent(target: Address, amountEur: number): Promise<IntentResult> {
  let res: Response;
  try {
    res = await fetch(RAIL_API_BASE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_address: target, amount_eur: amountEur.toFixed(2) }),
    });
  } catch {
    return { ok: false, reason: "network" };
  }
  const b = (await res.json().catch(() => ({}))) as IntentJson;
  if (res.ok && b.sid && b.epc_qr_data && b.status_url && b.memo && b.iban && b.beneficiary_name) {
    return {
      ok: true,
      intent: {
        sid: b.sid,
        amountEur: b.amount_eur ?? amountEur.toFixed(2),
        memo: b.memo,
        iban: b.iban,
        beneficiaryName: b.beneficiary_name,
        bic: b.bic ?? null,
        epcQrData: b.epc_qr_data,
        statusUrl: b.status_url,
        expiresAt: b.expires_at ?? "",
      },
    };
  }
  if (b.error === "target_not_whitelisted") return { ok: false, reason: "not_whitelisted" };
  if (b.error === "invalid_amount_eur" || b.error === "amount_out_of_range") return { ok: false, reason: "invalid_amount" };
  return { ok: false, reason: "unknown" };
}

export async function fetchIntentStatus(statusUrl: string, signal: AbortSignal): Promise<IntentStatus> {
  const res = await fetch(statusUrl, { signal });
  if (!res.ok) throw new Error(String(res.status));
  const b = (await res.json()) as IntentJson;
  // Isti zamjenski izbor kao checkout kad `status` izostane.
  const stage: IntentStage =
    b.status?.stage ?? (b.state === "paid" ? "settled" : b.state === "expired" ? "expired" : "awaiting_payment");
  return { stage, forwardTxHash: b.forward_tx_hash ?? null, reviewExpected: b.status?.review_expected ?? null };
}
