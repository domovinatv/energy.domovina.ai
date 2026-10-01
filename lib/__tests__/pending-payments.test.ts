import { describe, expect, it } from "vitest";
import { unconfirmedCents, upsertPending } from "@/lib/pending-payments";

describe("uplata zaprimljena, a još nije na lancu", () => {
  it("zaprimljena uplata bez hasha broji se odmah", () => {
    expect(unconfirmedCents([{ sid: "a", cents: 103, txHash: null }], [])).toBe(103);
  });
  it("kad se forward pojavi na lancu, više se ne broji — nema dvostrukog zbroja", () => {
    expect(unconfirmedCents([{ sid: "a", cents: 103, txHash: "0xABC" }], ["0xabc"])).toBe(0);
  });
  it("forward poznat, ali lanac ga još ne pokazuje → i dalje se broji", () => {
    expect(unconfirmedCents([{ sid: "a", cents: 103, txHash: "0xabc" }], ["0xdef"])).toBe(103);
  });
  it("ista uplata javljena više puta ostaje jedna, hash se ne gubi", () => {
    let l = upsertPending([], { sid: "a", cents: 102, txHash: null });
    l = upsertPending(l, { sid: "a", cents: 102, txHash: "0x1" });
    l = upsertPending(l, { sid: "a", cents: 102, txHash: null });
    expect(l).toEqual([{ sid: "a", cents: 102, txHash: "0x1" }]);
  });
});
