import { Landing } from "@/components/landing";

/**
 * `/` — landing (docs/06).
 *
 * Cilj je uzak i mjerljiv: posjetitelj s GEF-a u 90 sekundi razumije što je
 * ovo, zašto je zakonito i zašto nema provizije — pa ostavi kontakt ili ode na
 * kartu (docs/11 §Kriterij „gotovo za GEF" br. 3 i br. 5).
 *
 * ⚠️ Registar je preseljen na `/karta/`, ali NIJE potisnut: živi isječak karte
 * je treća sekcija landinga, odmah iza problema. Registar je jedini dio koji
 * ima vrijednost bez ijednog projekta (docs/01 §4.1) i ostaje isporuka ako sve
 * ostalo padne (docs/11 §Rizici).
 */
export default function HomePage() {
  return <Landing />;
}
