/**
 * Ključ potvrde o uplati (pay.domovina.ai ADR 0022, docs/16 §4 #3).
 *
 * Preglednik PRIJE plaćanja napravi tajni ključ i salt i iz njih izvede `sid`
 * (`lib/receipt-sid.ts`). Ključ ne napušta uređaj osim u rezervnoj kopiji koju
 * uplatitelj sam preuzme. Format datoteke, ključ u `localStorage` i parametri
 * enkripcije su ISTI kao na railovoj stranici (`receipts/client/main.ts`), pa
 * se ključ izvezen ovdje uvozi na `mpt.domovina.ai/potvrda/<sid>` i obrnuto.
 *
 * Spremište je iza sučelja `ReceiptKeyStore`: ADR 0023 ga zamjenjuje glavnim
 * ključem iz 24 riječi i passkeyjem, a ostatak toka (`receipt-api.ts`, UI) ne
 * smije znati gdje ključ živi.
 */
import { bytesToHex, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { deriveReceiptSid } from "@/lib/receipt-sid";
import { browserStorage, RECEIPT_KEY_EVENT, RECEIPT_STORE_PREFIX } from "@/lib/receipt-index";

export interface ReceiptKey {
  v: 1;
  sid: string;
  owner: string;
  salt: Hex;
  pk: Hex;
  created_at: number;
}

export interface ReceiptKeyStore {
  load(sid: string): ReceiptKey | null;
  /** `false` kad preglednik ne dopušta spremanje (privatni način, puna kvota). */
  save(key: ReceiptKey): boolean;
}

// Konstante žive u viem-free modulu jer ih treba i popis potvrda na stranici projekta.
export { RECEIPT_KEY_EVENT, RECEIPT_STORE_PREFIX } from "@/lib/receipt-index";

export function newReceiptKey(nowS: number = Math.floor(Date.now() / 1000)): ReceiptKey {
  const pk = generatePrivateKey();
  const owner = privateKeyToAccount(pk).address;
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return { v: 1, sid: deriveReceiptSid(owner, salt), owner, salt, pk, created_at: nowS };
}

/** Pripada li ključ ovom `sid`-u: `sid == derive(owner(pk), salt)`. Nikad ne baca. */
export function isKeyFor(sid: string, k: unknown): k is ReceiptKey {
  if (k === null || typeof k !== "object") return false;
  const { pk, salt } = k as Partial<ReceiptKey>;
  if (typeof pk !== "string" || typeof salt !== "string") return false;
  try {
    return deriveReceiptSid(privateKeyToAccount(pk).address, salt as Hex) === sid;
  } catch {
    return false;
  }
}

/** `localStorage` spremište; `storage` se podmeće u testu, `null` = nedostupno. */
export function createLocalKeyStore(storage: () => Storage | null = browserStorage): ReceiptKeyStore {
  return {
    load(sid) {
      try {
        const raw = storage()?.getItem(RECEIPT_STORE_PREFIX + sid);
        if (!raw) return null;
        const k: unknown = JSON.parse(raw);
        return isKeyFor(sid, k) ? k : null;
      } catch {
        return null;
      }
    },
    save(key) {
      try {
        const s = storage();
        if (s === null) return false;
        s.setItem(RECEIPT_STORE_PREFIX + key.sid, JSON.stringify(key));
        if (typeof window !== "undefined") window.dispatchEvent(new Event(RECEIPT_KEY_EVENT));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const receiptKeyStore: ReceiptKeyStore = createLocalKeyStore();

// ---------- datoteka ključa ----------

export const keyFileName = (sid: string) => `mpt-kljuc-${sid}.json`;
export const keyFileJson = (k: ReceiptKey) => JSON.stringify(k, null, 2);

/**
 * Učita datoteku ključa: otvorenu, `{ encrypted_key: "<json>" }` ili gol
 * šifrirani blob (`{ v, kdf, iter, salt, iv, ct }`) — sva tri oblika koja rail
 * piše ili čita. Baca `wrong_key` kad ključ ne pripada `sid`-u.
 */
export async function parseKeyFile(sid: string, text: string, password: string): Promise<ReceiptKey> {
  let k = JSON.parse(text) as Partial<ReceiptKey> & { encrypted_key?: string; ct?: string };
  if (k.encrypted_key || k.ct) k = await decryptKey(k.encrypted_key ?? text, password);
  if (!isKeyFor(sid, k)) throw new Error("wrong_key");
  return k;
}

// ---------- enkripcija lozinkom (PBKDF2-SHA256 + AES-GCM, kao rail) ----------

export const PBKDF2_ITER = 310_000;

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function aesKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Vraća blob (string JSON-a) — u datoteku ide kao `{ encrypted_key: blob }`. */
export async function encryptKey(k: ReceiptKey, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await aesKey(password, salt, PBKDF2_ITER),
      new TextEncoder().encode(JSON.stringify(k)),
    ),
  );
  return JSON.stringify({ v: 1, kdf: "pbkdf2-sha256", iter: PBKDF2_ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) });
}

export async function decryptKey(blob: string, password: string): Promise<ReceiptKey> {
  const e = JSON.parse(blob) as { iter?: number; salt: string; iv: string; ct: string };
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(e.iv) },
    await aesKey(password, unb64(e.salt), e.iter ?? PBKDF2_ITER),
    unb64(e.ct),
  );
  return JSON.parse(new TextDecoder().decode(pt)) as ReceiptKey;
}
