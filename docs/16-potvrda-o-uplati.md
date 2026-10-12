# 16 — Potvrda o uplati (rail ADR 0022) u beta toku plaćanja

**Stanje 12. 10. 2026. (navečer):** izvedeno i **live za sve** (bez zastavice, §4). Test s pravim
novcem prošao: potvrda `r1dbxtrxtdnn8rcnzgu5bz8b6g` = 1 izravna + 73 naknadne uplate (80,93 €).
Neovisna provjera je na `/beta/provjera/` (§7). Zamke i tijek izvedbe: dnevnik izvedbe §17.
Prvo sidro (seq 1) provjereno na stvarnim podacima osim Bitcoin koraka, koji čeka atestaciju.

Izvor istine za kriptografiju i pravila je rail:

- `pay.domovina.ai/docs/decisions/0022-potvrda-o-uplati-vezana-uz-kljuc-uplatitelja.md`: model,
  matrica kad se potvrda izdaje, naknadno (lazy) izdavanje po IBAN-u
- `pay.domovina.ai/docs/decisions/0023-potvrde-nadogradnja-iz-maksimir-glasanja.md`: sljedeći
  korak (24 riječi + passkey umjesto ključa u `localStorage`), još Proposed
- `pay.domovina.ai/backend/src/receipts/`: `sid.ts` (izvođenje), `api.ts` (API),
  `client/main.ts` (referentni preglednički klijent, stranica `mpt.domovina.ai/potvrda/:sid`)

## 1. Što potvrda jest

Uplatitelj kod plaćanja dobije **potvrdu koja dokazuje da je baš on platio**, bez računa i bez
prijave. Na temelju nje se u budućnosti mogu tražiti prava (npr. tokeni ili udio). Dokaz:

- preglednik **prije plaćanja** napravi tajni ključ i salt, a iz njih izvede referencu plaćanja
  (`sid` oblika `r1` + 24 znaka);
- uplatitelj taj `sid` sam pošalje u opisu naloga (EPC QR ga već nosi u `memo`), pa ga nitko
  naknadno ne može vezati uz drugi ključ;
- kad uplata stigne na Safe elektrane, rail izda **izravnu potvrdu**. Ranije uplate s **istog
  IBAN-a** koje nisu imale potvrdu (npr. tri uplate bez potvrde, četvrta s potvrdom) postaju
  potvrđene **naknadno**, sve na istoj potvrdi;
- potvrda se sidri u dnevni Merkle korijen, žigosan na Bitcoinu (OpenTimestamps).

## 2. Zašto ovdje, a ne preusmjeravanjem na `mpt.domovina.ai/potvrda`

Ključ živi u `localStorage` **origina koji ga je napravio**. Rail već ima vlastiti tok
(`mpt.domovina.ai/potvrda/nova/:sid` → checkout na `mpt.`), ali bi uplatitelja odveo s našeg
beta UI-ja na railov checkout i ključ ostavio na drugom originu. Zato tok mora biti **nativno u
energyju**: ključ, `sid`, QR i stranica potvrde na `energy.domovina.ai`.

Datoteka ključa je **isti format** kao na railovoj stranici, pa se ključ izvezen ovdje može uvesti
na `mpt.domovina.ai/potvrda/<sid>` i obrnuto.

## 3. Ugovor s railom (već live)

Svi pozivi idu na `RAIL_API_BASE` (`https://mpt.domovina.ai/api/intents`). CORS za
`energy.domovina.ai` i CSP `connect-src https://mpt.domovina.ai` već postoje, pa ništa ne treba
mijenjati.

### 3.1 Izvođenje `sid`-a (mora biti bajt-identično railu)

```
owner  = adresa (secp256k1) ključa uplatitelja, checksummed
salt   = 16 nasumičnih bajtova (0x + 32 hex)
digest = keccak256( utf8("MPT-RECEIPT-v1") ‖ owner (20 B) ‖ salt (16 B) )
sid    = "r1" + base32(digest)[0:24]
         abeceda "abcdefghijkmnpqrstuvwxyz23456789", 5 bita po znaku, MSB prvo
```

**Zlatni vektor** (mora ga dati i naš test):

| | |
|---|---|
| privatni ključ | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| owner | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| salt | `0x000102030405060708090a0b0c0d0e0f` |
| **sid** | **`r183ns4pcpn659hd2z3xtaqiwq`** |

