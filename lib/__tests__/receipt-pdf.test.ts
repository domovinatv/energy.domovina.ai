import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { hr } from "@/lib/i18n/hr";
import { formatDateShort, formatEurPrecise } from "@/lib/format";
import { buildReceiptPdf, RECEIPT_PDF_FONT_URLS, type ReceiptPdfFonts } from "@/lib/receipt-pdf";
import type { Receipt } from "@/lib/receipt-api";

const font = (url: string) => new Uint8Array(readFileSync(join(process.cwd(), "public", url)));
const FONTS: ReceiptPdfFonts = {
  regular: font(RECEIPT_PDF_FONT_URLS.regular),
  semibold: font(RECEIPT_PDF_FONT_URLS.semibold),
  display: font(RECEIPT_PDF_FONT_URLS.display),
};

const t = (key: keyof typeof hr, vars?: Readonly<Record<string, string | number>>) =>
  (hr[key] as string).replace(/\{(\w+)\}/g, (m, k: string) => (vars && k in vars ? String(vars[k]) : m));

const RC: Receipt = {
  version: "mpt-receipt-v1",
  sid: "r183ns4pcpn659hd2z3xtaqiwq",
  chain_id: 100,
  status: "issued",
  intent: {
    amount_cents: 100,
    currency: "EUR",
    label: "Lukavec",
    target_address: "0x4f7f1950b2cb6713ccb47b869f30c0ebc01d0173",
    tenant_id: null,
    created_at: 1791800000,
    paid_at: 1791800100,
  },
  forward_tx_hash: null,
  payment_registry: null,
  payments: [
    { kind: "lazy", order_id: "o1", tx_hash: "0x" + "1".repeat(64), amount_cents: 500, placed_at: "2026-10-05T10:00:00Z", leaf_hash: "0xaa", anchor: { anchor_id: 3, root: "0x" + "ab".repeat(32), proof: [], ots_available: true, anchored_at: 1791500000 } },
    { kind: "direct", order_id: "o2", tx_hash: "0x" + "2".repeat(64), amount_cents: 100, placed_at: "2026-10-12T08:00:00Z", leaf_hash: "0xbb", anchor: null },
  ],
  lazy_included: true,
  owner: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  salt: "0x000102030405060708090a0b0c0d0e0f",
};

describe("PDF potvrde", () => {
  it("fontovi imaju hrvatske dijakritike i znakove iz copyja", () => {
    const has = (bytes: Uint8Array, chars: string) => {
      const f = fontkit.create(bytes as unknown as Buffer);
      return [...chars].filter((c) => !f.hasGlyphForCodePoint(c.codePointAt(0)!));
    };
    const diacritics = "ČčĆćĐđŠšŽž";
    // Inter nosi sav tekst (i „‖" iz uputa za provjeru); Fraunces samo naslov.
    expect(has(FONTS.regular, diacritics + "„“”‖€…—·")).toEqual([]);
    expect(has(FONTS.semibold, diacritics + "„“”‖€…—·")).toEqual([]);
    expect(has(FONTS.display, diacritics)).toEqual([]);
  });

  it("napravi PDF s ugrađenim podskupom fontova", async () => {
    const bytes = await buildReceiptPdf(RC, null, FONTS, {
      t,
      formatEur: formatEurPrecise,
      formatDate: (iso) => formatDateShort(iso, "hr"),
      generatedAt: "12. 10. 2026. 09:00",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    // Podskup: puni Inter je ~325 KB po rezu; PDF mora biti puno manji.
    expect(bytes.length).toBeLessThan(2_000_000);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(doc.getTitle()).toContain(RC.sid);
    if (process.env.RECEIPT_PDF_OUT) writeFileSync(process.env.RECEIPT_PDF_OUT, bytes);
  });
});
