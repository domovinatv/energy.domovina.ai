# domovina.energy — CLAUDE.md

P2P platforma za zajedničko financiranje i suvlasništvo **sunčanih elektrana u
Hrvatskoj**. Registar svih FN elektrana + marketplace projekata na Safe multisig
railu.

**Nismo posrednik — mi smo izvođač.** Gradimo elektrane i prodajemo ih ključ u ruke,
a novac prikupljamo od ljudi koji tu elektranu dobivaju (**Mod 1**, uzor ZEZ). Tko
želi, isti softver koristi sa **svojim** Monerium IBAN-om i **svojim** Safeom i tada
novac ne prolazi kroz nas (**Mod 2**). Zbog toga **ne treba ECSP** — `docs/14`.

**Ime: `domovina.energy`. Live na: `energy.domovina.ai` (closed beta).**
**JEDNO OKRUŽENJE — development = staging = production.** Grana `main` je ono što
ljudi vide; nema „probat ću na stagingu". Detalji i pravila: `docs/12`.

**Stanje: Faza 1a + 1b + 1c + 1d isporučene** — temelj (Next.js, tokeni, `lib/*`,
i18n), registar (maplibre karta s klasterima, filtri, popis, `/elektrana/:slug`),
marketplace (`/projekt/:slug` s osam tabova, tijek doprinosa, `/zajednice`,
`/novi-projekt`, lista čekanja) i landing (11 sekcija + podnožje, dijagram toka
novca s 4 scenarija, kalkulator). Sljedeće je **Faza 1e — uglačavanje i štand**
(`docs/11`). Fiksni rok: **Green Energy Fair, Arena Zagreb, 28.–29.10.2026.**

⚠️ **Rute: `/` je LANDING, registar je na `/karta/`** (odluka u 1d). `docs/07` §2.1
i `docs/08` §2 još govore o `/` kao karti — vrijedi `docs/06` §1 i dnevnik §10.5.

### Potvrđene odluke (15.9.2026.)

- **Pozicioniranje: energetske zajednice**, ne „crowdfunding za solar". Hero nosi
  „tri zajednice u cijeloj Hrvatskoj, radimo četvrtu". Riječ *crowdfunding* se
  **ne koristi** u heroju ni u navigaciji (`docs/01` §1.1).
- **Nastup: vjerojatno posjetitelj**, ali opseg gradimo na izlagački standard
  (offline build, layout za TV, kiosk povratak, deep-linkovi — `docs/06` §6).
  Veći opseg se lako smanjuje; obrnuto ne ide.
- **Ime: `domovina.energy`**, radna/live adresa `energy.domovina.ai`. Ime **ne
  hardkodiraj** u copy — ide preko `lib/brand.ts` (`docs/12` §5), jer je prelazak na
  `domovina.energy` kasnije jedna izmjena.
- **Jedno okruženje, idemo live s njim.** Svaki push u `main` je objava:
  `npm run verify` prolazi prije commita, nedovršeno ide **iza zastavice** a ne na
  `main` bez nje, migracije su samo aditivne (`docs/12` §2.1).

---

## Izvor istine

**`docs/` je jedini izvor istine.** Kod se piše iz dokumenata, ne obrnuto.
Indeks: [`docs/00-indeks.md`](./docs/00-indeks.md).

Prije rada pročitaj **00 (indeks), 01 (vizija) i 03 (pravni okvir)** + dokument
relevantan za task. Za brojke uvijek **02**, za tok novca uvijek **04**, za
konkurenciju i njezine pouke **13**.

⚠️ **Sukob interesa je strukturni:** istovremeno smo platforma i izvođač koji
naplaćuje. Zato **naš potpisnik nikad ne smije činiti većinu praga Safea** (prag
3-od-5 → mi držimo najviše jedan ključ), razrada troška izvedbe je javna, a objava
sukoba interesa stoji trajno na stranici projekta (`docs/14` §4).

⚠️ **„0 %" se nikad ne piše samo.** Ne uzimamo postotak od prikupljenog, ali
zarađujemo kao izvođač — to mora stajati u istom vidnom polju (`docs/14` §3.1).

