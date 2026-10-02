# 04 — `/beta/`: pravi novac

`/beta/` je jedini dio koda koji rukuje pravim novcem, pa je ovdje mjera
drugačija: ne „je li uredno", nego „je li svaki izvor istine o uplati jedan".
Logika je dobra i dokumentirana (`docs/15` §6); problem je da živi u
komponentama i da isti intent čitaju dvije petlje odjednom.

**Ne dirati bez čitanja `docs/15` §6 i `pay.domovina.ai`:** faze intenta,
značenje `received_processing`, zašto se uplata pribraja prije minta, zašto se
hash forwarda pamti. Ovo je refactor rasporeda koda, ne ponašanja.

---

## R4.1 · Polling i stanje lanca → hookovi  `P2 · M`

**Stanje.** `components/beta/beta-page.tsx` (525 redaka) drži tri petlje
dohvaćanja u tri komponente:

| Komponenta | Što polla | Interval | Redci |
|---|---|---|---|
| `LiveActivity` | `fetchSafeActivity` (gnosisscan) | 20 s + 3 s/8 s nakon forwarda, samo vidljiva kartica | 246–296 |
| `PendingWatcher` | `fetchIntentStatus` za svaku zaprimljenu bez hasha | 15 s | 164–205 |
| `IntentPanel` (`intent-panel.tsx`) | `fetchIntentStatus` za otvoreni intent | 2 s | 53–88 |

Uz to `AnimatedEur` (208–230) i `PayWithIntent` (401–497) drže vlastito
stanje. Tri `eslint-disable-next-line react-hooks/exhaustive-deps` u ovom
direktoriju (od četiri u repou) su simptom: efekti ovise o stvarima koje nisu
u ovisnostima jer su u komponenti umjesto u hooku s jasnim ulazom.

**Prijedlog.** `lib/beta/` ili `components/beta/hooks/`:

- `useSafeActivity(safe: Address, refreshKey: number): LoadState` — sve iz
  `LiveActivity` efekta (visibilitychange, interval, burst nakon forwarda,
  „greška ne briše prikazano"). Čisti ulaz/izlaz, nema JSX-a.
- `useIntentStatus(statusUrl: string, intervalMs: number): IntentStatus` —
  jedna petlja, zaustavlja se na terminalnoj fazi, mrežnu grešku ignorira.
  Koriste je i `IntentPanel` i `PendingWatcher` (R4.2).
- `useAnimatedNumber(target: number, durationMs): number` — iz `AnimatedEur`,
  s `prefers-reduced-motion`.
- Izvedenice iz `pending` + lanca (`unconfirmed`, `receivedCents`, `latest`,
  `onChain` skup) iz `LiveActivity:298–311` u čistu funkciju
  `mergeChainAndPending(activity, pending)` u `lib/pending-payments.ts`, uz
  `unconfirmedCents` koji ondje već stoji — i test za nju (danas je
  `unconfirmedCents` testiran, a popis `unconfirmed` koji se prikazuje nije).

**Kriterij dovršenosti.** `beta-page.tsx` ≤ 250 redaka, bez `useEffect` s
`fetch`. Nijedan `eslint-disable` u `components/beta/`. Ponašanje provjereno
tehnikom iz dnevnika §12.2 (podmetanje `**/api/intents/*` odgovora za faze
`received_processing` / `settled` / `rejected`).

---

## R4.2 · Isti intent polla dvije petlje istodobno  `P2 · S`

Dok je `IntentPanel` otvoren i uplata zaprimljena, `PendingWatcher` **isti**
`statusUrl` čita svakih 15 s, a `IntentPanel` svake 2 s. Uz to `IntentPanel`
pri svakom 2-sekundnom odgovoru u fazi `received_processing` poziva
`onPayment` → `savePending` → `localStorage.setItem` + `dispatchEvent` → svi
`usePending` pretplatnici ponovno čitaju (`intent-panel.tsx:60–70`).
`upsertPending` to čini idempotentnim, pa nije bug — ali je ~8 upisa u minutu
u storage bez promjene.

**Prijedlog.**

1. `PendingWatcher` preskače intente čiji `sid` trenutno ima otvoren
   `IntentPanel` (prop `activeSid: string | null` iz `ProjectSection`).
2. `IntentPanel` zove `onPayment` samo kad se **promijeni** faza ili hash
   (usporedba s prethodnim statusom u `useIntentStatus`), ne pri svakom
   odgovoru.
3. Oba koriste `useIntentStatus` iz R4.1 — jedna implementacija petlje.

**Kriterij dovršenosti.** U mrežnoj kartici za jedan otvoreni intent postoji
jedan zahtjev na `status_url` svake 2 s, nijedan dodatni; `localStorage` se
piše pri promjeni faze, ne pri svakom odgovoru.

---

## R4.3 · API `pending-store` i mali oblici u `beta-page.tsx`  `P3 · S`

- `usePending(project.safe ?? "")` (`beta-page.tsx:66`) čita ključ
  `domovina-energy:pending:` za projekt bez Safea. Bezopasno, ali potpis laže.
  `usePending(safe: Address | null)` koji za `null` vraća `EMPTY` bez čitanja.
- `PayWithIntent` predaje `IntentPanel`-u render-prop `copyRow` koji samo
  omata lokalni `Row` (`beta-page.tsx:429`). `Row` s gumbom „kopiraj" i
  vlastitim `copied` stanjem (`:500–525`) je samostalna komponenta —
  `components/beta/copy-row.tsx` — i `IntentPanel` je uvozi izravno.
- `Fact` (`:232`) → `components/ui/figure.tsx` (R2.2).
- Konstante `RECENT_COUNT`, `REFRESH_MS`, `PENDING_CHECK_MS`, `SETTLE_RETRY_MS`,
  `POLL_MS` (u `intent-panel.tsx`) na jedno mjesto, `lib/beta/timing.ts`, s
  komentarom koji ih veže na `docs/15` §6 „Plan: push umjesto pollinga" — kad
  dođe SSE, mijenja se jedna datoteka.

---

## R4.4 · `readonly` i zastarjeli komentari u `lib/beta-projects.ts`  `P2 · S`

- `BetaProject` i `OWNER_SIGNERS` nemaju `readonly` polja, za razliku od
  svega u `lib/types.ts`. `BETA_PROJECTS` je `readonly BetaProject[]`, ali
  svaki element je promjenjiv. `signers.owners: Address[]` isto. Dodati
  `readonly` svugdje; `hasVerifiedSafe`/`isPayable` type-guardovi se ne
  mijenjaju.
- Zaglavlje datoteke (redci 1–14) kaže: „Uplatitelj šalje SEPA nalog izravno
  (Monerium mintuje EURe na Safe projekta), a stranica samo čita Gnosis Chain."
  To opisuje odbačeni `gnosis:<safe>` put. Stvarni put (2.10.) je MPT intent:
  Monerium → rail Safe → forward na Safe elektrane, uz `localStorage` sloj za
  zaprimljene uplate. Komentar uz `MPT_INTENT` (`:36–45`) to točno opisuje;
  zaglavlje ne. Prepisati zaglavlje da upućuje na `MPT_INTENT` i `docs/15` §6.
- Dvije prazne linije na vrhu i dvije prije `PRESET_AMOUNTS_EUR` — ostaci
  brisanja.
- `BetaPayment = { kind: "mpt-intent" }` je unija s jednim članom. Ili ostaviti
  s komentarom „unija jer su drugi putovi bili i mogli bi se vratiti" (već
  djelomično piše), ili pojednostaviti u `payment: boolean`. Preporuka:
  ostaviti uniju — `docs/15` §6 još raspravlja put B (izravni mint).

