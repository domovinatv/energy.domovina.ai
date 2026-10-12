/**
 * Fontovi za PDF-ove generirane u pregledniku (potvrda, izvještaj o provjeri).
 * Učitaju se jednom i ostaju u memoriji, pa PDF nastaje i bez mreže u trenutku
 * klika. Neuspjelo učitavanje se ne pamti: sljedeći poziv pokuša ponovno.
 */
import type { ReceiptPdfFonts } from "@/lib/receipt-pdf";

export const PDF_FONT_URLS = {
  regular: "/fonts/inter-400.ttf",
  semibold: "/fonts/inter-600.ttf",
  display: "/fonts/fraunces-600.ttf",
} as const;

let fonts: Promise<ReceiptPdfFonts> | null = null;

export function loadPdfFonts(): Promise<ReceiptPdfFonts> {
  fonts ??= (async () => {
    const load = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`font ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    };
    const [regular, semibold, display] = await Promise.all([
      load(PDF_FONT_URLS.regular),
      load(PDF_FONT_URLS.semibold),
      load(PDF_FONT_URLS.display),
    ]);
    return { regular, semibold, display };
  })().catch((e: unknown) => {
    fonts = null;
    throw e;
  });
  return fonts;
}
