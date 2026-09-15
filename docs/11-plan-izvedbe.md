# 11 — Plan izvedbe

Zadnja revizija: **15.9.2026.**

Fiksni rok: **Green Energy Fair 2026, Arena Zagreb, 28.–29.10.2026.**
Od danas: **43 dana**, od čega ~6 radnih tjedana.

---

## Faza 0 — Baza znanja ✅

**Gotovo 15.9.2026.** Ovaj `docs/` direktorij. Jedini izvor istine
([00](./00-indeks.md)).

---

## Faza 1 — Landing + prototip aplikacije (do GEF-a)

**Opseg: UI bez backenda.** Mock podaci, simulirane transakcije, oznaka demo na
svakom ekranu.

### 1a · Temelj (tjedan 1) ✅ **15.9.2026.**

- [x] Next.js 16 + React 19 + TS strict (`noUncheckedIndexedAccess`) + Tailwind,
      tokeni iz [09](./09-dizajn-sustav.md) u `tailwind.config.ts`
- [x] `lib/mock.ts` — 352 elektrane, 4 projekta, 3 zajednice, 15 doprinosa po
      [05](./05-podatkovni-model.md); svi `demo: true`, deterministički iz sjemena
- [x] `lib/facts.ts` — samo **potvrđene** brojke; V1–V8 stoje u
      `PENDING_VERIFICATION` **bez polja `value`**, pa se ne mogu formatirati u UI
- [x] `lib/fees.ts` — kopija iz pinka landinga (SEPA 0,25–**0,40** €)
- [x] `lib/brand.ts` — ime preko konstante ([12](./12-ime-domena-okruzenja.md) §5)
- [x] i18n HR/EN, HR izvor; EN tipiziran prema HR pa nedostajući ključ ruši `tsc`
- [x] `npm run verify` = lint + **lint:copy** + tsc + testovi + build
- [x] `scripts/check-copy.ts` — lint na zabranjene riječi (zahtjev
      [E3](./03-pravni-okvir.md)); odobrene negacije su doslovne rečenice, ne uzorak

### 1b · Karta i registar (tjedan 1–2) ✅ **15.9.2026.**

- [x] maplibre karta Hrvatske s markerima, **clustering** (broj + ukupni MW)
- [x] filtri: županija, status, `grid_status`, raspon kWp, „traže suradnju", pretraga
- [x] statistika iznad karte, računata iz **filtriranog** skupa
- [x] popis sinkroniziran s kartom — `filterPlants` se zove **jednom** u
      `components/registry.tsx` i hrani kartu, popis i statistiku
- [x] `/elektrana/:slug` — 352 prerenderirane rute
- [x] filtri u URL-u (`?zupanija=&status=&mreza=&snaga=&suradnja=&q=`) + `?e={slug}`
      fly-to — deep-linkovi za štand ([06](./06-produkt-landing.md) §6) stižu ranije
- [x] `robots.txt` + `noindex` ([12](./12-ime-domena-okruzenja.md) §6)

### 1c · Marketplace (tjedan 2–3)

- [ ] `/projekt/:slug` s tabovima ([07](./07-produkt-app.md) §2.3)
- [ ] knjiga doprinosa
- [ ] tijek doprinosa do ekrana potvrde (simuliran)
- [ ] `/zajednice` + `/zajednica/:slug` s trakom registracije
- [ ] **tab „Tijek"** na projektu (K1) — vremenska crta uplata → prva kWh
- [ ] **trajna lista čekanja** (K4) kad nijedan projekt nije otvoren
- [ ] `/novi-projekt` čarobnjak — redoslijed po [03](./03-pravni-okvir.md) §8

### 1d · Landing (tjedan 3–4)

- [ ] 12 sekcija ([06](./06-produkt-landing.md) §1)
- [ ] `lib/energy-machine.ts` + React Flow/Mermaid dijagram + 3 scenarija
- [ ] testovi invarijanti (vitest)
- [ ] kalkulator usporedbe, označen ilustrativnim
- [ ] footer s ITalk impresumom

### 1e · Uglačavanje i štand (tjedan 5) — **gradimo za štand, idemo vjerojatno kao posjetitelj**

