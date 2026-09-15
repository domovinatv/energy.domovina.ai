# 02 — Hrvatsko solarno tržište i energetske zajednice

**Sve brojke u proizvodu dolaze odavde.** Ne prepisuj iz sjećanja, ne citiraj
blog bez primarnog izvora. Uz svaku tvrdnju stoji datum provjere.

Zadnja revizija: **15.9.2026.**

---

## 1. Solar u Hrvatskoj — stanje

| Podatak | Vrijednost | Izvor | Provjereno |
|---|---|---|---|
| Ukupna instalirana snaga FN elektrana | **~1.500 MW** (početak 2026.) — solar **prvi put prestigao vjetar** po instaliranoj snazi | Poslovni dnevnik, prenosi HOPS/HEP podatke | 15.9.2026. |
| Novoinstalirano u 12 mj. | **417 MW** (prosinac 2024. → prosinac 2025.) | Udruga Obnovljivi izvori energije Hrvatske (OIEH), prenosi boljaenergija.24sata.hr | 15.9.2026. |
| Broj FN elektrana na mreži HEP-ODS-a | **~44.000** (veljača 2026.) | HEP-ODS preko Poslovnog dnevnika | 15.9.2026. |
| Segment kućanstava | **35.345** elektrana, **275 MW** (raniji presjek) | zupan.hr, prenosi HERA/HEP podatke | 15.9.2026. ⚠️ presjek stariji od gornjih |
| Udio poduzetničkog segmenta u snazi na distribuciji | **~3/4** instaliranih kapaciteta | HEP-ODS preko Poslovnog dnevnika | 15.9.2026. |
| Proizvodnja iz FN | **53.000 MWh (2015.) → 1,045.000 MWh (2025.)** — rast ~20× u 10 godina | Poslovni dnevnik | 15.9.2026. |
| Ukupna neto proizvodnja el. energije RH | **14.760 GWh (2024.)**, od toga 6.799 GWh hidro | tehnoeko.com.hr | 15.9.2026. ⚠️ sekundarni izvor, potvrditi kod HEP/DZS prije javne upotrebe |

**Kako se to čita za proizvod:** tržište nije prazno i ne treba ga stvarati.
44.000 elektrana već postoji, a zadnjih 12 mjeseci doda se ~400 MW godišnje.
Problem nije potražnja za solarom — problem je **tko ga smije zajednički
posjedovati i kako se kapital udružuje** (§3).

---

## 2. Ekonomika jedne elektrane

| Parametar | Vrijednost | Izvor | Napomena |
|---|---|---|---|
| Godišnji prinos, Zagreb | **1.393 kWh/kWp** | energetska-ucinkovitost.hr | Dalmacija je osjetno viša; ne koristi jedan broj za cijelu RH |
| Cijena el. energije za kućanstvo | **0,176 €/kWh (2026.)**, +12,7 % u godini | energetska-ucinkovitost.hr | ⚠️ sekundarni izvor; za javni copy potvrditi kod HERA-e |
| FZOEU poticaj za solar | **do 600 €/kW, max 50 % troška** | energetska-ucinkovitost.hr, prenosi FZOEU natječaj | ovisi o natječaju; provjeriti aktualni prije citiranja |
| Fond za obnovu | **~120 M€**, ~10.000 kuća | energetska-ucinkovitost.hr | isto |
| Povrat ulaganja | **5–7 god.** (prodavači) vs **~15 god.** (neutralniji izvor) | solarne-elektrane.shop / emajstor.hr | ⚠️ **raspon je prevelik da bi se citirao kao činjenica.** U proizvodu prikazuj kao ulaz u kalkulator, nikad kao obećanje |

> **Pravilo za copy:** nikad ne piši „povrat u X godina" kao tvrdnju platforme.
> To je izlaz kalkulatora s korisnikovim ulazima i uvijek nosi oznaku
> ilustrativnosti — isti obrazac kao `SavingsCalculator` na mpt.hr.

---

## 3. Energetske zajednice — prava rupa na tržištu

Ovo je **razlog zašto platforma postoji**, jasnije od bilo koje solarne brojke.

| Podatak | Vrijednost | Izvor | Provjereno |
|---|---|---|---|
| Registrirane energetske zajednice u RH | **tri** (prosinac 2025.) | tportal, „Imamo samo tri energetske zajednice"; potvrđuje ZEZ i H-Alter | 15.9.2026. |
| Trošak registracije | **može premašiti 20.000 €** | Zelena energetska zadruga (ZEZ) | 15.9.2026. |
| Trajanje registracije | **više od šest mjeseci** | ZEZ | 15.9.2026. |
| Zajednica obnovljive energije (ZOE) | **nijedna** — pet godina nakon što je zakon to omogućio | H-Alter | 15.9.2026. |
| Prva operativna zajednica koja dijeli struju | **Špičkovina (Zabok)**, u funkciji od **1.6.2026.** | financije.hr | 15.9.2026. |
| Pozicija RH u EU | **na dnu** po korištenju Sunčeve energije i po broju zajednica | tportal | 15.9.2026. |
| Revizija EU | **Tematsko izvješće ECA 10/2026 — Energetske zajednice**: države ne mjere prepreke ni potencijal | Europski revizorski sud | 15.9.2026. |

### Zašto je to prilika, a ne samo tužna brojka

