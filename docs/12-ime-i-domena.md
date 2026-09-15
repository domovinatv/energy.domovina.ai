# 12 — Ime i domena

Status: **prijedlog, čeka odluku** (blokada B3 u [11](./11-plan-izvedbe.md)).
Zadnja revizija: **15.9.2026.**

`energy.domovina.ai` je adresa repozitorija i radni naziv, ne ime proizvoda.

---

## 1. Kriteriji

Izvedeni iz [01](./01-vizija-i-pozicioniranje.md) §1.1 i
[03](./03-pravni-okvir.md) §3:

1. **Ne smije zvučati financijski.** Ime koje asocira na fond, ulaganje ili prinos
   radi protiv pravnog pozicioniranja. Isključuje sve s *invest*, *fund*, *capital*,
   *yield*.
2. **Mora nositi zajedništvo ili mjesto, ne tehnologiju.** Priča je tko posjeduje
   proizvodnju, ne kako radi panel.
3. **Hrvatsko i izgovorljivo.** Publika je domaća, a ime mora preživjeti izgovor u
   radiju i telefonom. Bez dijakritika u domeni.
4. **Radi i na engleskom** barem kao vlastito ime (EU natječaji, partneri).
5. **Uklapa se u obitelj** — pinka, airKUNA, MPT, DOMOVINA su kratke, konkretne,
   nepretenciozne riječi. Ne opisne fraze.
6. **Domena slobodna** u `.hr` ili `.energy`.

---

## 2. Prijedlozi

Provjera DNS-om 15.9.2026. „slobodno" znači **bez DNS zapisa**, što je jak
pokazatelj ali **ne** zamjena za provjeru kod registrara (za `.hr` — DNS.hr /
CARNET, uz uvjete za `.hr` domenu pravne osobe).

### 2.1 Preporuka — **Prisoje**

`prisoje.hr` · `prisoje.energy` — **oboje bez DNS zapisa**

*Prisoje* je hrvatska riječ za **sunčanu, prisojnu stranu brda** (suprotno:
*osoje*, sjenovita strana). Riječ je stara, topla, zemljopisna i potpuno
neopterećena financijskim značenjem.

| Kriterij | Ocjena |
|---|---|
| Ne zvuči financijski | ✅ savršeno — zvuči kao mjesto, ne kao proizvod |
| Zajedništvo / mjesto | ✅ doslovno mjesto na suncu |
| Izgovorljivo | ✅ `pri-so-je`, bez dijakritika |
| Engleski | ⚠️ neprozirno, ali radi kao vlastito ime (kao *Skype*, *Miro*) |
| Uklapa se u obitelj | ✅ kratka konkretna riječ, isti registar kao *pinka* |
| Domena | ✅ `.hr` i `.energy` slobodni |

Slogan koji se sam piše: **„Stanite na prisoje."** / „Svi smo na istoj strani brda."

Rizik: dio ljudi ne zna riječ. To je **prednost** za brand (ništa drugo je ne
zauzima) i trošak za prvo objašnjenje — rješiv jednom rečenicom u heroju.

### 2.2 **Suncostaj**

`suncostaj.hr` · `.energy` — **slobodno**

Solsticij, najduži dan. Snažno, poetično, jasno sunčano.

✅ Nedvosmisleno vezano uz sunce · ✅ pamtljivo · ⚠️ duže (9 slova) ·
⚠️ „staj" na kraju može zvuči kao *stajati*/zastoj — nesretna konotacija za
energetski proizvod · ⚠️ nešto patetičnije od obiteljskog registra

### 2.3 **Osunce**

`osunce.hr` — **slobodno**

Igra na *o sunce* / *osunčati*. Kratko, mekano, moderno.

✅ najkraće · ✅ dobar `.hr` · ⚠️ pomalo generičko, lako zamijeniti s desetak
solarnih tvrtki · ⚠️ ne nosi zajedništvo

### 2.4 **Zadruga.energy**

`zadruga.energy` — **slobodno**

Doslovno ono što gradimo. Riječ *zadruga* u Hrvatskoj nosi stvarnu povijest
zajedničkog vlasništva.

✅ savršeno precizno · ✅ odmah objašnjava model · ⚠️ **preusko** — sužava nas na
jedan pravni oblik, a `docs/05` predviđa i udrugu, JLS i neregistriranu zajednicu ·
⚠️ generička riječ, teško braniti kao brand · ⚠️ nema `.hr`

### 2.5 Odbačeno

| Ime | Zašto ne |
|---|---|
| **Suncokret** | `suncokret.hr` **zauzet** (aktivan A zapis). Uz to preopterećeno — koristi ga mnogo brandova |
| **Sunovrat** | arhaično znači solsticij, ali primarno današnje značenje je **propast**. Isključeno |
| **Naše sunce**, **Zajedno sunce** | opisne fraze, ne imena; izlaze iz registra obitelji |
| bilo što s *solar*, *energy*, *invest* u korijenu | generičko i/ili financijski obojeno (kriterij 1) |

---

## 3. Odnos imena i domene

Odvojena odluka od domene za **aplikaciju**.

| Sloj | Prijedlog |
|---|---|
| Landing | `prisoje.hr` (ili odabrano ime) |
| Aplikacija | `app.prisoje.hr` ili zadržati `energy.domovina.ai` |
| Repo | ostaje `energy.domovina.ai` — mijenjati ime repoa nije vrijedno truda |
| Sloj na karti | `gis.domovina.ai` → sloj „Sunčane elektrane" |

⚠️ **Odluka o domeni mijenja tri tehničke stvari** (blokada B2):
passkey **RP ID** (WebAuthn je vezan uz registrable domain), Certilia
`ALLOWED_ORIGINS`, i CSP `connect-src`/`frame-src`. Isti obrazac kao napomena u
`pinka-finance/app/docs/energy-solar/PLAN.md` §d.4: wallet radi kroz iframe pod
`domovina.ai`, pa različit eTLD+1 nije blokada — ali passkeyi **nisu dijeljeni**
između `prisoje.hr` i `domovina.ai`.

---

## 4. Prije registracije provjeriti

- [ ] Žig — pretraga u registru **DZIV** i **EUIPO** za odabrano ime
- [ ] Sudski registar — postoji li tvrtka s tim imenom
- [ ] `.hr` uvjeti — domena na ITalk d.o.o.
- [ ] Društvene mreže — dostupnost handlea
- [ ] Nema neugodnog značenja u susjednim jezicima
