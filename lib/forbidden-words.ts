/**
 * Zabranjeni pojmovi — JEDAN popis za lint i za validaciju korisničkog unosa.
 *
 * ⚠️ NIJE kozmetika nego KONTROLA USKLAĐENOSTI (docs/14 §2.4). Ograničenje na
 * modele A i B je jedina stvar koja Mod 2 drži izvan ECSP licence, a ono se u
 * proizvodu provodi na dva mjesta:
 *
 *  1. `scripts/check-copy.ts` — naš copy, pri svakom `npm run verify` (E3);
 *  2. čarobnjak `/novi-projekt` — TUĐI opis projekta, prije predaje (E3).
 *
 * Popis zato živi ovdje, a ne u lintu: dvije kopije bi se razišle, i to tiho.
 * Ista logika kao `lib/facts.ts` za brojke (CLAUDE.md pravilo 2).
 *
 * ⚠️ Ova je datoteka u `ALLOWLIST` linta — ovdje zabranjeni pojmovi stoje kao
 * uzorci, što je cijela njezina svrha. Nijedna druga datoteka tu iznimku nema.
 */

export interface ForbiddenRule {
  readonly pattern: RegExp;
  /** Zašto je zabranjeno — ide korisniku, pa mora biti razumljivo bez propisa. */
  readonly why: string;
}

/**
 * Pojmovi iz CLAUDE.md §1 i docs/03 §3, u oba jezika.
 *
 * Granice riječi (`\b`) drže lažne pozitive niskima: „return" u `return;` je
 * ključna riječ jezika, pa se kod provjerava samo u STRING literalima
 * (`extractStrings` u lintu); korisnički unos je ionako čisti tekst.
 */
export const FORBIDDEN_RULES: readonly ForbiddenRule[] = [
  { pattern: /\bprinos/i, why: "obećanje prinosa → ECSPR/MiFID (docs/03 §3)" },
  { pattern: /\bkamat/i, why: "kamata → zajam → ECSPR ili bankovna djelatnost" },
  { pattern: /\bdividend/i, why: "dividenda → udio u dobiti → ECSPR/MiFID" },
  // ⚠️ SKLONIDBA. Prva izvedba ovih pravila hvatala je samo nominativ, pa je
  // „sekundarnom tržištu" prolazilo dok je „sekundarno tržište" padalo. Uzorak
  // za hrvatski mora podnijeti padeže; jednorječni uzorci iznad to rješavaju
  // prefiksom (`\bprinos` hvata i „prinosa"), višerječni trebaju `\w*`.
  { pattern: /\bpovrat\w*\s+na\s+ulaganj/i, why: "povrat na ulaganje → ECSPR/MiFID" },
  { pattern: /\b(udio|udjel\w*)\s+u\s+dobit/i, why: "udio u dobiti → ECSPR/MiFID" },
  { pattern: /\bsekundarn\w*\s+trži/i, why: "sekundarno tržište → model D, DLT Pilot" },
  {
    pattern: /\bprodaj\w*\s+(svoj\w*\s+)?(udio|udjel\w*)/i,
    why: "prenosivost udjela → model D",
  },
  { pattern: /\byield\b/i, why: "yield → ECSPR/MiFID (docs/03 §3)" },
  { pattern: /\broi\b/i, why: "ROI → ECSPR/MiFID" },
  { pattern: /\bprofit share\b/i, why: "profit share → ECSPR/MiFID" },
  { pattern: /\bshare of profit\b/i, why: "share of profit → ECSPR/MiFID" },
  { pattern: /\binterest rate\b/i, why: "interest rate → zajam → ECSPR" },
  { pattern: /\bsecondary market\b/i, why: "secondary market → model D" },
  { pattern: /\bannual return\b/i, why: "annual return → ECSPR/MiFID" },
  { pattern: /\breturn on investment\b/i, why: "return on investment → ECSPR/MiFID" },
  {
    pattern: /\bvraćamo ti\b/i,
    why: "povratna uplata → primanje povratnih sredstava od javnosti (docs/14 §2.3)",
  },
];

