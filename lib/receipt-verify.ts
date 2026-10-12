/**
 * Neovisna provjera potvrde o uplati, korak po korak, u pregledniku
 * (docs/16 §7). Ne vjeruje ni railu ni ovoj stranici: svaki hash se ponovno
 * računa iz same potvrde, a mrežne provjere idu na izvore koje MPT ne
 * kontrolira (javni checkpointi na GitHubu, Bitcoin API-ji, Gnosis RPC).
 *
 * Formule su KOPIJE raila, ne vlastite varijante:
 *   sid         — lib/receipt-sid.ts (rail receipts/sid.ts)
 *   leafHash    — rail receipts/merkle.ts `leafHash`
 *   Merkle      — rail receipts/merkle.ts (sortirani parovi, OpenZeppelin)
 *   chain_head  — rail receipts/anchor.ts `chainHead` (ADR 0023 §2)
 *   OTS, Bitcoin — rail scripts/mpt_receipt_verify.py (parse_ots, check_bitcoin_time)
 *
 * Čista logika: mreža ulazi kroz `VerifyNet`, pa su koraci testabilni.
 */
import {
  bytesToHex,
  encodeAbiParameters,
  hexToBytes,
  keccak256,
  recoverMessageAddress,
  ripemd160,
  sha256,
  toBytes,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { deriveReceiptSid, isReceiptSalt, isReceiptSid, receiptDigest } from "@/lib/receipt-sid";
import type { ReceiptKey } from "@/lib/receipt-keys";

export const VERIFY_REPORT_VERSION = "domovina-energy-receipt-verify-v1";

// ---------------------------------------------------------------- formule raila

export const DIRECT_LEAF_DOMAIN = "MPT-RECEIPT-DIRECT-v1";
export const LAZY_LEAF_DOMAIN = "MPT-RECEIPT-LAZY-v1";
const ZERO32: Hex = `0x${"00".repeat(32)}`;

export function leafHash(l: { kind: string; sid: string; orderId: string; txHash: string | null; amountCents: number }): Hex {
  const tx = (l.txHash && /^0x[0-9a-fA-F]{64}$/.test(l.txHash) ? l.txHash.toLowerCase() : ZERO32) as Hex;
  return keccak256(
    encodeAbiParameters(
      [{ type: "string" }, { type: "string" }, { type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }],
      [l.kind === "direct" ? DIRECT_LEAF_DOMAIN : LAZY_LEAF_DOMAIN, l.sid, keccak256(toBytes(l.orderId)), tx, BigInt(l.amountCents)],
    ),
  );
}

function hashPair(a: Hex, b: Hex): Hex {
  const [x, y] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(`0x${x.slice(2)}${y.slice(2)}` as Hex);
}

export function merkleApply(leaf: Hex, proof: readonly Hex[]): Hex {
  let h = leaf;
  for (const p of proof) h = hashPair(h, p);
  return h.toLowerCase() as Hex;
}

/** Za testove i za provjeru cijelog stabla: isto kao rail `merkleRoot`. */
export function merkleRoot(leaves: readonly Hex[]): Hex {
  if (leaves.length === 0) throw new Error("empty_tree");
  let level = [...leaves];
  while (level.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? hashPair(level[i]!, level[i + 1]!) : level[i]!);
    level = next;
  }
  return level[0]!;
}

export function merkleProof(leaves: readonly Hex[], index: number): Hex[] {
  const proof: Hex[] = [];
  let level = [...leaves];
  let i = index;
  while (level.length > 1) {
    const sibling = i % 2 === 0 ? i + 1 : i - 1;
    if (sibling < level.length) proof.push(level[sibling]!);
    const next: Hex[] = [];
    for (let j = 0; j < level.length; j += 2) next.push(j + 1 < level.length ? hashPair(level[j]!, level[j + 1]!) : level[j]!);
    level = next;
    i = Math.floor(i / 2);
  }
  return proof;
}

export interface AnchorFields {
  seq: number;
  prev_chain_head: string;
  chain_head: string;
  root: string;
  leaf_count: number;
  total_leaves: number;
  total_cents: number;
  lazy_count: number;
}

