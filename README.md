# domovina.energy

**P2P platforma za zajedničko financiranje i suvlasništvo sunčanih elektrana u
Hrvatskoj.** Ne uzimamo postotak od prikupljenog — zarađujemo kao izvođač koji
elektranu gradi, a trošak izvedbe je javan. Javni dokaz tko je što uplatio.

> **Ime:** `domovina.energy` · **Live:** `energy.domovina.ai` (closed beta)
> **Jedno okruženje:** development = staging = production. Grana `main` je ono što
> ljudi vide. Vidi [`docs/12`](./docs/12-ime-domena-okruzenja.md).

> Zakon zajedničko vlasništvo nad elektranom dopušta od 2021.
> U Hrvatskoj postoje **tri** takve zajednice.
> Pokušavamo napraviti četvrtu lakšom od prve tri.

---

## Stanje

Dva dijela, odvojena route groupom:

| Ruta | Što je | Novac |
|---|---|---|
| `/`, `/karta/`, `/projekt/…`, `/zajednice/`, `/novi-projekt/` | **maketa** (Faza 1a–1d): landing, registar s kartom, marketplace, čarobnjak | nema — svaki zapis nosi `demo: true` i UI to prikazuje |
| `/beta/` | **tri stvarne elektrane** (Lukavec, Donja Lomnica, Rab), pravi Safe 2-od-3 na Gnosis Chainu, uplata SEPA → Monerium → EURe → Safe | **pravi** — samo vlasnik lokacije i osobno poznati ljudi, **nije javno prikupljanje** ([`docs/15`](./docs/15-pravi-projekti-vlastite-lokacije.md)) |

Zadani iznos na `/beta/` je **1 €**, namjerno: vizija su mnoge mikrouplate.

Sljedeće: **Faza 1e — uglačavanje i štand** ([`docs/11`](./docs/11-plan-izvedbe.md)).
Rok: **Green Energy Fair 2026, Arena Zagreb, 28.–29.10.2026.**

`docs/` je jedini izvor istine iz kojeg se piše kod, ne obrnuto
([`docs/00`](./docs/00-indeks.md)).

---

## Zašto je kod javan

Dok je na Safeovima malo novca, svaki pronađeni bug je jeftin. Kasnije bi bio
skup. Zato je sve javno od bete: kod, dokumentacija, otvorena pitanja i greške iz
kojih smo učili ([`docs/2026-09-15-dnevnik-izvedbe.md`](./docs/2026-09-15-dnevnik-izvedbe.md)).

Adrese Safeova, potpisnika i lokacija su javne namjerno — sve se može provjeriti
na lancu bez prijave.

