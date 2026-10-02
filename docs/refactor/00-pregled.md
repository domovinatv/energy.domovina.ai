# Refactor — pregled i redoslijed

Datum analize: **2.10.2026.** Autor analize: Claude Fable 5.1, na zahtjev
Matije. Namjena: Opus prolazi stavke i izvodi ih; ovaj dokument **ne mijenja
proizvod**, nego kod ispod njega.

**Ulaz analize:** svih 78 izvornih datoteka (`app/`, `components/`, `lib/`,
`scripts/`), konfiguracija, `docs/00`, `docs/11`, `docs/12` §2, `docs/15` §6,
`docs/09` §6 i oba dnevnika. Stanje u trenutku analize: `npm run lint`,
`lint:copy`, `typecheck` i `test` prolaze (5 datoteka, 154 testa). Build nije
pokretan; `npm run deploy` ga pokreće.

---

## 1. Što je dobro i što se NE dira

Ovo je razlog zašto je refactor uopće siguran. Ne rušiti:

- **Testovi invarijanti** (`lib/__tests__/*`) testiraju pravnu i činjeničnu
  poziciju, ne pokrivenost. Svaka stavka niže mora proći kroz njih netaknute.
- **`lib/forbidden-words.ts` + `scripts/check-copy.ts`** su kontrola
  usklađenosti. `ALLOWLIST` se **ne proširuje** ni za jednu stavku odavde.
- **`useSyncExternalStore` za vanjsko stanje** (URL, `localStorage`,
  `sessionStorage`, `matchMedia`). Obrazac ostaje; mijenja se samo to da se
  pet ručnih kopija spoji u jednu tvornicu (R1.5).
- **`lib/energy-machine.ts` kao jedan artefakt** za dijagram, simulaciju i
  testove. Dvojezične `L10n` labele u njemu su svjesna iznimka od i18n kataloga
  i ostaju (vidi `03-i18n.md` §4).
- **Iznosi u centima**, `DEMO_NOW`, deterministički mock, maplibre
  `setWorkerUrl`, dvije datoteke s heksom (`map-colors`, `diagram-colors`).
  Stavka R1.1 ih ne ukida, nego im daje zajednički izvor.
- **Route group `app/(prototip)/` vs `app/beta/`** — razdvajanje makete i
  pravog novca ostaje točno kakvo jest.

---

## 2. Pravila izvedbe za Opus

1. **Jedna stavka = jedan commit** (ili PR), s ID-em stavke u poruci
   (`refactor(R1.2): …`). Ne spajati stavke različitih valova.
2. **`npm run verify` prije svakog commita.** Ako stavka mijenja i testove,
   prvo pokazati da novi test **pada** na starom kodu, pa tek onda mijenjati
   kod (isti postupak kao dnevnik §10.2).
3. **Bez promjene ponašanja** osim gdje stavka to izrijekom kaže (R3.2
   množina, R2.6 prijevod 404, R4.2 manje upita). Snimka HTML-a prije i
   poslije mora biti ista za sve ostale stavke.
4. **Pravni copy se ne dira.** Rečenice iz `APPROVED_NEGATIONS`, `model.*`,
   `conflict.disclosure`, `footer.*`, `beta.notInvestment` — ni slovo. Nalazi
   koji ih se tiču stoje u §5 i čekaju čovjeka.
5. **`docs/` je SSOT** — ali `05-alati-testovi-docs.md` §4 imenuje mjesta gdje
   je kod otišao dalje od dokumenta. Ondje se ažurira dokument, ne vraća kod.
6. Zabrane iz `CLAUDE.md` vrijede i za refactor: nikad `any`, nikad heks u
   komponenti, nikad emoji, hrvatski izvor pa engleski, nikad brojka u copyju.

---

## 3. Valovi i redoslijed

Redoslijed nije proizvoljan: val 0 postavlja mreže koje kasnije valove čine
sigurnima. Unutar vala stavke su neovisne.

