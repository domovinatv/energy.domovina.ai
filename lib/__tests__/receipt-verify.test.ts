import { describe, expect, it } from "vitest";
import { bytesToHex, hexToBytes, sha256, type Hex } from "viem";
import {
  chainHead,
  EURE_GNOSIS,
  leafHash,
  merkleProof,
  merkleRoot,
  parseBlockHeader,
  parseOts,
  verifyReceipt,
  type GnosisReceipt,
  type ReceiptInput,
  type VerifyNet,
} from "@/lib/receipt-verify";
import type { ReceiptKey } from "@/lib/receipt-keys";

// Zlatni ključ (docs/16 §3.1) i vrijednosti izračunate RAILOVIM kodom
// (pay.domovina.ai receipts/merkle.ts i anchor.ts, 12. 10. 2026.).
const PK: Hex = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const OWNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const SALT: Hex = "0x000102030405060708090a0b0c0d0e0f";
const SID = "r183ns4pcpn659hd2z3xtaqiwq";
const KEY: ReceiptKey = { v: 1, sid: SID, owner: OWNER, salt: SALT, pk: PK, created_at: 1 };
const RAIL = {
  a: "0x64b07836006e52009e31a979a14573b4461e0febe3a9dfc922a30d9d5cb0b7fc",
  b: "0xa305914a39cb05851409eb8ca790e89616116e8740fec2c686ae42377b02c299",
  root: "0x6288cb5dd5a3ed5fb4e26e1b85f6fdf81b1c04902a57056da0083143fabffac7",
  ch: "0x983d8a357685144aec88ba7772401ec8c1037194ecb691152f1c755e6586d973",
};
const TARGET = "0x4f7f1950b2cb6713ccb47b869f30c0ebc01d0173";
const TX = `0x${"2".repeat(64)}`;
const CREATED = 1_791_800_000;
const ZERO = `0x${"00".repeat(32)}`;

// ---- sintetički .ots: append(32 B) → sha256 → Bitcoin atestacija na visini 900000
const APPEND = new Uint8Array(32).fill(7);
function varuint(n: number): number[] {
  const out: number[] = [];
  do {
    let b = n & 0x7f;
    n = Math.floor(n / 128);
    if (n > 0) b |= 0x80;
    out.push(b);
  } while (n > 0);
  return out;
}
const MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
function makeOts(head: Hex, height: number): { ots: Uint8Array; root: Uint8Array } {
  const digest = sha256(hexToBytes(head), "bytes");
  const msg = new Uint8Array([...digest, ...APPEND]);
  const root = sha256(msg, "bytes");
  const att = varuint(height);
  const ots = new Uint8Array([
    ...MAGIC, 0x01, 0x08, ...digest,
    0xf0, ...varuint(32), ...APPEND, // append
    0x08, // sha256
    0x00, 0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01, ...varuint(att.length), ...att,
  ]);
  return { ots, root };
}
function makeHeader(merkleRootBytes: Uint8Array, time: number): Uint8Array {
  const h = new Uint8Array(80);
  h.set(merkleRootBytes, 36);
  h[68] = time & 0xff;
  h[69] = (time >>> 8) & 0xff;
  h[70] = (time >>> 16) & 0xff;
  h[71] = (time >>> 24) & 0xff;
  return h;
}

function receipt(): ReceiptInput {
  const a = leafHash({ kind: "direct", sid: SID, orderId: "07d82d3b-c60e-11f1-a028-86f2570d9f29", txHash: TX, amountCents: 100 });
  const b = leafHash({ kind: "lazy", sid: SID, orderId: "36063aa3-c609-11f1-a028-86f2570d9f29", txHash: null, amountCents: 500 });
  const root = merkleRoot([a, b]);
  const anchorBase = { seq: 1, anchor_id: 1, prev_chain_head: ZERO, root, leaf_count: 2, total_leaves: 2, total_cents: 600, lazy_count: 1, anchored_at: CREATED };
  const ch = chainHead(anchorBase);
  const { ots } = makeOts(ch, 900_000);
  const anchor = (i: number) => ({ ...anchorBase, chain_head: ch, proof: merkleProof([a, b], i), ots: bytesToHex(ots) });
  return {
    version: "mpt-receipt-v1",
    sid: SID,
    chain_id: 100,
    owner: OWNER.toLowerCase(),
    salt: SALT,
    intent: { amount_cents: 100, target_address: TARGET, label: null },
    payments: [
      { kind: "direct", order_id: "07d82d3b-c60e-11f1-a028-86f2570d9f29", tx_hash: TX, amount_cents: 100, placed_at: null, leaf_hash: a, target_address: TARGET, anchor: anchor(0) },
      { kind: "lazy", order_id: "36063aa3-c609-11f1-a028-86f2570d9f29", tx_hash: null, amount_cents: 500, placed_at: null, leaf_hash: b, anchor: anchor(1) },
    ],
  };
}

