# energy.domovina.ai — CLAUDE.md

P2P platforma za zajedničko financiranje i suvlasništvo **sunčanih elektrana u
Hrvatskoj**. Registar svih FN elektrana + marketplace projekata na Safe multisig
railu, bez provizije.

**Stanje: Faza 0 — baza znanja, koda još nema.**
Fiksni rok: **Green Energy Fair, Arena Zagreb, 28.–29.10.2026.**

### Potvrđene odluke (15.9.2026.)

- **Pozicioniranje: energetske zajednice**, ne „crowdfunding za solar". Hero nosi
  „tri zajednice u cijeloj Hrvatskoj, radimo četvrtu". Riječ *crowdfunding* se
  **ne koristi** u heroju ni u navigaciji (`docs/01` §1.1).
- **Nastup: vjerojatno posjetitelj**, ali opseg gradimo na izlagački standard
  (offline build, layout za TV, kiosk povratak, deep-linkovi — `docs/06` §6).
  Veći opseg se lako smanjuje; obrnuto ne ide.
- **Ime: otvoreno**, preporuka *Prisoje* (`docs/12`). Do odluke ne hardkodiraj ime
  u copy — koristi konstantu.

---

## Izvor istine

**`docs/` je jedini izvor istine.** Kod se piše iz dokumenata, ne obrnuto.
Indeks: [`docs/00-indeks.md`](./docs/00-indeks.md).

Prije rada pročitaj **00 (indeks), 01 (vizija) i 03 (pravni okvir)** + dokument
relevantan za task. Za brojke uvijek **02**, za tok novca uvijek **04**, za
konkurenciju i njezine pouke **13**.

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
**glas u zajednici**, **javni dokaz doprinosa**.

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
- **Nikad `any`.** Verifikacija: `npm run verify` = lint + tsc + build.
- Ekrani su **sadržaj-agnostični** — svi podaci iz `lib/mock.ts`
  (obrazac iz `zef-novcanik-prototip`). To omogućuje bijelu etiketu kasnije.
- **Mobile-first.** Publika na sajmu gleda na mobitelu.
- Boje samo preko Tailwind tokena (`docs/09`), nikad hex u komponenti. Jedina
  iznimka: maplibre paint properties — uz komentar iz kojeg tokena boja dolazi.

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

## Otvoreno (blokira, vidi `docs/11` §Blokirano)

- **B1** pravno mišljenje: je li članski ulog u energetsku zadrugu izvan ECSPR-a
- **B2** domena: `energy.domovina.ai` vs `domovina.energy`
- **B3** ime proizvoda — „energy.domovina.ai" je adresa, ne ime
- **B10** registracija za GEF — **prvo po hitnosti**
