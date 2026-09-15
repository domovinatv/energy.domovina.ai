# 09 — Dizajn sustav

Zadnja revizija: **15.9.2026.**

---

## 1. Odluka: koji brand

Tri postojeća sustava u obitelji, svaki s vlastitim SSOT-om:

| Sustav | SSOT | Karakter | Koristi se za |
|---|---|---|---|
| **pinka** | `pinka-finance/app/tailwind.config.ts` | cream/sand, koraljna, šumska zelena, serif display | pinka.finance, pinka.io, `pinka-finance/energy` |
| **airKUNA** | `airkuna/airkuna-web/com/index.html` `:root` | paper/navy/gold, Fraunces + Inter | airkuna.com/.org, mpt.hr, tokenizacija |
| **DOMOVINA wallet** | `zef-novcanik-prototip/BLUEPRINT.md` §2 | navy + akcent, CSS vars kao RGB kanali | novčanici, bijela etiketa |

**Odabrano: pinka tokeni kao baza, s energetskim akcentom.**

Razlozi: (a) prethodnik `pinka-finance/energy` već ih koristi i njegove komponente
preuzimamo ([10](./10-reuse-mapa.md)); (b) cream/sand + forest je toplije i manje
„fintech" od navy/gold, što odgovara zajedničkom vlasništvu; (c) airKUNA navy/gold
nosi „institucionalno financiranje", što je pogrešan signal za model koji
eksplicitno **ne** nudi prinos.

---

## 2. Tokeni

Iz `pinka-finance/app/tailwind.config.ts`, doslovno:

```
cream      #FBF8F3    pozadina
sand       #F5EFE6    sekundarna ploha
sandDeep   #F0E6D2
ink        #1A1A1A    tekst
inkSoft    #3A3A3A
inkMuted   #6B6B6B
coral      #E85D5D    pinka akcent  → kod nas SEKUNDARNO
teal       #0F4C5C    tamna, focus ring
forest     #2D6A4F    → kod nas PRIMARNI akcent
rust       #9B2226    greške/upozorenja
border     rgba(26,26,26,0.12)
```

**Energetski dodatak** (jedini novi token):

```
solar      #E8A33D    jantar — markeri elektrana, energija, proizvodnja
solarSoft  #FBF0DC    podloga za istaknute energetske brojke
```

⚠️ **Jantar nije CTA boja.** `#E8A33D` na bijelom ima nizak kontrast — ista zamka
kao gold `#EFAB23` u `zef-novcanik-prototip` (2.89:1, jedva AA za veliki tekst).
Pravilo: jantar nosi **podatak** (marker, brojka na jantarnoj podlozi s tamnim
tekstom), nikad primarni gumb. Primarni CTA je `forest` s `cream` tekstom.

### 2.1 Tipografija

```
sans     var(--font-sans)     → body, UI, brojke
display  var(--font-display)  → naslovi, serif
```

Veličine `display-xl/lg/md` s `clamp()` — iz pinka konfiguracije, nepromijenjeno.

### 2.2 Ostalo

`radius`: lg 16px · md 12px · sm 8px
`shadow`: `soft` (kartice) · `lift` (hover)
`maxWidth`: content 1200px · hero 1280px

---

## 3. Semantika boje statusa

Boja nosi značenje na tri mjesta — karta, kartica, badge — i mora biti ista.

| Značenje | Token |
|---|---|
| u pogonu | `solar` |
| u izgradnji | `solar` + isprekidani rub |
| planirana | `inkMuted` |
| traži suradnju | `forest` |
| zajednica | `teal` |
| upozorenje (bez priključka, bez Safea) | `rust` |
| demo / prototip | `sandDeep` podloga + `inkMuted` tekst |

---

## 4. Tema

**Samo svijetla**, barem u Fazi 1.

Razlog: prototip se pokazuje na sajmu, na projektoru i na tuđim mobitelima; jedna
tema znači jedan skup provjerenih kontrasta. airkuna-web isto nema tamnu temu.

Ako se kasnije doda: tokeni kao **CSS varijable s RGB kanalima** (`--forest: 45 106 79`),
ne hex — inače Tailwind opacity modifikatori (`bg-forest/10`) prestanu raditi.
Naučeno u `zef-novcanik-prototip` gotcha 10.

---

## 5. Komponente koje se preuzimaju

Iz `pinka-finance/energy/components/` (rade, provjerene):

| Komponenta | Promjena |
|---|---|
| `plant-card.tsx` | ➕ `grid_status` red, ➕ demo badge |
| `status-badge.tsx` | ➕ `grid_status` varijante |
| `plant-form.tsx` | ➕ polja iz [05](./05-podatkovni-model.md) §2 |
| `energy-header/footer.tsx` | ➕ ITalk impresum ([03](./03-pravni-okvir.md) §7) |

Iz `pinka-finance/app/components/`:

| Komponenta | Namjena |
|---|---|
| `contribute-panel.tsx` | tijek doprinosa |
| `permanent-qr.tsx` | trajni uplatni QR |
| `mermaid-diagram.tsx` | dijagrami na `/kako-radi` |
| `language-switcher.tsx` | HR/EN |
| `ui/button.tsx` | cva primitiv |

---

## 6. Pravila

1. **Nikad hex u komponenti.** Sve preko Tailwind tokena. (Prekršeno jednom u
   `usePinkaLayer.ts` — `PINKA_CORAL` je hardkodiran jer maplibre ne čita Tailwind;
   to je jedina dopuštena iznimka, i mora imati komentar koji kaže iz kojeg tokena
   dolazi.)
2. **Bez emojija u UI-ju.**
3. **Iznosi** uvijek `Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' })`.
   Energija: `kWp` za snagu, `kWh`/`MWh` za proizvodnju, `MW` za agregat.
4. **Demo oznaka je dio dizajna**, ne naljepnica zalijepljena na kraju. Traka na
   vrhu + badge na svakoj kartici s `demo: true`.
5. **Kontrast:** provjeriti svaki par teksta i podloge prije commita; jantar je
   poznata zamka (§2).
6. **Mobile-first.** Publika na sajmu gleda na mobitelu.