Kod: kopirati `pay.domovina.ai/backend/src/receipts/sid.ts` (≈80 linija, ovisi samo o `viem`) u
`lib/receipt-sid.ts`, uz komentar s izvorom i commitom. Nikad ne pisati vlastitu varijantu.

⚠️ Kopirati verziju **s ispravkom iz pay.domovina.ai grane `feat/receipts-0023-faze-1-3`**
(12. 10. 2026.). Prva verzija je `viem.concat` davala mješavinu `Uint8Array` i hex stringova,
pa su slova a–f adrese i salta postajala 0. Ispravno: sva tri dijela kao bajtovi
(`hexToBytes`), ukupno 50 bajtova. Gornji vektor je ispravan i isti u Python verifikatoru
(`pay.domovina.ai/scripts/mpt_receipt_verify.py`).

### 3.2 Stvaranje intenta s potvrdom

Isti `POST /api/intents` kao danas, uz polje `sid`:

```json
{ "target_address": "0x4f7f…0173", "amount_eur": "1.00", "sid": "r1…" }
```

- `201`/`200` + isti JSON kao danas; `memo` sadrži `?sid=r1…`, `epc_qr_data` ga nosi.
- `409 {"error":"sid_already_exists"}` → napravi novi ključ i pokušaj još jednom.
- Ključ se **sprema prije** POST-a: uplata nikad ne smije nadživjeti svoj ključ.

### 3.3 Dohvat potvrde

- `GET /api/intents/:sid/receipt`: javno, samo **izravna** uplata.
- `POST /api/intents/:sid/receipt`: vlasnik, uključuje i **naknadne** uplate.

  ```json
  { "owner": "0x…", "salt": "0x…", "ts": 1791800000, "signature": "0x…" }
  ```

  `signature` = EIP-191 `personal_sign` ključem uplatitelja nad porukom (točno, s `\n`):

  ```
  MPT potvrda o uplati
  sid: <sid>
  vrijeme: <ts>
  ```

  `ts` je unix sekunde i smije odstupati najviše 300 s. Greške: `403 owner_does_not_match_sid`,
  `403 stale_signature`, `403 bad_signature`, `404 not_receipt_sid`, `404 intent_not_found`.

Odgovor (oba poziva):

```ts
{
  version: "mpt-receipt-v1"; sid: string; chain_id: 100;
  status: "issued" | "awaiting_payment" | "settling" | "unbound_stray" | `not_delivered:${string}`;
  intent: { amount_cents; currency; label; target_address; tenant_id; created_at; paid_at };
  forward_tx_hash: string | null;
  payment_registry: string | null;          // danas null: PaymentRegistry nije deployan
  payments: Array<{
    kind: "direct" | "lazy"; order_id; tx_hash: string | null; amount_cents; placed_at: string | null;
    leaf_hash; anchor: null | { anchor_id; root; proof: string[]; ots_available: boolean; anchored_at };
  }>;
  lazy_included: boolean;
  owner?: string; salt?: string;            // samo u POST odgovoru
}
```

| `status` | Tekst za korisnika |
|---|---|
| `awaiting_payment` | Uplata još nije stigla. |
| `settling` | Uplata je stigla i prosljeđuje se. Potvrda nastaje za minutu. |
| `issued` | Potvrda je izdana (prikaži retke). |
| `unbound_stray` | Uplata je stigla bez reference u opisu, pa nije vezana uz ključ. Pokrit će je sljedeća uplata s potvrdom s istog IBAN-a. |
| `not_delivered:*` | Uplata nije isporučena; javi se podršci. |

`anchor === null` znači „čeka sidrenje". Sidro nastaje u 00:00 UTC; `.ots` je
`https://mpt.domovina.ai/api/receipts/anchors/<anchor_id>.ots`.

## 4. Što napraviti u ovom repou

Prvo je išlo iza zastavice `?potvrda=1` (pravilo iz `docs/12` §2.1). **Odluka 12. 10. 2026.:** zastavica
je uklonjena, „Želim potvrdu o uplati" je **uvijek prikazano i uključeno po zadanom** (uplatitelj ga
može isključiti). Nakon stvaranja intenta piše da ključ postoji samo u tom pregledniku, lokalno, i
nije poslan ni spremljen nigdje drugdje.