function net(opts: { headerTime?: number; tamperHeader?: boolean; transfer?: boolean } = {}): VerifyNet {
  const rc = receipt();
  const a = rc.payments[0]!.anchor!;
  const { root } = makeOts(a.chain_head as Hex, 900_000);
  const header = makeHeader(opts.tamperHeader ? new Uint8Array(32) : root, opts.headerTime ?? CREATED + 3 * 3600);
  const transferLog = {
    address: EURE_GNOSIS,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      `0x${"0".repeat(24)}${"1".repeat(40)}`,
      `0x${"0".repeat(24)}${TARGET.slice(2)}`,
    ],
    data: `0x${(100n * 10n ** 16n).toString(16).padStart(64, "0")}`,
  };
  return {
    checkpoint: async () => ({
      anchor: { seq: 1, prev_chain_head: a.prev_chain_head!, chain_head: a.chain_head!, root: a.root!, leaf_count: 2, total_leaves: 2, total_cents: 600, lazy_count: 1, created_at: CREATED },
      ots: null,
    }),
    bitcoinHeaders: async () => [
      { api: "a", header },
      { api: "b", header },
    ],
    gnosisReceipts: async (txs) =>
      new Map(txs.map((tx) => [tx, { status: "0x1", blockNumber: "0x1", logs: opts.transfer === false ? [] : [transferLog] } as GnosisReceipt])),
  };
}

const status = (r: Awaited<ReturnType<typeof verifyReceipt>>) => Object.fromEntries(r.checks.map((c) => [c.id, c.status]));

describe("formule = rail", () => {
  it("leafHash, merkleRoot i chainHead daju railove vrijednosti", () => {
    const rc = receipt();
    expect(rc.payments[0]!.leaf_hash).toBe(RAIL.a);
    expect(rc.payments[1]!.leaf_hash).toBe(RAIL.b);
    expect(rc.payments[0]!.anchor!.root).toBe(RAIL.root);
    expect(rc.payments[0]!.anchor!.chain_head).toBe(RAIL.ch);
  });
});

describe("verifyReceipt", () => {
  it("ispravna potvrda s ključem i mrežom: svi koraci prolaze", async () => {
    const r = await verifyReceipt(receipt(), { key: KEY, net: net(), nowS: CREATED + 86400 });
    expect(status(r)).toEqual({
      format: "ok",
      sid: "ok",
      key: "ok",
      leaves: "ok",
      merkle: "ok",
      chainHead: "ok",
      checkpoint: "ok",
      ots: "ok",
      bitcoin: "ok",
      gnosis: "ok",
    });
    expect(r.result).toBe("ok");
    expect(r.total_cents).toBe(600);
  });

  it("bez mreže: lokalni koraci prolaze, mrežni preskočeni", async () => {
    const r = await verifyReceipt(receipt(), { key: KEY, net: null });
    expect(status(r)).toMatchObject({ sid: "ok", key: "ok", leaves: "ok", merkle: "ok", chainHead: "ok", ots: "ok", checkpoint: "skip", gnosis: "skip" });
    expect(r.result).toBe("ok");
  });

  it("promijenjen iznos ruši list", async () => {
    const rc = receipt();
    rc.payments[1]!.amount_cents = 50_000;
    const r = await verifyReceipt(rc, { net: null });
    expect(status(r).leaves).toBe("fail");
    expect(r.result).toBe("fail");
  });

  it("tuđi salt ruši sid", async () => {
    const rc = receipt();
    rc.salt = "0x000102030405060708090a0b0c0d0e00";
    expect(status(await verifyReceipt(rc, { net: null })).sid).toBe("fail");
  });

  it("tuđi ključ ne prolazi", async () => {
    const other: ReceiptKey = { ...KEY, pk: "0x0000000000000000000000000000000000000000000000000000000000000001" };
    expect(status(await verifyReceipt(receipt(), { key: other, net: null })).key).toBe("fail");
  });

  it("promijenjen dokaz ruši Merkle, promijenjen total ruši chain_head", async () => {
    const rc = receipt();
    rc.payments[0]!.anchor!.proof = [ZERO];
    rc.payments[1]!.anchor = { ...rc.payments[1]!.anchor!, total_cents: 999 };
    const s = status(await verifyReceipt(rc, { net: null }));
    expect(s.merkle).toBe("fail");
    expect(s.chainHead).toBe("fail");
  });

  it("Bitcoin: tuđi blok ili prekasna atestacija padaju", async () => {
    expect(status(await verifyReceipt(receipt(), { net: net({ tamperHeader: true }) })).bitcoin).toBe("fail");
    expect(status(await verifyReceipt(receipt(), { net: net({ headerTime: CREATED + 60 * 3600 }) })).bitcoin).toBe("fail");
  });

  it("Gnosis: transakcija bez EURe prijenosa primatelju je upozorenje", async () => {
    expect(status(await verifyReceipt(receipt(), { net: net({ transfer: false }) })).gnosis).toBe("warn");
  });

  it("nesidrena potvrda: sidreni koraci čekaju, ne padaju", async () => {
    const rc = receipt();
    for (const p of rc.payments) p.anchor = null;
    const r = await verifyReceipt(rc, { net: net() });
    expect(status(r)).toMatchObject({ merkle: "pending", chainHead: "pending", checkpoint: "pending", ots: "pending", bitcoin: "pending" });
    expect(r.result).toBe("ok");
  });
});

describe("OTS i Bitcoin header", () => {
  it("parseOts odbija .ots tuđeg chain_heada", () => {
    const { ots } = makeOts(RAIL.ch as Hex, 1);
    expect("error" in parseOts(ots, ZERO as Hex)).toBe(true);
    const ok = parseOts(ots, RAIL.ch as Hex);
    expect("proof" in ok && ok.proof.bitcoin[0]?.height).toBe(1);
  });

  it("header bloka 0 daje poznati hash Genesis bloka", () => {
    const genesis = hexToBytes(
      "0x0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
    );
    const h = parseBlockHeader(genesis);
    expect(h.blockHash).toBe("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
    expect(h.time).toBe(1231006505);
  });
});