⚠️ Tri nalaza iz `docs/13` koja mijenjaju pretpostavke:
**(a)** model već radi u HR — ZEZ Sunce, 140.000 € u 10 dana, alat im je Google
obrazac (partner, ne konkurent). **(b)** Ripple Energy propao, a njegove zadruge
rade dalje — dokaz non-custody teze, citirati poimence. **(c)** Sun Exchange propao
na trošku administriranja 10.000 suvlasnika — bez provizije naš trošak po članu
mora biti ~0.

---

## Tri pravila koja se ne krše

### 1. Pravna granica iz `docs/03` §3

Čim ono što korisnik drži nosi **očekivanje prinosa, udio u dobiti ili
prenosivost s tržišnom cijenom** — to je ECSP/MiFID teritorij i mi nemamo licencu.

Zabranjeno u copyju, u imenima polja i u imenima komponenti:
`prinos` · `kamata` · `dividenda` · `povrat na ulaganje` · `udio u dobiti` ·
`yield` · `return` · `roi` · `sekundarno tržište` · `prodaj udio`

Dopušteno: **doprinos**, **članski ulog**, **udio u proizvedenoj energiji**,
**glas u zajednici**, **javni dokaz doprinosa**, **predujam na elektranu**.

⚠️ **Uplata se nikad ne opisuje kao povratna.** „Daj novac pa ti ga vraćamo" nije
ECSPR nego **primanje povratnih sredstava od javnosti** = rezervirana bankovna
djelatnost. Strože, ne blaže (`docs/14` §2.3).

⚠️ **U Modu 2 nas ne štiti non-custody.** ECSPR ne traži skrbništvo — štiti nas
samo to što su instrumenti izvan opsega. Zato su onemogućeni modeli C/D i lint na
zabranjene riječi **kontrola usklađenosti**, ne kozmetika (`docs/14` §2.4).

### 2. Jedan broj = jedno mjesto istine

Nijedna brojka se ne piše izravno u copy ili komponentu.
Tržišne brojke → `docs/02-trziste-hrvatska.md` → `lib/facts.ts`.
Stope naknada → `lib/fees.ts` (kopija iz pinka landinga).
Nova brojka bez izvora i datuma provjere = neprovjerena, ne ide u UI.

⚠️ Poznati nesklad u obitelji: SEPA nalog je **0,25–0,40 €**, ne 0,45.
`mpt-landing/src/lib/market-fees.ts` ima grešku — ne prenositi je.

### 3. Prototip se deklarira kao prototip

Svaki mock zapis nosi `demo: true` i UI to **prikazuje** — traka na vrhu + badge na
kartici. Nikad lažni „provjeri na Gnosisscanu" link bez oznake demo. To je jedina
stvar koja bi na sajmu izgledala kao prijevara umjesto kao maketa.

---

## Konvencije

- **Jezik UI-ja: hrvatski** (izvor istine), EN izveden. Mijenjaj **oba** kataloga.
- **Bez emojija u UI-ju.**
- Iznosi: `Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' })`.
  Energija: `kWp` (snaga) · `kWh`/`MWh` (proizvodnja) · `MW` (agregat).
- **Nikad `any`.** Verifikacija: `npm run verify` = lint + lint:copy + tsc +
  testovi + build.
- Boje za **maplibre** su u `lib/map-colors.ts`, za **React Flow i Mermaid** u
  `lib/diagram-colors.ts` — jedine dvije iznimke od „nikad hex u komponenti".
- Ekrani su **sadržaj-agnostični** — svi podaci iz `lib/mock.ts`
  (obrazac iz `zef-novcanik-prototip`). To omogućuje bijelu etiketu kasnije.
- **Mobile-first.** Publika na sajmu gleda na mobitelu.
- Boje samo preko Tailwind tokena (`docs/09`), nikad hex u komponenti. Iznimke su
  samo alati koji ne čitaju Tailwind (maplibre, React Flow, Mermaid) i žive u
  dvije datoteke iznad — uz svaku boju stoji iz kojeg tokena dolazi.

---

## Stack (planiran)

Next.js App Router + TypeScript strict + Tailwind + maplibre-gl, statički export na
Cloudflare. Dijagrami: React Flow (≥1024px) + Mermaid (<1024px). Testovi: vitest.
Detalji i verzije: `docs/06` §5.

---

## Naučene zamke (ne ponavljaj)

