import { describe, expect, it } from "vitest";
import {
  createPaymentIntent,
  intentStreamUrl,
  POLL_MS,
  statusFromJson,
  watchIntentStatus,
  type IntentStatus,
  type IntentTransport,
  type StreamSource,
  type WatchDeps,
} from "@/lib/mpt-intent";

const INTENT = { sid: "abc123", statusUrl: "https://mpt.domovina.ai/api/intents/abc123" };

const st = (stage: IntentStatus["stage"], forwardTxHash: string | null = null): IntentStatus => ({
  stage,
  forwardTxHash,
  reviewExpected: null,
});

/** SSE event kakav rail šalje (`intents/stream.ts` `formatEvent`). */
const sse = (stage: string, forwardTxHash: string | null = null) =>
  JSON.stringify({ sid: INTENT.sid, state: "pending", status: { stage, forward_tx_hash: forwardTxHash } });

class FakeStream implements StreamSource {
  readyState = 0;
  onerror: ((ev: unknown) => void) | null = null;
  closed = false;
  private listeners: ((ev: { data: string }) => void)[] = [];
  addEventListener(_type: "stage", l: (ev: { data: string }) => void) {
    this.listeners.push(l);
  }
  emit(data: string) {
    this.readyState = 1;
    for (const l of this.listeners) l({ data });
  }
  fail(readyState: number) {
    this.readyState = readyState;
    this.onerror?.({});
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
}

/** Ručni sat i red odgovora za polling — bez stvarnog čekanja. */
function harness(withStream: boolean) {
  const timers = new Map<number, () => void>();
  let nextId = 1;
  const polls: ((s: IntentStatus) => void)[] = [];
  let pollCount = 0;
  const stream = new FakeStream();
  const opened: string[] = [];
  let visible: (() => void) | null = null;
  const deps: WatchDeps = {
    onVisible: (fn) => {
      visible = fn;
      return () => {
        visible = null;
      };
    },
    openStream: withStream
      ? (url) => {
          opened.push(url);
          return stream;
        }
      : null,
    fetchStatus: () => {
      pollCount += 1;
      return new Promise((resolve) => polls.push(resolve));
    },
    setTimeout: (fn) => {
      const id = nextId++;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
  };
  const seen: IntentStatus[] = [];
  const transports: IntentTransport[] = [];
  const stop = watchIntentStatus(INTENT, (s) => seen.push(s), (t) => transports.push(t), deps);
  return {
    stream,
    opened,
    seen,
    transports,
    stop,
    timers,
    get pollCount() {
      return pollCount;
    },
    /** Kartica opet vidljiva (povratak iz aplikacije banke). */
    becomeVisible() {
      visible?.();
    },
    get listening() {
      return visible !== null;
    },
    /** Odgovori na najstariji otvoreni poll i pusti mikrozadatke. */
    async answer(s: IntentStatus) {
      polls.shift()?.(s);
      await Promise.resolve();
      await Promise.resolve();
    },
    /** Okini sve zakazane timere (sljedeći krug pollinga). */
    tick() {
      const fns = [...timers.values()];
      timers.clear();
      for (const f of fns) f();
    },
  };
}

describe("statusFromJson", () => {
  it("čita fazu i hash iz `status` (oblik SSE eventa)", () => {
    expect(
      statusFromJson({ state: "paid", status: { stage: "settled", forward_tx_hash: "0xabc", review_expected: false } }),
    ).toEqual({ stage: "settled", forwardTxHash: "0xabc", reviewExpected: false });
  });

  it("hash na vrhu (oblik `GET status_url`) ima prednost", () => {
    expect(statusFromJson({ forward_tx_hash: "0x1", status: { stage: "settled", forward_tx_hash: "0x2" } }).forwardTxHash).toBe(
      "0x1",
    );
  });

  it("bez `status` faza dolazi iz `state`, kao u checkoutu", () => {
    expect(statusFromJson({ state: "paid" }).stage).toBe("settled");
    expect(statusFromJson({ state: "expired" }).stage).toBe("expired");
    expect(statusFromJson({ state: "pending" }).stage).toBe("awaiting_payment");
  });
});

describe("watchIntentStatus", () => {
  it("povratak na karticu odmah dohvaća status, i kad stream čeka ponovno spajanje", async () => {
    const h = harness(true);
    await h.answer({ stage: "awaiting_payment", forwardTxHash: null, reviewExpected: null });
    const before = h.pollCount;
    h.becomeVisible();
    expect(h.pollCount).toBe(before + 1);
    await h.answer({ stage: "received_processing", forwardTxHash: null, reviewExpected: null });
    expect(h.seen.at(-1)?.stage).toBe("received_processing");
  });

  it("stop odjavljuje slušanje povratka na karticu", () => {
    const h = harness(true);
    expect(h.listening).toBe(true);
    h.stop();
    expect(h.listening).toBe(false);
  });

  it("otvara stream na railu za taj sid", () => {
    const h = harness(true);
    expect(h.opened).toEqual([intentStreamUrl(INTENT.sid)]);
    expect(intentStreamUrl("a b")).toBe("https://mpt.domovina.ai/api/intents/a%20b/stream");
    h.stop();
  });

  it("prvi SSE event gasi polling", async () => {
    const h = harness(true);
    expect(h.transports).toEqual(["poll"]);
    h.stream.emit(sse("awaiting_payment"));
    expect(h.transports).toEqual(["poll", "sse"]);
    await h.answer(st("awaiting_payment"));
    expect(h.timers.size).toBe(0);
    h.tick();
    expect(h.pollCount).toBe(1);
    h.stop();
  });

  it("javlja samo promjene, ne svaki event", () => {
    const h = harness(true);
    h.stream.emit(sse("awaiting_payment"));
    h.stream.emit(sse("awaiting_payment"));
    h.stream.emit(sse("received_processing"));
    h.stream.emit(sse("received_processing"));
    expect(h.seen.map((s) => s.stage)).toEqual(["awaiting_payment", "received_processing"]);
    h.stop();
  });

  it("završna faza zatvara stream — EventSource se ne spaja ponovno", () => {
    const h = harness(true);
    h.stream.emit(sse("settled", "0xfeed"));
    expect(h.seen.at(-1)).toEqual(st("settled", "0xfeed"));
    expect(h.stream.closed).toBe(true);
    h.stream.emit(sse("settled", "0xfeed"));
    expect(h.seen).toHaveLength(1);
  });

  it("SSE isključen na railu (404 → CLOSED): ostaje polling svake 2 s", async () => {
    const h = harness(true);
    h.stream.fail(2);
    expect(h.stream.closed).toBe(true);
    await h.answer(st("awaiting_payment"));
    expect(h.timers.size).toBe(1);
    h.tick();
    expect(h.pollCount).toBe(2);
    await h.answer(st("received_processing"));
    expect(h.seen.map((s) => s.stage)).toEqual(["awaiting_payment", "received_processing"]);
    h.stop();
  });

  it("prekid streama vraća polling, ponovni event ga opet gasi", async () => {
    const h = harness(true);
    h.stream.emit(sse("awaiting_payment"));
    await h.answer(st("awaiting_payment"));
    h.stream.fail(0);
    expect(h.transports).toEqual(["poll", "sse", "poll"]);
    expect(h.pollCount).toBe(2);
    h.stream.emit(sse("received_processing"));
    expect(h.transports.at(-1)).toBe("sse");
    h.stop();
  });

  it("bez EventSourcea radi samo polling i staje na završnoj fazi", async () => {
    const h = harness(false);
    await h.answer(st("awaiting_payment"));
    h.tick();
    await h.answer(st("expired"));
    expect(h.seen.map((s) => s.stage)).toEqual(["awaiting_payment", "expired"]);
    expect(h.timers.size).toBe(0);
    expect(POLL_MS).toBe(2_000);
  });

  it("nakon gašenja ništa ne javlja", async () => {
    const h = harness(true);
    h.stop();
    h.stream.emit(sse("settled"));
    await h.answer(st("settled"));
    expect(h.seen).toHaveLength(0);
    expect(h.stream.closed).toBe(true);
  });
});

describe("createPaymentIntent — hub3_data", () => {
  const base = {
    sid: "abc123",
    amount_eur: "1.00",
    memo: "mpt:0x0000000000000000000000000000000000000001?sid=abc123",
    iban: "EE707777000162921128",
    beneficiary_name: "ITalk d.o.o.",
    epc_qr_data: "BCD",
    status_url: INTENT.statusUrl,
  };
  const withFetch = async (body: object) => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status: 201 })) as typeof fetch;
    try {
      return await createPaymentIntent("0x0000000000000000000000000000000000000001", 1);
    } finally {
      globalThis.fetch = orig;
    }
  };

  it("prenosi HUB3 tekst koji je rail sastavio", async () => {
    const r = await withFetch({ ...base, hub3_data: "HRVHUB30\nEUR\n" });
    expect(r.ok && r.intent.hub3Data).toBe("HRVHUB30\nEUR\n");
  });

  it("stari rail bez polja → null, panel nudi samo QR", async () => {
    const r = await withFetch(base);
    expect(r.ok && r.intent.hub3Data).toBeNull();
  });
});