export function chainHead(a: Omit<AnchorFields, "chain_head">): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "uint64" }, { type: "bytes32" }, { type: "uint32" }, { type: "uint64" }, { type: "uint64" }, { type: "uint64" }],
      [
        a.prev_chain_head as Hex,
        BigInt(a.seq),
        a.root as Hex,
        a.leaf_count,
        BigInt(a.total_leaves),
        BigInt(a.total_cents),
        BigInt(a.lazy_count),
      ],
    ),
  );
}

// ---------------------------------------------------------------- OpenTimestamps

const OTS_MAGIC = new Uint8Array([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00,
  0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94,
]);
const BITCOIN_TAG = "0588960d73d71901";
const PENDING_TAG = "83dfe30d2ef90c8e";
const OTS_MAX_FILE = 1 << 20;
const OTS_MAX_DEPTH = 256;
const OTS_MAX_VARBYTES = 8192;

export interface OtsProof {
  bitcoin: { height: number; merkleRoot: Uint8Array }[];
  pending: string[];
  unknown: string[];
  /** Grane koje ovdje nije moguće izračunati (SHA-1). */
  unverifiable: number[];
}

class OtsReader {
  pos = 0;
  constructor(private data: Uint8Array) {}
  bytes(n: number): Uint8Array {
    if (this.pos + n > this.data.length) throw new Error("truncated");
    const out = this.data.slice(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  byte(): number {
    return this.bytes(1)[0]!;
  }
  varuint(): number {
    let value = 0;
    let mul = 1;
    for (;;) {
      const b = this.byte();
      value += (b & 0x7f) * mul;
      if (!(b & 0x80)) return value;
      mul *= 128;
      if (mul > 2 ** 56) throw new Error("varuint too long");
    }
  }
  varbytes(): Uint8Array {
    const n = this.varuint();
    if (n > OTS_MAX_VARBYTES) throw new Error(`varbytes of ${n} bytes`);
    return this.bytes(n);
  }
  get done() {
    return this.pos === this.data.length;
  }
}

const hexOf = (b: Uint8Array) => bytesToHex(b).slice(2);
const concatBytes = (a: Uint8Array, b: Uint8Array) => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
};

function applyUnary(tag: number, msg: Uint8Array | null): Uint8Array | null {
  if (msg === null) return null;
  switch (tag) {
    case 0x02:
      return null; // SHA-1: nema sinkrone implementacije ovdje → „neprovjerljivo", kao Python bez ripemd160
    case 0x03:
      return ripemd160(msg, "bytes");
    case 0x08:
      return sha256(msg, "bytes");
    case 0x67:
      return keccak256(msg, "bytes");
    case 0xf2:
      return msg.slice().reverse();
    case 0xf3:
      return new TextEncoder().encode(hexOf(msg));
    default:
      throw new Error(`unknown op 0x${tag.toString(16)}`);
  }
}

function otsTimestamp(r: OtsReader, msg: Uint8Array | null, depth: number, out: OtsProof): void {
  if (depth > OTS_MAX_DEPTH) throw new Error("proof tree too deep");
  const handle = (tag: number) => {
    if (tag === 0x00) {
      const attTag = hexOf(r.bytes(8));
      const payload = r.varbytes();
      if (attTag === BITCOIN_TAG) {
        const height = new OtsReader(payload).varuint();
        if (msg === null) out.unverifiable.push(height);
        else out.bitcoin.push({ height, merkleRoot: msg });
      } else if (attTag === PENDING_TAG) {
        out.pending.push(new TextDecoder().decode(new OtsReader(payload).varbytes()));
      } else {
        out.unknown.push(attTag);
      }
      return;
    }
    let next: Uint8Array | null;
    if (tag === 0xf0 || tag === 0xf1) {
      const arg = r.varbytes();
      next = msg === null ? null : tag === 0xf0 ? concatBytes(msg, arg) : concatBytes(arg, msg);
    } else {
      next = applyUnary(tag, msg);
    }
    otsTimestamp(r, next, depth + 1, out);
  };
  let tag = r.byte();
  while (tag === 0xff) {
    handle(r.byte());
    tag = r.byte();
  }
  handle(tag);
}

/** `.ots` koji mora žigosati sha256(bajtovi chain_head). */
export function parseOts(data: Uint8Array, head: Hex): { error: string } | { proof: OtsProof } {
  if (data.length > OTS_MAX_FILE) return { error: "proof file too large" };
  if (data.length < OTS_MAGIC.length || OTS_MAGIC.some((b, i) => data[i] !== b)) return { error: "not an OpenTimestamps proof" };
  const r = new OtsReader(data);
  r.pos = OTS_MAGIC.length;
  let digest: Uint8Array;
  try {
    if (r.varuint() !== 1 || r.byte() !== 0x08) return { error: "not a SHA256 OpenTimestamps proof (major version 1)" };
    digest = r.bytes(32);
  } catch {
    return { error: "not a SHA256 OpenTimestamps proof" };
  }
  if (hexOf(digest) !== hexOf(sha256(hexToBytes(head), "bytes"))) return { error: "stamps a different digest than sha256(chain_head)" };
  const proof: OtsProof = { bitcoin: [], pending: [], unknown: [], unverifiable: [] };
  try {
    otsTimestamp(r, digest, 0, proof);
    if (!r.done) throw new Error("trailing bytes after the proof tree");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "unreadable" };
  }
  return { proof };
}

