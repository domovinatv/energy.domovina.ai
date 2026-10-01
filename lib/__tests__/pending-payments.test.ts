import { describe, expect, it } from "vitest";
import { unconfirmedCents, upsertPending, type PendingPayment } from "@/lib/pending-payments";

const p = (sid: string, cents: number, txHash: string | null): PendingPayment => ({
  sid,
  cents,
  txHash,
  statusUrl: `https://mpt.domovina.ai/api/intents/${sid}`,
  receivedAt: 1_000,
});

describe("uplata zaprimljena, a još nije na lancu", () => {
  it("zaprimljena uplata bez hasha broji se odmah", () => {
    expect(unconfirmedCents([p("a", 103, null)], [])).toBe(103);
  });
  it("kad se forward pojavi na lancu, više se ne broji — nema dvostrukog zbroja", () => {
    expect(unconfirmedCents([p("a", 103, "0xABC")], ["0xabc"])).toBe(0);
  });
  it("forward poznat, ali lanac ga još ne pokazuje → i dalje se broji", () => {
    expect(unconfirmedCents([p("a", 103, "0xabc")], ["0xdef"])).toBe(103);
  });
  it("ista uplata javljena više puta ostaje jedna, hash se ne gubi", () => {
    let l = upsertPending([], p("a", 102, null));
    l = upsertPending(l, p("a", 102, "0x1"));
    l = upsertPending(l, p("a", 102, null));
    expect(l).toEqual([p("a", 102, "0x1")]);
    expect(l[0]?.receivedAt).toBe(1_000);
  });
});
