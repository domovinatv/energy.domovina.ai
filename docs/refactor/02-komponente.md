# 02 — Komponente

Tri komponente nose 2.477 od 6.900 redaka u `components/`: `project-detail.tsx`
(995), `new-project-wizard.tsx` (957) i `beta-page.tsx` (525). Uz to se isti
mali gradivni dijelovi (`Row`, `Summary`, `ReviewRow`, `Fact`, `Stat`) pišu
iznova po datoteci. Nijedna od tih kopija nije opasna sama po sebi; opasna je
R2.1, gdje kopija računa **brojku** mimo `lib/project.ts`.

Redoslijed: R2.1 i R2.2 prvo, jer R2.3 i R2.4 grade na primitivima iz R2.2.

---

## R2.1 · Privatni `ProjectCard` u `plant-detail.tsx` računa napredak sam  `P1 · S`

**Stanje.** `components/plant-detail.tsx:217–271` ima vlastitu funkciju
`ProjectCard` koja:

- računa postotak inline (`plant-detail.tsx:220–223`) umjesto `progressPct()`
  iz `lib/project.ts:28` — točno ono što zaglavlje `lib/project.ts` zabranjuje
  („kad napredak računa svaka kartica za sebe, dvije se brojke na istom ekranu
  raziđu");
- crta traku napretka ručno (`:229–231`) umjesto `ProgressBar` iz
  `components/project-card.tsx:24`, koji postoji upravo zato da se „zaobljenje i
  visina ne raziđu između kartice i detalja";
- ponavlja objavu sukoba interesa (`conflict.disclosure`) koja već stoji u
  `LegalBoundary` u `project-detail.tsx`.

Ista se brojka danas računa na dva mjesta s istom formulom. Formula je ista
**danas**; test to ne čuva.

**Prijedlog.** Jedna od dvije opcije, ne obje:

- **(a) Jednostavno:** zamijeniti privatni `ProjectCard` izvezenim
  `ProjectCard` iz `project-card.tsx`. Gubi se blok s modelom i objavom sukoba
  interesa na detalju elektrane. `docs/07` §2.2 traži „karticu projekta" na
  detalju elektrane, ne ponavljanje pravnog bloka; pravni blok je zahtjev za
  `/projekt/:slug` (`docs/07` §2.3).
- **(b) Ako se taj blok želi zadržati na elektrani:** izvući `ModelAndBoundary`
  komponentu (model + `model.noPromise` + `conflict.disclosure`) u
  `components/project/legal-boundary.tsx` i koristiti je u `project-detail.tsx`
  (`LegalBoundary`), `plant-detail.tsx` i `contribute-flow.tsx:116–128` (gdje
  je isti blok treći put, bez objave sukoba interesa). Napredak i traka svakako
  idu kroz `progressPct` i `ProgressBar`.

Preporuka: **(b)**, jer je blok pravno nosiv i već postoji na tri mjesta s tri
različita opsega.

**Kriterij dovršenosti.** `grep -rn "raised_cents /" components` prazan.
Jedan `ProgressBar`. Pravni blok ima jednu implementaciju.

---

## R2.2 · UI primitivi → `components/ui/`  `P2 · M`

**Stanje.** Isti elementi definirani lokalno:

| Element | Gdje | Razlika |
|---|---|---|
| `Row` (dt/dd s donjim rubom) | `plant-detail.tsx:21`, `project-detail.tsx:371` | identično |
| `Summary` / `ReviewRow` (isti `Row`, ali `value: string`) | `contribute-flow.tsx:516`, `new-project-wizard.tsx:950` | identično međusobno, podskup `Row` |
| `Panel` (`<dl>` s okvirom) | `project-detail.tsx:380` | inline `<dl className=…>` u `plant-detail.tsx:86`, `contribute-flow.tsx:466`, `new-project-wizard.tsx:904` |
| `TabHeading` / `Legend` (naslov + opcionalni uvod) | `project-detail.tsx:360`, `new-project-wizard.tsx:357` | `h2` vs `legend` |
| `Fact` / `Stat` (dt mala slova + dd velika brojka) | `beta-page.tsx:232`, `registry-stats.tsx:14` | redoslijed dt/dd, `Stat` ima okvir |
| `StepBar` (koraci kao pilule, `aria-current`) | `contribute-flow.tsx:199`, inline u `new-project-wizard.tsx:263–281`, `rails-switch.tsx:58–86` (varijanta s kvačicom) | tri izvedbe iste ideje |
| „Natrag" poveznica (`ArrowLeft` + tekst) | `plant-detail.tsx`, `project-detail.tsx`, `community-detail.tsx`, `contribute-flow.tsx`, `rails-switch.tsx` | identičan `className` 5× |
| Prazno stanje s točkastim rubom (`border-dashed … bg-sand`) | `registry.tsx`, `open-projects.tsx`, `plant-detail.tsx`, `project-detail.tsx` (×2), `rails-switch.tsx`, `contribute-flow.tsx`, `new-project-wizard.tsx` | isti stil, različit sadržaj |

**Prijedlog.** `components/ui/` s malim, bez-stanja komponentama:

- `definition-row.tsx` — `Row` (`label`, `children`), s `value?: string`
  pogodnošću da pokrije `Summary`/`ReviewRow`.
- `definition-panel.tsx` — `Panel`.
- `section-heading.tsx` — `TabHeading`; `as: "h2" | "legend"` za čarobnjak.
- `figure.tsx` — `Fact`/`Stat`, s `framed?: boolean`.
- `step-pills.tsx` — `StepBar` s `labels: readonly string[]`, `index`,
  `done?: number` (za `rails-switch` varijantu).
- `back-link.tsx`, `empty-state.tsx`.

`landing.tsx` `Section` i `Figure` ostaju lokalni — koriste se samo na
landingu i imaju drugu tipografiju.

**Kriterij dovršenosti.** Nijedna lokalna `function Row|Summary|ReviewRow|Fact|Stat|Panel|TabHeading|Legend|StepBar` u `components/*.tsx`. Vizualno isto.

**Ne raditi.** Ne uvoditi UI biblioteku ni `cva`/`class-variance-authority`;
`clsx` i `tailwind-merge` su već u `package.json` i **nitko ih ne uvozi** —
dovoljni su za varijante ako zatrebaju.

---

## R2.3 · `project-detail.tsx` → `components/project/`  `P2 · M`

**Stanje.** 995 redaka, osam tabova kao privatne funkcije, plus `LegalBoundary`,
`FundingSummary`, `TabList`. Datoteka je čitljiva, ali svaki tab ima vlastite
`useT()` i formatiranje, a `OverviewTab` prima cijeli `ProjectDetailProps`
(`project-detail.tsx:388`).

**Prijedlog.** Mehaničko razdvajanje, bez promjene JSX-a:

```
components/project/
  project-detail.tsx      — omot, URL tab, raspored (≈ 120 redaka)
  legal-boundary.tsx      — iz R2.1(b)
  funding-summary.tsx
  tab-list.tsx            — TABS konstanta + TabSlug + isTabSlug
  tabs/overview.tsx  plant.tsx  funding.tsx  account.tsx
       milestones.tsx  ledger.tsx  documents.tsx  timeline.tsx
```

Uz to:

- `TABS` i `TabSlug` idu u `lib/project-tabs.ts` ako ih treba i tko drugi
  (`contribute-flow.tsx` već linka `?tab=knjiga` kao string, `rails-switch.tsx`
  `?tab=racun`). Tipizirani slug sprječava tipfeler u linku.
- Tab panel dobiva `role="tabpanel"` i `aria-labelledby`; gumbi `aria-controls`
  (vidi `00-pregled.md` §5 točka 5). Navigacija strelicama je bonus.
- `useSyncExternalStore(searchStore…)` + `new URLSearchParams(search)` +
  `params.get(...)` ponavlja se u `registry.tsx:49–61` i
  `project-detail.tsx:101–108`. Izvući `useSearchParam(name): string | null` i
  `useSearchParams(): URLSearchParams` u `lib/url-state.ts`. Nextov
  `useSearchParams` nije korišten namjerno (statički export traži `Suspense`
  granicu i baca pri prerenderu); to zapisati u zaglavlje `url-state.ts`.

**Kriterij dovršenosti.** Rute `/projekt/:slug/?tab=*` daju identičan HTML.
Nijedna datoteka u `components/project/` nije dulja od ~200 redaka.

---

## R2.4 · `new-project-wizard.tsx` → `components/wizard/` + tipizirani koraci  `P2 · M`

**Stanje.** 957 redaka. Koraci su osam privatnih funkcija; napredovanje je
`switch (index)` s magičnim brojevima 0–7 (`new-project-wizard.tsx:192–215`),
dok `STEPS` (`:148`) nosi ključeve poruka. `contribute-flow.tsx` isti problem
rješava bolje: `type StepKey = "amount" | "who" | …` i niz `steps: StepKey[]`.
Nacrt i spremnik žive u komponenti (R1.5).

**Prijedlog.**

1. `lib/project-draft.ts` (iz R1.5): `Draft`, `EMPTY_DRAFT`, `parseDraft`,
   `draftStore`, i **izvedene provjere kao čiste funkcije**:
   `draftGoalCents(d)`, `draftCostTotalCents(d)`, `draftConflict(d)`,
   `draftThresholdBad(d)`, `canAdvance(step, d)`. Čiste funkcije dobivaju
   testove u `lib/__tests__/project-draft.test.ts` — danas se `canAdvance`
   logika (uključujući zabranjene riječi i invarijantu sukoba) ne testira,
   iako je to kontrola usklađenosti iz `docs/14` §2.4.
2. `WizardStep = "holder" | "model" | "plant" | "siteRight" | "cost" |
   "account" | "description" | "review"` i `WIZARD_STEPS: readonly WizardStep[]`;
   labela je `wizard.step.${step}` (ključevi već postoje u tom obliku).
3. `components/wizard/new-project-wizard.tsx` (omot, ≈ 150 redaka) +
   `components/wizard/steps/*.tsx`, jedan korak po datoteci, svi tipa
   `StepProps`.
4. `CostStep` koristi `parseEurToCents` iz R1.2.

**Kriterij dovršenosti.** `switch (index)` nestaje; napredovanje se računa
iz `WizardStep`. Testovi za `canAdvance` pokrivaju: nema nositelja, model
nije odabran, opis sa zabranjenom riječi, prag veći od broja potpisnika, naš
ključ čini većinu.

---

## R2.5 · Odlomak o pokrivenosti registra dvaput  `P3 · S`

`components/registry.tsx:88–99` i `components/landing-map.tsx:48–60` imaju isti
`<p>` s `home.coverage` + `home.coverageNote` i istim komentarom o `docs/08`
§4. Dvije kopije poštene formulacije su dvije prilike da jedna ostane stara.

**Prijedlog.** `components/coverage-note.tsx` s `shown: number`; obje
komponente ga renderiraju. Komentar o `docs/08` §4 seli se u njega.

---

## R2.6 · Skip-link i 404 izvan i18n  `P3 · S`

- `app/(prototip)/layout.tsx:19` ima hardkodirano „Prijeđi na sadržaj" iako
  ključ `nav.skipToContent` postoji (i zato je na popisu nekorištenih, R3.1).
  `app/beta/layout.tsx` skip-linka uopće nema, a ima `<main id="main">`.
- `app/not-found.tsx` je hrvatski bez prijevoda i vodi na `/karta/` s tekstom
  „Natrag na registar"; posjetitelj koji je na EN dobiva HR.

**Prijedlog.** `components/skip-link.tsx` (`"use client"`, `useT`) u oba
layouta. `components/not-found-view.tsx` (`"use client"`) s ključevima
`notFound.title`, `notFound.body`, `notFound.cta`; `app/not-found.tsx` ga
renderira. Layout ostaje serverska komponenta — samo dijete je klijentsko.

---

## R2.7 · Klase polja i gumba  `P3 · S`

Isti `className` doslovno:

| Klasa | Pojavljivanja |
|---|---|
| `mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink` (polje) | 15 |
| `text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted` (nadnaslov) | 7 |
| `rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700` (primarni gumb) | 4, plus 6 varijanti s `transition-colors`/`disabled:` |
| `rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft hover:border-forest hover:text-forest` (sekundarni) | 3, plus varijante |

`registry-filters.tsx:20–25` već ima `FIELD` i `LABEL` konstante — obrazac
postoji, samo nije podijeljen.

**Prijedlog.** `components/ui/styles.ts` s `FIELD`, `LABEL`, `EYEBROW`,
`BUTTON_PRIMARY`, `BUTTON_SECONDARY` kao `string` konstantama (bez `cva`), ili
tri `@layer components` klase u `globals.css` uz postojeće `.card-base`,
`.eyebrow`, `.container-content`. Preporuka: `globals.css`, jer `.eyebrow` i
`.card-base` tamo već žive i Tailwind ih vidi.

**Rizik.** Nizak; čisto estetski. Raditi zadnje u valu.

---

## Napomene uz pojedine komponente (bez vlastite stavke)

- `components/project-card.tsx:61` zove `getContributionsForProject(project.slug).length`
  u kartici — pristup podacima u prezentacijskoj komponenti i filtriranje
  cijele tablice pri svakom renderu. Dovoljno je `contributorCount(project)`
  u `lib/mock.ts` (ili prop). Ulazi u R2.3 kad se dira `FundingSummary`.
- `components/plant-map.tsx` je dobar primjer imperativne integracije s
  vanjskim crtačem; ne dirati osim R1.1 (boje). Popup CTA je `<a href>` s
  punim učitavanjem — svjesno, jer popup živi izvan Reacta.
- `components/money-flow.tsx:573` tipizira `locale: "hr" | "en"` ručno umjesto
  `Locale` iz `lib/i18n`. Jedan import.
- `components/site-header.tsx` — vidi `00-pregled.md` §5 točka 3 (nije refactor).
