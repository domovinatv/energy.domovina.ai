# 15 — Pravi projekti na vlastitim lokacijama

Odlučeno: **1.10.2026.** Status: **MVP stranica isporučena na `/beta/` (1.10.2026.); Safeovi se otvaraju.**

> **Jedna rečenica:** tri stvarne elektrane na lokacijama koje su Matijine,
> financirane **njegovim novcem i novcem osobno poznatih ljudi**, kroz potpuno isti
> javni tok kao `/c/domovina-tv/doniraj` (SEPA → Monerium → EURe → Safe → izvođač po
> fazama). Nema javnog prikupljanja.

---

## 1. Zašto

Prototip ([11](./11-plan-izvedbe.md) Faza 1) prikazuje tok novca na izmišljenim
podacima. To je dovoljno za objasniti model, ali ne i za dokazati ga. Tri prava
projekta daju:

- stvarne uplate, stvaran Safe multisig i stvarne isplate po situacijama, provjerive
  na Gnosisscanu bez prijave;
- referencu za izvođača ([14](./14-poslovni-model.md) §5.1 primijenjen u praksi);
- vezu s infrastrukturom: na sve tri lokacije radi **Gnosis node**, na istom lancu
  na kojem se kreću EURe i ugovori koje projekt koristi.

## 2. Lokacije

| # | Mjesto | Poštanski broj | Napomena |
|---|---|---|---|
| L1 | Lukavec (Ciglenice 38A) | 10412 | Gnosis node |
| L2 | Donja Lomnica (Školska 5) | 10412 | Gnosis node |
| L3 | Rab (Barbat 697) | 51280 | Gnosis node |

