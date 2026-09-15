# 10 — Mapa ponovne upotrebe

Zadnja revizija: **15.9.2026.**

Što se točno uzima iz kojeg repoa, u kojem obliku, i pod kojim uvjetima.
**Tri načina preuzimanja**, i razlika je bitna:

| Oznaka | Značenje |
|---|---|
| **KOPIJA** | datoteka se kopira u ovaj repo i dalje živi svojim životom. Izvor se navodi u zaglavlju datoteke. |
| **UZOR** | obrazac se prepisuje, kod ne. |
| **VEZA** | ostaje u izvornom repou, mi ga koristimo kao servis ili ga mijenjamo PR-om. |

---

## 1. `pinka-finance/energy` — izravni prethodnik

`domovina.energy`, Faza 1 registra napisana pa **on hold**
(`landing/docs/EKOSUSTAV.md` §3.4). Najbliži izvor.

| Što | Kako | Napomena |
|---|---|---|
| `components/plant-card.tsx` | **KOPIJA** | ➕ `grid_status`, ➕ demo badge |
| `components/status-badge.tsx` | **KOPIJA** | ➕ varijante |
| `components/plant-form.tsx` | **KOPIJA** | ➕ polja iz [05](./05-podatkovni-model.md) |
| `components/energy-header.tsx`, `energy-footer.tsx` | **KOPIJA** | ➕ ITalk impresum |
| `app/page.tsx` (registar + filtri + statistika) | **KOPIJA** | ➕ karta iznad popisa |
| `app/elektrana/page.tsx` | **KOPIJA** | |
| `app/prijava/page.tsx` | **KOPIJA** | |
| `lib/i18n.tsx` | **KOPIJA** | |
| `tailwind.config.ts` | **UZOR** | ne nasljeđujemo `../app` — izolirani repo, tokeni se kopiraju ([09](./09-dizajn-sustav.md)) |

⚠️ **Ne preuzimati shared-lib wiring** (`@/*` → `../app/*`, `externalDir: true`).
To je bio monorepo kompromis; ovdje je repo izoliran i to je namjerno.

---

## 2. `pinka-finance/app` — pinka.io

| Što | Kako | Napomena |
|---|---|---|
| `lib/solar.ts` | **KOPIJA** | tipovi + `HR_COUNTIES`; upite zamijeniti mockom u Fazi 1 |
| `docs/energy-solar/DB-MIGRATION.sql` | **KOPIJA u `docs/`** | referenca za Fazu 2; **ne primjenjivati** — shema živi u `domovina-api` |
| `lib/chain/{safe,passkey,constants,walletSdk}.ts` | **VEZA / UZOR** | Faza 1 ne zove lanac; struktura se zrcali |
| `components/contribute-panel.tsx` | **KOPIJA** | |
| `components/permanent-qr.tsx` | **KOPIJA** | |
| `components/mermaid-diagram.tsx` | **KOPIJA** | |
| `components/language-switcher.tsx`, `ui/button.tsx` | **KOPIJA** | |
| `lib/auth.tsx` (`VerifiedGate`), `lib/certilia.ts` | **UZOR** | Faza 1 simulira gate |
| `app/dashboard/new/page.tsx` | **UZOR** | čarobnjak + sessionStorage draft prije wallet handoffa |
| `app/kako-radi/diagrams.ts` | **UZOR** | mermaid obrazac |
| `docs/SECURITY-FINDINGS.md` | **ČITATI** | checklist B invarijante; A1–A3 još otvoreni |
| `docs/wallet-campaign-account-handoff.md` | **ČITATI** | ugovor SDK ≥ 0.10; wallet strana **još nije isporučena** |

---

## 3. `pinka-finance/landing` — pinka.finance

| Što | Kako | Napomena |
|---|---|---|
| `TECH_STACK.md` | **UZOR** | cijeli stack landinga, verzije fiksne |
| struktura `components/sections/` | **UZOR** | jedna datoteka po sekciji |
| `lib/i18n/` (HR izvor, EN tipiziran prema njemu) | **UZOR** | |
| `lib/fees.ts` | **KOPIJA** | SSOT stopa; ⚠️ SEPA = 0,25–**0,40** €, ne 0,45 |
| `docs/pravni-okvir-primanja-sredstava.md` | **ČITATI — i dalje vrijedi** | [03](./03-pravni-okvir.md) ga nadograđuje, ne zamjenjuje |
| `docs/EKOSUSTAV.md` | **ČITATI** | karta obitelji + pravila usklađenosti |
| `worker/index.js` + `d1/schema.sql` | **UZOR** | ako landing dobije formu za pilot |

---

## 4. `domovinatv/mpt-landing` — mpt.hr

Najbolji uzor za **dijagram + simulaciju + testove iz jednog artefakta**.

