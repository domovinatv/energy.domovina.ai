# 2026-09-15 — Dnevnik izvedbe: odluke o stacku, zamke i ispravci iz Faze 1a/1b

Parnjak [istraživačkog dnevnika](./2026-09-15-istrazivacki-dnevnik.md), ali za
**kod**. Onaj nosi što je provjereno o tržištu; ovaj nosi zašto stack izgleda
ovako, što je koštalo vremena, i koje su tvrdnje iz `docs/` pri izvedbi morale
biti precizirane.

Pokriva prva dva commita s kodom: `94b7db7` (Faza 1a + 1b) i `c87afbe`
(ispravci karte).

**Vezani dokumenti:** [05-podatkovni-model](./05-podatkovni-model.md) ·
[06-produkt-landing](./06-produkt-landing.md) §5 ·
[11-plan-izvedbe](./11-plan-izvedbe.md) · [14-poslovni-model](./14-poslovni-model.md) §4

---

## 1. ⚠️ Zamka koja je koštala najviše: maplibre worker pod Turbopackom

**Ovo je najvrjednija stavka u dokumentu.** Simptom je takav da navodi na krivi
trag, a rješenje je u tri retka.

**maplibre-gl 6 pod Next 16 / Turbopackom ne podigne svoj worker.** Traži ga
preko `import.meta.url` i tiho odustane ako to nije `http(s):` URL:

```js
// iz maplibre-gl.mjs
let e = import.meta.url;
if (!/^https?:/.test(e)) return ``;          // ← Turbopack ovdje padne
return new URL(`./maplibre-gl-worker.mjs`, e).href;
```

### Zašto je simptom varljiv

Sve što se provjerava prvo — **izgleda ispravno**:

| Provjera | Rezultat |
|---|---|
| `<canvas>` postoji, ima točnu veličinu | ✅ 2204×1120 |
| WebGL2 dostupan | ✅ |
| Stil (`/styles/positron`) | ✅ 200 |
| Sprite (`ofm@2x.json`, `.png`) | ✅ 200 |
| TileJSON (`/planet`) | ✅ 200 |
| **Vektorske pločice (`.pbf`)** | ❌ **nijedna** |
| `map.loaded()` | ❌ zauvijek `false` |
| **Greška u konzoli** | ❌ **nijedna** |

Sve što ide glavnom dretvom radi; sve što ide kroz worker je mrtvo. Karta je
prazna, a ništa ne prijavljuje kvar.

### Dijagnoza u jednom retku

```js
performance.getEntriesByType('resource')
  .filter(e => /\.pbf|maplibre-gl-worker/.test(e.name)).length   // 0 ⇒ ovo je to
```

### Rješenje

`setWorkerUrl()` je javni API, i mora se pozvati **prije prvog `new Map(...)`** —
poslije se worker pool već podigao s praznim URL-om.

Worker se poslužuje s **vlastite domene, ne s CDN-a**: demo na sajmu mora raditi
bez mreže ([06](./06-produkt-landing.md) §6). `scripts/copy-maplibre-worker.mjs`
kopira **obje** datoteke pri `predev`/`prebuild`:

- `maplibre-gl-worker.mjs`
- `maplibre-gl-shared.mjs` — worker ga uvozi **relativno u odnosu na sebe**, pa
  moraju stajati jedan uz drugi

`public/maplibre/` je u `.gitignore`. Vendorirati 500 kB tuđeg minificiranog
koda znači da će se razići s verzijom u `package.json`; generiranje pri buildu
to ne može.

⚠️ Ovo vrijedi i za **svaki drugi repo u obitelji koji pređe na Next 16** —
`gis.domovina.ai` i `karta-hrvatske` su na maplibreu ([08](./08-karta-i-geo.md) §5).

---

## 2. ⚠️ Druga maplibre zamka: `zoom` izraz se ne smije ugnijezditi

