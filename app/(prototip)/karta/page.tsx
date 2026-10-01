import type { Metadata } from "next";
import { Registry } from "@/components/registry";

/**
 * `/karta/` — karta i registar (docs/07 §2.1).
 *
 * Radi bez prijave i bez ijednog projekta. To je jedini dio koji ima vrijednost
 * s nula korisnika (docs/01 §4.1) i, ako sve ostalo padne, i dalje je isporuka
 * (docs/11 §Rizici).
 *
 * ⚠️ PREMJEŠTENO S `/` U FAZI 1d. Landing je preuzeo ulaz, jer posjetitelj koji
 * skenira QR sa sajma mora prvo dobiti odgovor „što je ovo i zašto je zakonito"
 * (kriterij dovršenosti br. 3, docs/11). Registar je od toga jedan klik daleko,
 * a isječak karte stoji i na landingu (docs/06 §1, sekcija 3).
 *
 * Filtri su i dalje u URL-u, samo pod novom putanjom:
 * `/karta/?zupanija=…&status=…&e=…` (dnevnik §6.1).
 */
export const metadata: Metadata = {
  title: "Karta i registar",
  description:
    "Karta i registar sunčanih elektrana u Hrvatskoj — filtriranje po županiji, statusu i snazi. Prototip.",
};

export default function MapPage() {
  return <Registry />;
}