Opseg je namjerno postavljen na izlagački standard iako je nastup vjerojatno
posjetiteljski ([06](./06-produkt-landing.md) §6). Veći opseg se lako smanjuje.
Stavke ispod su **poželjne, ne uvjet** — uvjet je kriterij dovršenosti na dnu.

- [x] lint na zabranjene riječi ([06](./06-produkt-landing.md) §4.6) — **povučeno u
      1a**, jer je kontrola usklađenosti jeftinija dok je copyja malo
      (`scripts/check-copy.ts`, dio `npm run verify`)
- [ ] provjera kontrasta, posebno jantar
- [ ] mobile prolaz na pravom uređaju
- [ ] **layout za 1080p TV u portretu** — štand, ne samo laptop
- [x] deep-linkovi za demo na štandu — **povučeno u 1b**: filtri su u URL-u, pa su
      deep-linkovi posljedica izbora da URL bude izvor istine, a ne dodatan posao
- [ ] **offline build** — service worker, demo radi bez mreže
- [ ] **kiosk povratak** na početni ekran nakon neaktivnosti
- [ ] deploy na Cloudflare (`energy.domovina.ai`) — **blokirano na B4/B14**;
      `robots.txt` + `noindex` su već u repou ([12](./12-ime-domena-okruzenja.md) §6)
- [ ] QR na materijalima (`?izvor=gef2026`)

### Namjerno IZVAN Faze 1

Backend · pravi Safe · pravi eID · pravi novac · sloj na gis.domovina.ai ·
proizvodnja/monitoring · sekundarno tržište (nikad bez licence).

---

## Faza 2 — Živi podaci (nakon GEF-a, Q4 2026 – Q1 2027)

- Primjena `DB-MIGRATION.sql` + proširenja iz [05](./05-podatkovni-model.md)
  → **zahtijeva `domovina-api` tim**
- Certilia eID: `ALLOWED_ORIGINS` += naša domena
- Wallet handoff — **čeka `Domovina.createAccount` u `pay.domovina.ai/wallet`**
- MPT rail za doprinose
- Sloj „Sunčane elektrane" na gis.domovina.ai (PR u `karta-hrvatske`)
- Seed registra iz javnih izvora — **tek nakon licencnog odgovora**
- Vodič i predložak statuta za zajednicu

---

## Faza 3 — Proizvod (2027)

Portfelj i upravljanje · automatsko izvješće iz on-chain podataka · proizvodnja
(ručni unos → inverter API) · profili instalatera · bijela etiketa za JLS/zadruge.

---

## Faza N — Audit-gated / licence-gated

Ne planira se dok ne postoje preduvjeti.

| Stavka | Preduvjet |
|---|---|
| Zajam ili vlasnički udio | **ECSP odobrenje HANFA-e** (3 mj. od urednog zahtjeva) |
| Tokenizirani udio | prospekt + DLT Pilot + **audit** `pinka-finance-mvp` (V-1/V-2/V-3 otvoreni) |
| Sekundarno trgovanje | DLT MTF, HANFA + ESMA |

---

## Blokirano na eksterno

Ne može se riješiti u ovom repou. Vlasnik = tko to mora pokrenuti.

