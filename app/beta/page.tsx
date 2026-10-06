import { BetaPage } from "@/components/beta/beta-page";

/**
 * /beta/ — popis pravih projekata (docs/15); svaki ima svoju stranicu /beta/<slug>/.
 *
 * QR za uplatu NE radi se pri buildu: iznos mora biti u EPC QR-u (bez njega
 * Revolut ne popuni opis plaćanja), a iznos bira uplatitelj — pa se QR crta u
 * pregledniku (`components/beta/beta-page.tsx`, `PayInstructions`).
 */
export default function Page() {
  return <BetaPage />;
}
