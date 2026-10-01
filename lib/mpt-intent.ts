/**
 * Stvaranje MPT payment intenta iz preglednika — `POST /api/intents` na
 * pay.domovina.ai (`backend/src/intents/api.ts`). Ništa novo: isti poziv koji
 * koriste wallet.domovina.ai i pinka. Odgovor nosi `checkout_url`, brendiranu
 * stranicu raila s jedinstvenim EPC QR-om i statusom uživo.
 *
 * Preduvjeti na railu: `energy.domovina.ai` u `ALLOWED_ORIGINS` (CORS) i Safe na
 * payout whitelisti tenanta. Nova domena ovdje = nova stavka u CSP-u.
 */
import { RAIL_API_BASE, type Address } from "@/lib/beta-projects";

export type IntentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; reason: "not_whitelisted" | "invalid_amount" | "network" | "unknown" };

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
  const body = (await res.json().catch(() => ({}))) as { checkout_url?: string; error?: string };
  if (res.ok && typeof body.checkout_url === "string") return { ok: true, checkoutUrl: body.checkout_url };
  if (body.error === "target_not_whitelisted") return { ok: false, reason: "not_whitelisted" };
  if (body.error === "invalid_amount_eur" || body.error === "amount_out_of_range") {
    return { ok: false, reason: "invalid_amount" };
  }
  return { ok: false, reason: "unknown" };
}
