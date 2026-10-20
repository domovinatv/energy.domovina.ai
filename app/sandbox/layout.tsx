import type { Metadata } from "next";
import { SandboxFooter, SandboxHeader } from "@/components/sandbox/sandbox-chrome";
import { WHITE_LABEL } from "@/lib/white-label";

export const metadata: Metadata = {
  title: { absolute: `Sandbox · ${WHITE_LABEL.name}` },
  description: "Kampanja doprinosa na MPT railu: Monerium sandbox i Chiado testnet, bez pravog novca.",
};

/**
 * Okvir za sandbox kampanje (docs/17). Odvojen od makete i od /beta/: placeholder
 * brend klijenta, traka „sandbox" koja se ne može zatvoriti (CLAUDE.md pravilo 3).
 */
export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SandboxHeader />
      <main id="main" className="flex-1 bg-cream">
        {children}
      </main>
      <SandboxFooter />
    </>
  );
}