// ---------------------------------------------------------------- Bitcoin

export const MAX_STAMP_DELAY_S = 48 * 3600;
export const MAX_CLOCK_SKEW_S = 7200;

/** 80-bajtni header bloka: hash bloka, merkle root, vrijeme. */
export function parseBlockHeader(header: Uint8Array): { blockHash: string; merkleRoot: Uint8Array; time: number } {
  if (header.length !== 80) throw new Error(`header is ${header.length} bytes, not 80`);
  const blockHash = hexOf(sha256(sha256(header, "bytes"), "bytes").slice().reverse());
  const time = header[68]! | (header[69]! << 8) | (header[70]! << 16) | (header[71]! * 2 ** 24);
  return { blockHash, merkleRoot: header.slice(36, 68), time };
}

// ---------------------------------------------------------------- ulaz

export interface ReceiptPaymentInput {
  kind: string;
  order_id: string;
  tx_hash: string | null;
  amount_cents: number;
  placed_at: string | null;
  leaf_hash: string;
  target_address?: string | null;
  anchor: (Partial<AnchorFields> & { anchor_id?: number; proof?: string[]; ots?: string | null; anchored_at?: number }) | null;
}

export interface ReceiptInput {
  version: string;
  sid: string;
  chain_id: number;
  owner: string | null;
  salt: string | null;
  intent: { amount_cents: number; target_address: string; label: string | null; created_at?: number; paid_at?: number | null };
  payments: ReceiptPaymentInput[];
}

/** Potvrda iz JSON-a (kanonski JSON potvrde, ili railov odgovor). `null` = nije potvrda. */
export function asReceipt(v: unknown): ReceiptInput | null {
  if (v === null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.version !== "string" || !o.version.startsWith("mpt-receipt-")) return null;
  if (typeof o.sid !== "string" || !Array.isArray(o.payments)) return null;
  const intent = o.intent as ReceiptInput["intent"] | undefined;
  if (!intent || typeof intent.target_address !== "string") return null;
  return {
    version: o.version,
    sid: o.sid,
    chain_id: typeof o.chain_id === "number" ? o.chain_id : 0,
    owner: typeof o.owner === "string" ? o.owner : null,
    salt: typeof o.salt === "string" ? o.salt : null,
    intent,
    payments: o.payments as ReceiptPaymentInput[],
  };
}

// ---------------------------------------------------------------- izvještaj

export type CheckStatus = "ok" | "fail" | "pending" | "skip" | "warn";

export interface Check {
  /** Stabilan id koraka (za strojno čitanje). */
  id: string;
  status: CheckStatus;
  /** Varijable za tekst koraka (i18n ključ je `verify.step.<id>`). */
  vars?: Record<string, string | number>;
  /** Tehnički detalji: izračunate i očekivane vrijednosti. */
  detail: string[];
}

export interface VerifyReport {
  version: typeof VERIFY_REPORT_VERSION;
  verified_at: string;
  sid: string | null;
  owner: string | null;
  total_cents: number;
  payments: number;
  /** ok = nijedan korak nije pao; fail = barem jedan je pao. */
  result: "ok" | "fail";
  checks: Check[];
}

export interface VerifyNet {
  /** Javni checkpoint sidra `seq` (GitHub), bez raila. `null` = nema ga. */
  checkpoint(seq: number): Promise<{ anchor: AnchorFields & { created_at?: number }; ots: Uint8Array | null } | null>;
  /** 80-bajtni header Bitcoin bloka sa svakog API-ja (više njih se uspoređuje). */
  bitcoinHeaders(height: number): Promise<{ api: string; header: Uint8Array | null; error?: string }[]>;
  /** eth_getTransactionReceipt na Gnosis Chainu. */
  gnosisReceipts(txs: string[]): Promise<Map<string, GnosisReceipt | null>>;
}

