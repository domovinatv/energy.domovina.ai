/**
 * Potvrda o uplati kao PDF, generiran u pregledniku (docs/16 §4 #7).
 *
 * Bez dijaloga za ispis: korisnik dobije datoteku i s njom radi što hoće.
 * Fontovi su fontovi stranice (Inter za tekst, Fraunces za naslov, OFL), kao
 * statični TTF u `public/fonts/`, i ugrađuju se kao podskup, pa PDF nosi
 * hrvatske dijakritike i ne ovisi o fontovima uređaja. Hashevi, adrese i JSON
 * su ASCII, pa za njih stoji ugrađeni Courier.
 *
 * U PDF ide samo javni dio (A). Ključ (dio B) se NE stavlja u PDF: PDF je ono
 * što se šalje kao dokaz, a „tko ima ključ, ima i pravo iz potvrde".
 *
 * Čista funkcija nad bajtovima fontova, pa radi i u testu (node) i u pregledniku.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { BETA_PROJECTS } from "@/lib/beta-projects";
import {
  canonicalJson,
  recipientLabel,
  otsUrl,
  receiptPublicPart,
  receiptStatusKey,
  type Receipt,
  type ReceiptAnchor,
} from "@/lib/receipt-api";
import type { ReceiptKey } from "@/lib/receipt-keys";
import type { MessageKey } from "@/lib/i18n/hr";
import { FOREST as FOREST_HEX, INK as INK_HEX, INK_MUTED, SAND_DEEP } from "@/lib/diagram-colors";

export interface ReceiptPdfFonts {
  regular: Uint8Array;
  semibold: Uint8Array;
  display: Uint8Array;
}

export const RECEIPT_PDF_FONT_URLS = {
  regular: "/fonts/inter-400.ttf",
  semibold: "/fonts/inter-600.ttf",
  display: "/fonts/fraunces-600.ttf",
} as const;

export interface ReceiptPdfText {
  t: (key: MessageKey, vars?: Readonly<Record<string, string | number>>) => string;
  formatEur: (cents: number) => string;
  formatDate: (iso: string | null) => string;
  /** Kad je PDF napravljen — ide u podnožje. */
  generatedAt: string;
}

export const receiptPdfFileName = (sid: string) => `potvrda-o-uplati-${sid}.pdf`;

// A4 u točkama, margine 48 pt.
const W = 595.28;
const H = 841.89;
const M = 48;
const CONTENT_W = W - 2 * M;

// pdf-lib ne čita Tailwind, pa boje dolaze iz iste iznimke kao dijagrami
// (`lib/diagram-colors.ts`, uz svaku boju piše token).
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex(INK_HEX);
const MUTED = hex(INK_MUTED);
const FOREST = hex(FOREST_HEX);
const RULE = hex(SAND_DEEP);

class Layout {
  page: PDFPage;
  y = H - M;
  constructor(private doc: PDFDocument) {
    this.page = doc.addPage([W, H]);
  }
  /** `true` kad je otvorena nova stranica (tablica tada ponovi zaglavlje). */
  ensure(h: number): boolean {
    if (this.y - h < M + 24) {
      this.page = this.doc.addPage([W, H]);
      this.y = H - M;
      return true;
    }
    return false;
  }
  gap(h: number) {
    this.y -= h;
  }
}

/**
 * Prelamanje po riječima; predugačka „riječ" (hash, kanonski JSON) se lomi po
 * znakovima. ⚠️ Linearno: kanonski JSON velike potvrde je ~30 KB bez ijednog
 * razmaka. Prva verzija skraćivala je takvu riječ znak po znak i svaki put
 * mjerila cijeli ostatak — O(n²) po retku, a kartica se smrznula (12. 10. 2026.,
 * potvrda s 74 retka). Zato se širina znakova zbraja jednim prolazom.
 */
export function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  const space = font.widthOfTextAtSize(" ", size);
  const charW = new Map<string, number>();
  const widthOfChar = (c: string) => {
    let w = charW.get(c);
    if (w === undefined) {
      w = font.widthOfTextAtSize(c, size);
      charW.set(c, w);
    }
    return w;
  };
  for (const para of text.split("\n")) {
    let line = "";
    let lineW = 0;
    for (const word of para.split(" ")) {
      // Mjeri se samo riječ, ne cijeli redak; širina riječi je zbroj znakova
      // (bez kerninga — razlika je ispod pola točke, a redak ima rezervu).
      let wordW = 0;
      for (const c of word) wordW += widthOfChar(c);
      const sep = line === "" ? 0 : space;
      if (lineW + sep + wordW <= width) {
        line = line === "" ? word : `${line} ${word}`;
        lineW += sep + wordW;
        continue;
      }
      if (line !== "") lines.push(line);
      line = "";
      lineW = 0;
      if (wordW <= width) {
        line = word;
        lineW = wordW;
        continue;
      }
      // Riječ šira od retka: lomi po znakovima, jednim prolazom.
      for (const c of word) {
        const w = widthOfChar(c);
        if (line !== "" && lineW + w > width) {
          lines.push(line);
          line = "";
          lineW = 0;
        }
        line += c;
        lineW += w;
      }
    }
    lines.push(line);
  }
  return lines;
}