| # | Datoteka | Što |
|---|---|---|
| 1 | `package.json` | dodati `viem` (koristi se samo `viem/accounts` i `keccak256`/`concat`; provjeriti veličinu bundlea u `npm run build`) |
| 2 | `lib/receipt-sid.ts` | kopija railovog `sid.ts` + test sa zlatnim vektorom iz §3.1 |
| 3 | `lib/receipt-keys.ts` | `newReceiptKey()` → `{ v:1, sid, owner, salt, pk, created_at }`; `localStorage` ključ `mpt-receipt:<sid>` (isti kao rail); `exportKey`, `importKey` (provjera `sid == derive(owner(pk), salt)`); enkripcija lozinkom **istim parametrima kao rail** (PBKDF2-SHA256 310 000, AES-GCM, `{ encrypted_key: "<json>" }`). Napisati iza sučelja, jer ga ADR 0023 zamjenjuje glavnim ključem iz 24 riječi i passkeyja. |
| 4 | `lib/mpt-intent.ts` | `createPaymentIntent(target, amount, { receiptSid })` šalje `sid`; obrada `409` |
| 5 | `lib/receipt-api.ts` | `fetchReceipt(sid, key?)`: potpis + POST, ili GET bez ključa; tipovi iz §3.3; mapiranje `status` → tekst |
| 6 | `components/beta/intent-panel.tsx` | prekidač „Želim potvrdu o uplati" prije prikaza QR-a; nakon stvaranja ponuda „Preuzmi rezervnu kopiju ključa"; kad `isReceived`/`settled`, gumb „Potvrda o uplati" → `/beta/potvrda/?sid=…` |
| 7 | `app/beta/potvrda/page.tsx` | stranica potvrde (statički export, pa `sid` iz query parametra, ne dinamička ruta): učitaj ključ, potpiši, prikaži retke (izravna/naknadna), ukupno, upute za provjeru, kanonski JSON, QR (`sid`, `owner`, `salt`), poveznice na `.ots`; „Preuzmi PDF" (**PDF generiran u pregledniku**, `lib/receipt-pdf.ts`: pdf-lib + fontkit, fontovi stranice Inter i Fraunces ugrađeni iz `public/fonts/`, bez dijaloga za ispis; u PDF ide samo javni dio, ne ključ. Inter se ugrađuje cijeli jer podskup u `@pdf-lib/fontkit` gubi glifove — odluka 12. 10. 2026.), „Preuzmi potvrdu (JSON)", uvoz ključa iz datoteke. Predložak teksta i rasporeda je railov `client/main.ts`. |
| 8 | `lib/__tests__/` | izvođenje (vektor), spremanje/uvoz/enkripcija ključa, `createPaymentIntent` šalje `sid` i radi `409`, mapiranje statusa |

### 4.1 Rubni slučajevi koje UI mora pokriti

- **HUB3 (barkod uplatnice, Aircash):** HUB3 opis **ne nosi `sid`**, pa uplata preko barkoda
  nikad ne dobiva izravnu potvrdu. U modu s potvrdom sakrij HUB3 karticu, ili jasno napiši:
  „Uplatnica nema potvrdu; dobit ćete je naknadno kad jednom platite QR-om s istog računa."
- **Privatni način / blokiran `localStorage`:** `saveKey` ne uspije → prije QR-a obavezno
  preuzimanje datoteke ključa.
- **QR skeniran mobitelom, nalog s drugog uređaja:** u redu, ključ ostaje u pregledniku gdje je
  intent nastao. Tekst: „Potvrdu preuzmite na ovom uređaju."
- **Intent istekne bez uplate:** ključ ostaje u `localStorage`; stranica potvrde pokaže
  `awaiting_payment`. Ne brisati ključeve automatski.
- **Ključ = pravo:** uz preuzimanje i dio B potvrde uvijek upozorenje „Tko ima ovaj ključ, ima i
  pravo iz potvrde."
- **Rok sidrenja:** prvih do 24 h retci su „čeka sidrenje"; to nije greška.
- **Prikupljeno na projektu (`pending-payments.ts`):** ne mijenja se; potvrda je zaseban sloj.

### 4.2 Copy

Riječi: „potvrda o uplati", „ključ potvrde", „naknadno potvrđeno (isti IBAN)". Ne koristiti
„NFT", „token" ni „crowdfunding" (`docs/01` §1.1, `lint:copy`). Ime platforme preko
`lib/brand.ts`.