/**
 * Imena polja i komponenti — u lintu se provjeravaju u CIJELOM izvoru, ne samo
 * u stringovima, jer završe u API-ju i na screenshotovima (docs/05 §5).
 *
 * ⚠️ HRVATSKI SADRŽI ENGLESKE KRATICE KAO SLOGOVE. Prva izvedba pravila za
 * `roi` glasila je `\b\w*[rR]oi\w*\s*[:=(]` i hvatala je običnu riječ
 * „p·roi·zvoda:" — `\w*` prije korijena pojede bilo koji prefiks. Lažni
 * pozitiv je opasniji nego što izgleda: rješenje na koje navodi je nova iznimka
 * u `ALLOWLIST`, a iznimka po iznimka je točno način na koji kontrola
 * usklađenosti prestane biti kontrola.
 *
 * Zato korijen mora početi na granici riječi (`\broi`) ili na granici riječi
 * unutar camelCasea (`[a-z]Roi`). Isti oblik vrijedi za sve kratice koje bi se
 * mogle naći usred hrvatske riječi. Vidi `FORBIDDEN_NON_EXAMPLES`.
 */
export const FORBIDDEN_IDENTIFIER_RULES: readonly ForbiddenRule[] = [
  { pattern: /(\byield|[a-z]Yield)\w*\s*[:=(]/, why: "ime polja/komponente s `yield`" },
  { pattern: /(\bdividend|[a-z]Dividend)\w*\s*[:=(]/, why: "ime polja/komponente s `dividend`" },
  { pattern: /(\broi|[a-z]Roi)\w*\s*[:=(]/, why: "ime polja/komponente s `roi`" },
  { pattern: /\breturnOn\w*\s*[:=(]/, why: "ime polja/komponente s `returnOn`" },
];

/** Pada li redak izvornog koda na nekom pravilu o imenima polja i komponenti. */
export function findForbiddenIdentifier(line: string): ForbiddenHit | null {
  for (const rule of FORBIDDEN_IDENTIFIER_RULES) {
    const found = rule.pattern.exec(line);
    if (found !== null) return { match: found[0], why: rule.why };
  }
  return null;
}

/**
 * ODOBRENE NEGACIJE — jedine rečenice u kojima zabranjeni pojam smije stajati.
 *
 * docs/07 §2.3 traži da rečenica „Ne nudimo prinos ni udio u dobiti" bude
 * TRAJNO VIDLJIVA, ne u fusnoti. Odricanje mora imenovati ono čega se odriče,
 * pa se bez iznimke ne može napisati.
 *
 * Namjerno je to popis DOSLOVNIH rečenica, a ne uzorak „dopusti ako je
 * negirano". Uzorak bi propustio svako „ne nudimo prinos, ali…", a ova je
 * rečenica pravno nosiva — svako odstupanje od odobrene formulacije mora pasti
 * na lintu i proći kroz svjesnu odluku, kao i svaka druga izmjena pravnog teksta.
 *
 * ⚠️ Vrijedi samo za NAŠ copy. Korisnikov opis projekta nema iznimke: nitko
 * izvana ne smije odobravati vlastite pravne formulacije kroz obrazac.
 *
 * Dodavanje retka ovdje je pravna odluka. Uz svaki ide dokument koji ga traži.
 */
export const APPROVED_NEGATIONS: readonly string[] = [
  // docs/07 §2.3 — trajno vidljivo na stranici projekta
  "Ne nudimo prinos ni udio u dobiti.",
  "We do not offer a financial gain or a share of profit.",
  // docs/03 §3 — objašnjenje modela A
  "Doprinos financira izgradnju. Ne daje pravo na novac ni na udio u dobiti.",
  "A contribution funds construction. It grants no claim to money and no share of profit.",
];

/** Nalaz u tekstu: koji je pojam pao i zašto. */
export interface ForbiddenHit {
  /** Doslovan isječak iz teksta, da korisnik vidi ŠTO da makne. */
  readonly match: string;
  readonly why: string;
}

/**
 * Provjera slobodnog teksta — korisnikov opis projekta (E3, docs/03 §8).
 *
 * Bez iznimaka za negacije: `APPROVED_NEGATIONS` je popis NAŠIH rečenica.
 *
 * @returns svi nalazi; prazan niz znači da tekst smije proći.
 */
export function findForbidden(text: string): readonly ForbiddenHit[] {
  const hits: ForbiddenHit[] = [];
  for (const rule of FORBIDDEN_RULES) {
    const found = rule.pattern.exec(text);
    if (found !== null) {
      hits.push({ match: found[0], why: rule.why });
    }
  }
  return hits;
}

/**
 * Primjeri koje popis MORA uhvatiti.
 *
 * Žive ovdje, a ne u testu, jer je ovo jedina datoteka s iznimkom u lintu
 * (`ALLOWLIST` u `scripts/check-copy.ts`). Da stoje u testu, trebalo bi
 * allowlistati i njega — a iznimka po iznimka je točno način na koji kontrola
 * usklađenosti prestane biti kontrola.
 *
 * Uz to su na pravom mjestu: pravilo i primjer koji ga opravdava stoje zajedno,
 * pa se pri sljedećoj izmjeni popisa vidi što se smije izgubiti, a što ne.
 *
 * `expected` je doslovan isječak koji mora pasti — da test ne prođe slučajno,
 * preko nekog drugog pravila.
 */
export interface ForbiddenExample {
  readonly text: string;
  /** Doslovno ono što uzorak uhvati — ne fraza iz teksta, nego pogodak. */
  readonly expected: string;
}

export const FORBIDDEN_EXAMPLES: readonly ForbiddenExample[] = [
  { text: "Očekivani prinos 7 % godišnje.", expected: "prinos" },
  { text: "Uloži pa ti vraćamo s kamatom.", expected: "kamat" },
  { text: "Isplaćujemo dividendu svake godine.", expected: "dividend" },
  { text: "Uplatitelj ima udio u dobiti elektrane.", expected: "udio u dobit" },
  { text: "Prodaj svoj udio drugom korisniku.", expected: "prodaj svoj udio" },
  // ⚠️ Svi padeži koje je prva izvedba propuštala. Ne brisati — to su točni
  // primjeri zbog kojih uzorci izgledaju kako izgledaju.
  { text: "Udio se trguje na sekundarnom tržištu.", expected: "sekundarnom trži" },
  { text: "Nema sekundarnog tržišta za udjele.", expected: "sekundarnog trži" },
  { text: "Visina povrata na ulaganje ovisi o suncu.", expected: "povrata na ulaganj" },
  { text: "Član ima pravo na udjel u dobiti zadruge.", expected: "udjel u dobit" },
  { text: "Prodajte svoje udjele kad želite.", expected: "prodajte svoje udjele" },
  { text: "Guaranteed annual return of 7%.", expected: "annual return" },
  { text: "A steady yield from every panel.", expected: "yield" },
  { text: "Best return on investment in the region.", expected: "return on investment" },
  { text: "Members get a share of profit.", expected: "share of profit" },
  { text: "Trade it on the secondary market.", expected: "secondary market" },
];

/**
 * Primjeri i PROTUPRIMJERI za pravila o imenima polja i komponenti.
 *
 * ⚠️ Protuprimjeri su ovdje zato što je lažni pozitiv u ovoj kontroli skoro
 * jednako štetan kao propust. Pravilo koje padne na hrvatskoj riječi tjera
 * sljedećeg čovjeka da doda iznimku u `ALLOWLIST` umjesto da popravi uzorak —
 * a nakon dovoljno iznimaka kontrola ne provjerava više ništa.
 *
 * `roi` u „proizvoda", „broj" ili „uroni" NIJE ROI. `yield` i `dividend` stoje
 * iz istog razloga, iako za njih danas nema hrvatske riječi koja ih sadrži:
 * pravilo koje nema protuprimjer nitko ne provjerava dok ne pukne.
 */
export const FORBIDDEN_IDENTIFIER_EXAMPLES: readonly ForbiddenExample[] = [
  { text: "  const expectedRoi = 0.07;", expected: "Roi =" },
  { text: "  roi: number;", expected: "roi:" },
  { text: "  annualYield: number;", expected: "Yield:" },
  { text: "  yieldPct = 7;", expected: "yieldPct =" },
  { text: "  dividendCents: number;", expected: "dividendCents:" },
  { text: "  monthlyDividend(amount);", expected: "Dividend(" },
  { text: "  returnOnCapital = 3;", expected: "returnOnCapital =" },
];

/** Retci koji NE SMIJU pasti — obične hrvatske riječi s engleskim slogom. */
export const FORBIDDEN_IDENTIFIER_NON_EXAMPLES: readonly string[] = [
  // Zbog ovog retka je pravilo za `roi` prepisano (Faza 1d).
  '  "landing.open.lead": "Zato je plan isti kao u ostatku obitelji proizvoda: kod otvoren.",',
  '  "x": "Razrada troška po stavkama proizvoda: oprema, montaža, dokumentacija.",',
  '  "y": "Uroni: pogledaj knjigu doprinosa.",',
  "  const brojPotpisnika = 5;",
];