Zakon **dopušta** zajedničko vlasništvo nad elektranom od 2021. Pet godina kasnije
postoje tri zajednice. Uzrok nije nezainteresiranost građana — 44.000 elektrana
kaže suprotno. Uzrok je **transakcijski trošak udruživanja**:

1. pravno osnivanje (20.000 € + 6 mjeseci),
2. nepostojanje alata za **udruživanje kapitala bez posrednika** — banka, platforma
   ili fond uzimaju proviziju i traže vlastito povjerenje,
3. nepostojanje alata za **transparentno praćenje tuđeg novca** — tko je koliko
   uložio, gdje je novac sada, tko ga smije potrošiti.

Točke 2 i 3 su **točno ono što Safe multisig + EURe rail rješavaju bez licence**
([04-financijska-arhitektura.md](./04-financijska-arhitektura.md)). Točka 1 je
pravna i ne rješava se softverom — ali se rješava **predloškom i vodičem**, i to je
legitiman dio proizvoda.

---

## 4. Mreža kao usko grlo

> Prema podacima HGK-a **proizvodni projekti se u prosjeku realiziraju tri puta brže
> od jačanja prijenosne i distribucijske mreže.**
> — Poslovni dnevnik, provjereno 15.9.2026.

HEP razvija baterijske spremnike na lokacijama SE Korlat (75 MW, u redovnoj
proizvodnji) i SE Sukošan (45 MW, u pripremi).

**Posljedica za proizvod:** status elektrane „čeka priključak" nije rubni slučaj
nego čest scenarij, i mora postojati kao prvorazredno stanje u podatkovnom modelu
([05-podatkovni-model.md](./05-podatkovni-model.md) §2). Kampanja koja financira
elektranu koja nikad neće dobiti priključak je najveći rizik za povjerenje u
platformu.

---

## 5. Green Energy Fair 2026 — kontekst prve javne objave

| Podatak | Vrijednost |
|---|---|
| Datum | **28.–29. listopada 2026.** |
| Mjesto | **Arena Zagreb** |
| Radno vrijeme | 28.10. 8:30–20:00 (program do 18:00) · 29.10. 8:30–16:00 (program do 14:00) |
| Ulaz | besplatan uz registraciju |
| Veličina (2025.) | 5.000+ posjetitelja, 100+ izlagača, 50+ govornika, 30+ partnera |
| Najava 2026. | 120+ izlagača |
| Teme | Solar · Energy Storage · Nuclear · Power System Flexibility · **ESG** · E-mobility u javnom sektoru |
| Glavni pokrovitelj | IBC Solar |

Izvor: zg-gef.com, provjereno 15.9.2026.

**Zašto je to dobar termin:** program eksplicitno pokriva **sustainable finance i
ESG**, a ne samo hardver. Publika su instalateri, investitori, JLS-ovi i tvrtke —
točno tri od četiri naša segmenta ([01-vizija-i-pozicioniranje.md](./01-vizija-i-pozicioniranje.md) §3).

---

## 6. Otvorena istraživačka pitanja

Nije riješeno ovom revizijom; treba prije javnog nastupa.

1. **Postoji li javni registar FN elektrana** koji se smije koristiti kao seed?
   Kandidati: HROTE registar, HERA registar dozvola, HEP-ODS podaci o priključenima.
   Pitanje nije samo postoji li, nego **pod kojim licencnim uvjetima** smije u naš
   registar. (Isto pitanje otvoreno i u `pinka-finance/app/docs/energy-solar/PLAN.md` §d.7.)
2. **Aktualni FZOEU natječaj** — iznos i uvjeti po kWp u trenutku nastupa.
3. **Cijena el. energije po tarifnim modelima 2026.** iz HERA izvora, ne s portala.
4. **Struktura naknade za priključenje** i tipično vrijeme čekanja po županijama —
   to je podatak koji nitko ne agregira, a bio bi razlog da ljudi dolaze na kartu.
5. **Tko su tri registrirane zajednice** i bi li bile spremne biti pilot.
6. Potvrditi brojku ukupne neto proizvodnje (§1) kod DZS/HEP-a.

---

## Izvori

- Poslovni dnevnik — „Hrvatska srušila rekord u potrošnji struje" (1.500 MW, 44.000 elektrana, 3/4 poduzetnički, 53.000→1.045.000 MWh, HGK o mreži)
- boljaenergija.24sata.hr — „Hrvatska je u 2025. instalirala 417 MW sunčanih elektrana" (izvor: Udruga OIEH)
- zupan.hr — „U četiri godine udeseterostručen broj sunčanih elektrana" (kućanstva 35.345 / 275 MW)
- tehnoeko.com.hr — „Pregled solarnih elektrana u Hrvatskoj" (ukupna proizvodnja 2024.)
- energetska-ucinkovitost.hr — prinos Zagreb, cijena kWh 2026., FZOEU 600 €/kW, fond 120 M€
- tportal — „Imamo samo tri energetske zajednice: Hrvatska na dnu u EU-u", 8.12.2025.
- ZEZ (zez.coop) — „Energetske zajednice u Hrvatskoj: koliko su zrele za provedbu" (20.000 €, 6 mj.)
- H-Alter — „Kome smeta demokratizacija energetskog sustava?" (nijedna ZOE)
- financije.hr — prva zajednica koja dijeli struju, Špičkovina/Zabok, od 1.6.2026.
- Europski revizorski sud — Tematsko izvješće 10/2026: Energetske zajednice
- zg-gef.com — Green Energy Fair 2026
