import { DemoBar } from "@/components/demo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Okvir prototipa: sve pod ovom grupom su IZMIŠLJENI podaci (CLAUDE.md
 * pravilo 3). Traka prototipa stoji iznad zaglavlja i ne može se zatvoriti.
 *
 * Pravi projekti (docs/15) žive pod /beta/ s vlastitim okvirom, bez ove trake —
 * zato traka nije u root layoutu.
 */
export default function PrototipLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-forest focus:px-3 focus:py-2 focus:text-sm focus:text-cream"
      >
        Prijeđi na sadržaj
      </a>
      <DemoBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
