/**
 * Mjerna mjesta HEP ODS-a za projekte na /beta/, iz izvoza Moje mreže
 * (`lib/moja-mreza.ts` — shema i porijeklo). Odvojeno od `beta-projects.ts`
 * jer taj modul čita i `scripts/check-beta.mts` pod Nodeom, bez JSON importa.
 *
 * Osvježavanje: novi izvoz iz extensiona → `jq 'del(.mjesta[].korisnik)'` →
 * prepiši datoteku u `lib/data/moja-mreza/`. Oblik se provjerava pri buildu.
 */
import lukavec from "@/lib/data/moja-mreza/lukavec.json";
import { mjestoIzUvoza, type MojaMrezaMjesto } from "@/lib/moja-mreza";

export interface BetaHep {
  mjesto: MojaMrezaMjesto;
  /** ISO vrijeme kad je extension pročitao Moju mrežu. */
  dohvaceno: string;
}

export const BETA_HEP: Readonly<Record<string, BetaHep>> = {
  lukavec: mjestoIzUvoza(lukavec, "0100031779"),
};
