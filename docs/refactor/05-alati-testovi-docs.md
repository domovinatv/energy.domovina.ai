# 05 — Alati, testovi, dokumenti

Val 0 (R5.1–R5.4) ide **prije** svih drugih valova: to su mreže koje refactor
`lib/` čine sigurnim. Val 5 (R5.5–R5.8) ide zadnji: kad kod stane, dokumenti
se usklade.

---

## R5.1 · `scripts/check-beta.mts` nije ni u `tsc` ni pod eslint pravilima za `scripts/`  `P1 · S`

**Dokaz.** `npx tsc --noEmit --listFilesOnly | grep check-beta` vraća 0.
`tsconfig.json` `include` ima `**/*.ts` i `**/*.tsx`; `*.ts` **ne** hvata
`.mts`. `eslint.config.mjs:34` override `files: ["scripts/**/*.ts",
"scripts/**/*.mjs"]` ne hvata `.mts`, pa je `no-console` ostao na `warn` i
skripta na prvom retku nosi `/* eslint-disable no-console */` — zaobilazak
simptoma, ne uzroka.

Skripta je dio `npm run deploy` i čita lanac prije objave prave adrese za
uplatu. Jedina provjera tipa koju danas ima je ona koju `tsx` radi u letu, a
`tsx` ne provjerava tipove.

**Prijedlog.**
1. `tsconfig.json` `include` += `"**/*.mts"`. Skripta uvozi s `.ts`
   ekstenzijom (`check-beta.mts:13–14`), što traži
   `allowImportingTsExtensions: true` — dopušteno uz `noEmit: true`, što repo
   već ima. Alternativa: skripta kao `.ts` uz top-level `await` omotan u
   `main()` (razlog za `.mts` iz dnevnika §12.1 bio je top-level `await` u CJS
   paketu).
2. `eslint.config.mjs` override `files` += `"scripts/**/*.mts"` i brisati
   `eslint-disable` iz skripte.
3. Vitest `include` dobiva `scripts/**/*.test.mts` ako se ikad napiše test za
   skriptu (danas ih nema).

**Kriterij dovršenosti.** `tsc --listFilesOnly` sadrži `check-beta.mts`;
`npx eslint scripts/check-beta.mts` prolazi bez `eslint-disable`.

---

## R5.2 · Zlatni test determinizma mocka  `P1 · S`

`lib/mock.ts` generira 340 elektrana iz sjemena, a `nameFor()` (`mock.ts:294`)
troši isti `rng` **unutar** petlje. Bilo koja promjena redoslijeda poziva
`rng()` — nova funkcija, premještena linija — mijenja sve slugove iza nje,
dakle sve deep-linkove sa štanda (`docs/06` §6) i sve `?e=` adrese koje su
negdje zapisane. Postojeći test (`invariants.test.ts:47`) provjerava samo da
`demoSafeAddress` daje isti rezultat dvaput **u istom procesu**, što ne čuva
ništa između commitova.

**Prijedlog.** `lib/__tests__/mock-golden.test.ts`:
```ts
it("slugovi registra su zamrznuti — deep-linkovi sa štanda ne smiju puknuti", () => {
  expect(PLANTS.length).toBe(352);
  expect(PLANTS.slice(0, 20).map((p) => p.slug)).toEqual([ /* zapisati današnje */ ]);
  expect(fnv1a(PLANTS.map((p) => p.slug).join("|"))).toBe(0x________);  // hash cijelog niza
  expect(PROJECTS.map((p) => p.destination_address)).toEqual([ /* četiri adrese */ ]);
});
```
`fnv1a` se za to izvozi iz `mock.ts` (ili se hash računa drugom funkcijom u
testu). Komentar u testu mora reći **što raditi kad padne**: ako je promjena
slugova namjerna, ažurirati zlatne vrijednosti u istom commitu i zapisati u
dnevnik da su stari deep-linkovi mrtvi.

Ovaj test je preduvjet za R1.3 (seljenje `slugify`) — dokazuje da je funkcija
identična.

---

## R5.3 · Test: `SAFES[slug].address === project.destination_address`  `P2 · S`

