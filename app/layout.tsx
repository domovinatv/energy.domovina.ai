import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { I18nProvider } from "@/lib/i18n";
import { DemoBar } from "@/components/demo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.liveUrl),
  title: {
    default: `${BRAND.name} — registar sunčanih elektrana u Hrvatskoj`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Karta i registar sunčanih elektrana u Hrvatskoj, i alat kojim ljudi zajedno financiraju i posjeduju nove. Prototip.",
  alternates: { canonical: BRAND.liveUrl },
  // ⚠️ docs/12 §3 i §6: closed beta ne smije završiti u tražilicama. Ovo ide od
  // PRVOG deploya, ne naknadno.
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    alternateLocale: ["en_US"],
    url: BRAND.liveUrl,
    siteName: BRAND.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF8F3", // cream (docs/09 §2)
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `lang` je HR jer je hrvatski izvor istine; prekidač jezika ga mijenja na
  // klijentu (lib/i18n).
  return (
    <html lang="hr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-forest focus:px-3 focus:py-2 focus:text-sm focus:text-cream"
          >
            Prijeđi na sadržaj
          </a>
          {/* Traka prototipa stoji IZNAD zaglavlja i ne može se zatvoriti. */}
          <DemoBar />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