export interface GnosisReceipt {
  status: string;
  blockNumber: string;
  logs: { address: string; topics: string[]; data: string }[];
}

/** EURe na Gnosis Chainu (Monerium), 18 decimala. */
export const EURE_GNOSIS = "0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export interface VerifyOptions {
  key?: ReceiptKey | null;
  net?: VerifyNet | null;
  nowS?: number;
  /** Nasumičan izazov za potpis ključem (test ga fiksira). */
  challenge?: string;
}

export async function verifyReceipt(receipt: ReceiptInput, opts: VerifyOptions = {}): Promise<VerifyReport> {
  const checks: Check[] = [];
  const nowS = opts.nowS ?? Math.floor(Date.now() / 1000);
  const total = receipt.payments.reduce((s, p) => s + (Number.isFinite(p.amount_cents) ? p.amount_cents : 0), 0);

  // 1. Oblik
  checks.push({
    id: "format",
    status: receipt.version === "mpt-receipt-v1" && receipt.chain_id === 100 ? "ok" : "warn",
    vars: { version: receipt.version, payments: receipt.payments.length },
    detail: [`version: ${receipt.version}`, `chain_id: ${receipt.chain_id}`, `payments: ${receipt.payments.length}`],
  });

  // 2. sid iz vlasnika i salta
  const sidCheck: Check = { id: "sid", status: "fail", detail: [] };
  if (!isReceiptSid(receipt.sid)) {
    sidCheck.detail.push(`sid "${receipt.sid}" nije oblika r1 + 24 znaka`);
  } else if (receipt.owner === null || receipt.salt === null) {
    sidCheck.status = "skip";
    sidCheck.detail.push("owner/salt: nema ih u datoteci (javna potvrda bez ključa)");
  } else if (!isReceiptSalt(receipt.salt)) {
    sidCheck.detail.push(`salt nije 16 bajtova hex: ${receipt.salt}`);
  } else {
    try {
      const digest = receiptDigest(receipt.owner, receipt.salt as Hex);
      const derived = deriveReceiptSid(receipt.owner, receipt.salt as Hex);
      sidCheck.detail.push(
        `keccak256("MPT-RECEIPT-v1" ‖ ${receipt.owner} ‖ ${receipt.salt})`,
        `= ${digest}`,
        `base32(prvih 120 bitova) → ${derived}`,
        `u potvrdi: ${receipt.sid}`,
      );
      sidCheck.status = derived === receipt.sid ? "ok" : "fail";
    } catch (e) {
      sidCheck.detail.push(String(e));
    }
  }
  checks.push(sidCheck);

  // 3. Ključ
  const key = opts.key ?? null;
  if (key === null) {
    checks.push({ id: "key", status: "skip", detail: ["ključ nije priložen"] });
  } else {
    const keyCheck: Check = { id: "key", status: "fail", detail: [] };
    try {
      const account = privateKeyToAccount(key.pk);
      const keySid = deriveReceiptSid(account.address, key.salt);
      keyCheck.detail.push(`adresa ključa: ${account.address}`, `sid iz ključa: ${keySid}`);
      const challenge = opts.challenge ?? `MPT provjera ključa\nsid: ${receipt.sid}\nvrijeme: ${nowS}\nnonce: ${bytesToHex(crypto.getRandomValues(new Uint8Array(16)))}`;
      const signature = await account.signMessage({ message: challenge });
      const recovered = await recoverMessageAddress({ message: challenge, signature });
      keyCheck.detail.push(`potpis izazova vraća adresu: ${recovered}`);
      const ownerOk = receipt.owner === null || receipt.owner.toLowerCase() === account.address.toLowerCase();
      keyCheck.status = keySid === receipt.sid && recovered === account.address && ownerOk ? "ok" : "fail";
      if (!ownerOk) keyCheck.detail.push(`vlasnik u potvrdi je ${receipt.owner}`);
    } catch (e) {
      keyCheck.detail.push(`ključ nije ispravan: ${String(e)}`);
    }
    checks.push(keyCheck);
  }

  // 4. Listovi
  const leafCheck: Check = { id: "leaves", status: "ok", vars: { n: receipt.payments.length }, detail: [] };
  for (const [i, p] of receipt.payments.entries()) {
    let computed: Hex;
    try {
      computed = leafHash({ kind: p.kind, sid: receipt.sid, orderId: p.order_id, txHash: p.tx_hash, amountCents: p.amount_cents });
    } catch (e) {
      leafCheck.status = "fail";
      leafCheck.detail.push(`#${i + 1}: ${String(e)}`);
      continue;
    }
    const ok = computed.toLowerCase() === String(p.leaf_hash).toLowerCase();
    if (!ok) leafCheck.status = "fail";
    leafCheck.detail.push(`#${i + 1} ${p.kind} ${(p.amount_cents / 100).toFixed(2)} €: ${ok ? "✓" : `✗ izračunato ${computed}, u potvrdi ${p.leaf_hash}`}`);
  }
  if (receipt.payments.length === 0) leafCheck.status = "skip";
  checks.push(leafCheck);

  // 5. Merkle dokazi do korijena sidra; 6. chain_head sidra
  const merkle: Check = { id: "merkle", status: "ok", detail: [] };
  const head: Check = { id: "chainHead", status: "ok", detail: [] };
  const anchors = new Map<number, ReceiptPaymentInput["anchor"] & object>();
  let unanchored = 0;
  for (const [i, p] of receipt.payments.entries()) {
    const a = p.anchor;
    if (a === null || a === undefined) {
      unanchored++;
      continue;
    }
    const seq = a.seq ?? a.anchor_id;
    if (seq === undefined || typeof a.root !== "string" || !Array.isArray(a.proof)) {
      merkle.status = "fail";
      merkle.detail.push(`#${i + 1}: sidro bez korijena ili dokaza`);
      continue;
    }
    anchors.set(seq, a);
    const got = merkleApply(String(p.leaf_hash).toLowerCase() as Hex, a.proof as Hex[]);
    const ok = got === a.root.toLowerCase();
    if (!ok) merkle.status = "fail";
    merkle.detail.push(`#${i + 1} → sidro #${seq}: ${ok ? "✓" : `✗ ${got} ≠ ${a.root}`}`);
  }
  if (anchors.size === 0) {
    merkle.status = receipt.payments.length === 0 ? "skip" : "pending";
    head.status = merkle.status;
  } else if (unanchored > 0) {
    merkle.detail.push(`${unanchored} redaka još čeka sidrenje (00:00 UTC)`);
  }
  for (const [seq, a] of anchors) {
    if (typeof a.chain_head !== "string" || typeof a.prev_chain_head !== "string" || a.leaf_count === undefined) {
      head.status = head.status === "fail" ? "fail" : "warn";
      head.detail.push(`#${seq}: potvrda ne nosi polja lanca (stariji format)`);
      continue;
    }
    const computed = chainHead({
      seq,
      prev_chain_head: a.prev_chain_head,
      root: a.root!,
      leaf_count: a.leaf_count,
      total_leaves: a.total_leaves ?? 0,
      total_cents: a.total_cents ?? 0,
      lazy_count: a.lazy_count ?? 0,
    });
    const ok = computed === a.chain_head.toLowerCase();
    if (!ok) head.status = "fail";
    head.detail.push(`#${seq}: ${ok ? `✓ ${computed}` : `✗ izračunato ${computed}, u potvrdi ${a.chain_head}`}`);
  }
  checks.push({ ...merkle, vars: { anchors: anchors.size, pending: unanchored } }, head);

  // 7–9. Mreža: checkpoint (GitHub), OTS → Bitcoin, Gnosis transakcije
  const net = opts.net ?? null;
  const cp: Check = { id: "checkpoint", status: "skip", detail: [] };
  const ots: Check = { id: "ots", status: "skip", detail: [] };
  const btc: Check = { id: "bitcoin", status: "skip", detail: [] };
  const gnosis: Check = { id: "gnosis", status: "skip", detail: [] };
  if (anchors.size === 0) {
    for (const c of [cp, ots, btc]) {
      c.status = receipt.payments.length === 0 ? "skip" : "pending";
      c.detail.push("nijedan redak još nije sidren (sidro nastaje u 00:00 UTC)");
    }
  }
  if (net === null) {
    for (const c of [cp, btc, gnosis]) if (c.status !== "pending") c.detail.push("mrežne provjere isključene");
  }

  const otsSources: { seq: number; head: Hex; data: Uint8Array; createdAt: number | null; where: string }[] = [];
  if (anchors.size > 0) {
    cp.status = net === null ? "skip" : "ok";
    for (const [seq, a] of anchors) {
      if (typeof a.ots === "string" && a.ots.startsWith("0x") && typeof a.chain_head === "string") {
        otsSources.push({ seq, head: a.chain_head as Hex, data: hexToBytes(a.ots as Hex), createdAt: a.anchored_at ?? null, where: "potvrda" });
      }
      if (net === null) continue;
      let got: Awaited<ReturnType<VerifyNet["checkpoint"]>>;
      try {
        got = await net.checkpoint(seq);
      } catch (e) {
        cp.status = "fail";
        cp.detail.push(`#${seq}: dohvat nije uspio (${String(e)})`);
        continue;
      }
      if (got === null) {
        // Checkpoint repo se puni jednom dnevno, nakon sidra.
        if (cp.status !== "fail") cp.status = "pending";
        cp.detail.push(`#${seq}: još nije u javnom repozitoriju checkpointa`);
        continue;
      }
      const same = got.anchor.chain_head.toLowerCase() === String(a.chain_head).toLowerCase() && got.anchor.root.toLowerCase() === String(a.root).toLowerCase();
      const recomputed = chainHead(got.anchor);
      const selfOk = recomputed === got.anchor.chain_head.toLowerCase();
      if (!same || !selfOk) cp.status = "fail";
      cp.detail.push(
        `#${seq}: chain_head u javnom checkpointu ${same ? "= potvrda ✓" : `≠ potvrda ✗ (${got.anchor.chain_head})`}; ponovno izračunat ${selfOk ? "✓" : "✗"}`,
      );
      if (got.ots !== null) otsSources.push({ seq, head: got.anchor.chain_head as Hex, data: got.ots, createdAt: got.anchor.created_at ?? null, where: "checkpoint" });
    }
  }

  // OTS: najbolji dokaz po sidru (checkpoint je nadograđen, potvrdin može biti „pending").
  if (anchors.size > 0) {
    ots.status = otsSources.length === 0 ? "pending" : "ok";
    if (otsSources.length === 0) ots.detail.push(".ots još nije dostupan");
    const attested = new Map<number, { seq: number; height: number; root: Uint8Array; createdAt: number | null }[]>();
    for (const s of otsSources) {
      const parsed = parseOts(s.data, s.head);
      if ("error" in parsed) {
        ots.status = "fail";
        ots.detail.push(`#${s.seq} (${s.where}): ${parsed.error}`);
        continue;
      }
      const p = parsed.proof;
      ots.detail.push(
        `#${s.seq} (${s.where}): žigosan sha256(chain_head) ✓; Bitcoin atestacija: ${p.bitcoin.map((b) => b.height).join(", ") || "još nema"}${p.pending.length ? `; čeka kalendare: ${p.pending.length}` : ""}`,
      );
      for (const b of p.bitcoin) {
        const list = attested.get(s.seq) ?? [];
        list.push({ seq: s.seq, height: b.height, root: b.merkleRoot, createdAt: s.createdAt });
        attested.set(s.seq, list);
      }
    }
    if (ots.status === "ok" && attested.size === 0) ots.status = "pending";

    if (net === null || attested.size === 0) {
      btc.status = attested.size === 0 ? "pending" : "skip";
      if (attested.size === 0) btc.detail.push("nijedan .ots još nema Bitcoin atestaciju (obično nekoliko sati nakon sidra)");
    } else {
      btc.status = "ok";
      const headers = new Map<number, Uint8Array | null>();
      for (const [seq, list] of attested) {
        let best: { time: number; height: number } | null = null;
        for (const at of list) {
          if (!headers.has(at.height)) {
            const answers = await net.bitcoinHeaders(at.height);
            const distinct = new Set(answers.filter((x) => x.header !== null).map((x) => hexOf(x.header!)));
            for (const x of answers) if (x.header === null) btc.detail.push(`blok ${at.height}: ${x.api} nije odgovorio (${x.error ?? "?"})`);
            if (distinct.size > 1) {
              btc.status = "fail";
              btc.detail.push(`blok ${at.height}: Bitcoin API-ji se ne slažu`);
            }
            headers.set(at.height, distinct.size === 1 ? hexToBytes(`0x${[...distinct][0]}` as Hex) : null);
          }
          const header = headers.get(at.height);
          if (!header) continue;
          const h = parseBlockHeader(header);
          if (hexOf(h.merkleRoot) !== hexOf(at.root)) {
            btc.status = "fail";
            btc.detail.push(`#${seq}: blok ${at.height} ne sadrži ovaj dokaz (merkle root se razlikuje)`);
            continue;
          }
          if (best === null || h.time < best.time) best = { time: h.time, height: at.height };
        }
        if (best === null) {
          if (btc.status !== "fail") btc.status = "pending";
          btc.detail.push(`#${seq}: Bitcoin atestacija nije potvrđena`);
          continue;
        }
        const createdAt = list[0]?.createdAt ?? null;
        const when = new Date(best.time * 1000).toISOString().replace(".000Z", "Z");
        if (createdAt === null) {
          btc.detail.push(`#${seq}: blok ${best.height} u ${when} ✓`);
          continue;
        }
        const delay = best.time - createdAt;
        if (delay > MAX_STAMP_DELAY_S || delay < -MAX_CLOCK_SKEW_S) {
          btc.status = "fail";
          btc.detail.push(`#${seq}: blok ${best.height} u ${when}, ${(delay / 3600).toFixed(0)} h od sidrenja — izvan dopuštenog prozora`);
        } else {
          btc.detail.push(`#${seq}: blok ${best.height} u ${when} (${(delay / 3600).toFixed(1)} h nakon sidrenja) ✓`);
        }
      }
    }
  }

  // Gnosis: svaka uplata s hashom transakcije stvarno je prenijela EURe primatelju.
  const withTx = receipt.payments.filter((p) => typeof p.tx_hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(p.tx_hash));
  if (net !== null && withTx.length > 0) {
    gnosis.status = "ok";
    let receipts: Map<string, GnosisReceipt | null>;
    try {
      receipts = await net.gnosisReceipts([...new Set(withTx.map((p) => p.tx_hash!.toLowerCase()))]);
    } catch (e) {
      receipts = new Map();
      gnosis.status = "fail";
      gnosis.detail.push(`Gnosis RPC: ${String(e)}`);
    }
    let okCount = 0;
    for (const p of withTx) {
      const r = receipts.get(p.tx_hash!.toLowerCase());
      const target = (p.target_address ?? (p.kind === "direct" ? receipt.intent.target_address : null))?.toLowerCase() ?? null;
      if (!r) {
        gnosis.status = "fail";
        gnosis.detail.push(`${p.tx_hash!.slice(0, 12)}…: transakcija nije pronađena`);
        continue;
      }
      if (r.status !== "0x1") {
        gnosis.status = "fail";
        gnosis.detail.push(`${p.tx_hash!.slice(0, 12)}…: transakcija nije uspjela`);
        continue;
      }
      const want = BigInt(p.amount_cents) * 10n ** 16n;
      const transfer = r.logs.find(
        (l) =>
          l.address.toLowerCase() === EURE_GNOSIS &&
          l.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
          (target === null || `0x${(l.topics[2] ?? "").slice(-40)}`.toLowerCase() === target) &&
          BigInt(l.data) === want,
      );
      if (transfer === undefined) {
        gnosis.status = gnosis.status === "fail" ? "fail" : "warn";
        gnosis.detail.push(
          `${p.tx_hash!.slice(0, 12)}…: uspjela, ali bez EURe prijenosa od ${(p.amount_cents / 100).toFixed(2)} € ${target ? `na ${target.slice(0, 8)}…` : ""}`,
        );
        continue;
      }
      okCount++;
    }
    gnosis.detail.unshift(`${okCount}/${withTx.length} transakcija: EURe prijenos točnog iznosa primatelju, blok potvrđen`);
  } else if (withTx.length === 0) {
    gnosis.detail.push("nijedan redak nema Gnosis transakciju");
  }
  checks.push(cp, ots, btc, gnosis);

  return {
    version: VERIFY_REPORT_VERSION,
    verified_at: new Date(nowS * 1000).toISOString(),
    sid: receipt.sid,
    owner: receipt.owner,
    total_cents: total,
    payments: receipt.payments.length,
    result: checks.some((c) => c.status === "fail") ? "fail" : "ok",
    checks,
  };
}
