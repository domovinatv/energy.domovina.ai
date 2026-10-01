import { BetaPage } from "@/components/beta/beta-page";

/**
 * /beta/ — tri prava projekta (docs/15).
 *
 * QR za uplatu NE radi se pri buildu: iznos mora biti u EPC QR-u (bez njega
 * Revolut ne popuni opis plaćanja), a iznos bira uplatitelj — pa se QR crta u
 * pregledniku (`components/beta/beta-page.tsx`, `PayInstructions`).
 */
export default function Page() {
  return <BetaPage />;
}