function paragraph(
  l: Layout,
  text: string,
  font: PDFFont,
  size: number,
  opts: { color?: ReturnType<typeof rgb>; x?: number; width?: number; leading?: number } = {},
) {
  const x = opts.x ?? M;
  const width = opts.width ?? CONTENT_W - (x - M);
  const leading = opts.leading ?? size * 1.4;
  for (const line of wrapText(text, font, size, width)) {
    l.ensure(leading);
    l.page.drawText(line, { x, y: l.y - size, size, font, color: opts.color ?? INK });
    l.y -= leading;
  }
}

async function drawQr(page: PDFPage, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const quiet = 2;
  const cell = size / (n + 2 * quiet);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        page.drawRectangle({
          x: x + (c + quiet) * cell,
          y: y + size - (r + quiet + 1) * cell,
          width: cell,
          height: cell,
          color: INK,
        });
      }
    }
  }
}

export async function buildReceiptPdf(
  rc: Receipt,
  key: ReceiptKey | null,
  fonts: ReceiptPdfFonts,
  text: ReceiptPdfText,
): Promise<Uint8Array> {
  const { t } = text;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fonts.regular, { subset: false });
  const semibold = await doc.embedFont(fonts.semibold, { subset: false });
  const display = await doc.embedFont(fonts.display, { subset: true });
  const mono = await doc.embedFont(StandardFonts.Courier);

  const pub = receiptPublicPart(rc, key);
  const json = canonicalJson(pub);
  const total = rc.payments.reduce((s, p) => s + p.amount_cents, 0);

  doc.setTitle(`${t("receipt.title")} ${rc.sid}`);
  doc.setSubject(rc.version);
  doc.setCreator("energy.domovina.ai");
  doc.setProducer("pdf-lib (u pregledniku)");

  const l = new Layout(doc);

  // ── zaglavlje ──
  l.page.drawText(t("receipt.title"), { x: M, y: l.y - 24, size: 24, font: display, color: INK });
  l.gap(34);
  paragraph(l, `MPT · ${rc.version}`, regular, 9, { color: MUTED });
  l.gap(10);

  // ── polja ──
  const labelW = 150;
  const fields: [string, string, PDFFont][] = [
    [t("receipt.sid"), rc.sid, mono],
    [t("receipt.label"), rc.intent.label ?? "—", regular],
    [t("receipt.target"), rc.intent.target_address, mono],
    ...(rc.payments.length > 0 ? [[t("receipt.total"), text.formatEur(total), semibold] as [string, string, PDFFont]] : []),
    [t("receipt.owner"), pub.owner ?? t("receipt.ownerMissing"), pub.owner ? mono : regular],
  ];
  for (const [label, value, font] of fields) {
    const lines = wrapText(value, font, 10, CONTENT_W - labelW);
    l.ensure(lines.length * 14 + 4);
    l.page.drawText(label.toUpperCase(), { x: M, y: l.y - 9, size: 7.5, font: regular, color: MUTED });
    for (const line of lines) {
      l.page.drawText(line, { x: M + labelW, y: l.y - 10, size: 10, font, color: INK });
      l.y -= 14;
    }
    l.gap(4);
  }
  l.gap(6);

  const statusKey = receiptStatusKey(rc.status);
  paragraph(l, t(statusKey, { status: rc.status }), semibold, 10, {
    color: rc.status === "issued" ? FOREST : INK,
  });
  l.gap(8);

  // ── retci ──
  if (rc.payments.length > 0) {
    const C = {
      date: { h: t("receipt.colDate"), x: M, w: 70, right: false },
      amount: { h: t("receipt.colAmount"), x: M + 70, w: 70, right: true },
      kind: { h: t("receipt.colKind"), x: M + 150, w: 170, right: false },
      tx: { h: t("receipt.colTx"), x: M + 325, w: 105, right: false },
      anchor: { h: t("receipt.colAnchor"), x: M + 432, w: CONTENT_W - 432, right: false },
    };
    const cols = Object.values(C);
    const header = () => {
      for (const c of cols) {
        const s = c.h.toUpperCase();
        const x = c.right ? c.x + c.w - regular.widthOfTextAtSize(s, 7.5) : c.x;
        l.page.drawText(s, { x, y: l.y - 8, size: 7.5, font: regular, color: MUTED });
      }
      l.gap(14);
    };
    l.ensure(20);
    header();
    for (const p of rc.payments) {
      const recipient = recipientLabel(p.target_address, BETA_PROJECTS);
      const kind =
        (p.kind === "direct" ? t("receipt.kindDirect") : t("receipt.kindLazy")) +
        (recipient !== null ? `\n→ ${recipient}` : "");
      const kindLines = wrapText(kind, regular, 9, C.kind.w);
      const rowH = Math.max(1, kindLines.length) * 12 + 6;
      if (l.ensure(rowH)) header();
      l.page.drawLine({ start: { x: M, y: l.y }, end: { x: W - M, y: l.y }, thickness: 0.5, color: RULE });
      const top = l.y - 12;
      l.page.drawText(text.formatDate(p.placed_at) || "—", { x: C.date.x, y: top, size: 9, font: regular, color: INK });
      const amt = text.formatEur(p.amount_cents);
      l.page.drawText(amt, {
        x: C.amount.x + C.amount.w - regular.widthOfTextAtSize(amt, 9),
        y: top,
        size: 9,
        font: regular,
        color: INK,
      });
      kindLines.forEach((line, i) =>
        l.page.drawText(line, { x: C.kind.x, y: top - i * 12, size: 9, font: regular, color: INK }),
      );
      l.page.drawText(p.tx_hash !== null ? `${p.tx_hash.slice(0, 14)}…` : "—", {
        x: C.tx.x,
        y: top,
        size: 8,
        font: p.tx_hash !== null ? mono : regular,
        color: INK,
      });
      l.page.drawText(p.anchor !== null ? `#${p.anchor.anchor_id}` : t("receipt.anchorPending"), {
        x: C.anchor.x,
        y: top,
        size: 9,
        font: regular,
        color: p.anchor !== null ? INK : MUTED,
      });
      l.gap(rowH);
    }
    l.page.drawLine({ start: { x: M, y: l.y }, end: { x: W - M, y: l.y }, thickness: 0.5, color: RULE });
    l.gap(8);
    if (rc.payments.some((p) => p.anchor === null)) paragraph(l, t("receipt.anchorNote"), regular, 8, { color: MUTED });
    // Puni hashevi transakcija: u tablici su skraćeni, a dokaz mora biti provjerljiv iz PDF-a.
    for (const p of rc.payments) {
      if (p.tx_hash !== null) paragraph(l, `tx ${p.tx_hash}`, mono, 7, { color: MUTED, leading: 10 });
    }
  }
  if (!rc.lazy_included) paragraph(l, t("receipt.lazyOwnerOnly"), regular, 8, { color: MUTED });
  l.gap(14);

  // ── provjera ──
  l.ensure(40);
  paragraph(l, t("receipt.verifyTitle"), semibold, 12);
  l.gap(4);
  (["receipt.verify1", "receipt.verify2", "receipt.verify3", "receipt.verify4"] as const).forEach((k, i) => {
    const lines = wrapText(t(k), regular, 9, CONTENT_W - 16);
    l.ensure(lines.length * 12.5);
    l.page.drawText(`${i + 1}.`, { x: M, y: l.y - 9, size: 9, font: regular, color: INK });
    for (const line of lines) {
      l.page.drawText(line, { x: M + 16, y: l.y - 9, size: 9, font: regular, color: INK });
      l.y -= 12.5;
    }
    l.gap(2);
  });
  const anchors = [
    ...new Map(
      rc.payments.filter((p) => p.anchor !== null).map((p) => [p.anchor!.anchor_id, p.anchor!] as const),
    ).values(),
  ].filter((a: ReceiptAnchor) => a.ots_available);
  for (const a of anchors) {
    l.gap(4);
    paragraph(l, t("receipt.anchorLink", { id: a.anchor_id }), semibold, 9);
    paragraph(l, otsUrl(a.anchor_id), mono, 8, { color: FOREST });
    paragraph(l, `${t("receipt.anchorRoot")} ${a.root}`, mono, 7.5, { color: MUTED });
  }
  l.gap(4);
  paragraph(l, `salt: ${pub.salt ?? "—"}`, mono, 8, { color: MUTED });
  l.gap(12);

  // ── QR ──
  const qrSize = 120;
  l.ensure(qrSize + 8);
  await drawQr(l.page, canonicalJson({ v: 1, sid: rc.sid, owner: pub.owner, salt: pub.salt }), M - 4, l.y - qrSize, qrSize);
  l.page.drawText(t("receipt.qrNote"), { x: M + qrSize + 12, y: l.y - qrSize / 2, size: 9, font: regular, color: MUTED });
  l.gap(qrSize + 14);

  // ── kanonski JSON ──
  l.ensure(40);
  paragraph(l, t("receipt.jsonTitle"), semibold, 12);
  l.gap(4);
  paragraph(l, json, mono, 7, { leading: 9 });

  // ── podnožje na svakoj stranici ──
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const footer = `${t("receipt.title")} · ${rc.sid} · ${text.generatedAt} · ${i + 1}/${pages.length}`;
    page.drawText(footer, { x: M, y: M - 20, size: 7.5, font: regular, color: MUTED });
  });

  return doc.save();
}
