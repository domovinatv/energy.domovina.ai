import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { hr } from "@/lib/i18n/hr";
import { formatDateShort, formatEurPrecise } from "@/lib/format";
import { pdfAttachments } from "@/lib/pdf-attachments";
import { asReceipt, verifyReceipt } from "@/lib/receipt-verify";
import { buildVerifyPdf } from "@/lib/verify-pdf";
import { canonicalJson, receiptPublicPart } from "@/lib/receipt-api";
import { buildReceiptPdf, monoSafe, RECEIPT_PDF_FONT_URLS, wrapText, type ReceiptPdfFonts } from "@/lib/receipt-pdf";
import { StandardFonts } from "pdf-lib";
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
    { kind: "lazy", order_id: "o1", tx_hash: "0x" + "1".repeat(64), amount_cents: 500, placed_at: "2026-10-05T10:00:00Z", leaf_hash: "0xaa", anchor: { anchor_id: 3, root: "0x" + "ab".repeat(32), proof: [], ots_available: true, anchored_at: 1791500000 }, target_address: "0x6693a7d19486dc45e9f90fd2d515d972bba2d65e" },
    { kind: "direct", order_id: "o2", tx_hash: "0x" + "2".repeat(64), amount_cents: 100, placed_at: "2026-10-12T08:00:00Z", leaf_hash: "0xbb", anchor: null, target_address: "0x4f7f1950b2cb6713ccb47b869f30c0ebc01d0173" },
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
    expect(has(FONTS.regular, diacritics + "„“”‖€…—·→")).toEqual([]);
    expect(has(FONTS.semibold, diacritics + "„“”‖€…—·→")).toEqual([]);
    expect(has(FONTS.display, diacritics)).toEqual([]);
  });

  it("napravi PDF s ugrađenim podskupom fontova", async () => {
    const bytes = await buildReceiptPdf(RC, null, FONTS, {
      t,
      formatEur: formatEurPrecise,
      formatDate: (iso) => formatDateShort(iso, "hr"),
      generatedAt: "12. 10. 2026. 09:00",
      verifyUrl: "https://energy.domovina.ai/beta/provjera/",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    // Podskup: puni Inter je ~325 KB po rezu; PDF mora biti puno manji.
    expect(bytes.length).toBeLessThan(2_000_000);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(doc.getTitle()).toContain(RC.sid);
  });

  it("velika potvrda (74 retka, ~30 KB JSON-a bez razmaka) se napravi brzo", async () => {
    const base = RC.payments[0]!;
    const many: Receipt = {
      ...RC,
      payments: Array.from({ length: 74 }, (_, i) => ({
        ...base,
        order_id: `o${i}`,
        leaf_hash: `0x${i.toString(16).padStart(64, "0")}`,
        anchor: { ...base.anchor!, proof: Array.from({ length: 7 }, (_, j) => `0x${String(j).repeat(64)}`) },
      })),
    };
    const started = Date.now();
    const bytes = await buildReceiptPdf(many, null, FONTS, {
      t,
      formatEur: formatEurPrecise,
      formatDate: (iso) => formatDateShort(iso, "hr"),
      generatedAt: "12. 10. 2026. 09:00",
      verifyUrl: "https://energy.domovina.ai/beta/provjera/",
    });
    expect(Date.now() - started).toBeLessThan(5_000);
    if (process.env.RECEIPT_PDF_OUT) writeFileSync(process.env.RECEIPT_PDF_OUT, bytes);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(2);
  }, 20_000);

  it("wrapText: nijedan redak nije širi od zadanog i tekst ostaje cijel", async () => {
    const doc = await PDFDocument.create();
    const mono = await doc.embedFont(StandardFonts.Courier);
    const json = JSON.stringify({ a: "x".repeat(5000), b: Array.from({ length: 200 }, (_, i) => i) });
    const lines = wrapText(json, mono, 7, 300);
    expect(lines.join("")).toBe(json);
    for (const line of lines) expect(mono.widthOfTextAtSize(line, 7)).toBeLessThanOrEqual(300.01);
    const prose = "Rijeci se lome na razmaku, a preduga 0x" + "ab".repeat(80) + " ide po znakovima.";
    const pl = wrapText(prose, mono, 9, 200);
    expect(pl.join(" ").replace(/\s+/g, "")).toBe(prose.replace(/\s+/g, ""));
    for (const line of pl) expect(mono.widthOfTextAtSize(line, 9)).toBeLessThanOrEqual(200.01);
  });

  it("dijakritike u labelu (JSON ide u Courier) ne ruše PDF", async () => {
    const rc: Receipt = { ...RC, intent: { ...RC.intent, label: "Članarina čćđšž — „test”" } };
    const bytes = await buildReceiptPdf(rc, null, FONTS, {
      t,
      formatEur: formatEurPrecise,
      formatDate: (iso) => formatDateShort(iso, "hr"),
      generatedAt: "12. 10. 2026. 09:00",
      verifyUrl: "https://energy.domovina.ai/beta/provjera/",
    });
    expect(bytes.length).toBeGreaterThan(1000);
    // Escapeani JSON je ista vrijednost.
    const json = JSON.stringify({ label: rc.intent.label });
    expect(monoSafe(json)).toMatch(/^[\x20-\x7e]*$/);
    expect(JSON.parse(monoSafe(json))).toEqual({ label: rc.intent.label });
  });

  it("PDF nosi točne bajtove kanonskog JSON-a kao privitak", async () => {
    const bytes = await buildReceiptPdf(RC, null, FONTS, {
      t,
      formatEur: formatEurPrecise,
      formatDate: (iso) => formatDateShort(iso, "hr"),
      generatedAt: "12. 10. 2026. 09:00",
      verifyUrl: "https://energy.domovina.ai/beta/provjera/",
    });
    const att = await pdfAttachments(bytes);
    expect(att.map((a) => a.name)).toEqual([`mpt-potvrda-${RC.sid}.json`]);
    expect(new TextDecoder().decode(att[0]!.data)).toBe(canonicalJson(receiptPublicPart(RC, null)));
  });

  it("izvještaj o provjeri: PDF nosi izvještaj (JSON) i točne bajtove potvrde", async () => {
    const receiptBytes = new TextEncoder().encode(JSON.stringify(RC));
    const report = await verifyReceipt(asReceipt(RC)!, { net: null });
    const bytes = await buildVerifyPdf(report, [{ name: "p.json", sha256: "00" }], receiptBytes, FONTS, {
      t,
      formatEur: formatEurPrecise,
      generatedAt: "12. 10. 2026.",
      verifyUrl: "https://energy.domovina.ai/beta/provjera/",
    });
    const att = await pdfAttachments(bytes);
    const rep = att.find((a) => a.name.startsWith("provjera-potvrde-"));
    expect(JSON.parse(new TextDecoder().decode(rep!.data))).toMatchObject({ version: "domovina-energy-receipt-verify-v1", sid: RC.sid, result: report.result });
    expect(att.find((a) => a.name === `mpt-potvrda-${RC.sid}.json`)?.data).toEqual(receiptBytes);
  });
});
