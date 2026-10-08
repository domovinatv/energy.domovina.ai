/**
 * MPT payment intent iz preglednika — isti ugovor koji koriste rail checkout
 * (`pay.domovina.ai/backend/src/checkout/page.ts`) i domovina.ai/c/…/support.
 * `POST /api/intents` stvori intent; status stiže SSE-om s
 * `/api/intents/:sid/stream` (pay.domovina.ai ADR 0017 §SSE) u trenutku
 * Monerium webhooka, a `GET status_url` svake 2 s je rezerva dok stream nije
 * spojen ili kad padne (`watchIntentStatus`).
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
  status?: { stage?: IntentStage; review_expected?: boolean | null; forward_tx_hash?: string | null };
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

/**
 * Isti oblik dolazi iz `GET status_url` i iz SSE eventa (`{sid, state, status}`,
 * gdje je `status` bajt-identičan pollingu). Zamjenski izbor faze kad `status`
 * izostane je isti kao u checkoutu.
 */
export function statusFromJson(b: IntentJson): IntentStatus {
  const stage: IntentStage =
    b.status?.stage ?? (b.state === "paid" ? "settled" : b.state === "expired" ? "expired" : "awaiting_payment");
  return {
    stage,
    forwardTxHash: b.forward_tx_hash ?? b.status?.forward_tx_hash ?? null,
    reviewExpected: b.status?.review_expected ?? null,
  };
}

export async function fetchIntentStatus(statusUrl: string, signal: AbortSignal): Promise<IntentStatus> {
  const res = await fetch(statusUrl, { signal });
  if (!res.ok) throw new Error(String(res.status));
  return statusFromJson((await res.json()) as IntentJson);
}

export const intentStreamUrl = (sid: string) => `${RAIL_API_BASE}/${encodeURIComponent(sid)}/stream`;

/** Kako status trenutno stiže — za `data-transport` na panelu i provjeru u pregledniku. */
export type IntentTransport = "sse" | "poll";

/** Ono što `watchIntentStatus` treba od `EventSource` — u testu se podmeće. */
export interface StreamSource {
  readonly readyState: number;
  addEventListener(type: "stage", listener: (ev: { data: string }) => void): void;
  onerror: ((ev: unknown) => void) | null;
  close(): void;
}

export interface WatchDeps {
  openStream: ((url: string) => StreamSource) | null;
  fetchStatus: (statusUrl: string, signal: AbortSignal) => Promise<IntentStatus>;
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
  /**
   * Javlja povratak na stranicu (kartica opet vidljiva). Vraća odjavu.
   * Na istom mobitelu uplatitelj iz Revoluta skoči natrag tek nakon „Send";
   * iOS je dotad uspavao SSE i timere, pa bez ovoga promjena čeka ponovno
   * spajanje streama ili sljedeći krug pollinga.
   */
  onVisible?: (fn: () => void) => () => void;
}

export const POLL_MS = 2_000;
const CLOSED = 2;

function browserDeps(): WatchDeps {
  return {
    openStream: typeof EventSource === "undefined" ? null : (url) => new EventSource(url) as unknown as StreamSource,
    fetchStatus: fetchIntentStatus,
    setTimeout: (fn, ms) => window.setTimeout(fn, ms),
    clearTimeout: (id) => window.clearTimeout(id),
    onVisible: (fn) => {
      const h = () => {
        if (document.visibilityState === "visible") fn();
      };
      document.addEventListener("visibilitychange", h);
      return () => document.removeEventListener("visibilitychange", h);
    },
  };
}

const sameStatus = (a: IntentStatus, b: IntentStatus) =>
  a.stage === b.stage && a.forwardTxHash === b.forwardTxHash && a.reviewExpected === b.reviewExpected;

/**
 * Prati status intenta dok ne dođe do završne faze. Obrazac je railov checkout
 * (`checkout/page.ts` `startStream`): polling i stream kreću zajedno, prvi SSE
 * event gasi polling, greška streama ga vraća. Tako nema rupe ni kad je SSE na
 * railu isključen (404) ni kad preglednik nema `EventSource`.
 *
 * `onStatus` se zove samo kad se status promijeni — ne pri svakom odgovoru
 * (refactor R4.2: `savePending` je pisao `localStorage` svake 2 s).
 * Vraća funkciju za gašenje.
 */
export function watchIntentStatus(
  intent: Pick<PaymentIntent, "sid" | "statusUrl">,
  onStatus: (s: IntentStatus) => void,
  onTransport: (t: IntentTransport) => void = () => {},
  deps: WatchDeps = browserDeps(),
): () => void {
  const controller = new AbortController();
  let timer: number | undefined;
  let polling = false;
  let done = false;
  let last: IntentStatus | null = null;
  let stream: StreamSource | null = null;
  const cleanups: (() => void)[] = [];

  const stop = () => {
    done = true;
    controller.abort();
    if (timer !== undefined) deps.clearTimeout(timer);
    stream?.close();
    for (const off of cleanups) off();
  };

  const apply = (s: IntentStatus) => {
    if (done) return;
    if (last === null || !sameStatus(last, s)) {
      last = s;
      onStatus(s);
    }
    if (isTerminal(s.stage)) stop();
  };

  const poll = () => {
    if (!polling || done) return;
    deps.fetchStatus(intent.statusUrl, controller.signal).then(
      (s) => {
        apply(s);
        if (polling && !done) timer = deps.setTimeout(poll, POLL_MS);
      },
      () => {
        // Prolazna greška mreže: pokušaj ponovno, prikaz ostaje kakav jest.
        if (polling && !done) timer = deps.setTimeout(poll, POLL_MS);
      },
    );
  };

  const startPolling = () => {
    if (polling || done) return;
    polling = true;
    onTransport("poll");
    poll();
  };

  const stopPolling = () => {
    polling = false;
    if (timer !== undefined) deps.clearTimeout(timer);
    timer = undefined;
  };

  startPolling();

  // Povratak iz aplikacije banke: jedan dohvat odmah, ne čeka stream ni timer.
  if (deps.onVisible) {
    cleanups.push(
      deps.onVisible(() => {
        if (done) return;
        deps.fetchStatus(intent.statusUrl, controller.signal).then(apply, () => {});
      }),
    );
  }

  if (deps.openStream !== null) {
    try {
      stream = deps.openStream(intentStreamUrl(intent.sid));
    } catch {
      stream = null;
    }
    if (stream !== null) {
      const es = stream;
      es.addEventListener("stage", (ev) => {
        let b: IntentJson;
        try {
          b = JSON.parse(ev.data) as IntentJson;
        } catch {
          return;
        }
        if (polling) {
          stopPolling();
          onTransport("sse");
        }
        apply(statusFromJson(b));
      });
      es.onerror = () => {
        if (done) return;
        // CLOSED: rail je odbio (404 dok je SSE isključen) — od sad samo polling.
        // CONNECTING: EventSource se sam ponovno spaja; dotad polling.
        startPolling();
        if (es.readyState === CLOSED) es.close();
      };
    }
  }

  return stop;
}
