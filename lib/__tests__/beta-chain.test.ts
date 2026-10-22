import { afterEach, describe, expect, it, vi } from "vitest";

import { activityUrl, fetchSafeActivity, parseRailActivity } from "@/lib/beta-chain";
import { RAIL_ITALK, RAIL_ITALK_SANDBOX } from "@/lib/rail-profile";

// docs/18 §4–5: lanac kroz rail /api/activity (edge cache), izravno kao rezerva.

const SAFE = "0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173";
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("activityUrl", () => {
  it("is next to the intents API on the rail", () => {
    expect(activityUrl(RAIL_ITALK, SAFE)).toBe(`https://mpt.domovina.ai/api/activity/${SAFE}`);
  });

  it("only Gnosis goes through the rail; the sandbox reads Chiado directly", () => {
    expect(RAIL_ITALK.activityViaRail).toBe(true);
    expect(RAIL_ITALK_SANDBOX.activityViaRail).toBe(false);
  });
});

describe("parseRailActivity", () => {
  it("accepts the rail shape and drops a malformed balance", () => {
    expect(
      parseRailActivity({ transfers: [{ hash: "0x1", timestamp: "t", value: "10" }], balance_wei: "x", truncated: false }),
    ).toEqual({ transfers: [{ hash: "0x1", timestamp: "t", value: "10" }], balance_wei: null, truncated: false });
  });

  it("rejects a body with any malformed row, so the page falls back instead of under-counting", () => {
    expect(parseRailActivity({ transfers: [{ hash: "0x1", timestamp: "t", value: "1e18" }], balance_wei: null, truncated: false })).toBeNull();
    expect(parseRailActivity({ error: "rate_limited" })).toBeNull();
  });
});

describe("fetchSafeActivity", () => {
  it("reads through the rail when it answers", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      return json({
        transfers: [{ hash: "0xa", timestamp: "2026-10-21T18:50:25Z", value: "1030000000000000000" }],
        balance_wei: "2060000000000000000",
        truncated: false,
      });
    });
    const a = await fetchSafeActivity(SAFE, new AbortController().signal, RAIL_ITALK);
    expect(urls).toEqual([activityUrl(RAIL_ITALK, SAFE)]);
    expect(a).toMatchObject({ receivedCents: 103, balanceCents: 206, truncated: false });
  });

  it("falls back to Blockscout and the RPC when the rail fails", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      if (url.startsWith("https://mpt.domovina.ai")) return new Response("", { status: 429 });
      if (url === RAIL_ITALK.rpcUrl) return json({ jsonrpc: "2.0", id: 1, result: "0x" + (1030000000000000000n).toString(16) });
      return json({ items: [{ transaction_hash: "0xa", timestamp: "t", total: { value: "1030000000000000000" } }], next_page_params: null });
    });
    const a = await fetchSafeActivity(SAFE, new AbortController().signal, RAIL_ITALK);
    expect(urls[0]).toBe(activityUrl(RAIL_ITALK, SAFE));
    expect(urls.some((u) => u.startsWith(RAIL_ITALK.blockscoutApi))).toBe(true);
    expect(a).toMatchObject({ receivedCents: 103, balanceCents: 103 });
  });

  it("`direct` skips the rail", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      if (url === RAIL_ITALK.rpcUrl) return json({ jsonrpc: "2.0", id: 1, result: "0x0" });
      return json({ items: [], next_page_params: null });
    });
    await fetchSafeActivity(SAFE, new AbortController().signal, RAIL_ITALK, { direct: true });
    expect(urls.some((u) => u.startsWith("https://mpt.domovina.ai"))).toBe(false);
  });
});
