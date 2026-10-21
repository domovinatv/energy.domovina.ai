import { describe, expect, it } from "vitest";
import {
  RAIL_PENDING_WINDOW_MS,
  parsePayerTags,
  payerLabel,
  payerRef,
  payersUrl,
  railOnlyPending,
  tagsByHash,
  type PayerTag,
} from "@/lib/payer-tags";
import { RAIL_ITALK } from "@/lib/rail-profile";

const tag = (over: Partial<PayerTag> = {}): PayerTag => ({
  label: "M. S. ··0160",
  cents: 2500,
  receivedAt: 1_000,
  minted: false,
  txHashes: [],
  ref: null,
  ...over,
});

describe("oznaka uplatitelja", () => {
  it("inicijali i zadnje 4 znamenke, ili ono od toga što postoji", () => {
    expect(payerLabel("M. S.", "0160")).toBe("M. S. ··0160");
    expect(payerLabel(null, "0160")).toBe("··0160");
    expect(payerLabel("M. S.", null)).toBe("M. S.");
    expect(payerLabel(null, null)).toBeNull();
  });
  it("ne prikazuje ništa što nije 4 znaka IBAN-a — ni ako rail jednom pošalje više", () => {
    expect(payerLabel("M. S.", "HR1210010051863000160")).toBe("M. S.");
  });
  it("adresa endpointa je uz intent API raila", () => {
    expect(payersUrl(RAIL_ITALK, "0xabc")).toBe("https://mpt.domovina.ai/api/payers/0xabc");
  });
  it("odgovor raila: hashevi malim slovima, neispravni retci ispadaju", () => {
    const tags = parsePayerTags({
      data: [
        {
          initials: "M. S.",
          iban_last4: "0160",
          amount_cents: 2500,
          received_at: "2026-10-21T10:00:00Z",
          state: "minted",
          tx_hashes: ["0xABC"],
          ref: "00112233aabbccdd",
        },
        { initials: "X.", amount_cents: "25" },
      ],
    });
    expect(tags).toEqual([
      tag({ receivedAt: Date.parse("2026-10-21T10:00:00Z"), minted: true, txHashes: ["0xabc"], ref: "00112233aabbccdd" }),
    ]);
    expect(parsePayerTags({ error: "x" })).toEqual([]);
  });
  it("ref je isti izračun kao na railu: SHA-256(sid), prvih 16 hex", async () => {
    // node -e "crypto.createHash('sha256').update('abc').digest('hex').slice(0,16)"
    expect(await payerRef("abc")).toBe("ba7816bf8f01cfea");
  });
});

describe("uparivanje s lancem i s vlastitim uplatama", () => {
  it("oznaka se veže uz prijenos po bilo kojem hashu uplate", () => {
    const t = tag({ txHashes: ["0xmint", "0xfwd"] });
    expect(tagsByHash([t]).get("0xfwd")).toBe(t);
  });
  it("zaprimljena uplata koje nema na lancu vidi se svima", () => {
    expect(railOnlyPending([tag()], [], new Set(), 2_000)).toHaveLength(1);
  });
  it("kad sjedne na lanac, više nije zasebni redak — nema dvostrukog zbroja", () => {
    expect(railOnlyPending([tag({ txHashes: ["0xabc"] })], ["0xABC"], new Set(), 2_000)).toEqual([]);
  });
  it("uplatitelj svoju uplatu već vidi iz localStoragea — rail redak se ne ponavlja", () => {
    expect(railOnlyPending([tag({ ref: "r1" })], [], new Set(["r1"]), 2_000)).toEqual([]);
  });
  it("stara ili nedatirana nepotvrđena uplata ne napuhava zbroj zauvijek", () => {
    expect(railOnlyPending([tag()], [], new Set(), 1_000 + RAIL_PENDING_WINDOW_MS)).toEqual([]);
    expect(railOnlyPending([tag({ receivedAt: null })], [], new Set(), 2_000)).toEqual([]);
  });
});
