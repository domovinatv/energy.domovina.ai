# domovina.energy

**P2P platforma za zajedničko financiranje i suvlasništvo sunčanih elektrana u
Hrvatskoj.** Bez provizije, bez posrednika koji drži novac, s javnim dokazom tko je
što uložio.

> **Ime:** `domovina.energy` · **Live:** `energy.domovina.ai` (closed beta)
> **Jedno okruženje:** development = staging = production. Grana `main` je ono što
> ljudi vide. Vidi [`docs/12`](./docs/12-ime-domena-okruzenja.md).

> Zakon zajedničko vlasništvo nad elektranom dopušta od 2021.
> U Hrvatskoj postoje **tri** takve zajednice.
> Pokušavamo napraviti četvrtu lakšom od prve tri.

---

## Stanje

**Faza 0 — baza znanja.** Koda još nema. `docs/` je jedini izvor istine iz kojeg se
gradi landing i aplikacija.

Prvi javni rok: **Green Energy Fair 2026, Arena Zagreb, 28.–29.10.2026.**

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

ITalk d.o.o. je **non-custodial pružatelj softvera**. Sredstva nikad ne prolaze
kroz platformu niti platforma drži ključeve. Regulirane funkcije e-novca obavlja
**Monerium** (EMI, MiCA EMT). Platforma nije pružatelj usluga skupnog financiranja
po Uredbi (EU) 2020/1503, nije investicijsko društvo i ne daje investicijski savjet.

Ništa u ovom repozitoriju nije pravni ni porezni savjet.
