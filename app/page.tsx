import { Registry } from "@/components/registry";

/**
 * `/` — karta i registar. Najvažniji ekran (docs/07 §2.1).
 *
 * Radi bez prijave i bez ijednog projekta. To je jedini dio koji ima vrijednost
 * s nula korisnika (docs/01 §4.1) i, ako sve ostalo padne, i dalje je isporuka
 * (docs/11 §Rizici).
 */
export default function HomePage() {
  return <Registry />;
}
