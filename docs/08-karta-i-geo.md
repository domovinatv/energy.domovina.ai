# 08 — Karta i geo sloj

Zadnja revizija: **15.9.2026.**

Karta je **najjeftinija i najvrjednija stvar koju možemo isporučiti**: ima
vrijednost s nula korisnika i nula projekata ([01](./01-vizija-i-pozicioniranje.md) §4.1).

---

## 1. Dvije karte, ne jedna

| | **Karta u našem appu** | **Sloj na gis.domovina.ai** |
|---|---|---|
| Gdje | `energy.domovina.ai/` | `karta-hrvatske/apps/karta-web` |
| Svrha | ulaz u marketplace, filtriranje, klik na projekt | otkrivanje — ljudi koji gledaju kartu Hrvatske naiđu na elektrane |
| Podaci | isti izvor | isti izvor |
| Faza | **1** | **2** |

Isti obrazac kao pinka: aplikacija ima svoju kartu, a `gis.domovina.ai` nosi sloj
„Pinka kampanje" koji vodi natrag. Za nas: sloj **„Sunčane elektrane"**.

---

## 2. Postojeći obrazac koji kopiramo

`karta-hrvatske/apps/karta-web/src/lib/pinka.ts` + `src/hooks/usePinkaLayer.ts`.
Provjereno, radi u produkciji.

**Što taj obrazac već rješava:**

- **Javni PostgREST read** na `api.domovina.ai`, shema bira se headerom
  `accept-profile: pinka_finance` (nije default shema).
- **Anon JWT je javan po dizajnu** — sav pristup je RLS-gated na serveru.
- **Filtriranje na izvoru:** samo `visibility=public`, `state in (active,funded)`,
  koordinate ne-null, `destination_address != 0x0…0`. Zadnji uvjet je sigurnosni —
  marker bez Safea vodio bi u spaljene donacije.
- **Lazy fetch** pri prvom uključenju sloja; `loadingRef` umjesto state-a da
  cleanup ne otkaže inflight fetch pri re-renderu.
- **Popup** s naprijetkom, brojem podržavatelja i CTA-om; `esc()` na svemu iz baze.
- **Deep-link** `?c={slug}` → fly-to + otvori popup jednom.

Za nas se mijenja: URL tablice (`solar_plants` / `projects`), boja, sadržaj popupa,
naziv sloja. Logika ostaje.

---

## 3. Sloj „Sunčane elektrane" — specifikacija

### 3.1 Vizualni jezik

| Stanje elektrane | Boja | Oblik |
|---|---|---|
| u pogonu (`operational`) | jantarna / zlatna | puni krug |
| u izgradnji | jantarna | krug s isprekidanim rubom |
| planirana, **bez** projekta | siva | mali krug |
| planirana, **traži suradnju** | **naglasna boja proizvoda** | puni krug + prsten |
| zajednica | zelena | drugi simbol (ne krug) |

**Veličina markera ∝ kWp**, `interpolate` po zoomu kao u `usePinkaLayer`. Zbog
raspona (5 kWp krov ↔ 75 MW Korlat) skaliraj **logaritamski**, inače velike
elektrane pojedu kartu.

⚠️ Pri 44.000 elektrana pojedinačni markeri su neupotrebljivi. Obavezno
**clustering** ispod određenog zooma, s brojem u klasteru i ukupnim MW.

### 3.2 Popup

Ime · županija · kWp · status · status priključka · ako ima projekt: traka
napretka + „Pogledaj projekt". Bez iznosa kad projekta nema.

### 3.3 Privatnost

Elektrana fizičke osobe s `visibility != public`: koordinate **zaokružene na
razinu naselja**, bez adrese ([05](./05-podatkovni-model.md) §8). Krov je dom.

---

## 4. Odakle podaci

| Izvor | Faza | Status |
|---|---|---|
| **Registar OIEKPP** (Ministarstvo) | — | ⚠️ **već postoji, s interaktivnom kartom** — `oie-aplikacije.mzoe.hr/InteraktivnaKarta/`. **Provjeriti ručno u pregledniku što pokriva prije bilo kakve tvrdnje** ([13](./13-konkurencija.md) §9) |
| **Samoupis** (`/prijava-elektrane`) | 1 | radi — RPC postoji |
| **Mock seed** za prototip | 1 | plauzibilne elektrane, `demo: true` |
| **HROTE / HERA / HEP-ODS** | 2 | ⚠️ **otvoreno** — ne zna se smijemo li ([02](./02-trziste-hrvatska.md) §6.1, [03](./03-pravni-okvir.md) §9.7) |
| **OSM** `generator:source=solar` | 2 | ODbL — traži atribuciju; korisno za grubi presjek |

> Dok se ne riješi licenca javnih registara, **ne prikazuj agregat kao da je
> potpun.** „44.000 elektrana u Hrvatskoj, 312 na ovoj karti" je poštena
> formulacija; prešutjeti razliku nije.

---

## 5. Tehnički okvir

| | Naš app (Faza 1) | gis sloj (Faza 2) |
|---|---|---|
| Biblioteka | **maplibre-gl** — isto što karta-web već koristi | maplibre-gl |
| Bazne pločice | OpenFreeMap ili pmtiles | pmtiles (postoji) |
| Podaci | GeoJSON iz mocka | PostgREST → GeoJSON, lazy |
| Granice | JLS/županije iz `data-pipeline` | postoji |

**Ne uvoditi drugu kartografsku biblioteku.** Cijela obitelj je na maplibre; druga
bi značila drugi stil, druge pločice i dvostruko održavanje.

---

## 6. Koraci za sloj na gis.domovina.ai (Faza 2)

Po uzoru na to kako je dodan pinka sloj:

1. `src/lib/solar.ts` — fetch elektrana (kopija `pinka.ts` s našom tablicom)
2. `src/hooks/useSolarLayer.ts` — kopija `usePinkaLayer.ts`
3. `src/lib/layers.ts` + `useLayerControls.ts` — registracija prekidača
4. `MapState.tsx` — `showSolar` zastavica
5. `types.ts` — `SolarPlantFeature` / `SolarPlantProperties`
6. deep-link `/elektrane?e={slug}`
7. README + `docs/ui-refactor-plan.md` dopuna

**To je izmjena u tuđem repou** (`domovinatv/karta-hrvatske`) — zasebna grana i PR,
ne dio ovog repoa.

---

## 7. Otvoreno

- [ ] ⚠️ **Prije lansiranja: provjeriti Registar OIEKPP u pregledniku.** Hrvatska već
      ima službeni registar OIE s interaktivnom kartom. Naša karta se **ne smije**
      pozicionirati kao „prva" ni „jedina" — diferencijacija mora biti stvarna
      (opseg, upotrebljivost, klikabilnost projekta, status priključka).
      „Ovo ne postoji" je najlakše oboriva rečenica na sajmu
      ([13](./13-konkurencija.md) §9.1).
- [ ] Licenca podataka HROTE/HERA/HEP-ODS/OIEKPP ([03](./03-pravni-okvir.md) §9.7)
- [ ] Clustering prag i vizualni jezik klastera
- [ ] Bazne pločice: OpenFreeMap (besplatno, bez ključa) vs vlastiti pmtiles
- [ ] Prikaz **mrežnog uskog grla** po županijama — nitko to ne agregira, a bio bi
      najjači razlog da netko dođe na kartu ([02](./02-trziste-hrvatska.md) §6.4)
