# 17 — Sandbox kampanja pod bijelom etiketom

> Stanje: 20.10.2026. `/sandbox/` live, kampanja registrirana, javni ključ u `lib/rail-profile.ts`.

## 1. Što i zašto

Prikaz kampanje doprinosa koji se smije pokazati bilo kome: **isti kod koji na `/beta/`
miče pravi novac**, ali na tenantu `italk-sandbox` (Monerium sandbox, Chiado). Banka se
simulira, a sve iza nje je pravi put raila: Monerium order, webhook, mint EURe na Safe
kampanje i status uživo (SSE).

Brend je **placeholder** (`lib/white-label.ts`). Fokus je funkcionalnost; brend se
„blueprinta" kad tok radi (§4).

## 2. Kako je složeno

| Dio | Datoteka |
|---|---|
| Profil raila (tenant, lanac, EURe, RPC, Blockscout, ključ) | `lib/rail-profile.ts` — `RAIL_ITALK`, `RAIL_ITALK_SANDBOX` |
| Čitanje lanca po profilu | `lib/beta-chain.ts`, `lib/safe-rpc.ts` |
| Intent s `Bearer pk_…` i simulirana SEPA uplata | `lib/mpt-intent.ts` — `createPaymentIntent({ rail })`, `simulateSandboxTransfer` |
| Panel: u sandboxu gumb umjesto EPC QR-a | `components/beta/intent-panel.tsx` — `SandboxTransfer` |
| Kampanje (`demo: true`) | `lib/sandbox-campaigns.ts` |
| Stranice i okvir | `app/sandbox/`, `components/sandbox/` |

Rail strana već postoji: `POST /api/intents/:sid/monerium-sandbox-transfer`
(pay.domovina.ai `backend/src/monerium/sandboxFund.ts`) odbija svaki intent koji nije na
Monerium sandbox tenantu, pa gumb ne može pomaknuti pravi novac.

**Tri pravila:**

- **Sandbox IBAN se nikad ne crta kao EPC QR.** Netko bi ga skenirao bankom i poslao
  pravi novac na račun koji ne postoji. IBAN stoji samo kao tekst s oznakom „nije pravi
  račun", bez gumba za kopiranje.
- **Bez potvrde o uplati u sandboxu.** Potvrda se provjerava na Gnosisu (docs/16) i znači
  dokaz uplate, a simulirana uplata nije uplata.
- **Traka i oznaka su obavezne** (CLAUDE.md pravilo 3), jer sandbox izgleda potpuno stvarno.

## 3. Kampanja `primjer-kampanje`

- Safe `0xb7A3d779E416C71b97A5bf81D6E6C5C98ac0241D` (Chiado, 2-od-3), napravljen
  20.10.2026. s `funding-init.mjs --env sandbox --project energy-demo-kampanja`. Povezan
  je s Monerium sandboxom i upisan u pay.domovina.ai `tools/funding/projects.sandbox.json`.
- **Otvoreno (ručno, admin traži prijavu):**
  1. kampanja i whitelista u konzoli `mpt.domovina.ai/admin`:
     `fetch('/admin/api/tenants/italk-sandbox/campaigns', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({campaign_id:'energy-demo-kampanja', safe_address:'0xb7A3d779E416C71b97A5bf81D6E6C5C98ac0241D', label:'Primjer kampanje'})}).then(r=>r.json())`
  2. javni ključ: `POST /admin/api/tenants/italk-sandbox/keys` s `{"kind":"public"}`.
     `pk_…` ide u `ITALK_SANDBOX_PUBLIC_KEY` (`lib/rail-profile.ts`). Dok je `null`,
     stranica kaže da uplata nije podešena.
  3. (nije nužno) ProjectRouter na glavnom Safeu `italk-sandbox`: `funding-init` korak 6
     je odbijen jer delegat nije registriran. Simulirana uplata nosi referencu, pa mint
     ide izravno na Safe kampanje i bez routera.

## 4. Blueprint brenda (kasnije)

`WHITE_LABEL` postaje konfiguracija po klijentu, birana pri buildu (statički export
znači jedan build po brendu i zaseban host): ime, logo, boje kao CSS varijable s RGB
kanalima (CLAUDE.md, tamna tema), impresum, profil raila i popis kampanja. Za drugi
host treba nova stavka u rail `ALLOWED_ORIGINS`. Uzor je pay.domovina.ai ADR 0015.
Copy kampanja klijenta prolazi isti `lint:copy`: to je Mod 2, gdje nas non-custody ne
štiti (docs/14 §2.4).

## 5. Provjereno 20.10.2026.

U Braveu na `energy.domovina.ai/sandbox/primjer-kampanje/`: 1 € pa 10 €, gumb „Simuliraj
uplatu". Od klika do „Na Safeu kampanje" je prošlo 8 s, odnosno 2 s. Ukupno prikupljeno je
11,00 €, što se slaže s `balanceOf` na Chiadu.

**Nađen i ispravljen bug koji vrijedi i za `/beta/`:** u izravnom načinu rail šalje
`forward_error: "direct_mint"` i `forward_tx_hash: null`, pa se zaprimljena uplata iz
`localStorage` nikad nije uparila s prijenosom na lancu i iznos se zbrajao dvaput (2,00 €
umjesto 1,00 €). `statusFromJson` sad uzima zadnji mint tx kao dolazak na Safe. Stari
zapisi se sami poprave pri sljedećoj provjeri (`PendingWatcher`).

Chiado Blockscout povremeno ne odgovori iz preglednika (`Failed to fetch`); minutu kasnije
radi. Saldo dolazi s RPC-a, pa je samo popis uplata privremeno prazan.