| Val | Cilj | Stavke | Dokument |
|---|---|---|---|
| **0** | Sigurnosni pojas prije refactora | R5.1 `.mts` u tsc/eslint · R5.2 zlatni test determinizma mocka · R5.3 test `SAFES` = `destination_address` · R5.4 testovi `format.ts` | [05](./05-alati-testovi-docs.md) |
| **1** | Jedno mjesto istine u `lib/` | R1.1 tokeni boja · R1.2 novac (EUR↔centi, parsiranje) · R1.3 transliteracija · R1.4 skupovi statusa · R1.5 tvornica vanjskog spremnika · R1.6 mrtvi izvozi | [01](./01-lib-jedno-mjesto-istine.md) |
| **2** | Komponente bez kopija | R2.1 dvostruki `ProjectCard` · R2.2 UI primitivi · R2.3 razbiti `project-detail` · R2.4 razbiti čarobnjak · R2.5 `CoverageNote` · R2.6 `SkipLink` i 404 · R2.7 klase polja i gumba | [02](./02-komponente.md) |
| **3** | i18n | R3.1 nekorišteni ključevi · R3.2 množina · R3.3 tipizirani dinamički ključevi · R3.4 brojevi u interpolaciji | [03](./03-i18n.md) |
| **4** | `/beta/` | R4.1 hookovi za lanac i intent · R4.2 jedan poll po intentu · R4.3 API `pending-store` · R4.4 `readonly` i zastarjeli komentari · R4.5 testovi `mpt-intent` i `beta-chain` | [04](./04-beta-tok-novca.md) |
| **5** | Dokumenti i README | R5.5 README · R5.6 `CLAUDE.md` · R5.7 `docs/15` §6 · R5.8 `docs/11` 1f | [05](./05-alati-testovi-docs.md) |

**Oznake:** prioritet P1 (nesklad koji može proizvesti krivi broj ili krivu
tvrdnju) · P2 (dvostruka istina koja će se razići) · P3 (higijena). Trud S
(< 1 h) · M (1–3 h) · L (pola dana i više).

---

## 4. Sve stavke na jednom mjestu

| ID | Stavka | P | Trud | Datoteke |
|---|---|---|---|---|
| R5.1 | `scripts/check-beta.mts` nije u `tsc` ni pod eslint pravilima za `scripts/` | P1 | S | `tsconfig.json`, `eslint.config.mjs` |
| R5.2 | Zlatni test: slugovi i Safe adrese mocka se ne mijenjaju | P1 | S | `lib/__tests__/` |
| R5.3 | Test: `SAFES[slug].address === project.destination_address` | P2 | S | `lib/__tests__/invariants.test.ts` |
| R5.4 | Testovi za `lib/format.ts` | P2 | S | `lib/__tests__/` |
| R1.1 | Paleta na četiri mjesta → `lib/tokens.ts` | P2 | M | `tailwind.config.ts`, `lib/map-colors.ts`, `lib/diagram-colors.ts`, `app/globals.css`, `app/layout.tsx` |
| R1.2 | EUR↔centi i parsiranje iznosa na 8 mjesta → `lib/money.ts` | P1 | M | `lib/mock.ts`, `lib/energy-machine.ts`, `lib/fees.ts`, `lib/beta-projects.ts`, 4 komponente |
| R1.3 | Transliteracija dvaput → `lib/text.ts` | P3 | S | `lib/mock.ts`, `lib/filters.ts` |
| R1.4 | `PLANT_STATUS_SET` / `GRID_STATUS_SET` prepisani iz `types.ts` | P2 | S | `lib/filters.ts` |
| R1.5 | Pet ručnih `useSyncExternalStore` spremnika → `lib/external-store.ts` | P2 | M | `lib/i18n/index.tsx`, `lib/url-state.ts`, `lib/pending-store.ts`, `lib/media-query.ts`, `components/new-project-wizard.tsx` |
| R1.6 | 14 mrtvih izvoza vrijednosti u `lib/` | P3 | S | `lib/fees.ts`, `lib/facts.ts`, `lib/brand.ts`, `lib/beta-projects.ts`, `lib/mock.ts` |
| R2.1 | Privatni `ProjectCard` u `plant-detail.tsx` računa napredak sam | P1 | S | `components/plant-detail.tsx` |
| R2.2 | `Row` ×3, `Summary`, `ReviewRow`, `Fact`, `Stat`, `TabHeading`, `Panel`, `Legend`, `StepBar` → `components/ui/` | P2 | M | 7 komponenti |
| R2.3 | `project-detail.tsx` (995 redaka) → `components/project/` | P2 | M | `components/project-detail.tsx` |
| R2.4 | `new-project-wizard.tsx` (957 redaka) → `components/wizard/` + tipizirani koraci | P2 | M | `components/new-project-wizard.tsx` |
| R2.5 | Odlomak o pokrivenosti registra dvaput | P3 | S | `components/registry.tsx`, `components/landing-map.tsx` |
| R2.6 | Skip-link hardkodiran, nema ga u `/beta/`; 404 bez prijevoda | P3 | S | `app/(prototip)/layout.tsx`, `app/beta/layout.tsx`, `app/not-found.tsx` |
| R2.7 | Klasa polja ponovljena 15×, gumba 4–7× | P3 | S | sve komponente s obrascima |
| R3.1 | 26 nekorištenih ključeva u oba kataloga | P3 | S | `lib/i18n/hr.ts`, `lib/i18n/en.ts` |
| R3.2 | Množina: „2 elektrana", „1 doprinosa", „91 dana" | P2 | M | `lib/i18n/index.tsx`, katalozi, 8 poziva |
| R3.3 | Šest `as MessageKey` castova u `landing.tsx` i `plant-map.tsx` | P3 | S | `components/landing.tsx`, `components/plant-map.tsx` |
| R3.4 | `interpolate` radi `String(value)` na brojevima | P3 | S | `lib/i18n/index.tsx` |
| R4.1 | Polling i stanje lanca u komponentama → `useSafeActivity`, `useIntentStatus` | P2 | M | `components/beta/beta-page.tsx`, `components/beta/intent-panel.tsx` |
| R4.2 | Isti intent polla `IntentPanel` (2 s) i `PendingWatcher` (15 s) istodobno | P2 | S | `components/beta/beta-page.tsx` |
| R4.3 | `usePending(project.safe ?? "")`, `copyRow` render-prop, `Row` s vlastitim stanjem | P3 | S | `lib/pending-store.ts`, `components/beta/beta-page.tsx` |
| R4.4 | `BetaProject` bez `readonly`; zaglavlje `beta-projects.ts` opisuje stari put novca | P2 | S | `lib/beta-projects.ts` |
| R4.5 | Testovi za `mpt-intent.ts` i `beta-chain.ts` (mock `fetch`) | P2 | M | `lib/__tests__/` |
| R5.5 | README opisuje stanje iz 15.9. („Faza 1a + 1b", iznimke u `check-copy.ts`) | P2 | S | `README.md` |
| R5.6 | `CLAUDE.md` §„Stack (planiran)" — stack je stvaran | P3 | S | `CLAUDE.md` |
| R5.7 | `docs/15` §6: QR „pri buildu", `payment.kind` `monerium`/`rail` više ne postoje u kodu | P1 | S | `docs/15-pravi-projekti-vlastite-lokacije.md` |
| R5.8 | `docs/11` 1f: Safeovi i kampanje su gotovi, a neodčekirani | P3 | S | `docs/11-plan-izvedbe.md` |

---

## 5. Nalazi koji NISU refactor — za odluku čovjeka

Ovo Opus **ne izvodi**. Stoji ovdje da se ne izgubi.

1. **Dvije rečenice na `/beta/` proturječe si.** `beta.signers`
   (`lib/i18n/hr.ts:844`) kaže da sva tri ključa drži ista osoba, vlasnik
   lokacije. `beta.notInvestment` (`hr.ts:879`) kaže „{brand} ne drži ključeve
   nijednog Safea". Vlasnik lokacije je direktor operatera (`lib/brand.ts`,
   `OPERATOR.director`), a `docs/15` §16 kaže da su Safeovi na ITalk profilu.
   Treba odlučiti koja je formulacija točna; vjerojatno treća.
