import type { Metadata } from "next";
import { BetaBar } from "@/components/beta/beta-bar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Pravi projekti",
  description:
    "Tri sunčane elektrane financirane javno, preko računa s više potpisa na Gnosis Chainu.",
};

/**
 * Okvir za prave projekte (docs/15). NEMA trake prototipa: ništa ovdje nije
 * izmišljeno. Umjesto nje stoji traka koja kaže da je riječ o pravom novcu —
 * posjetitelj koji dođe s prototipa mora vidjeti razliku bez čitanja.
 */
export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BetaBar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
