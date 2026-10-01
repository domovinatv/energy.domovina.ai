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

⚠️ Ulica i kućni broj su adrese privatne osobe. U javnom UI-ju stoji **samo mjesto**,
a točka na karti se zaokružuje na razinu naselja. Puna adresa ostaje u ovom
(privatnom) repou.

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

### Kako se projekt aktivira

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
     **odabrano za betu** (1.10.2026.): JEDAN IBAN Matijinog osobnog Monerium
     profila za sve tri elektrane. Opis plaćanja `gnosis:<safe>` Monerium koristi
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

Potpisnici (isti na svim Safeovima, tri MetaMaska u tri Chrome profila):
`0x4924…1944` ms-dom-energy-signer (stepanic.matija@gmail.com) ·
`0xF3c4…6FB8` ds-dom-energy-signer (domovinasync@gmail.com) ·
`0xC238…A24B` md-dom-energy-signer (mojadomovinatvojazemlja@gmail.com).

⚠️ Ime Safea u safe.global sadrži ulicu (`…-cig38a`). To ime je lokalno u
pregledniku i nije na lancu, ali se ne smije pojaviti u javnom UI-ju.

## 7. Otvoreno

- [ ] Potpisnici za svaki Safe (tko su druga dva, i ima li netko hardverski ključ)
- [ ] Izvođač po lokaciji — kandidat **SolarDei** za barem jednu (sastanak 2.10.2026.)
- [ ] Snaga i okvirni iznos po lokaciji (`goal_cents`) — iz ponude izvođača
- [ ] Faze isplate i postotci — dogovor s izvođačem
- [ ] Priključak HEP-ODS po lokaciji i rok
- [ ] Porezni tretman uplata osobno poznatih ljudi (dar fizičkoj osobi) — provjeriti
      prije prve tuđe uplate
- [ ] Hoće li se projekti vidjeti i na domovina.ai kao kampanje, ili samo na
      energy.domovina.ai