2. **`beta.intro`** (`hr.ts:821`) kaže da uplata „završava na tom računu" i
   da stranica novac „ne prima ni ne drži". Stranica ne drži, ali s MPT
   intentom novac prolazi kroz rail Safe operatera (`RAIL_SAFE_ADDRESS`) pa se
   prosljeđuje. `docs/15` §6 sam upozorava da kod rail puta tvrdnja „ne
   prolazi kroz nas" nije točna. Copy to danas ne kaže.
3. **Zaglavlje `app/(prototip)/layout.tsx` skriva dvije od četiri stavke
   navigacije na mobitelu** (`hidden sm:inline` za „Kako radi" i „Novi
   projekt"). `CLAUDE.md` kaže mobile-first i da publika gleda na mobitelu.
   Ili izbornik, ili svjesna odluka zapisana u `docs/06`.
4. **`RAIL_SAFE_ADDRESS` i `GNOSIS_CHAIN_ID`** su izvezeni, a nitko ih ne
   čita. Ako je put novca rail → Safe, možda stranica treba pokazati i rail
   adresu kao dio objašnjenja; ako ne, konstante se brišu (R1.6).
5. **Tabovi na `/projekt/:slug`** imaju `role="tab"` bez `aria-controls`,
   bez `role="tabpanel"` i bez navigacije strelicama. Pristupačnost, ne
   refactor; radi se kad se radi R2.3.
6. **Nijedan test ne dira komponente.** To je prihvatljivo za prototip, ali
   `/beta/` više nije prototip. Ako se odluči uvesti `jsdom`/`happy-dom`, prvi
   kandidati su `IntentPanel` (faze) i `LiveActivity` (zbrajanje
   nepotvrđenih). Trošak: nova dev ovisnost i `environment` po datoteci.
