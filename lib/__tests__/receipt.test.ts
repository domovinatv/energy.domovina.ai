import { describe, expect, it, vi } from "vitest";
import { recoverMessageAddress, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { deriveReceiptSid, isReceiptSid, receiptSidMatches } from "@/lib/receipt-sid";
import {
  createLocalKeyStore,
  decryptKey,
  encryptKey,
  isKeyFor,
  keyFileJson,
  newReceiptKey,
  parseKeyFile,
  RECEIPT_STORE_PREFIX,
  type ReceiptKey,
} from "@/lib/receipt-keys";
import {
  canonicalJson,
  createReceiptIntent,
  fetchReceipt,
  receiptRequestMessage,
  receiptStatusKey,
  recipientLabel,
  type ReceiptDeps,
} from "@/lib/receipt-api";
import { createPaymentIntent, type IntentResult } from "@/lib/mpt-intent";
import { fetchPublicReceiptSummary, keyBackupFileName, listLocalReceipts, rememberReceipt } from "@/lib/receipt-index";

/** Zlatni vektor iz railovog testa (docs/16 §3.1) — mora dati bajt-identičan sid. */
const PK: Hex = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const OWNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const SALT: Hex = "0x000102030405060708090a0b0c0d0e0f";
const SID = "r183ns4pcpn659hd2z3xtaqiwq";
const GOLDEN: ReceiptKey = { v: 1, sid: SID, owner: OWNER, salt: SALT, pk: PK, created_at: 1791800000 };
const SAFE = "0x4f7f000000000000000000000000000000000173" as const;

class MemoryStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

describe("receipt-sid (kopija raila)", () => {
  it("zlatni vektor", () => {
    expect(privateKeyToAccount(PK).address).toBe(OWNER);
    expect(deriveReceiptSid(OWNER, SALT)).toBe(SID);
    expect(deriveReceiptSid(OWNER.toLowerCase(), SALT)).toBe(SID);
    expect(isReceiptSid(SID)).toBe(true);
    expect(receiptSidMatches(SID, OWNER, SALT)).toBe(true);
  });

  it("drugi salt ili vlasnik daju drugi sid", () => {
    expect(receiptSidMatches(SID, OWNER, "0x000102030405060708090a0b0c0d0e00")).toBe(false);
    expect(receiptSidMatches(SID, "0x0000000000000000000000000000000000000001", SALT)).toBe(false);
  });

  it("sid običnog intenta nije sid potvrde", () => {
    expect(isReceiptSid("abc123")).toBe(false);
    expect(isReceiptSid(SID.toUpperCase())).toBe(false);
  });
});

describe("receipt-keys", () => {
  it("novi ključ je dosljedan: sid iz vlasnika i salta", () => {
    const k = newReceiptKey(100);
    expect(k.v).toBe(1);
    expect(k.created_at).toBe(100);
    expect(isReceiptSid(k.sid)).toBe(true);
    expect(privateKeyToAccount(k.pk).address).toBe(k.owner);
    expect(isKeyFor(k.sid, k)).toBe(true);
    expect(newReceiptKey().sid).not.toBe(k.sid);
  });

  it("spremište: railov prefiks, učitavanje provjerava sid", () => {
    const mem = new MemoryStorage();
    const store = createLocalKeyStore(() => mem as unknown as Storage);
    expect(store.save(GOLDEN)).toBe(true);
    expect(mem.map.has(RECEIPT_STORE_PREFIX + SID)).toBe(true);
    expect(store.load(SID)).toEqual(GOLDEN);
    // Podmetnut ključ pod tuđim sid-om se ne učita.
    mem.setItem(RECEIPT_STORE_PREFIX + "r1aaaaaaaaaaaaaaaaaaaaaaaa", JSON.stringify(GOLDEN));
    expect(store.load("r1aaaaaaaaaaaaaaaaaaaaaaaa")).toBeNull();
  });

  it("spremište bez localStorage ili s greškom javlja false", () => {
    expect(createLocalKeyStore(() => null).save(GOLDEN)).toBe(false);
    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const store = createLocalKeyStore(() => throwing as unknown as Storage);
    expect(store.save(GOLDEN)).toBe(false);
    expect(store.load(SID)).toBeNull();
  });

  it("uvoz otvorene datoteke i odbijanje tuđeg ključa", async () => {
    expect(await parseKeyFile(SID, keyFileJson(GOLDEN), "")).toEqual(GOLDEN);
    await expect(parseKeyFile("r1aaaaaaaaaaaaaaaaaaaaaaaa", keyFileJson(GOLDEN), "")).rejects.toThrow("wrong_key");
  });

  it("enkripcija lozinkom: railov oblik i povratak", async () => {
    const blob = await encryptKey(GOLDEN, "lozinka123");
    const e = JSON.parse(blob) as Record<string, unknown>;
    expect(e).toMatchObject({ v: 1, kdf: "pbkdf2-sha256", iter: 310_000 });
    expect(await decryptKey(blob, "lozinka123")).toEqual(GOLDEN);
    // Oba oblika koja rail čita: { encrypted_key } i gol blob.
    expect(await parseKeyFile(SID, JSON.stringify({ encrypted_key: blob }), "lozinka123")).toEqual(GOLDEN);
    expect(await parseKeyFile(SID, blob, "lozinka123")).toEqual(GOLDEN);
    await expect(parseKeyFile(SID, blob, "kriva-lozinka")).rejects.toThrow();
  });
});

describe("createPaymentIntent sa sid-om", () => {
  const okBody = {
    sid: SID,
    amount_eur: "1.00",
    memo: `mpt:${SAFE}?sid=${SID}`,
    iban: "EE00",
    beneficiary_name: "MPT",
    epc_qr_data: "BCD",
    status_url: "https://mpt.domovina.ai/api/intents/" + SID,
  };

  it("šalje sid u tijelu", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(okBody), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const r = await createPaymentIntent(SAFE, 1, { receiptSid: SID });
      expect(r.ok).toBe(true);
      const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
      expect(JSON.parse(String(init.body))).toEqual({ target_address: SAFE, amount_eur: "1.00", sid: SID });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("bez potvrde ne šalje sid", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(okBody), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await createPaymentIntent(SAFE, 1);
      const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
      expect(JSON.parse(String(init.body))).not.toHaveProperty("sid");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("409 → sid_conflict", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: "sid_already_exists" }), { status: 409 }));
    try {
      expect(await createPaymentIntent(SAFE, 1, { receiptSid: SID })).toEqual({ ok: false, reason: "sid_conflict" });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("createReceiptIntent", () => {
  const intentOk = (sid: string): IntentResult => ({
    ok: true,
    intent: {
      sid,
      amountEur: "1.00",
      memo: "",
      iban: "",
      beneficiaryName: "",
      bic: null,
      epcQrData: "",
      hub3Data: null,
      statusUrl: "",
      expiresAt: "",
    },
  });

  it("ključ se sprema PRIJE POST-a", async () => {
    const order: string[] = [];
    const store = { load: () => null, save: () => (order.push("save"), true) };
    const create = vi.fn(async (_t: unknown, _a: unknown, o?: { receiptSid?: string }) => {
      order.push("post");
      return intentOk(o!.receiptSid!);
    });
    const r = await createReceiptIntent(SAFE, 1, store, create);
    expect(order).toEqual(["save", "post"]);
    expect(r.ok && r.intent.sid === r.key?.sid).toBe(true);
    expect(r.saved).toBe(true);
  });

  it("na 409 novi ključ i jedan novi pokušaj", async () => {
    const saved: string[] = [];
    const store = { load: () => null, save: (k: ReceiptKey) => (saved.push(k.sid), true) };
    let n = 0;
    const create = vi.fn(async (_t: unknown, _a: unknown, o?: { receiptSid?: string }): Promise<IntentResult> =>
      n++ === 0 ? { ok: false, reason: "sid_conflict" } : intentOk(o!.receiptSid!),
    );
    const r = await createReceiptIntent(SAFE, 1, store, create);
    expect(create).toHaveBeenCalledTimes(2);
    expect(saved).toHaveLength(2);
    expect(saved[0]).not.toBe(saved[1]);
    expect(r.ok && r.key?.sid).toBe(saved[1]);
  });

  it("dva 409 zaredom → greška bez ključa", async () => {
    const create = vi.fn(async (): Promise<IntentResult> => ({ ok: false, reason: "sid_conflict" }));
    const r = await createReceiptIntent(SAFE, 1, { load: () => null, save: () => true }, create);
    expect(create).toHaveBeenCalledTimes(2);
    expect(r).toMatchObject({ ok: false, reason: "sid_conflict", key: null });
  });

  it("nespremljen ključ se javlja (UI traži preuzimanje prije QR-a)", async () => {
    const r = await createReceiptIntent(SAFE, 1, { load: () => null, save: () => false }, async (_t, _a, o) =>
      intentOk(o!.receiptSid!),
    );
    expect(r.saved).toBe(false);
    expect(r.key).not.toBeNull();
  });
});

describe("fetchReceipt", () => {
  const receipt = { version: "mpt-receipt-v1", sid: SID, status: "issued", payments: [] };

  it("s ključem: POST s potpisom točne poruke", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const deps: ReceiptDeps = {
      fetch: (async (url: string, init?: RequestInit) => {
        calls.push([url, init]);
        return new Response(JSON.stringify(receipt));
      }) as typeof fetch,
      nowS: () => 1791800000,
    };
    const r = await fetchReceipt(SID, GOLDEN, deps);
    expect(r.ok).toBe(true);
    const [url, init] = calls[0]!;
    expect(url).toBe(`https://mpt.domovina.ai/api/intents/${SID}/receipt`);
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as { owner: string; salt: string; ts: number; signature: Hex };
    expect(body).toMatchObject({ owner: OWNER, salt: SALT, ts: 1791800000 });
    expect(receiptRequestMessage(SID, 1791800000)).toBe(`MPT potvrda o uplati\nsid: ${SID}\nvrijeme: 1791800000`);
    const signer = await recoverMessageAddress({ message: receiptRequestMessage(SID, body.ts), signature: body.signature });
    expect(signer).toBe(OWNER);
  });

  it("bez ključa: javni GET", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const deps: ReceiptDeps = {
      fetch: (async (url: string, init?: RequestInit) => {
        calls.push([url, init]);
        return new Response(JSON.stringify(receipt));
      }) as typeof fetch,
      nowS: () => 0,
    };
    await fetchReceipt(SID, null, deps);
    expect(calls[0]?.[1]).toBeUndefined();
  });

  it("greška raila se prenosi", async () => {
    const deps: ReceiptDeps = {
      fetch: (async () => new Response(JSON.stringify({ error: "stale_signature" }), { status: 403 })) as typeof fetch,
      nowS: () => 0,
    };
    expect(await fetchReceipt(SID, GOLDEN, deps)).toEqual({ ok: false, error: "stale_signature" });
  });
});

describe("mapiranje statusa i kanonski JSON", () => {
  it("status → tekst", () => {
    expect(receiptStatusKey("issued")).toBe("receipt.statusIssued");
    expect(receiptStatusKey("awaiting_payment")).toBe("receipt.statusAwaiting");
    expect(receiptStatusKey("settling")).toBe("receipt.statusSettling");
    expect(receiptStatusKey("confirmed")).toBe("receipt.statusSettling");
    expect(receiptStatusKey("unbound_stray")).toBe("receipt.statusUnbound");
    expect(receiptStatusKey("not_delivered:failed")).toBe("receipt.statusNotDelivered");
    expect(receiptStatusKey("nesto_novo")).toBe("receipt.statusUnknown");
  });

  it("kanonski JSON: sortirani ključevi, bez undefined", () => {
    expect(canonicalJson({ b: 1, a: { d: [2, null], c: "x" }, z: undefined })).toBe('{"a":{"c":"x","d":[2,null]},"b":1}');
  });
});

describe("primatelj retka", () => {
  const projects = [{ safe: "0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173", place: "Lukavec" }, { safe: null, place: "X" }];
  it("naša elektrana po imenu, tuđi Safe skraćeno, bez polja null", () => {
    expect(recipientLabel("0x4f7f1950b2cb6713ccb47b869f30c0ebc01d0173", projects)).toBe("Lukavec");
    expect(recipientLabel("0x6693a7d19486dc45e9f90fd2d515d972bba2d65e", projects)).toBe("0x6693…d65e");
    expect(recipientLabel(undefined, projects)).toBeNull();
  });
});

describe("popis potvrda iz preglednika", () => {
  class FullStorage {
    map = new Map<string, string>();
    get length() {
      return this.map.size;
    }
    key(i: number) {
      return [...this.map.keys()][i] ?? null;
    }
    getItem(k: string) {
      return this.map.get(k) ?? null;
    }
    setItem(k: string, v: string) {
      this.map.set(k, v);
    }
  }

  it("popis su ključevi, najnoviji prvi; indeks dodaje primatelja i iznos", () => {
    const s = new FullStorage();
    s.setItem("mpt-receipt:r1aaaaaaaaaaaaaaaaaaaaaaaa", JSON.stringify({ created_at: 100 }));
    s.setItem("mpt-receipt:r1bbbbbbbbbbbbbbbbbbbbbbbb", JSON.stringify({ created_at: 200 }));
    s.setItem("nesto-drugo", "x");
    s.setItem("mpt-receipt:pokvaren", "{nije json");
    const storage = s as unknown as Storage;
    expect(listLocalReceipts(storage).map((e) => e.sid)).toEqual([
      "r1bbbbbbbbbbbbbbbbbbbbbbbb",
      "r1aaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
    expect(rememberReceipt(storage, "r1aaaaaaaaaaaaaaaaaaaaaaaa", SAFE.toUpperCase().replace("0X", "0x"), 100)).toBe(true);
    const a = listLocalReceipts(storage).find((e) => e.sid === "r1aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(a).toMatchObject({ target: SAFE.toLowerCase(), amountCents: 100, createdAt: 100 });
    expect(listLocalReceipts(null)).toEqual([]);
  });

  it("javni sažetak: stanje, primatelj, izravni iznos; greška → null", async () => {
    const ok = (async () =>
      new Response(
        JSON.stringify({
          status: "issued",
          intent: { target_address: "0xABC", amount_cents: 100 },
          payments: [{ kind: "direct", amount_cents: 100 }, { kind: "lazy", amount_cents: 500 }],
        }),
      )) as typeof fetch;
    expect(await fetchPublicReceiptSummary(SID, ok)).toEqual({ status: "issued", target: "0xabc", amountCents: 100, directCents: 100 });
    expect(await fetchPublicReceiptSummary(SID, (async () => new Response("{}", { status: 404 })) as typeof fetch)).toBeNull();
    expect(await fetchPublicReceiptSummary(SID, (async () => { throw new Error("net"); }) as typeof fetch)).toBeNull();
  });
});

describe("ime datoteke ključa", () => {
  it("sufiks za zaključan/otključan i vrijeme preuzimanja", () => {
    const d = new Date(2026, 9, 12, 9, 5, 7);
    expect(keyBackupFileName(SID, false, d)).toBe(`mpt-kljuc-${SID}-otkljucan-20261012-090507.json`);
    expect(keyBackupFileName(SID, true, d)).toBe(`mpt-kljuc-${SID}-zakljucan-20261012-090507.json`);
    expect(keyBackupFileName(SID, true, new Date(2026, 9, 12, 9, 5, 8))).not.toBe(keyBackupFileName(SID, true, d));
  });
});