---

## R4.5 · Testovi za `mpt-intent.ts` i `beta-chain.ts`  `P2 · M`

Danas su testirane čiste funkcije (`isPayable`, `parseAmountEur`, `weiToCents`,
`decodeAddressArray`, `unconfirmedCents`, `upsertPending`). Nisu testirani:

- `createPaymentIntent` — mapiranje `IntentJson` → `PaymentIntent`, grane
  `target_not_whitelisted` / `invalid_amount_eur` / `amount_out_of_range` /
  mrežna greška / nepotpun odgovor (`mpt-intent.ts:78–109`).
- `fetchIntentStatus` — zamjenski izbor faze iz `state` kad `status` izostane
  (`:111–119`).
- `fetchSafeActivity` — straničenje do `MAX_PAGES`, `truncated`, zbroj,
  pronalazak EURe salda po `address_hash` **ili** `address`
  (`beta-chain.ts:53–84`).

Sve tri rade s `fetch` i daju se testirati s `vi.stubGlobal("fetch", …)` u
Node okruženju, bez jsdoma. To su funkcije kroz koje prolazi pravi novac;
test koji lovi promjenu oblika railovog JSON-a vrijedi više od bilo kojeg
drugog u ovom dokumentu.

**Kriterij dovršenosti.** `lib/__tests__/mpt-intent.test.ts` i
`beta-chain.test.ts` pokrivaju nabrojane grane; svaki test ima naziv koji kaže
koju tvrdnju čuva (konvencija repoa).

---

## Napomene

- `lib/safe-rpc.ts` se koristi samo iz `scripts/check-beta.mts` (Node). Ostaje
  u `lib/` jer ga testovi i skripta dijele; `GNOSIS_RPC` ne treba biti izvezen.
- `scripts/check-beta.mts` ne provjerava whitelist na railu (admin API) — to je
  dokumentirano u zaglavlju i u `docs/15` §6. Nije rupa u kodu, nego u ovlasti.
- Copy-nalazi na `/beta/` (proturječne rečenice o ključevima, put novca kroz
  rail) su u `00-pregled.md` §5 i **nisu** za Opus.