**Puna adresa se prikazuje javno na `/beta/`** — odluka vlasnika 1.10.2026.
(ranije je pravilo bilo „samo mjesto"). Ime Safea u safe.global i dalje ne treba
dijeliti.

| Lokacija | Snaga | Cilj kampanje |
|---|---|---|
| Lukavec | 16 kW | 11.200 € |
| Donja Lomnica | 2 × 10 kW | 15.500 € |
| Rab | 8 kW | 6.500 € |

Ciljevi su procjena vlasnika (1.10.2026.), ne ponuda izvođača.

## 3. Odluka: tko uplaćuje

| Opcija | Odluka | Razlog |
|---|---|---|
| **Vlasnik lokacije + osobno poznati** | ✅ **odabrano** | nema javne ponude ni javnog prikupljanja; izvedivo odmah |
| Javnost, kao donacija | ❌ ne sada | elektrana je imovina fizičke osobe: to nije nijedan od tri čista slučaja iz [14](./14-poslovni-model.md) §2.2 (predujam, zadružni udjel, dar ustanovi). Traži pravno i porezno mišljenje |

Ako se javnost ikad uključi, to ide **novom odlukom** u ovom dokumentu, ne
proširenjem postojeće kampanje.

## 4. Tehnički put (iz pregleda postojećeg raila, 1.10.2026.)

Sve postoji; novi kod treba samo za prikaz na energy.domovina.ai.

| Korak | Kako | Izvor |
|---|---|---|
| 1. Safe po lokaciji | ručno na app.safe.global, **2-od-3**, Gnosis Chain. `Domovina.createAccount` (SDK 0.10) zna samo 1-od-2, a proizvoljni owneri/prag su tek nacrt | `pay.domovina.ai/wallet/public/sdk.js`, `docs/plans/advanced-safe-initialization.md` |
| 2. Kampanja | red u `pinka_finance.campaigns` (`slug`, `title`, `goal_cents`, `destination_address` = Safe) | `domovina-api/supabase/migrations/20260530120100_pinka_finance_schema.sql` |
| 3. Whitelist | `POST /admin/api/tenants/:id/campaigns` na pay.domovina.ai; bez toga intent vraća `target_not_whitelisted` | `pay.domovina.ai/backend/src/tenants/admin.ts` |
| 4. Uplata | SEPA na zajednički Monerium IBAN tenanta s memom `mpt:<safe>`, ili EURe izravno na Safe (EIP-681 QR) | `domovina-api/docs/pinka-donation-rails.md` |
| 5. Prikaz | na energy.domovina.ai iz preglednika: saldo `balanceOf` na EURe `0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430` (chain 100), dolazne uplate iz Transfer logova `to = safe`, bez prijelaza s rail Safea `0x449aBCEf…` | `domovina.ai/lib/pinka_sdk/src/util/pinka_onchain.dart`, `pay.domovina.ai/wallet/src/lib/activity.ts` |
| 6. Isplata | izvođaču po situaciji, prijedlog transakcije u Safeu, dva potpisa | [14](./14-poslovni-model.md) §5.1 |

**Nema IBAN-a po Safeu.** Svi koriste IBAN tenanta, usmjeravanje radi memo. Vlastiti
IBAN po projektu bio bi zaseban tenant s vlastitim Monerium računom — nije potreban.

## 5. Što to traži od ovog repoa

- **`demo: false` zapisi.** Pravilo 3 iz `CLAUDE.md` vrijedi za mock; tri prava
  projekta su prvi zapisi koji **nisu** demo. UI ih mora razlikovati: vlastita
  oznaka („Stvaran projekt — financira ga vlasnik lokacije") i stvarni Gnosisscan
  link, a demo traka na vrhu ne smije sugerirati da je i ovo izmišljeno.
- **CSP:** `connect-src` += `https://rpc.gnosischain.com` u `public/_headers`
  ([12](./12-ime-domena-okruzenja.md) §7). Ako se čita zid podrške iz Pinke, još i
  Supabase domena.
- **Razdvajanje okruženja.** [12](./12-ime-domena-okruzenja.md) §2.2 kaže da je pravi
  novac na pravom Safeu okidač za razdvajanje. Ovdje se novac ne prikuplja kroz naš
  kod (rail je pay.domovina.ai, a mi samo čitamo lanac), pa razdvajanje **nije
  nužno** dok stranica samo prikazuje. Postaje nužno čim stranica počne pokretati
  uplate.
- **Sukob interesa.** Pravilo „naš potpisnik nikad nije većina" štiti uplatitelje od
  izvođača. Ovdje je vlasnik lokacije ujedno i najveći uplatitelj, pa je njegov
  potpis prirodan; **izvođač ne smije biti potpisnik**.

## 6. Beta MVP — `energy.domovina.ai/beta/` (1.10.2026.)

**Odluka o URL-u:** isti Worker, ista domena, put `/beta/`. Prototip ostaje na
`/` netaknut. Razlog: jedan build i jedan deploy, a odvajanje od makete radi
**route group** — `app/(prototip)/layout.tsx` nosi demo traku, `app/beta/layout.tsx`
nosi traku „Stvarni projekti". Root layout drži samo fontove i i18n. Poddomena je
odbačena jer bi tražila drugi build ili Worker koji prepisuje putanje, a
`*.energy.domovina.ai` nije pokriven univerzalnim certifikatom.

**Nema baze, nema prijave, nema našeg backenda.** Sve što stranica zna stoji u
`lib/beta-projects.ts` (statično) ili se čita s lanca (`lib/beta-chain.ts`,
gnosisscan.io/api/v2). QR kod za uplatu (EPC069-12, isti raspored kao
pay.domovina.ai `intents/epc.ts`) radi se pri buildu.

### Uplata = MPT payment intent (odluka 2.10.2026.)

Jedini način uplate na `/beta/` je **provjereni MPT tok** iz pay.domovina.ai, kojim
se mjesecima procesuiraju uplate: odabir iznosa → `POST mpt.domovina.ai/api/intents`
(`target_address` = Safe elektrane) → rail checkout (`/checkout/<sid>`) s jedinstvenim
EPC QR-om (`mpt:<safe>?sid=<sid>`, iznos u QR-u) → potvrda čim Monerium zaprimi
SEPA → forward na Safe. Svaka uplata je vidljiva na `mpt.domovina.ai/admin/intents`.

Statični opisi (`gnosis:<safe>`, `cmp:`) i vlastiti EPC generator izbačeni su iz
koda: bez intenta nema obavijesti uplatitelju ni zapisa u adminu.

**Checkout je ugrađen u `/beta/`** (2.10.2026., `components/beta/intent-panel.tsx`),
ne preusmjerava se na mpt.domovina.ai — isti obrazac kao domovina.ai/c/…/support.
Ponašanje preslikano iz rail checkouta (`backend/src/checkout/page.ts`): QR iz
railova `epc_qr_data` (≥ 316 px na 414 px ekranu, tiha zona 4, ECC M), `GET
status_url` svake 2 s (SSE `/stream` je na railu rezerviran → 404), „uplata je
stigla" na `received_processing`, kraj na `settled` / `rejected` / `expired`.

**Euro stiže odmah, EURe kasni (2.10.2026.).** SEPA je trenutna, ali prvu uplatu
s novog IBAN-a Monerium zna držati na provjeri satima prije minta. Zato se uplata
pribraja kampanji na `received_processing`, ne na lancu:
- iznos se odmah doda „Uplaćeno ukupno" i traci (animacija, „+X upravo stiglo");
- uz rail `status.review_expected` stoji napomena da provjera prve uplate može
  trajati od minuta do sati — bez riječi „AML" (pravilo iskrenosti iz rail `stage.ts`);
- zaprimljena uplata je u `localStorage` (`lib/pending-store.ts`) i preživljava
  osvježavanje; `PendingWatcher` prati intent dok rail ne javi hash forwarda, a
  `rejected`/`expired` je briše. Kad se forward pojavi na lancu, više se ne broji.

⚠️ Ovo vidi **samo uplatitelj** u svom pregledniku. Da bi zaprimljene, a još
nemintane uplate vidjeli svi posjetitelji, rail treba **javni zbroj po Safeu**
(npr. `GET /api/intents/summary?target=` — iznos i broj, bez osobnih podataka).
To je izmjena u pay.domovina.ai.

Preduvjeti na railu (pay.domovina.ai):
1. ✅ `https://energy.domovina.ai` u `ALLOWED_ORIGINS` — pay.domovina.ai `a0507c6`,
   deploy `da5b8e9e` (2.10.2026.). Preflight provjeren; ostali originsi nepromijenjeni.
2. ✅ Tri kampanje registrirane 2.10.2026. (tab **Whitelist** → „Kampanje (cmp: QR)"):
   `dom-energy-stepanic-lukavec-cig38a`, `dom-energy-stepanic-lomnica-sko5`,
   `dom-energy-stepanic-rab-bar697`. Intent za Lukavec (1 €, `byqntwtnu75p`)
   stvoren s `/beta/` i otvoren rail checkout — provjereno na produkciji.
   Registracija kampanje ujedno stavlja Safe na whitelist (`tenants/admin.ts:147`).
   Bez registracije intent vraća 403 `target_not_whitelisted` i `/beta/` to javlja.



U `lib/beta-projects.ts`, za lokaciju:

1. `safe` — adresa Safea (nulta adresa i `null` = „u pripremi", bez upute za uplatu).
   Safe se radi na **app.safe.global** (Gnosis Chain, 2-od-3, vlasnici su tri
   MetaMaska), **ne** offline derivacijom iz pay.domovina.ai: nedeployan Safe se
   ne može uvesti u safe.global ni povezati s Moneriumom, a novac na nedeployanoj
   adresi je točno zamka iz postmortema 0001 (pay.domovina.ai).
   `signers` — `{ owners, threshold }` kakve očekujemo; bez toga projekt nije
   naplativ. `npm run deploy` (`scripts/check-beta.mts`) čita lanac i ruši deploy
   ako Safe nije deployan ili se vlasnici/prag ne slažu.
2. `payment` — jedan od dva puta:
   - `{ kind: "monerium", routing: "reference", iban, beneficiaryName, bic }` —
     **odabrano za betu** (1.10.2026.): JEDAN IBAN za sve tri elektrane. U praksi
     je to **Business profil ITalk d.o.o.** (`EE70 7777 0001 6292 1128`, BIC
     `LHVBEE22`) — isti IBAN koji koristi pay.domovina.ai rail. Opis plaćanja `gnosis:<safe>` Monerium koristi
     za usmjeravanje na taj Safe (help.monerium.com/article/14-redirect-incoming-payments).
     Uvjet: svaki Safe mora biti **povezan s profilom**. Uplata bez točnog opisa
     završi na adresi na koju je IBAN vezan.
   - `{ kind: "monerium", routing: "iban", … }` — IBAN vezan baš za taj Safe.
   - `{ kind: "rail", campaignId, iban, beneficiaryName, bic }` — kao donacije
     podcastima; kampanja mora biti registrirana na pay.domovina.ai
     (`POST /admin/api/tenants/:id/campaigns`).
3. `goalCents` — kad stigne ponuda izvođača; do tada „—".
4. `npm run deploy` = verify + `check:beta` (Safe na lancu; za `rail` i registracija
   na railu — IBAN, primatelj, opis plaćanja) + `wrangler deploy`.

⚠️ **Kod `rail` puta primatelj na nalogu je ITalk d.o.o.**, pa tvrdnja „novac ne
prolazi kroz nas" tamo nije točna — rail ga prosljeđuje. Copy zato kaže samo da
nitko od nas ne drži ključeve Safea, a uz rail upute stoji da je primatelj
operater raila. Kod `monerium` puta primatelj je vlasnik Safea.

### Otvoreni Safeovi

| Lokacija | Safe (Gnosis Chain) | Prag | Otvoren |
|---|---|---|---|
| Lukavec | `0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173` | 2-od-3 | 1.10.2026. |
| Donja Lomnica | `0x52eaB439F021111A5280fdCF682D1777428578fa` | 2-od-3 | 1.10.2026. |
| Rab | `0x7CA5E2Dcd81Aa54bC2f8ee16a1D313734D314F05` | 2-od-3 | 1.10.2026. |

Potpisnici (isti na svim Safeovima, tri MetaMaska u tri Chrome profila):
`0x4924…1944` ms-dom-energy-signer (stepanic.matija@gmail.com) ·
`0xF3c4…6FB8` ds-dom-energy-signer (domovinasync@gmail.com) ·
`0xC238…A24B` md-dom-energy-signer (mojadomovinatvojazemlja@gmail.com).

⚠️ Ime Safea u safe.global sadrži ulicu (`…-cig38a`). To ime je lokalno u
pregledniku i nije na lancu, ali se ne smije pojaviti u javnom UI-ju.

### Detekcija uplate — tri puta (odluka 1.10.2026.)

| Put | Stanje | Za | Protiv |
|---|---|---|---|
| **1. Stranica čita lanac** svakih 20 s dok je kartica vidljiva | ✅ **isporučeno** | vidi sve uplate; isti izvor kao Gnosisscan; samo ovaj repo | radi samo dok netko gleda; ovisi o gnosisscan API-ju |
| **2. Rail bilježi izravni Monerium mint** (`pay.domovina.ai`): nalog čija je adresa registrirani Safe kampanje = doprinos, bez forwarda | sljedeće, PR u pay.domovina.ai | webhook već stiže; instant, bez gasa; zapis + obavijest; nestaje lažni `unroutable_prefix` alert | samo SEPA; kritičan kod za novac; ime uplatitelja ne smije na stranicu bez privole |
| **3. Vlastiti node + listener** (`domovina-gnosis-node`) | kad node proradi | sve uplate iz bloka, bez trećih strana | node nije pokrenut; jedna mašina = treba rezervni RPC i backfill |

**Put 1 nije dovoljan za UX uplate (Matija, 1.10.2026.).** Monerium prvu uplatu s
novog IBAN-a zna držati na provjeri **do 8 sati** prije minta, a upravo kod prve
uplate uplatitelj treba brz odgovor. Lanac to ne vidi dok mint ne prođe.
Cilj je UX kao kartica na POS terminalu: „novac je stigao" za nekoliko sekundi.

### Plan: payment intent s izravnim mintom (sljedeća sesija)

Što već postoji u `pay.domovina.ai/backend`:
- `POST /api/intents` (`intents/api.ts:40`) — javan; `target_address` + `amount_eur`
  → `sid`, EPC podaci, `status_stream_url` (SSE).
- `intents/stage.ts` — faza **`received_processing`** = Monerium je primio SEPA, EURe
  još nije mintan. To je trenutak „novac je stigao", neovisno o 8-satnoj provjeri.
- `monerium/sid.ts` — već predviđa memo `gnosis:0x<safe>?sid=<id>` (i rezervu
  `gnosis:0x<safe> sid:<id>`), uz napomenu da se ne zna prihvaća li ga Monerium.

**Korak 0 je već odgovoren — `gnosis:<safe>?sid=` NE radi.** Pokus 21.5.2026.
(pay.domovina.ai, sesija 9d6bbc54 05:25–05:27, commit `5da275d`): memo
`gnosis:0x6693…d65e?sid.dz4hhkkqsp` → Monerium radi **exact match** na cijeli opis,
pa je EURe mintan na **zadani** wallet profila, ne na adresu iz opisa. Zato
postoji `mpt-main-rail` (`0x449a…`) i `mpt:<safe>?sid=` s forwardom.

**Nije dokazano ni u jednom smjeru:** radi li **čisti** `gnosis:<safe>` (bez
nastavka) za povezani Safe koji nije zadani wallet. Za: Monerium UI to nudi,
`pay.domovina.ai/docs/monerium-private.md:232,429`. Protiv: Matijino sjećanje
(„ne radi za druge wallete"). `/beta/` koristi upravo taj oblik — **test od 1 €
s čistim opisom prije nego link ode ikome**; ako EURe završi na `mpt-main-rail`,
`/beta/` daje krivu uputu i prelazi na `mpt:`.

| | A. Intent preko raila (`mpt:`) | B. Izravni mint + uparivanje po iznosu |
|---|---|---|
| Opis plaćanja | `mpt:<safe>?sid=` | čisti `gnosis:<safe>` |
| Instant „novac je stigao" | da, radi danas | da, ako `pending` webhook nosi adresu i iznos (payload 21.5. ih nosi) |
| Uparivanje | točno, po `sid` | (Safe, točan iznos) u TTL-u; jedinstvenost centima (10,03 €) |
| Gas / forward | da | ne |
| ToS rizik | nema dok su Safeovi na ITalk profilu (§7); za tuđe Safeove §16 + §17 | isto |
| Ovisi o | ničemu novom | tome da čisti `gnosis:` radi |

**Ne** preusmjeravati na `cmp:` samo radi detekcije: gas za forward i vraća se
hold-and-forward korak koji je rizičniji dio raila po Monerium ToS §17.

### Plan: push umjesto pollinga (odluka 2.10.2026., nije izvedeno)

Danas: intent se čita svake 2 s, lanac (gnosisscan) svakih 20 s + 3 s i 8 s nakon
forwarda. Za betu nije opterećenje (~6 upita / 20 s po posjetitelju, samo vidljiva
kartica) — push je dobitak u brzini i osjećaju.

| Korak | Gdje | Što daje |
|---|---|---|
| **1. SSE za intente** — `/api/intents/:sid/stream` je na railu već rezerviran (danas 404) | pay.domovina.ai | „euro je stigao" u trenutku Monerium webhooka, bez čitanja svake 2 s. Najmanje posla, najveći učinak |
| **2. Node listener → Worker → kanal po Safeu** — `eth_subscribe` na EURe Transfer prema Safeovima; potpisani eventi Cloudflare Workeru; Durable Object drži WebSocket/SSE kanal po Safeu | domovina-gnosis-node (+ Worker) | popis i saldo osvježeni u bloku (~5 s), bez čekanja gnosisscan indeksa |
| **3. Polling ostaje kao rezerva**, rjeđe (npr. 60 s) | energy.domovina.ai | node je jedna mašina — nestanak struje/mreže ne smije zaustaviti prikaz |

Node **ne vidi** trenutak „euro je stigao" (to je Monerium webhook, ne lanac), pa
korak 1 ne zamjenjuje korak 2 ni obrnuto. Preglednik se nikad ne spaja izravno
na node (MacBook iza tunela, RPC Worker nije napisan).

## 7. Otvoreno

- [x] **Monerium Business ToS §16 — za `/beta/` nije prepreka** (Matija,
      2.10.2026., provjereno na monerium.app). §16 zabranjuje primiti uplatu
      kupca i e-novac **proslijediti tom istom kupcu** (front/reseller, vidi
      `pay.domovina.ai/docs/compliance/INTERNO-monerium-tos-analiza.md`). Ovdje
      ITalk prima uplate za **vlastite** elektrane, a novac ostaje na adresama
      **istog** ITalk profila: `mpt-main-rail` (`0x449a…Af2e`, jedina s IBAN-om)
      i sva tri Safea (`dom-energy-stepanic-lukavec-cig38a`, `…-lomnica-sko5`,
      `…-rab-bar697`) navedeni su pod Wallets na profilu ITalk d.o.o. Forward
      rail → Safe je prijenos između vlastitih adresa, ne isplata trećem.
      Isplata radi: 2.10. 00:51 redeem −2 € sa Safea Donja Lomnica na HR IBAN,
      Completed. Tvrdnja vrijedi dok su Safeovi ITalkovi; za Mod 2 (tuđi
      Safe/profil) i za rail donacija podcastima §16 ostaje otvoren.
      Mail Moneriumu s linkom na `/beta/` (nastavak niti od 28.9., partners@ +
      cc support@ i hello@italk.hr) — skica u Gmailu 2.10.2026., čeka slanje.
- [ ] **Monerium računi (2.10.2026.):** e-mail za prijavu na Business profil
      ITalk d.o.o. promijenjen je u `hello@italk.hr`. Matija otvara **zaseban
      osobni** profil na `stepanic.matija@gmail.com`. Ako se Safeovi elektrana
      ikad prebace na osobni profil (vidi „Čije su elektrane?" niže), zaključak o
      §16 iznad ne vrijedi automatski — provjeriti ponovno.
- [ ] ⚠️ **Čije su elektrane?** EURe na Safeovima povezanima s ITalk-ovim
      profilom su e-novac ITalka, a lokacije su Matijine. Ili su elektrane
      imovina ITalka (izvedba na tuđem krovu), ili Safeovi trebaju biti na
      osobnom Monerium profilu. Pitanje za knjigovođu prije prve veće uplate.
      Isto vrijedi za isplatu: redeem sa Safea na Matijin osobni IBAN (test
      −2 €, 2.10.) knjigovodstveno je isplata ITalka Matiji.
- [ ] Rail (`pay.domovina.ai`) vidi i ove Monerium naloge: `gnosis:` opis mu je
      `unroutable_prefix` → `park` + alert. Novac nije u rail Safeu pa nema što
      parkirati, ali alert je šum. Provjeriti na test uplati od 1 €.

- [ ] Potpisnici za svaki Safe (tko su druga dva, i ima li netko hardverski ključ)
- [ ] Izvođač po lokaciji — kandidat **SolarDei** za barem jednu (sastanak 2.10.2026.)
- [ ] Snaga i okvirni iznos po lokaciji (`goal_cents`) — iz ponude izvođača
- [ ] Faze isplate i postotci — dogovor s izvođačem
- [ ] Priključak HEP-ODS po lokaciji i rok
- [ ] Porezni tretman uplata osobno poznatih ljudi (dar fizičkoj osobi) — provjeriti
      prije prve tuđe uplate
- [ ] Hoće li se projekti vidjeti i na domovina.ai kao kampanje, ili samo na
      energy.domovina.ai