**Našli ste bug ili rupu?** Otvorite [issue](https://github.com/domovinatv/energy.domovina.ai/issues)
ili pišite na `hello@italk.hr`. Ako se tiče novca na Safeu, prvo mail, pa issue.

---

## Pokretanje

```bash
npm install
npm run dev      # http://localhost:3020
npm run verify   # lint + lint:copy + tsc + testovi + build
```

⚠️ **`npm run verify` prolazi PRIJE svakog commita, bez iznimke.** Jedno
okruženje: svaki push u `main` je objava ([`docs/12`](./docs/12-ime-domena-okruzenja.md) §2.1).

`npm run lint:copy` je **kontrola usklađenosti, ne kozmetika**: blokira riječi
koje uplatu opisuju kao prinosnu ili povratnu ([`docs/03`](./docs/03-pravni-okvir.md) §3,
zahtjev E3). Popis riječi je u `lib/forbidden-words.ts`.

`npm run deploy` = `verify` + provjera Safeova na lancu (`check:beta`) +
`wrangler deploy`. Deploy traži pristup Cloudflare računu; za doprinos kodu ne
treba.

---

## Gdje početi

| Ako trebaš… | Čitaj |
|---|---|
| pregled svega | [`docs/00-indeks.md`](./docs/00-indeks.md) |
| što gradimo i zašto | [`docs/01-vizija-i-pozicioniranje.md`](./docs/01-vizija-i-pozicioniranje.md) |
| **što smijemo, a što ne** | [`docs/03-pravni-okvir.md`](./docs/03-pravni-okvir.md) |
| kako teče novac | [`docs/04-financijska-arhitektura.md`](./docs/04-financijska-arhitektura.md) |
| što gradimo sljedeće | [`docs/11-plan-izvedbe.md`](./docs/11-plan-izvedbe.md) |
| ime, domena, okruženja | [`docs/12-ime-domena-okruzenja.md`](./docs/12-ime-domena-okruzenja.md) |
| konkurencija i pouke | [`docs/13-konkurencija.md`](./docs/13-konkurencija.md) |
| **poslovni model, zašto nismo ECSP** | [`docs/14-poslovni-model.md`](./docs/14-poslovni-model.md) |

**Prije bilo kakvog koda pročitaj 00, 01 i 03.** Granica iz 03 §3 nije stilska nego
licencna — određuje koje rečenice smiju stajati u sučelju.

---

## Ukratko

- **Registar** svih sunčanih elektrana u Hrvatskoj — javan, na karti, bez prijave.
  Elektrana može postojati bez ijedne kampanje.
- **Marketplace** projekata koji traže suradnju. Svaki projekt ima **vlastiti Safe
  multisig** na Gnosis Chainu — novac drže sami članovi, ne platforma.
- **Dva dopuštena modela:** doprinos (donacijski) i energetska zajednica
  (član dobiva **energiju i glas**, ne prinos).
- **Nismo posrednik — mi gradimo.** U nosivom modu smo **izvođač** koji prodaje
  elektranu ključ u ruke; uplata je predujam na elektranu, ne ulaganje. Zarađujemo
  na izvedbi, **ne na postotku od prikupljenog**, i cijena izvedbe je javna.
- **Tko želi, ide bez nas u sredini.** U nekoliko klikova klijent prebacuje projekt
  na **vlastiti Monerium IBAN i vlastiti Safe** — tada novac ne prolazi kroz nas.
- **Ne nudimo** kamatu, udio u dobiti ni prenosive udjele. Za to treba odobrenje
  HANFA-e po Uredbi (EU) 2020/1503 i mi ga nemamo.

---

## Obitelj proizvoda

Isti pravni subjekt: **ITalk d.o.o.**, IX. Južna obala 20, 10000 Zagreb,
OIB 54872935051.

`pinka.finance` / `pinka.io` · `mpt.hr` · `airkuna.com` / `airkuna.org` ·
`wallet.domovina.ai` · `pay.domovina.ai` · `gis.domovina.ai`

Karta odnosa: [`docs/00-indeks.md`](./docs/00-indeks.md) · što odakle preuzimamo:
[`docs/10-reuse-mapa.md`](./docs/10-reuse-mapa.md)

---

## Pravna napomena

Dva moda rada ([`docs/14`](./docs/14-poslovni-model.md)):

- **Mod 1 — mi smo izvođač.** ITalk d.o.o. gradi elektranu i prodaje je ključ u
  ruke; uplata je predujam na elektranu. Kod rail puta primatelj SEPA naloga je
  ITalk d.o.o. (operater raila), koji EURe prosljeđuje na Safe projekta.
  Ključeve Safea drže članovi, a izvođač nikad ne drži većinu praga
  ([`docs/14`](./docs/14-poslovni-model.md) §4). Na `/beta/` sva tri ključa drži
  vlasnik lokacija, jer su elektrane njegove ([`docs/15`](./docs/15-pravi-projekti-vlastite-lokacije.md)).
- **Mod 2 — bez nas u sredini.** Klijent koristi isti softver sa **svojim**
  Monerium IBAN-om i **svojim** Safeom; novac ne prolazi kroz nas.

Regulirane funkcije e-novca obavlja **Monerium** (EMI, MiCA EMT). Ne nudimo
kamatu, udio u dobiti ni prenosive udjele; platforma nije pružatelj usluga skupnog
financiranja po Uredbi (EU) 2020/1503, nije investicijsko društvo i ne daje
investicijski savjet. Otvorena pravna pitanja su javno popisana u
[`docs/03`](./docs/03-pravni-okvir.md) §9 i [`docs/11`](./docs/11-plan-izvedbe.md) (Blokirano).

Ništa u ovom repozitoriju nije pravni ni porezni savjet.

---

## Licenca

Kod je pod [MIT licencom](./LICENSE). Ime i oznaka `domovina.energy` nisu dio
licence.