Iz `mpt-landing/CLAUDE.md`:
- Next 16 `proxy.ts` **ne radi** na OpenNextu → `src/middleware.ts` (edge).
- `dynamicParams = false` **ruši** prerenderirane rute na OpenNextu (#611).
- **Nikad ne modeliraj tok novca iz sjećanja.** Kanonski izvor:
  `~/git/domovinatv/pay.domovina.ai`.

Iz `zef-novcanik-prototip/CLAUDE.md`:
- Mermaid: čekaj `document.fonts` **prije** `mermaid.render`, inače se tekst
  odsiječe (fallback font mjeri krive širine).
- **Ne stavljaj `zoom` na `html`** — lomi mermaidov `getBoundingClientRect`.
- Ako se ikad uvede tamna tema: tokeni kao **CSS vars s RGB kanalima**, ne hex —
  inače `bg-forest/10` prestane raditi.

Iz **ovog repoa** (`docs/2026-09-15-dnevnik-izvedbe.md`):
- **Zabranjene riječi i padeži:** višerječni uzorak pisan za nominativ propušta
  sklonidbu — „sekundarno tržište" je padalo, „na **sekundarnom** tržištu" je
  prolazilo. Svaka riječ koja se sklanja treba `\w*`. To je rupa u **kontroli
  usklađenosti**, ne kozmetika (dnevnik §7.1).
- **Popis zabranjenih riječi je u `lib/forbidden-words.ts`**, ne u lintu: isti
  popis treba i lint nad našim copyjem i validacija **tuđeg** opisa u čarobnjaku.
  Ne dodavati nove iznimke u `ALLOWLIST` — iznimka po iznimka ubija kontrolu.
- **Trajno vidljivo ne ide u tab.** Tab je fusnota s karticama (dnevnik §7.3).
- **`useSyncExternalStore` je zadani odgovor** na vanjsko stanje u statičkom
  exportu (URL, `localStorage`, `sessionStorage`). `setState` u efektu ruši lint
  (`react-hooks/set-state-in-effect`) i lomi hidraciju (dnevnik §7.6).
- **`DEMO_NOW` je fiksan datum.** Kašnjenja i rokovi se računaju iz njega, inače
  demo truli između danas i sajma (dnevnik §7.4).
- **maplibre 6 + Turbopack:** worker se tiho ne podigne (`import.meta.url` nije
  `http(s):`). Stil, sprite i TileJSON stignu s 200, ali nema nijednog `.pbf`,
  `map.loaded()` ostaje `false`, **greške nema**. Treba `setWorkerUrl()` +
  vendoriran worker (`scripts/copy-maplibre-worker.mjs`).
- **maplibre:** `zoom` izraz smije stajati samo kao vrh `step`/`interpolate` —
  `["+", <interpolate on zoom>, 5]` ruši sloj.
- **Provjera u pregledniku:** skrivena kartica pauzira `requestAnimationFrame`,
  pa canvas ne crta. To **ne dokazuje** da je kod ispravan — odgodi zaključak.
- **Deploy je `npm run deploy`** (verify + `wrangler deploy`), ne push. Nova vanjska
  domena u kodu ide i u CSP u `public/_headers`, inače je preglednik tiho blokira
  (`docs/12` §7).
- **ESLint ostaje na 9** dok `eslint-config-next` ne osvježi `eslint-plugin-react`
  (na 10 puca s `contextOrFilename.getFilename is not a function`).

Iz Faze 1d (`docs/2026-09-15-dnevnik-izvedbe.md` §10):
- **Mermaid `classDef` ne podnosi `rgba()`** — zarez ondje razdvaja svojstva, pa
  parser pukne i **cijeli dijagram tiho ostane prazan**, bez greške u konzoli
  (iznimka je bila neuhvaćena promise rejekcija). Boje za dijagrame idu u
  `lib/diagram-colors.ts` i **moraju biti heks** (dnevnik §10.2).
- **Uzorak za `roi`/`yield` u imenima polja mora biti na granici riječi.**
  `\b\w*[rR]oi\w*` pada na hrvatskoj riječi „p**roi**zvoda:". Lažni pozitiv tjera
  sljedećeg na iznimku u `ALLOWLIST`, a to ubija kontrolu — zato uz svako pravilo
  ide i **protuprimjer** (`FORBIDDEN_IDENTIFIER_NON_EXAMPLES`, dnevnik §10.1).
- **React Flow:** vodoravan tok traži `sourcePosition: Right` / `targetPosition:
  Left`; zadano je gore/dolje i strelice cik-cakaju.
- **`resize_window` ne smanjuje maksimiziran prozor** (`innerWidth` ostane 1920,
  a poziv javi uspjeh). Za usku širinu koristi **`iframe` na istom podrijetlu** i
  mjeri `contentWindow.innerWidth`. To nije uređaj i ne smije se tako zvati
  (dnevnik §10.3).
- **Tok novca je u CENTIMA** (`lib/energy-machine.ts`), za razliku od
  `mpt-machine.ts` koji radi s decimalnim eurima. Zbroj salda je tada cjelobrojan
  i invarijanta očuvanja nema zaokruživanja.

Iz `pinka-finance/app`:
- Statički export → `script-src` mora imati `'unsafe-inline'` (inline RSC bez
  nonce-a). Dobitak traži u `frame-ancestors`, origin-pin, `object-src 'none'`.
- Čarobnjak: spremi nacrt u `sessionStorage` **prije** wallet handoffa, vrati ga
  na `dw_error`.
- `is_verified` i `owner` su **server-computed**, nikad iz klijentskog patcha.

---

## Odnos prema drugim repoima

Puna mapa: [`docs/10-reuse-mapa.md`](./docs/10-reuse-mapa.md).

Najvažnije: **`pinka-finance/energy`** je izravni prethodnik (`domovina.energy`,
on hold) — `plant-card`, `status-badge`, `plant-form`, registar i `lib/solar.ts`
preuzimaju se kao kopija. Ali **ne** preuzimaj njegov shared-lib wiring
(`@/*` → `../app/*`, `externalDir`) — ovaj repo je izolirano namjerno.

⚠️ Iz `airkuna/tokenizacija` **ne** uvoziti `TokenSlider`, `YieldChip` ni
`KupovniModal` — korektni su tamo, pravno pogrešni ovdje.

Izmjene u tuđim repoima (npr. sloj na `karta-hrvatske`) idu **PR-om**, ne
kopiranjem natrag.

---

## Dug provjere

⚠️ Prije nego bilo koja brojka uđe u `lib/facts.ts` ili u javni copy, provjeri
`docs/2026-09-15-istrazivacki-dnevnik.md` §3 — **V1–V8 su tvrdnje koje NISU
potvrđene**. Brojka s oznakom ⚠️ u `docs/02` ili `docs/13` ne ide u UI dok se oznaka
ne makne. Isti dokument nosi i slijepe ulice (§1) da se ne ponavljaju.

---

## Pravi projekti (`docs/15`)

Tri **stvarne** elektrane na vlastitim lokacijama (Lukavec, Donja Lomnica, Rab),
pravi Safe 2-od-3, novac samo od vlasnika i osobno poznatih — **ne javno
prikupljanje**. Puna adresa lokacije je javna (odluka vlasnika 1.10.2026.).

Žive na **`/beta/`** (`app/beta/`, `lib/beta-projects.ts`), odvojeno od makete route
groupom: `app/(prototip)/` nosi demo traku, `/beta/` ne. Projekt se aktivira
upisom `safe` + `payment` u `lib/beta-projects.ts` (`docs/15` §6). Bez Safea nema
upute za uplatu — invarijanta, ne stil.

## Otvoreno (blokira, vidi `docs/11` §Blokirano)

- **B1** pravno mišljenje: je li članski ulog u energetsku zadrugu izvan ECSPR-a,
  i gdje je granica samoizdavanja vs posredovanja (`docs/03` §9.8)
- **B12** kontakt sa ZEZ-om — **prije GEF-a**
- **B14** kako se tehnički zatvara beta — zasad neindeksiran link (1.10.), konačno prije GEF-a
- **B15** pravni oblik nositelja u Modu 1 — ITalk d.o.o. ili zadruga kao ZEZ?
- **B16** registracija djelatnosti izvođenja + ovlašteni inženjer
- **B17** kapacitet izvedbe — obećanja bez kapaciteta proizvode Rippleov Trustpilot
- **B10** registracija za GEF

⚠️ **Passkey zamka:** u closed beti passkey je **simuliran** i mora tako ostati dok
se ne odluči trajna produkcijska domena. WebAuthn passkeyi su vezani uz registrable
domain i **ne migriraju** s `domovina.ai` na `domovina.energy` (`docs/12` §4).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