Oba polja dolaze iz `demoSafeAddress(slug)`, ali iz dva neovisna poziva
(`mock.ts:579` i `safeFor()` kroz `SAFES`). Test u `invariants.test.ts`
(„veze između entiteta"):
```ts
it("adresa Safea u računu i na projektu je ista", () => {
  for (const p of PROJECTS) expect(SAFES[p.slug]?.address, p.slug).toBe(p.destination_address);
});
```
Uz to: `SAFE_SHAPE[project.slug] ?? [3, 5]` (`mock.ts:726`) tiho daje zadani
prag nepoznatom slugu. Test da svaki `PROJECTS[].slug` ima zapis u `SAFE_SHAPE`,
ili `SAFE_SHAPE` tipizirati kao `Record<ProjectSlug, …>` gdje je `ProjectSlug`
unija iz `PROJECTS` — tada `tsc` čuva, ne test.

---

## R5.4 · Testovi za `lib/format.ts`  `P2 · S`

Jedina datoteka u `lib/` bez testa, a konvencija (`hr-HR`, `kWp`/`MWh`/`MW`
pragovi, datumi po jeziku) je pravilo iz `CLAUDE.md`. Slučajevi:

- `formatEur(123456)` → `1.235 €`; `formatEurPrecise(40)` → `0,40 €`.
- `formatKwp(9.8)` → `9,8 kWp`; `formatKwp(260)` → `260 kWp`.
- `formatAggregateCapacity(999)` → `999 kWp`; `(1000)` → `1,0 MW`.
- `formatProduction(9_999)` → `9.999 kWh`; `(10_000)` → `10,0 MWh`;
  `(1_000_000)` → `1.000 MWh`.
- `formatDate("2026-09-15", "hr")` → `15. rujna 2026.`; `("…", "en")` →
  `15 September 2026`; `formatDate(null)` → `""`; `formatDate("x")` → `""`.
- `shortAddress` za 42 i za 10 znakova.

Napomena: Node koristi ICU; vrijednosti u testu provjeriti jednom ručno u
Node 20+ jer se razmak ispred `€` u `hr-HR` razlikuje između ICU verzija
(obični vs. uski ne-prelomni razmak). Ako je nestabilno, testirati
`.replace(/\s/g, " ")`.

---

## R5.5 · README opisuje stanje iz 15.9.  `P2 · S`

`README.md` §„Stanje" (redci 17–33) kaže „Faza 1a + 1b", „Sljedeće: Faza 1c".
Isporučeno je 1a–1d, deploy na `energy.domovina.ai` i `/beta/` s pravim
novcem. §„Pokretanje" kaže da su odobrene iznimke linta „popisane u
`scripts/check-copy.ts`" — od 1c su u `lib/forbidden-words.ts`
(`APPROVED_NEGATIONS`). Nema `npm run deploy` ni `check:beta`.

**Prijedlog.** Prepisati §„Stanje" prema `CLAUDE.md` uvodu (koji je točan),
dodati `npm run deploy` i što radi `check:beta`, ispraviti referencu na
`lib/forbidden-words.ts`. Ne dodavati ništa što nije u `docs/11`.

---

## R5.6 · `CLAUDE.md` §„Stack (planiran)"  `P3 · S`

`CLAUDE.md:128` — naslov „Stack (planiran)". Stack je u produkciji; verzije su
u `package.json` i dnevniku §4. Preimenovati u „Stack" i dodati jedan redak:
„verzije: `package.json`; zašto baš te: dnevnik §4".

Uz to, u §„Konvencije" dodati jedan redak kad R1.1 prođe: „boje: `lib/tokens.ts`
je izvor; `tailwind.config.ts`, `map-colors`, `diagram-colors` i CSS varijable
se izvode". I jedan redak za `docs/refactor/00-pregled.md`.

---

## R5.7 · `docs/15` §6 opisuje kod koji više ne postoji  `P1 · S`

`docs/` je SSOT, ali ovdje je kod otišao dalje uz zapisanu odluku (2.10.), a
dokument je ažuriran djelomično. Proturječja unutar istog odjeljka:

| `docs/15` §6 | Kod |
|---|---|
| r. 100: „QR kod za uplatu … **radi se pri buildu**" | `app/beta/page.tsx` komentar i `intent-panel.tsx`: QR se crta u pregledniku iz railovog `epc_qr_data`, jer iznos mora biti u QR-u |
| r. 158–166: `payment` je jedan od `{ kind: "monerium", routing: … }` / `{ kind: "rail", campaignId, … }` | `lib/beta-projects.ts`: `BetaPayment = { kind: "mpt-intent" }`; drugi putovi su „namjerno izbačeni" |
| r. 172: „`check:beta` … za `rail` i registracija na railu — IBAN, primatelj, opis plaćanja" | `scripts/check-beta.mts` provjerava samo Safe na lancu; whitelist se ne može provjeriti (admin API) |

Isti odjeljak **niže** (pododjeljak „Uplata = MPT payment intent") opisuje
stvarno stanje točno. Dakle: gornji dio §6 je stariji sloj koji nije maknut.

**Prijedlog.** Prepisati uvodni dio §6 i popis „U `lib/beta-projects.ts`, za
lokaciju" tako da odgovaraju `BetaPayment` i `check-beta.mts`; stare
mogućnosti (`monerium`/`rail` put) premjestiti u pododjeljak „Odbačeno" s
datumom i razlogom (već postoji rečenica „Statični opisi … izbačeni su iz
koda"). Ne brisati — `docs/15` §6 „Plan: payment intent s izravnim mintom" još
računa na put B.

---

## R5.8 · `docs/11` 1f  `P3 · S`

`docs/11-plan-izvedbe.md:111–112`: „tri Safea 2-od-3" i „kampanje … whitelist"
su neodčekirani, a `docs/15` §6 ih navodi kao gotove (Safeovi 1.10., kampanje
2.10.) i `lib/beta-projects.ts` ima sve tri adrese. Odčekirati s datumom, isto
kao što su odčekirane stavke 1a–1d. Pravilo iz `docs/00` §6: plan ne nosi
stanje koje je prošlo.

---

## Pokrivenost testovima — što postoji, što ne

| Modul | Test | Napomena |
|---|---|---|
| `mock.ts`, `filters.ts`, `geojson.ts`, `facts.ts`, `fees.ts` | `invariants.test.ts` | dobro; dodati R5.2, R5.3 |
| `project.ts`, `forbidden-words.ts`, mock veze | `marketplace.test.ts` | dobro |
| `energy-machine.ts`, `toMermaid` | `energy-machine.test.ts` | vrlo dobro; jedini test koji dira komponentu (`toMermaid` je u `.tsx`) — razmotriti selidbu `toMermaid` u `lib/mermaid-source.ts` da test ne uvozi iz `components/` |
| `beta-projects.ts`, `safe-rpc.ts` | `beta.test.ts` | dobro |
| `pending-payments.ts` | `pending-payments.test.ts` | dobro |
| `format.ts` | — | R5.4 |
| `mpt-intent.ts`, `beta-chain.ts` | — | R4.5 |
| `url-state.ts`, `media-query.ts`, `pending-store.ts`, `i18n` | — | trebaju DOM; vidi `00-pregled.md` §5 točka 6 |
| čarobnjak `canAdvance`, nacrt | — | R2.4 ih čini čistim funkcijama pa postaju testabilni |
| komponente | — | svjesno; prototip. `/beta/` je iznimka — odluka čovjeka |

---

## Pipeline `verify` — prijedlog konačnog oblika

```
verify = lint + lint:copy + check:i18n (R3.1) + check:dead-exports (R1.6, opcionalno)
       + typecheck + test + build
deploy = verify + check:beta + wrangler deploy
```

Dvije nove provjere su skripte od ~40 redaka svaka, bez ovisnosti. Ako
`check:dead-exports` bude bučan (fakti i fees su svjesno nekorišteni), neka
čita popis iznimaka **s razlogom** iz vlastite datoteke, ne iz `ALLOWLIST`
linta usklađenosti — to su dvije različite kontrole i ne smiju dijeliti popis.

---

## Dodatak — skripta kojom je analiza našla nekorištene ključeve i mrtve izvoze

Polazište za `scripts/check-i18n.mjs` (R3.1) i `scripts/check-dead-exports.mjs`
(R1.6). Pokrenuta 2.10.2026. s `node`; bez ovisnosti. Napomena: `grep` na
Matijinom Macu je alias za `ugrep` s drugačijim `--include`, pa shell varijanta
daje krive rezultate — zato node.

```js
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const ROOT = process.cwd();
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) { if (!["node_modules", ".next", "out", ".git"].includes(e)) walk(f, out); }
    else if (/\.(ts|tsx|mts|mjs)$/.test(e)) out.push(f);
  }
  return out;
}
const files = ["app", "components", "lib", "scripts"].flatMap((d) => walk(join(ROOT, d)));
const src = Object.fromEntries(files.map((f) => [relative(ROOT, f), readFileSync(f, "utf8")]));

// 1. i18n ključevi koje nitko ne čita (uz dinamičke prefikse oblika t(`prefix.${…}`))
const hr = src["lib/i18n/hr.ts"];
const keys = [...hr.matchAll(/^\s+"([a-zA-Z0-9_.]+)":/gm)].map((m) => m[1]);
const others = Object.entries(src).filter(([p]) => !p.startsWith("lib/i18n/")).map(([, s]) => s).join("\n");
const dyn = [...others.matchAll(/t(?:Ref\.current)?\(`([a-zA-Z0-9_.]+)\$\{/g)].map((m) => m[1]);
const unused = keys.filter((k) => !others.includes(`"${k}"`) && !dyn.some((p) => k.startsWith(p)));
console.log("nekorišteni ključevi:", unused);

// 2. izvozi iz lib/ bez reference izvan vlastite datoteke
for (const [p, s] of Object.entries(src)) {
  if (!p.startsWith("lib/") || p.includes("__tests__") || p.startsWith("lib/i18n/")) continue;
  for (const m of s.matchAll(/^export (?:const|function|async function) ([A-Za-z0-9_]+)/gm)) {
    const re = new RegExp(`\\b${m[1]}\\b`);
    const refs = Object.entries(src).filter(([q, t]) => q !== p && re.test(t)).map(([q]) => q);
    if (refs.length === 0) console.log(`${p}: ${m[1]}`);
    else if (refs.every((q) => q.includes("__tests__"))) console.log(`${p}: ${m[1]} (samo testovi)`);
  }
}
```
