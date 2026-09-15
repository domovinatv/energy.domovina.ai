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

### 1a · Temelj (tjedan 1)

- [ ] Next.js + TS strict + Tailwind, tokeni iz [09](./09-dizajn-sustav.md)
- [ ] `lib/mock.ts` — elektrane, projekti, zajednice, doprinosi po
      [05](./05-podatkovni-model.md); svi `demo: true`
- [ ] `lib/facts.ts` — tržišne brojke, citiraju [02](./02-trziste-hrvatska.md)
- [ ] `lib/fees.ts` — kopija iz pinka landinga (SEPA 0,25–**0,40** €)
- [ ] i18n skelet HR/EN, HR izvor
- [ ] `npm run verify` = lint + tsc + build

### 1b · Karta i registar (tjedan 1–2) — **najveća vrijednost po satu**

- [ ] maplibre karta Hrvatske s markerima, clustering
- [ ] filtri: županija, status, `grid_status`, kWp
- [ ] statistika iznad karte
- [ ] popis sinkroniziran s kartom (isti filtrirani skup)
- [ ] `/elektrana/:slug`

### 1c · Marketplace (tjedan 2–3)

- [ ] `/projekt/:slug` s tabovima ([07](./07-produkt-app.md) §2.3)
- [ ] knjiga doprinosa
- [ ] tijek doprinosa do ekrana potvrde (simuliran)
- [ ] `/zajednice` + `/zajednica/:slug` s trakom registracije
- [ ] `/novi-projekt` čarobnjak — redoslijed po [03](./03-pravni-okvir.md) §8

### 1d · Landing (tjedan 3–4)

- [ ] 12 sekcija ([06](./06-produkt-landing.md) §1)
- [ ] `lib/energy-machine.ts` + React Flow/Mermaid dijagram + 3 scenarija
- [ ] testovi invarijanti (vitest)
- [ ] kalkulator usporedbe, označen ilustrativnim
- [ ] footer s ITalk impresumom

### 1e · Uglačavanje i štand (tjedan 5) — **nastupamo kao izlagač**

Potvrđeno 15.9.2026. Prototip je izlog, ne podrška razgovoru
([06](./06-produkt-landing.md) §6).

- [ ] lint na zabranjene riječi ([06](./06-produkt-landing.md) §4.6)
- [ ] provjera kontrasta, posebno jantar
- [ ] mobile prolaz na pravom uređaju
- [ ] **layout za 1080p TV u portretu** — štand, ne samo laptop
- [ ] deep-linkovi za demo na štandu
- [ ] **offline build** — service worker, demo radi bez mreže
- [ ] **kiosk povratak** na početni ekran nakon neaktivnosti
- [ ] deploy na Cloudflare + domena
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
| B2 | Odluka o domeni | Matija | deploy, CSP, Certilia origins, **passkey RP ID** ([12](./12-ime-i-domena.md) §3) |
| B3 | **Ime proizvoda** — prijedlozi spremni, preporuka *Prisoje* | Matija | landing copy, logo, OG ([12](./12-ime-i-domena.md)) |
| B4 | Cloudflare projekt + DNS | Matija | deploy |
| B5 | Certilia `ALLOWED_ORIGINS` | Coolify na certilia-serveru | Faza 2 |
| B6 | Primjena DB migracije | `domovina-api` tim | Faza 2 |
| B7 | `Domovina.createAccount` (SDK 0.10) u walletu | `pay.domovina.ai` | pravi Safe po projektu |
| B8 | Licenca podataka HROTE/HERA/HEP-ODS | upit institucijama | seed registra |
| B9 | Pravni tekst uvjeta/privatnosti | pravnik | javni launch |
| B10 | **Prijava štanda i plaćanje kotizacije za GEF** | Matija | **prvo po hitnosti** — nastup je potvrđen kao izlagač, prijava nije |
| B11 | Aktualni FZOEU natječaj i uvjeti | istraživanje | točnost kalkulatora |

---

## Rizici

| Rizik | Vjerojatnost | Ublažavanje |
|---|---|---|
| **Netko na GEF-u pita „gdje je licenca?"** | visoka | [03](./03-pravni-okvir.md) §3 je pripremljen odgovor; sekcija „Modeli" to govori prva |
| Opseg naraste i ništa ne bude gotovo | **visoka** | 1b (karta) ima vrijednost i sama; ako padne sve ostalo, karta je i dalje isporuka |
| Prototip izgleda kao da uzima prave uplate | srednja | oznaka demo u dizajnu, ne naknadno ([09](./09-dizajn-sustav.md) §6.4) |
| Pravno mišljenje sruši model B | niska–srednja | model A radi bez ijednog otvorenog pitanja |
| WiFi u Areni | **visoka** | statički build + service worker; demo mora raditi bez mreže |
| Štand traži više poliranja nego što stane u 5 tjedana | **visoka** | kriterij „gotovo" (dolje) je namjerno uzak; sve iznad toga je bonus |
| Wallet `createAccount` ne stigne | srednja | feature-detect, legacy derivacija kao fallback |

---

## Kriterij „gotovo za GEF"

Ne sve iz Faze 1 — ovo:

1. Karta Hrvatske s elektranama, filtrirana, na mobitelu.
2. Jedan projekt kroz koji se može proklikati do ekrana potvrde.
3. Landing koji u 90 sekundi objasni model i **zašto nema provizije**.
4. Jasna, dostojanstvena oznaka da je riječ o prototipu.
5. Način da netko ostavi kontakt.

Sve ostalo je bonus.
