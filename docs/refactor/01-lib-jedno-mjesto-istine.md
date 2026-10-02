# 01 — `lib/`: jedno mjesto istine

Pravilo 2 iz `CLAUDE.md` („jedan broj = jedno mjesto istine") repo provodi za
tržišne brojke i stope. Ista disciplina **ne vrijedi** za boje, pretvorbu
eura u cente, transliteraciju, skupove statusa i vanjske spremnike stanja — ondje
postoje dvije do pet ručno sinkroniziranih kopija. Ovaj dokument ih popisuje.

---

## R1.1 · Paleta boja na četiri mjesta → `lib/tokens.ts`  `P2 · M`

**Stanje.** Isti heks vrijednosti stoje u:

| Mjesto | Što | Redci |
|---|---|---|
| `tailwind.config.ts` | sve boje | 44–100 |
| `lib/map-colors.ts` | 8 boja, uz komentar iz kojeg su tokena | 18–33 |
| `lib/diagram-colors.ts` | 13 boja, uz isti komentar | 18–46, `BORDER_SOLID` 59 |
| `app/globals.css` | popup karte: `#fbf8f3`, `#3a3a3a`, `#f0e6d2`, `#6b6b6b`, `#1a1a1a`, `#2d6a4f`, `#255741` | 66–141 |
| `app/layout.tsx` | `themeColor: "#FBF8F3"` | 44 |

`docs/09` §6.1 dopušta heks samo gdje alat ne čita Tailwind i traži komentar
„iz kojeg tokena dolazi". Komentar je ručna sinkronizacija: promjena tokena u
Tailwindu ne propagira se nikamo, a test to ne hvata.

**Prijedlog.**

1. Nova datoteka `lib/tokens.ts`, čisti TypeScript bez ovisnosti:
   ```ts
   export const COLORS = {
     cream: "#FBF8F3", sand: "#F5EFE6", sandDeep: "#F0E6D2",
     ink: "#1A1A1A", inkSoft: "#3A3A3A", inkMuted: "#6B6B6B",
     forest: "#2D6A4F", forest700: "#255741", forest800: "#1C4331",
     teal: "#0F4C5C", solar: "#E8A33D", solarSoft: "#FBF0DC", solarInk: "#7A4F08",
     rust: "#9B2226", borderSolid: "#DBD5CE",
   } as const;
   ```
   Ljestvice `coral.*` i `teal.*` mogu ostati samo u Tailwind configu ako ih
   nitko izvan Tailwinda ne čita (danas nitko).
2. `tailwind.config.ts` uvozi `COLORS` i gradi `theme.extend.colors` iz njih.
   Tailwind 3 config je TS, pa import radi.
3. `lib/map-colors.ts` i `lib/diagram-colors.ts` postaju re-export
   (`export const SOLAR = COLORS.solar;`) i **zadržavaju** komentare o
   semantici (što boja znači na karti/dijagramu), jer ti komentari nose
   značenje, ne vrijednost.
4. Popup CSS u `globals.css` prelazi na CSS varijable. Varijable generira mali
   Tailwind plugin u configu:
   ```ts
   plugins: [plugin(({ addBase }) => addBase({ ":root": Object.fromEntries(
     Object.entries(COLORS).map(([k, v]) => [`--color-${k}`, v]) ) }))]
   ```
   pa `.plant-popup .pm-cta { background: var(--color-forest); }`.
5. `app/layout.tsx`: `themeColor: COLORS.cream`.
6. Test u `lib/__tests__/`: svaka vrijednost u `COLORS` je `#RRGGBB` bez
   zareza (čuva Mermaid zamku iz dnevnika §10.2 na izvoru, ne samo na izlazu).

**Kriterij dovršenosti.** `grep -rnE '#[0-9A-Fa-f]{6}' app components lib`
vraća pogotke **samo** u `lib/tokens.ts`. `verify` prolazi. Screenshot karte,
dijagrama i popupa identičan.

**Rizik.** Tailwind `content` već uključuje `lib/**` pa nema promjene u
purgeu. Jedina zamka: `border: "rgba(26, 26, 26, 0.12)"` je rgba i ostaje
token za Tailwind; u `COLORS` ide samo `borderSolid`.

---

## R1.2 · Euro ↔ centi i parsiranje iznosa → `lib/money.ts`  `P1 · M`

**Stanje.** Ista pretvorba napisana je osam puta, tri puta kao parser unosa s
različitim pravilima:

| Mjesto | Oblik | Napomena |
|---|---|---|
| `lib/mock.ts:514` | `const EUR = (a) => Math.round(a * 100)` | privatno |
| `lib/energy-machine.ts:515` | isti `EUR` | privatna kopija |
| `lib/energy-machine.ts:353–354` | `SEPA_FEE_MIN.toFixed(2).replace(".", ",")` | ručno formatiranje mimo `lib/format.ts` i `Intl` |
| `lib/energy-machine.ts:725` | `Math.round(SEPA_FEE_MAX * 100)` | |
| `components/fee-calculator.tsx:53,58,64,95,96,214` | `Math.round(x * 100)` šest puta | |
| `components/new-project-wizard.tsx:158–161` | `eurToCents(value: string)`: zarez→točka, `parseFloat`, 0 za neispravno | parser br. 1 |
| `components/contribute-flow.tsx:138–141` | isti parser, inline | parser br. 2 |
| `lib/beta-projects.ts` `parseAmountEur` | regex, ≤ 2 decimale, max 15.000, `null` za neispravno | parser br. 3 — **jedini ispravan** |
| `components/beta/intent-panel.tsx:67` | `Math.round(Number(intent.amountEur) * 100)` | |
| `components/landing.tsx:233,255`, `community-detail.tsx:217` | `FACT.value * 100` | fakti su u eurima, format traži cente |

Posljedica: čarobnjak prihvaća „12,345" kao 1234,5 centa i zaokružuje; tijek
doprinosa isto; `/beta/` to odbija. Tri različita pravila za isti pojam, a
jedno od njih je pravi novac.

**Prijedlog.**

1. `lib/money.ts`:
   ```ts
   export const eurToCents = (eur: number): number => Math.round(eur * 100);
   /** „12,50" | „12.50" → 1250; prazno, ≤ 0, > 2 decimale ili iznad `maxEur` → null. */
   export function parseEurToCents(input: string, maxEur?: number): number | null;
   ```
   `parseEurToCents` je `parseAmountEur` iz `beta-projects.ts` pomaknut i
   generaliziran (vraća cente, ne eure, da pozivatelj ne pretvara sam).
2. `lib/fees.ts` dobiva i centne konstante izvedene iz postojećih:
   `SEPA_FEE_MIN_CENTS`, `SEPA_FEE_MAX_CENTS`, `CARD_FEE_FIXED_CENTS`. Decimalne
   ostaju jer su kopija kanonskog izvora (`docs/10` §3) — izvedene se računaju
   iz njih, ne pišu ručno.
3. `energy-machine.ts` `costNote` koristi `formatEurPrecise(SEPA_FEE_MIN_CENTS)`
   umjesto `toFixed().replace()`. `lib/format.ts` nema ovisnosti pa ga `lib/`
   smije uvoziti. Napomena: engleski tekst danas ispisuje `€0.25` ispred
   broja; `formatEurPrecise` je `hr-HR` i daje `0,25 €`. To je svjesna
   konvencija repoa (iznosi uvijek `hr-HR`, `lib/format.ts` zaglavlje), pa EN
   labela smije dobiti hrvatski format iznosa — isto kao svugdje drugdje.
4. Čarobnjak i tijek doprinosa prelaze na `parseEurToCents`. Promjena
   ponašanja je namjerna i mala: „12,345" više ne prolazi tiho. Granica
   (`maxEur`) za čarobnjak ne postoji (cilj projekta), za doprinos je
   `project.goal_cents`.
5. `lib/facts.ts`: brojke u eurima (`COMMUNITY_REGISTRATION_COST_EUR`,
   `ZEZ_SUNCE.raisedEur`) ostaju u eurima jer ih dokument tako navodi;
   pozivatelji koriste `eurToCents(FACT.value)` umjesto `* 100`.

**Kriterij dovršenosti.** `grep -rn "\* 100" components lib` vraća samo
`lib/money.ts` i `lib/project.ts:30` (postotak, ne novac). Testovi za
`parseEurToCents` preuzeti iz `beta.test.ts` („iznos intenta") + novi slučajevi
za prazno/zarez/točku/granicu.

**Ne raditi.** Ne mijenjati `weiToCents` (18 decimala, BigInt) — to je drugi
pojam i ostaje u `beta-projects.ts`.

---

## R1.3 · Transliteracija dvaput → `lib/text.ts`  `P3 · S`

`lib/mock.ts:100–115` (`slugify`) i `lib/filters.ts:74–86` (`foldCroatian`)
imaju istu mapu `č ć đ š ž → c c d s z` i isti `normalize("NFD")` korak.
Razlika je samo što `slugify` još zamjenjuje ne-alfanumeričke znakove crticom.

**Prijedlog.** `lib/text.ts` s `foldCroatian(input)` i `slugify(input) =
foldCroatian(input).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")`.
`mock.ts` i `filters.ts` uvoze. `slugify` je danas izvezen iz `mock.ts`, a
nitko ga izvan `mock.ts` ne zove — izvoz se seli, ne duplicira.

**Kriterij dovršenosti.** R5.2 (zlatni test slugova) prolazi nepromijenjen —
to dokazuje da je `slugify` identičan.

---

## R1.4 · Skupovi statusa prepisani iz `types.ts`  `P2 · S`

`lib/filters.ts:166–180` ima `PLANT_STATUS_SET` i `GRID_STATUS_SET` kao
literalne nizove, iako `lib/types.ts:28` i `:48` već izvoze `PLANT_STATUSES` i
`GRID_STATUSES`. Dodavanje statusa u tip ne bi srušilo filter, nego bi ga tiho
odbacivao iz URL-a.

**Prijedlog.**
```ts
const PLANT_STATUS_SET: ReadonlySet<string> = new Set(PLANT_STATUSES);
const GRID_STATUS_SET: ReadonlySet<string> = new Set(GRID_STATUSES);
```
Uz to test: `PLANT_STATUSES` pokriva svaki član unije `PlantStatus` — TS to
može provjeriti tipom (`satisfies readonly PlantStatus[]` + pomoćni tip koji
traži potpunost), ne treba runtime test.

---

## R1.5 · Pet ručnih vanjskih spremnika → `lib/external-store.ts`  `P2 · M`

Isti obrazac — `subscribe` na `storage` + vlastiti `Event`, `getSnapshot` s
`try/catch`, `getServerSnapshot` koji vraća prazno, `write` koji `dispatchEvent`
— napisan je ručno pet puta:

| Mjesto | Spremnik | Ključ / događaj |
|---|---|---|
| `lib/i18n/index.tsx:43–77` | `localStorage` | `domovina-energy:locale` |
| `lib/pending-store.ts` | `localStorage` po Safeu, s cacheom | `domovina-energy:pending:*` |
| `components/new-project-wizard.tsx:92–122` | `sessionStorage` | `domovina-energy:project-draft` |
| `lib/url-state.ts` | `location.search` | `popstate` + vlastiti |
| `lib/media-query.ts` | `matchMedia` | `change` |

Dnevnik §7.6 i §10.8 ovo zovu „četvrti put da je `useSyncExternalStore`
točan odgovor". Peti put je u komponenti, ne u `lib/`.

**Prijedlog.**

1. `lib/external-store.ts`:
   ```ts
   export interface ExternalStore<T> {
     subscribe(onChange: () => void): () => void;
     getSnapshot(): T;
     getServerSnapshot(): T;
   }
   export function createStorageStore<T>(opts: {
     storage: "local" | "session";
     key: string;
     parse: (raw: string | null) => T;   // mora vraćati STABILNU referencu za isti raw
     serialize: (value: T) => string | null;
     fallback: T;
   }): ExternalStore<T> & { write(value: T): void };
   export function useExternalStore<T>(store: ExternalStore<T>): T;
   ```
   Cache „isti `raw` → ista referenca" iz `pending-store.ts:37–59` ulazi u
   tvornicu kao zadano ponašanje; danas ga `i18n` i čarobnjak nemaju i
   oslanjaju se na to da je `string` primitiv.
2. `localeStore`, `draftStore` i `pending-store` postaju pozivi tvornice.
   `draftStore` se seli iz komponente u `lib/project-draft.ts` zajedno s
   `Draft`, `EMPTY_DRAFT` i `parseDraft` (to je i preduvjet za R2.4).
3. `url-state.ts` i `media-query.ts` ne koriste storage, ali implementiraju
   isti `ExternalStore<T>` tip — radi jednog imena, ne radi tvornice.

**Kriterij dovršenosti.** Nijedan `addEventListener("storage"` ni
`new Event(` izvan `lib/external-store.ts`, `lib/url-state.ts`. Ponašanje
jezika, nacrta i zaprimljenih uplata nepromijenjeno (ručno: promijeni jezik u
drugoj kartici, osvježi čarobnjak s nacrtom, osvježi `/beta/` sa zaprimljenom
uplatom).

**Rizik.** `getServerSnapshot` mora i dalje vraćati isto što i prerender
(„hr", prazan nacrt, prazan niz) — inače hidracija puca. Tvornica to dobiva
kroz `fallback`.

---

## R1.6 · Mrtvi izvozi  `P3 · S`

Izvezene **vrijednosti** koje nitko ne čita (tipovi su izostavljeni — izvoz
tipa je besplatan i korisan za ugovor):

| Datoteka | Izvoz | Prijedlog |
|---|---|---|
| `lib/fees.ts` | `CARD_FEE_PCT_INTL`, `MICRO_AMOUNT`, `REFERENCE_AMOUNT`, `COMPARISON_AMOUNTS`, `sepaFeeMax`, `retainedPct` | Kopija iz pinka landinga (`docs/10` §3). **Zadržati**, ali označiti blokom `// ── Nekorišteno ovdje, dio kanonske kopije ──` da sljedeći ne traži gdje se koriste. Alternativa: brisati i u zaglavlju napisati da je kopija djelomična. |
| `lib/facts.ts` | `ADDED_CAPACITY_MW_12M`, `BUSINESS_SEGMENT_SHARE`, `PV_PRODUCTION_MWH_2015/2025`, `GRID_LAG_FACTOR`, `GEF_2026` | **Zadržati** — SSOT za brojke je svrha datoteke, i neke su u `docs/02`. Dodati test da svaki `Fact` ima `verifiedAt` u ISO obliku i `doc` koji počinje s `docs/`. |
| `lib/brand.ts` | `IS_CLOSED_BETA` | Nitko ne grana po njemu. Ili ga koristiti u `DemoBar`/`BetaBar` (umjesto da `footer.stage` tekst stoji sam), ili brisati. |
| `lib/beta-projects.ts` | `GNOSIS_CHAIN_ID`, `RAIL_SAFE_ADDRESS` | Vidi `00-pregled.md` §5 točka 4 — odluka čovjeka. Do odluke ostaviti. |
| `lib/mock.ts` | `slugify` (seli se, R1.3), `demoSafeAddress`, `CONTRIBUTIONS`, `MEMBERS` | `CONTRIBUTIONS`/`MEMBERS` čitaju samo testovi; UI ide kroz `getContributionsForProject`/`getMembersForCommunity`. To je dobro — testovi smiju gledati sirove tablice. Zadržati. |
| `lib/safe-rpc.ts` | `GNOSIS_RPC` | Koristi se interno; izvoz nije potreban. Učiniti privatnim. |
| `lib/energy-machine.ts` | `edgeById`, `scenarioById` | Nitko ih ne čita (ni testovi). Brisati ili dodati test koji ih koristi; `nodeById` i `transitionById` ostaju jer ih simulator koristi. |

**Kriterij dovršenosti.** Skripta iz analize (node, traži `\bNAME\b` izvan
datoteke) ne vraća ništa osim svjesno zadržanih uz komentar. Predlažem da se
skripta doda kao `scripts/check-dead-exports.mjs` i pozove iz `verify` — tada
je i to kontrola, ne jednokratna higijena. Ako to zvuči previše, barem je
ostaviti u `scripts/` bez poziva.
