# 06 — Landing: specifikacija

Zadnja revizija: **15.9.2026.**

Cilj landinga: **posjetitelj s GEF-a u 90 sekundi razumije što je ovo, zašto je
zakonito i zašto nema provizije** — i ostavi kontakt ili ode na kartu.

Uzor strukture: `pinka-finance/landing` (sekcije + i18n katalog + `fees.ts` SSOT).
Uzor tona i dijagrama: `mpt-landing` (jedan machine → dijagram + simulacija + testovi).

---

## 1. Sekcije, redom

| # | Sekcija | Nosi | Izvor istine |
|---|---|---|---|
| 1 | **Hero** | „Zakon to dopušta od 2021. Postoje tri takve zajednice. Radimo četvrtu." + CTA „Pogledaj kartu" / „Pokreni projekt" | [01](./01-vizija-i-pozicioniranje.md) §1.1 |
| 2 | **Problem** | 44.000 elektrana, **3** zajednice, 20.000 € i 6 mjeseci za osnivanje | [02](./02-trziste-hrvatska.md) §3 |
| 3 | **Karta** | živi isječak registra — pravi razlog da se ostane na stranici | [08](./08-karta-i-geo.md) |
| 4 | **Kako radi** | interaktivni dijagram toka novca: banka → EURe → Safe zajednice → instalater → banka | [04](./04-financijska-arhitektura.md) §2 |
| 5 | **Zašto 0 %** | poštena tablica tko što plaća; kalkulator usporedbe, označen kao ilustrativan | [04](./04-financijska-arhitektura.md) §4 |
| 6 | **Modeli** | doprinos vs. energetska zajednica; **eksplicitno što ne radimo** | [03](./03-pravni-okvir.md) §2, §3 |
| 7 | **Provjereno** | Certilia eID, Safe na Gnosisu, javna knjiga, non-custody + **Ripple Energy kao dokaz da imovina preživi platformu** (K5) | [04](./04-financijska-arhitektura.md) §5, [13](./13-konkurencija.md) §4.1 |
| 8 | **Za koga** | četiri segmenta s vlastitim CTA-om | [01](./01-vizija-i-pozicioniranje.md) §3 |
| 9 | **Otvoreni kod** | MIT repoi + bijela etiketa / konzalting | [04](./04-financijska-arhitektura.md) §4.1 |
| 10 | **Roadmap** | Isporučeno / U tijeku / Slijedi — **bez prošlih datuma** | [11](./11-plan-izvedbe.md) |
| 11 | **Pilot / kontakt** | forma: tko si, imaš li krov, imaš li zajednicu. **Trajna lista čekanja** neovisna o otvorenom pozivu (K4) | [13](./13-konkurencija.md) §7 |
| 12 | **Footer** | ITalk impresum doslovno + obitelj proizvoda + pravne napomene | [03](./03-pravni-okvir.md) §7 |

---

## 2. Sekcija 4 — dijagram toka novca

Najvrednija sekcija, i ona koja se najlakše pokvari. Obrazac je dokazan na mpt.hr:

- **Jedan artefakt** (`lib/energy-machine.ts`) drži čvorove, veze, scenarije i
  hr/en labele. Iz njega se izvode: React Flow dijagram (≥1024px), Mermaid
  (<1024px), simulacija, i **testovi invarijanti**.
- Invarijante koje testovi moraju dokazati:
  - doprinositelj plaća **0 €** platformi u svakom koraku,
  - zbroj salda je konstantan (novac se ne stvara ni ne gubi),
  - saldo nikad nije negativan,
  - iz Safea se ne može izaći bez M potpisa.
- ⚠️ Naučeno na mpt.hr: **ne modeliraj tok iz sjećanja.** Izvor je
  `pay.domovina.ai` + `mpt-machine.ts`.

Scenariji za simulaciju (minimalno tri):

1. **Susjedi grade zajedno** — 12 ljudi × 800 € → Safe 3-od-5 → instalater.
2. **Škola dobiva krov** — JLS + doprinosi građana → Safe škole.
3. **Zadruga širi kapacitet** — postojeća zadruga, novi članovi, novi ulog.

---

## 3. Sekcija 6 — modeli, i zašto je to prodajna, a ne pravna sekcija

Jedina sekcija koja eksplicitno kaže **što ne radimo**
([01](./01-vizija-i-pozicioniranje.md) §7). To je protuintuitivno, ali:

- publika na GEF-u ima ljude koji znaju za ECSPR. Ako to ne kažemo mi, kažu oni;
- „ne obećavamo prinos" je **razlog povjerenja**, ne ispričavanje;
- razlikuje nas od svake platforme koja isto obećava bez licence.

Formulacija koja radi:

> Ne nudimo prinos, kamatu ni udio u dobiti. Za to bi trebalo odobrenje HANFA-e po
> Uredbi (EU) 2020/1503, i mi ga nemamo. Nudimo nešto što zakon već dopušta od
> 2021., a gotovo nitko ne koristi: **da zajedno posjedujete elektranu i koristite
> struju koju proizvodi.**

