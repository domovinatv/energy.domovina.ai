/**
 * Privici (embedded files) iz PDF-a — za provjeru PDF potvrde (docs/16 §7):
 * PDF koji generira `lib/receipt-pdf.ts` nosi kanonski JSON potvrde kao
 * privitak, pa je ista datoteka i čitljiva i strojno provjerljiva.
 */
import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRawStream, PDFString } from "pdf-lib";

export interface PdfAttachment {
  name: string;
  data: Uint8Array;
}

const text = (v: unknown) => (v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : null);

export async function pdfAttachments(bytes: Uint8Array): Promise<PdfAttachment[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  const names = doc.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
  const root = names?.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
  const out: PdfAttachment[] = [];
  const seen = new Set<PDFDict>();

  const walk = (node: PDFDict, depth: number) => {
    if (depth > 32 || seen.has(node)) return;
    seen.add(node);
    const pairs = node.lookupMaybe(PDFName.of("Names"), PDFArray);
    if (pairs) {
      for (let i = 0; i + 1 < pairs.size(); i += 2) {
        const spec = pairs.lookupMaybe(i + 1, PDFDict);
        const ef = spec?.lookupMaybe(PDFName.of("EF"), PDFDict);
        const stream = ef?.lookup(PDFName.of("F"));
        if (!spec || !(stream instanceof PDFRawStream)) continue;
        const name = text(spec.lookup(PDFName.of("UF"))) ?? text(spec.lookup(PDFName.of("F"))) ?? text(pairs.lookup(i)) ?? "privitak";
        out.push({ name, data: decodePDFRawStream(stream).decode() });
      }
    }
    const kids = node.lookupMaybe(PDFName.of("Kids"), PDFArray);
    if (kids) for (let i = 0; i < kids.size(); i++) {
      const kid = kids.lookupMaybe(i, PDFDict);
      if (kid) walk(kid, depth + 1);
    }
  };
  if (root) walk(root, 0);
  return out;
}
