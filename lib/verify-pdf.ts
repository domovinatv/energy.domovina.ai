/**
 * Izvještaj o provjeri potvrde kao PDF (docs/16 §7): ispisiv, a strojno
 * čitljiv jer nosi dva privitka — izvještaj (JSON, `VERIFY_REPORT_VERSION`) i
 * točne bajtove provjerene potvrde. Isti fontovi i raspored kao PDF potvrde.
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { RUST, SOLAR_INK } from "@/lib/diagram-colors";
import type { MessageKey } from "@/lib/i18n/hr";
import {
  FOREST,
  hex,
  INK,
  Layout,
  M,
  monoSafe,
  MUTED,
  paragraph,
  type ReceiptPdfFonts,
  W,
  wrapText,
} from "@/lib/receipt-pdf";
import type { CheckStatus, VerifyReport } from "@/lib/receipt-verify";

export interface VerifyPdfText {
  t: (key: MessageKey, vars?: Readonly<Record<string, string | number>>) => string;
  formatEur: (cents: number) => string;
  generatedAt: string;
  verifyUrl: string;
}

import { verifyReportFileName } from "@/lib/verify-report-name";

export { verifyReportFileName };

const MARK: Record<CheckStatus, string> = { ok: "✓", fail: "✗", warn: "!", pending: "…", skip: "–" };

export async function buildVerifyPdf(
  report: VerifyReport,
  inputs: { name: string; sha256: string }[],
  receiptJson: Uint8Array | null,
  fonts: ReceiptPdfFonts,
  text: VerifyPdfText,
): Promise<Uint8Array> {
  const { t } = text;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // Inter cijeli: podskup u @pdf-lib/fontkit gubi glifove (vidi receipt-pdf.ts).
  const regular = await doc.embedFont(fonts.regular, { subset: false });
  const semibold = await doc.embedFont(fonts.semibold, { subset: false });
  const display = await doc.embedFont(fonts.display, { subset: true });
  const mono = await doc.embedFont(StandardFonts.Courier);
  const color: Record<CheckStatus, ReturnType<typeof hex>> = {
    ok: FOREST,
    fail: hex(RUST),
    warn: hex(SOLAR_INK),
    pending: MUTED,
    skip: MUTED,
  };

  doc.setTitle(`${t("verify.title")} ${report.sid ?? ""}`);
  doc.setSubject(report.version);
  doc.setCreator("energy.domovina.ai");

  const l = new Layout(doc);
  l.page.drawText(t("verify.title"), { x: M, y: l.y - 22, size: 22, font: display, color: INK });
  l.gap(32);
  paragraph(l, `${report.version} · ${report.verified_at}`, regular, 9, { color: MUTED });
  l.gap(8);

  const ok = report.result === "ok";
  paragraph(l, ok ? t("verify.resultOk") : t("verify.resultFail"), semibold, 13, { color: ok ? FOREST : hex(RUST) });
  if (report.payments === 0) paragraph(l, t("verify.resultEmpty"), regular, 9.5, { color: INK });
  if (report.checks.some((c) => c.status === "pending")) paragraph(l, t("verify.resultPending"), regular, 9, { color: MUTED });
  l.gap(6);
  // Hashevi i adrese u Courieru (ASCII); ostalo u Interu (€, crtica, razmak u iznosu).
  const rows: [string, string, boolean][] = [
    [t("receipt.sid"), report.sid ?? "—", report.sid !== null],
    [t("receipt.owner"), report.owner ?? "—", report.owner !== null],
    [t("receipt.total"), text.formatEur(report.total_cents), false],
    [t("verify.paymentsCount"), String(report.payments), false],
  ];
  for (const [k, v, isHex] of rows) {
    l.ensure(14);
    l.page.drawText(k.toUpperCase(), { x: M, y: l.y - 9, size: 7.5, font: regular, color: MUTED });
    l.page.drawText(isHex ? monoSafe(v) : v, { x: M + 150, y: l.y - 10, size: 9.5, font: isHex ? mono : regular, color: INK });
    l.gap(15);
  }
  l.gap(4);
  paragraph(l, t("verify.inputs"), semibold, 10);
  for (const i of inputs) paragraph(l, monoSafe(`${i.name}  sha256 ${i.sha256}`), mono, 7, { color: MUTED, leading: 9.5 });
  l.gap(10);

  // ── koraci ──
  for (const [n, c] of report.checks.entries()) {
    const title = `${n + 1}. ${t(`verify.step.${c.id}` as MessageKey, c.vars)}`;
    const desc = t(`verify.why.${c.id}` as MessageKey);
    const titleLines = wrapText(title, semibold, 10.5, W - 2 * M - 26);
    l.ensure(titleLines.length * 14 + 20);
    l.page.drawText(MARK[c.status], { x: M, y: l.y - 11, size: 12, font: semibold, color: color[c.status] });
    for (const line of titleLines) {
      l.page.drawText(line, { x: M + 18, y: l.y - 10.5, size: 10.5, font: semibold, color: INK });
      l.y -= 14;
    }
    paragraph(l, `${t(`verify.status.${c.status}` as MessageKey)} — ${desc}`, regular, 8.5, { x: M + 18, color: MUTED });
    for (const d of c.detail) paragraph(l, d, regular, 7.5, { x: M + 18, color: INK, leading: 10 });
    l.gap(8);
  }

  l.gap(6);
  paragraph(l, t("verify.pdfFooter", { url: text.verifyUrl }), regular, 8.5, { color: MUTED });

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(`${t("verify.title")} · ${report.sid ?? ""} · ${text.generatedAt} · ${i + 1}/${pages.length}`, {
      x: M,
      y: M - 20,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
  });

  await doc.attach(new TextEncoder().encode(JSON.stringify({ ...report, inputs }, null, 2)), verifyReportFileName(report.sid, "json"), {
    mimeType: "application/json",
    description: t("verify.title"),
  });
  if (receiptJson !== null && report.sid !== null) {
    await doc.attach(receiptJson, `mpt-potvrda-${report.sid}.json`, { mimeType: "application/json", description: t("receipt.jsonTitle") });
  }
  return doc.save();
}