```js
// ❌ maplibre odbija sloj, uz grešku u `map.on("error")`
"circle-radius": ["+", MARKER_RADIUS_EXPRESSION, 5]
//   "zoom expression may only be used as input to a top-level
//    step or interpolate expression"
```

Izraz koji čita `["zoom"]` smije stajati **samo kao vrh** `step`/`interpolate`
izraza. Prsten oko elektrana koje traže suradnju ([08](./08-karta-i-geo.md) §3.1
traži „puni krug + prsten") zato ne može biti polumjer markera + 5.

Rješenje: oba polumjera nastaju iz **istog izvora** (`RADIUS_STOPS` u
`lib/map-colors.ts`) s odmakom upisanim u svaku točku, pa se ne mogu razići.

> **Pouka o postupku, ne o maplibreu:** ovu je grešku uhvatio
> `map.on("error", …)` handler koji je bio na mjestu od početka. Bez njega bi
> sloj tiho nedostajao. Registrirati error handler na karti **prije** nego se
> dodaju slojevi.

---

## 3. ⚠️ Zamka u provjeri, ne u kodu: skrivena kartica pauzira `requestAnimationFrame`

Kad se karta provjerava kroz automatizirani preglednik, a prozor je prekriven
ili kartica nije aktivna:

```js
document.visibilityState  // "hidden"
// requestAnimationFrame se NE izvršava → maplibre nikad ne nacrta prvi frame
```

Simptom je **identičan** onome iz §1, pa jedan uzrok maskira drugi. Na ovoj
sesiji su oba bila istinita odjednom, i prvo je zaključeno da je kriva samo
skrivena kartica — što je bilo netočno.

**Ne pomaže:** klik u stranicu, promjena veličine prozora, ni
`osascript -e 'tell application "Brave Browser" to activate'` — fokus se dobije
(`document.hasFocus()` postane `true`), ali `visibilityState` ostaje `hidden`.
Jedino pomaže da čovjek klikne na prozor.

**Ne pokušavati zaobići** ručnim pozivom `map._render()` — zamrzne renderer i
sruši CDP vezu (`Runtime.evaluate timed out`).

> **Pravilo:** `visibilityState: "hidden"` znači **odgodi zaključak**, ne „kod je
> ispravan". „Canvas postoji, WebGL radi, zahtjevi 200" isključuje neke uzroke,
> ali ne dokazuje da karta radi.

---

## 4. Odluke o stacku — i što je odbačeno

Sve provjereno na npm-u 15.9.2026., ne po sjećanju.

| Izbor | Uzeto | Odbačeno | Zašto |
|---|---|---|---|
| Framework | **Next 16.3.5** | Next 15 | Zamke iz `mpt-landing/CLAUDE.md` (`proxy.ts`, `dynamicParams`) tiču se **OpenNexta**, a mi idemo na **statički export** — ne vrijede. Obitelj je ionako na 16 |
| Tailwind | **3.4.19** | Tailwind 4.3 | v4 je CSS-first (`@theme`); tokeni iz [09](./09-dizajn-sustav.md) i komponente koje preuzimamo iz `pinka-finance/energy` pisani su za v3 (`border-ink/8` traži `opacity` extend). v4 bi značio prepisati token sloj i raziđi se s obitelji |
| ESLint | **9.39.5** | ESLint 10.10 | `eslint-plugin-react`, koji donosi `eslint-config-next` 16, **ne radi** na ESLintu 10: `TypeError: contextOrFilename.getFilename is not a function`. Vratiti na 10 tek kad `eslint-config-next` osvježi taj plugin |
| Bazne pločice | **OpenFreeMap positron** | vlastiti pmtiles | Bez ključa, ista podloga kao `karta-hrvatske` ([08](./08-karta-i-geo.md) §5). pmtiles ostaje za offline build (1e) |

### Druge zatečene razlike u Nextu 16

- **`next lint` je uklonjen.** `package.json` zove `eslint .` izravno.
- **`eslint-config-next` ima native flat config** (`eslint-config-next/core-web-vitals`,
  `/typescript`) — `FlatCompat` nije potreban.
- **`next dev` dopisuje blok u `CLAUDE.md`** (`<!-- BEGIN:nextjs-agent-rules -->`).
  Generira ga `node_modules/next/dist/server/lib/generate-agent-files.js`; brisanje
  ga samo vrati pri sljedećem `dev`, pa se commita zajedno s radom.
- **`next build` prepisuje `tsconfig.json`** — postavlja `jsx: "react-jsx"` i
  dodaje `.next/dev/types`. Očekivano, ne boriti se s tim.

---

## 5. Ispravci koje su izvukli testovi invarijanti

Oba su bila **neslaganje koda s `docs/`**, ne obična greška — zato su vrijedni.

### 5.1 Invarijanta sukoba interesa bila je stroža od pravila

Prva izvedba `violatesConflictInvariant()`:

```ts
return safe.platform_signer_count * 2 >= safe.threshold;   // ❌ prestrogo
```

[14](./14-poslovni-model.md) §4 kaže „nikad ne smije činiti **većinu** praga", a
većina je **strogo više od polovice**. Uz prag 3 većina je 2, pa je jedan naš
ključ dopušten — i sam dokument to potvrđuje („prag 3-od-5 → najviše jedan
ključ"). S `>=` je padala legitimna 2-od-3 konfiguracija.

Točan uvjet je `> `, i sada stoji u [05](./05-podatkovni-model.md) §4.1 da se
pravilo ne mora ponovno izvoditi iz teksta.

### 5.2 U Modu 2 smo bili upisani kao potpisnik, a ne smijemo biti

`safeFor()` je svakom projektu upisivao `platform_signer_count: 1`, pa i onima s
`mode: "byo"`. Ali u Modu 2 je Safe **klijentov** i mi **nismo potpisnik uopće**
([14](./14-poslovni-model.md) §1).

To nije kozmetika: mogućnost da klijent u nekoliko klikova prebaci sve na svoje
šine je ono što tvrdnju „ne držimo vaš novac" čini **provjerljivom** umjesto
marketinškom ([14](./14-poslovni-model.md) §1). Ako u podacima stoji naš ključ na
klijentovom Safeu, tvrdnja pada.

> **Pouka:** invarijante iz `docs/` pisati kao **testove**, ne kao komentare.
> Oba su ispravka izašla iz `lib/__tests__/invariants.test.ts`, ne iz čitanja koda.

---

## 6. Odluke u izvedbi koje `docs/` nisu propisali

### 6.1 Filtri žive u URL-u, ne u `useState`

[07](./07-produkt-app.md) §2.1 traži da karta i popis gledaju **isti** filtrirani
skup. Izvedeno tako da `filterPlants()` stoji **jednom** u
`components/registry.tsx` i hrani kartu, popis i statistiku — greška na koju
dokument upozorava nije moguća bez namjernog razdvajanja jedne varijable.

Uz to, sami filtri su u URL-u (`useSyncExternalStore` nad `location.search`), a
ne u lokalnom stanju. Posljedica: **deep-linkovi iz [06](./06-produkt-landing.md) §6
stižu besplatno**, a „natrag" i „podijeli ovaj pogled" rade sami od sebe. Bilo bi
skuplje zrcaliti stanje u dva smjera nego imati jedan izvor.

### 6.2 Dug provjere je onemogućen strukturno, ne disciplinom

V1–V8 iz [istraživačkog dnevnika](./2026-09-15-istrazivacki-dnevnik.md) §3 stoje u
`lib/facts.ts` kao `PENDING_VERIFICATION`, i **nemaju polje `value`**. Nije ih
moguće formatirati u UI ni greškom; test to čuva. Potvrđene brojke imaju `value`,
`source`, `verifiedAt` i `doc`.

### 6.3 Odobrene negacije u lintu su doslovne rečenice, ne uzorak

`scripts/check-copy.ts` blokira zabranjene riječi ([03](./03-pravni-okvir.md) §3,
zahtjev E3). Problem: [07](./07-produkt-app.md) §2.3 **traži** da rečenica „Ne
nudimo prinos ni udio u dobiti." bude trajno vidljiva — a odricanje mora imenovati
ono čega se odriče.

Odbačeno rješenje: uzorak „dopusti ako je negirano". Propustio bi svako „ne nudimo
prinos, **ali**…".

Uzeto: popis **doslovnih rečenica** (`APPROVED_NEGATIONS`). Rečenica je pravno
nosiva, pa svako odstupanje od odobrene formulacije mora pasti na lintu i proći
kroz svjesnu odluku — kao i svaka druga izmjena pravnog teksta. Provjereno da
linter i dalje hvata produljenu verziju odobrene rečenice.

### 6.4 Povučeno ranije iz 1e

- **Lint na zabranjene riječi** — jeftiniji dok je copyja malo, i dio je
  `npm run verify` od prvog dana.
- **`robots.txt` + `noindex`** — [12](./12-ime-domena-okruzenja.md) §6 ionako kaže
  „od prvog deploya".

### 6.5 Mock podaci: geografija stvarna, elektrane izmišljene

352 elektrane vezane su na **stvarna** hrvatska naselja s koordinatama
(`lib/mock-geo.ts`) — to je zemljopis, ne podatak o elektrani. Same elektrane su
izmišljene, imenovane tako da se to vidi („Krovna elektrana — Sinj"), i sve nose
`demo: true` ([00](./00-indeks.md) pravilo 7).

Namjerno **bez fotografija**: prethodnik je imao `cover_image_url`, ali izmišljena
elektrana sa slikom je prvi korak prema tome da maketa izgleda kao stvarnost.

Generiranje je **determinističko iz sjemena** — bez toga deep-link sa štanda pukne
pri sljedećem deployu.

---

## 7. Što je ostalo neprovjereno ili otvoreno

| Stavka | Status |
|---|---|
| **Kontrast**, posebno jantar na `solar-soft` podlozi | ⚠️ nije mjeren. [09](./09-dizajn-sustav.md) §2 upozorava da je jantar poznata zamka; uveden je `solar.ink` (`#7A4F08`) za tekst, ali **bez mjerenja** |
| Mobilni prolaz na **pravom uređaju** | ⚠️ provjereno samo u pregledniku na 414 px (nema vodoravnog scrolla) |
| Layout za **1080p TV u portretu** | ne postoji (1e) |
| **Offline build** / service worker | ne postoji (1e). Worker i pločice su zasad s mreže |
| Deploy | blokiran na **B4** (Cloudflare) i **B14** (kako se zatvara beta) |
| **V1 — JIZ-01** | i dalje otvoren. Registar zato nigdje u copyju nije „prvi" ni „jedini"; stoji poštena formulacija „44.000 u Hrvatskoj, 352 na ovoj karti" |

---

## 8. Što je provjereno u pregledniku

Da se ne ponavlja posao, i da se zna dokle seže tvrdnja „radi":

- klasteri se zbrajaju na **352**; klik na klaster ga razlaže (46 → 38 + 5 + 3)
- filtar iz URL-a (`?zupanija=Splitsko-dalmatinska`) suzi **kartu, statistiku i
  popis na isti skup** (46)
- popup nosi demo oznaku, kWp, status i status priključka
- `/elektrana/:slug` prikazuje procjenu proizvodnje označenu kao procjenu, status
  priključka s datumom, i objavu sukoba interesa sa **stvarnim** pragom Safea
  („3 od 5 potpisa, a naš je samo jedan")
- EN katalog radi; datumi prate jezik sučelja, iznosi ostaju `hr-HR`
- mobilni 414 px: bez vodoravnog scrolla, demo traka prelazi na kratki oblik
- **i u `next dev` i na statičkom exportu iz `out/`**