---

## 4. Copy — pravila

1. **Jezik: hrvatski** kao izvor istine, engleski izveden. Rute `/hr` i `/en`,
   `[locale]` segment, redirect po `Accept-Language`. Uvijek mijenjaj oba.
2. **Bez emojija u UI-ju** (konvencija iz `airkuna/tokenizacija`).
3. **Iznosi:** `Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' })`.
4. **Nijedna brojka nije hardkodirana u copyju** — sve iz `lib/facts.ts`
   (tržišne brojke, citiraju [02](./02-trziste-hrvatska.md)) ili `lib/fees.ts`
   (stope). To je pravilo koje je u obitelji već jednom prekršeno i proizvelo
   nesklad 0,40 vs 0,45 € ([04](./04-financijska-arhitektura.md) §4).
5. **Nikad „povrat u X godina" kao tvrdnja.** Samo kao izlaz kalkulatora s
   korisnikovim ulazima, uz oznaku ilustrativnosti ([02](./02-trziste-hrvatska.md) §2).
6. **Zabranjene riječi u copyju:** prinos, kamata, dividenda, povrat na ulaganje,
   udio u dobiti, sekundarno tržište, prodaj udio. Provjeriti lintom, ne pažnjom.

---

## 5. Tehnički okvir

Nasljeđuje `pinka-finance/landing/TECH_STACK.md`; odstupanja označena.

| Sloj | Izbor |
|---|---|
| Framework | Next.js App Router |
| Jezik | TypeScript strict + `noUncheckedIndexedAccess`; **nikad `any`** |
| Stil | Tailwind, token-based ([09](./09-dizajn-sustav.md)) |
| Ikone | `lucide-react` |
| Dijagram | React Flow (desktop) + Mermaid (mobitel), dinamički import |
| i18n | vlastiti katalog, HR izvor |
| Hosting | **Cloudflare** — Pages (statički export) ili Workers + OpenNext |
| Testovi | vitest, invarijante machinea |

### Naučene zamke (ne ponavljati)

Iz `mpt-landing/CLAUDE.md` — ako se ide na Next 16 + OpenNext:
- Next 16 `proxy.ts` (Node middleware) **ne radi** na OpenNextu → koristi
  `src/middleware.ts` (edge) za jezični redirect.
- `export const dynamicParams = false` **ruši** prerenderirane rute na OpenNextu
  (opennextjs-cloudflare #611) — ne dodavati.

Iz `pinka-finance/app/docs/energy-solar/PLAN.md`:
- Statički export emitira inline RSC `self.__next_f` skripte bez nonce-a →
  `script-src` mora imati `'unsafe-inline'`. Dobitak se traži drugdje:
  `frame-ancestors`, origin-pinnan `connect/frame-src`, `object-src 'none'`.

Iz `zef-novcanik-prototip/CLAUDE.md`:
- **Mermaid + font:** čekaj `document.fonts` **prije** `mermaid.render`, inače
  mermaid mjeri širinu čvorova fallback fontom i tekst se odsiječe.
- **Ne stavljati `zoom` na `html`** — lomi mermaidov `getBoundingClientRect`.

---

## 6. Nastup na GEF-u — gradimo za štand, vjerojatno idemo kao posjetitelj

Odluka 15.9.2026.: **opseg se postavlja na izlagački standard namjerno**, iako je
stvarni nastup vjerojatno posjetiteljski (razgovori s drugim izlagačima, provjera
reakcije na model). Veći opseg se lako smanjuje; obrnuto ne ide.

Dakle: gradi po tablici dolje, ali kriterij dovršenosti
([11](./11-plan-izvedbe.md)) ostaje uzak i posjetiteljski — ako nešto od ovoga
padne, nastup nije ugrožen.

| Zahtjev | Zašto |
|---|---|
| **Offline build** | WiFi u Areni nije pretpostavka. Statički export + service worker; demo mora raditi bez mreže |
| **Prikaz na velikom ekranu** | layout mora raditi i na 1080p TV-u u portretu, ne samo na mobitelu i laptopu |
| **Deep-linkovi za demo** | `?slug=` na svakom ekranu — pokazuje se otvaranjem točne stranice, ne klikanjem kroz pet koraka |
| **Kiosk povratak** | nakon N minuta neaktivnosti vrati se na početni ekran |
| **QR na materijalima** | vodi na landing s UTM-om `?izvor=gef2026` |
| **Oznaka prototipa dostojanstvena** | na štandu se čita izbliza; traka mora biti jasna, ne sramežljiva |

---

## 7. Otvoreno

- [ ] OG slike (hr/en) — obrazac postoji u `pinka-finance/app/public/og/`.
- [ ] Pravni tekst uvjeta i privatnosti — **pravnik**, ne mi.
- [ ] Ime i domena — prijedlozi u [`12-ime-i-domena.md`](./12-ime-i-domena.md), čeka odluku.