## 5. Test na produkciji (1 €)

1. ~~Zastavica uključena samo za sebe~~ — od 12. 10. potvrda je uključena za sve (§4).
2. Lukavec (`0x4f7f…0173`), 1 €, „Želim potvrdu", preuzmi ključ, plati iz Revoluta skenom QR-a.
3. U opisu naloga mora pisati cijeli `sid` od 26 znakova (glavna nepoznanica, rail ADR 0022,
   otvoreno pitanje 1).
4. Nakon `settled` → „Potvrda o uplati" → status `issued`, redak „Izravna". Ako si s istog IBAN-a
   ranije plaćao Lukavec, ti retci se pojave kao „Naknadna".
5. Sutra nakon 00:00 UTC: retci imaju sidro i `.ots`.
6. Javi `sid` u pay.domovina.ai sesiji radi provjere zapisa na railu.

## 6. Što ovaj repo NE rješava (rail strana)

- **Mod 2 / način `direct`** (tenant s vlastitim Monerium IBAN-om, referenca `gnosis:<safe> sid:…`):
  rail za njega još **ne izdaje izravnu potvrdu**, jer povezivanje traži referencu `mpt:`/`cmp:` i
  forward kroz rail. Beta danas ide preko defaultnog tenanta (`mpt:`), pa radi. Za Mod 2 treba
  doraditi rail (`receipts/link.ts`, `direct_settle` grana u `monerium/forward.ts`).
- `kind = rcpt1` na lancu čeka `PaymentRegistry` (`safe-tx/004`); potvrda ne ovisi o tome.
- 24 riječi + passkey, javni repo checkpointa i verifikator: rail ADR 0023.

## 7. Neovisna provjera potvrde (`/beta/provjera/`, 12. 10. 2026.)

Samostalna stranica na koju se učita PDF i/ili JSON potvrde i po želji ključ (otvoren ili
zaključan lozinkom). Sve radi u pregledniku; datoteke se ne šalju nikamo.

| # | Korak | Kako |
|---|---|---|
| 1 | oblik | `version = mpt-receipt-v1`, `chain_id = 100` |
| 2 | sid | `deriveReceiptSid(owner, salt)` (§3.1) |
| 3 | ključ | adresa iz `pk` = vlasnik, sid iz ključa = sid, potpis nasumične poruke vraća adresu |
| 4 | listovi | rail `leafHash` (abi.encode domena, sid, keccak256(order_id), tx, iznos) |
| 5 | Merkle | sortirani parovi keccak256 do `anchor.root` |
| 6 | chain_head | rail `chainHead` (ADR 0023 §2) |
| 7 | checkpoint | isti `chain_head` u `github.com/domovinatv/mpt-receipts-checkpoints` (raw.githubusercontent.com) |
| 8 | OTS | `.ots` žigosa sha256(chain_head); stablo se ponovno računa do Bitcoin atestacije |
| 9 | Bitcoin | header bloka s mempool.space i blockstream.info (moraju se slagati), merkle root = rezultat dokaza, vrijeme ≤ 48 h od sidra |
| 10 | Gnosis | `eth_getTransactionReceipt`: uspjela i nosi EURe `Transfer` točnog iznosa primatelju |

Formule su kopije raila (`lib/receipt-verify.ts`), a test ih uspoređuje s vrijednostima koje je
izračunao railov kod. Mrežni izvori (7–10) namjerno nisu rail; svi su u CSP-u (`connect-src`).
Koraci 5–9 su „čeka" dok redak nije sidren (00:00 UTC) i dok Bitcoin ne atestira; to nije pad.

**PDF potvrde nosi kanonski JSON kao privitak** (`mpt-potvrda-<sid>.json`), pa je ista datoteka
ispisiva i strojno provjerljiva. PDF napravljen prije 12. 10. 2026. privitka nema: preuzeti ponovno.
Izvještaj o provjeri preuzima se kao PDF (s privicima: izvještaj u JSON-u i točni bajtovi potvrde)
ili kao JSON (`domovina-energy-receipt-verify-v1`).

**Datoteka ključa** se zove `mpt-kljuc-<sid>-otkljucan-<YYYYMMDD-HHMMSS>.json` ili
`…-zakljucan-…`, pa nijedno preuzimanje ne prepiše drugo, a otključana i zaključana kopija se
ne zamijene. Railov uvoz čita bilo koje ime.