| # | Što | Vlasnik | Blokira |
|---|---|---|---|
| B1 | **Pravno mišljenje** na pitanja [03](./03-pravni-okvir.md) §9 — prvenstveno §9.1 (je li članski ulog izvan ECSPR-a) | odvjetnik | skaliranje modela B |
| ~~B2~~ | ~~Odluka o domeni~~ — **riješeno 15.9.2026.**: live na `energy.domovina.ai` ([12](./12-ime-domena-okruzenja.md)) | — | — |
| ~~B3~~ | ~~Ime proizvoda~~ — **riješeno**: `domovina.energy` | — | — |
| B14 | **Kako se tehnički zatvara beta** (CF Access / lozinka / neindeksirani link) | Matija | dijeljenje linka na sajmu ([12](./12-ime-domena-okruzenja.md) §6) |
| B4 | Cloudflare projekt + DNS za `energy.domovina.ai` (zona `domovina.ai`); provjeriti je li `domovina.energy` registriran na ITalk | Matija | deploy |
| B5 | Certilia `ALLOWED_ORIGINS` | Coolify na certilia-serveru | Faza 2 |
| B6 | Primjena DB migracije | `domovina-api` tim | Faza 2 |
| B7 | `Domovina.createAccount` (SDK 0.10) u walletu | `pay.domovina.ai` | pravi Safe po projektu |
| B8 | Licenca podataka HROTE/HERA/HEP-ODS | upit institucijama | seed registra |
| B9 | Pravni tekst uvjeta/privatnosti | pravnik | javni launch |
| B10 | **Registracija za GEF** (ulaz besplatan uz registraciju; štand samo ako se predomisliš) | Matija | pristup sajmu |
| B11 | Aktualni FZOEU natječaj i uvjeti | istraživanje | točnost kalkulatora |
| B12 | **Kontakt sa ZEZ-om / ZEZ Suncem** — dokazali su potražnju (140.000 € u 10 dana), alat im je Google obrazac. Idealan pilot i recenzent | Matija | **prije GEF-a**, ne poslije ([13](./13-konkurencija.md) §2.2) |
| ~~B13~~ | ~~Provjera Registra OIEKPP~~ — **riješeno 15.9.2026.**: radi na `oie-aplikacije.mingo.hr` (ne `mzoe.hr`) ([08](./08-karta-i-geo.md) §4.1) | — | — |
| B15 | **Pravni oblik nositelja u Modu 1** — ITalk d.o.o. ili zadruga kao ZEZ? | Matija + odvjetnik | tko sklapa ugovor s uplatiteljima ([14](./14-poslovni-model.md) §7) |
| B16 | **Registracija djelatnosti izvođenja** FN sustava + ovlašteni inženjer | Matija | možemo li uopće biti izvođač |
| B17 | **Kapacitet izvedbe** — koliko projekata istovremeno stvarno možemo izgraditi | Matija | obećanja bez kapaciteta proizvode Rippleov Trustpilot |

---

## Rizici

| Rizik | Vjerojatnost | Ublažavanje |
|---|---|---|
| **Netko na GEF-u pita „gdje je licenca?"** | visoka | [03](./03-pravni-okvir.md) §3 je pripremljen odgovor; sekcija „Modeli" to govori prva |
| Opseg naraste i ništa ne bude gotovo | **visoka** | 1b (karta) ima vrijednost i sama; ako padne sve ostalo, karta je i dalje isporuka |
| Prototip izgleda kao da uzima prave uplate | srednja | oznaka demo u dizajnu, ne naknadno ([09](./09-dizajn-sustav.md) §6.4) |
| Pravno mišljenje sruši model B | niska–srednja | model A radi bez ijednog otvorenog pitanja |
| WiFi u Areni | **visoka** | statički build + service worker; demo mora raditi bez mreže |
| Izlagački opseg pojede pet tjedana | srednja | nastup je posjetiteljski — kriterij dovršenosti (dolje) je namjerno uzak; 1e je bonus |
| Wallet `createAccount` ne stigne | srednja | feature-detect, legacy derivacija kao fallback |
| **Netko kaže „država to već ima" (OIEKPP)** | **visoka** | B13 prije nastupa; ne tvrditi da smo prvi, diferencirati se opsegom i upotrebljivošću ([13](./13-konkurencija.md) §9.1) |
| ~~Bez provizije nemamo od čega živjeti~~ | — | **riješeno**: marža na izvedbi ([14](./14-poslovni-model.md) §3) |
| **Ne stignemo isporučiti ono što smo naplatili** | **visoka** | novac u Safeu s potpisima kupaca, plaćanje po situaciji; B17 prije bilo kakvog obećanja ([14](./14-poslovni-model.md) §5.1) |
| Netko primijeti da smo i platforma i izvođač | **visoka** | **priznati prvi** — objava sukoba interesa trajno na projektu, naš potpis nikad većina ([14](./14-poslovni-model.md) §4) |

---

## Kriterij „gotovo za GEF"

Ne sve iz Faze 1 — ovo:

1. Karta Hrvatske s elektranama, filtrirana, na mobitelu.
2. Jedan projekt kroz koji se može proklikati do ekrana potvrde.
3. Landing koji u 90 sekundi objasni model i **zašto nema provizije**.
4. Jasna, dostojanstvena oznaka da je riječ o prototipu.
5. Način da netko ostavi kontakt.

Sve ostalo je bonus.