| Što | Kako | Napomena |
|---|---|---|
| `src/lib/mpt-machine.ts` | **UZOR** | naš ekvivalent: `lib/energy-machine.ts` |
| `src/lib/mpt-machine.test.ts` | **UZOR** | invarijante ([06](./06-produkt-landing.md) §2) |
| `src/components/FlowDiagram.tsx`, `SimulationPlayer.tsx`, `MermaidFlow.tsx` | **UZOR/KOPIJA** | responzivno: React Flow ≥1024px, Mermaid <1024px |
| `src/lib/market-fees.ts` | **ČITATI s oprezom** | ⚠️ ima poznatu grešku 0,45 € |
| `CLAUDE.md` | **ČITATI** | OpenNext zamke, regulatorni framing, impresum doslovno |

---

## 5. `airkuna/tokenizacija` — frakcijska tokenizacija nekretnina

Najbliži **marketplace** uzor u obitelji.

| Što | Kako | Napomena |
|---|---|---|
| `docs/plan/` (8 dokumenata) | **UZOR strukture** | ova baza znanja slijedi isti obrazac |
| `docs/plan/02-realt-model-i-regulativa.md` | **ČITATI — vrijedi** | MiFID II, prospekt, DLT Pilot, RealT pouka |
| struktura detalja (tabovi: Istaknuto / Financije / Detalji / Blockchain / Ponuda) | **UZOR** | [07](./07-produkt-app.md) §2.3 — **bez financijskih obećanja** |
| `components/{PropertyCard,FinancialsTable,ProcessSteps,StatBlock}.tsx` | **UZOR** | |
| `components/{TokenSlider,YieldChip,KupovniModal}.tsx` | ❌ **NE** | nose model D ([03](./03-pravni-okvir.md) §3) |
| `components/DisclaimerBar.tsx` | **KOPIJA** | oznaka simulacije na svakom ekranu |
| `config/brands/` | **UZOR** | bijela etiketa kasnije |
| `data/properties.json` | **UZOR** | jedan JSON = jedan izvor podataka |
| `CLAUDE.md` | **ČITATI** | konvencije prototipa (hr, EUR, bez emojija, nikad `any`) |

---

## 6. `zef/zef-novcanik-prototip` — self-custody novčanik

| Što | Kako | Napomena |
|---|---|---|
| `BLUEPRINT.md` | **ČITATI** | 5 točaka bijele etikete, stack tablica |
| `src/lib/mock.ts` obrazac | **UZOR** | jedna datoteka, ekrani sadržaj-agnostični |
| gotchas iz `CLAUDE.md` | **ČITATI** | mermaid+font, `zoom` na `html`, RGB kanali, gold kontrast |
| `docs/compliance/isplativost-wallet.md` | **ČITATI, NE LINKATI** | interni nacrt ZEF-a; kanonski izvor stopa, ali se ne citira javno |

---

## 7. `domovinatv/karta-hrvatske` — gis.domovina.ai

| Što | Kako | Napomena |
|---|---|---|
| `apps/karta-web/src/lib/pinka.ts` | **UZOR** | PostgREST fetch + `accept-profile` header |
| `apps/karta-web/src/hooks/usePinkaLayer.ts` | **UZOR** | lazy fetch, `loadingRef`, popup, deep-link |
| bazni slojevi, pmtiles, JLS/županije | **VEZA** | ne kopirati podatke |
| dodavanje sloja „Sunčane elektrane" | **PR u taj repo** | Faza 2, [08](./08-karta-i-geo.md) §6 |

---

## 8. `airkuna/airkuna-web` i `domovinatv/pay.domovina.ai`

| Što | Kako | Napomena |
|---|---|---|
| `airkuna-web/com/index.html` `:root` | **ČITATI** | airKUNA brand SSOT — **ne** naš brand ([09](./09-dizajn-sustav.md) §1) |
| `airkuna-web/research/licence-hanfa-hnb.md` | **ČITATI** | MiCA/PSD2/CASP/PI analiza |
| `airkuna-web/docs/00-ssot-index.md` | **ČITATI** | SSOT ostalih brojki obitelji |
| `pay.domovina.ai` — rail, wallet, Monerium | **VEZA** | kanonski izvor mehanizma; nikad modelirati iz sjećanja |

---

## 9. Pravila preuzimanja

1. **Svaka KOPIJA nosi zaglavlje** s izvornom putanjom i datumom. Bez toga se za
   šest mjeseci ne zna je li divergencija namjerna.
2. **Dokumenti se ne prepisuju, nego referenciraju.** Pravni okvir donacija živi u
   `pinka-finance/landing/docs/`; [03](./03-pravni-okvir.md) ga proširuje i linka,
   ne duplicira.
3. **Brojke se ne kopiraju, nego uvoze.** Stope iz `fees.ts`, tržišne brojke iz
   [02](./02-trziste-hrvatska.md).
4. **Ne uvoziti komponente koje nose zabranjeni model.** `TokenSlider`, `YieldChip`
   i `KupovniModal` su korektni u svom repou i pravno pogrešni u ovom.
5. **Izmjene u tuđim repoima idu PR-om**, ne kopiranjem natrag.
