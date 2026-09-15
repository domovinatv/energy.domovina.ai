/**
 * Tok novca kao JEDAN artefakt — čvorovi, veze, prijelazi, scenariji i labele.
 *
 * Iz ovoga se izvode SVA četiri prikaza (docs/06 §2):
 *  1. React Flow dijagram (≥1024px)   — `components/money-flow-reactflow.tsx`
 *  2. Mermaid dijagram (<1024px)      — `components/money-flow-mermaid.tsx`
 *  3. Simulacija po koracima          — `components/money-flow.tsx`
 *  4. Testovi invarijanti             — `lib/__tests__/energy-machine.test.ts`
 *
 * ⚠️ NIKAD NE MODELIRAJ TOK NOVCA IZ SJEĆANJA (CLAUDE.md §Naučene zamke). Ovaj
 * je graf prepisan iz dokumenata i iz koda, ne iz glave:
 *  - `docs/04-financijska-arhitektura.md` §2 — slojevi i smjer strelica
 *  - `docs/04` §4 — tko koji korak plaća (tablica), izvor stopa je `lib/fees.ts`
 *  - `docs/14-poslovni-model.md` §1 — dva moda; §5.1 — plaćanje po situaciji
 *  - `domovinatv/mpt-landing/src/lib/mpt-machine.ts` — obrazac (UZOR, docs/10 §4)
 *  - `domovinatv/pay.domovina.ai` — kanonski rail, referenca `mpt:0x<addr>?sid=<id>`
 *
 * ⚠️ RAZLIKA PREMA mpt-machineu, i nije kozmetička: ondje je jedan rail i jedan
 * korisnik. Ovdje su DVA MODA (docs/14 §1), a razlika među njima je cijela
 * tvrdnja proizvoda. U Modu 2 novac **ne prolazi kroz nas** — to znači da čvor
 * `rail` u tim scenarijima ne smije imati saldo nijednom. Test to čuva.
 *
 * ⚠️ Iznosi su u CENTIMA, kao i drugdje u repou (`lib/format.ts`). Zbroj salda
 * je tada cjelobrojan i invarijanta očuvanja nema zaokruživanja koje bi je
 * moglo tiho popustiti.
 */
import type { Locale } from "./i18n";
import type { ProjectMode, ProjectRails } from "./types";
import { violatesConflictInvariant } from "./types";
import { PLATFORM_TAKE_PCT, SEPA_FEE_MAX, SEPA_FEE_MIN } from "./fees";

/** Dvojezična labela. Tipizirana prema `Locale`, pa novi jezik ruši `tsc`. */
export type L10n = Record<Locale, string>;

// ─────────────────────────────────────────────────────────────────────────────
// Čvorovi
// ─────────────────────────────────────────────────────────────────────────────

export type NodeId =
  | "contributorBank"
  | "monerium"
  | "rail"
  | "projectSafe"
  | "contractor"
  | "contractorBank"
  | "plant";

/**
 * `account` drži saldo, `outcome` ga ne drži nikad.
 *
 * Elektrana je razlog zbog kojeg se sve ovo događa, pa mora biti na dijagramu —
 * ali nije novčani čvor. Da jest, invarijanta očuvanja bi se „zatvorila" tako
 * što novac nestane u elektranu, što nije ni točno ni provjerljivo. Test traži
 * da `outcome` čvor nema saldo ni u jednom koraku.
 */
export type NodeKind = "account" | "outcome";

export interface FlowNode {
  readonly id: NodeId;
  readonly kind: NodeKind;
  readonly title: L10n;
  readonly subtitle: L10n;
  /** Tko je vlasnik čvora u Modu 1 i u Modu 2 — razlika je cijela poanta. */
  readonly ownership?: L10n;
  /** Položaj u React Flow dijagramu. */
  readonly x: number;
  readonly y: number;
}

export const nodes: readonly FlowNode[] = [
  {
    id: "contributorBank",
    kind: "account",
    title: { hr: "Banka uplatitelja", en: "Contributor's bank" },
    subtitle: {
      hr: "Bilo koja banka s IBAN-om u eurozoni. Običan SEPA nalog, bez novog računa i bez aplikacije.",
      en: "Any bank with a eurozone IBAN. An ordinary SEPA order — no new account, no app.",
    },
    x: 0,
    y: 0,
  },
  {
    id: "monerium",
    kind: "account",
    title: { hr: "Monerium", en: "Monerium" },
    subtitle: {
      hr: "Institucija za elektronički novac (EMI / MiCA EMT). Zamjenjuje euro s računa za EURe 1:1 i natrag.",
      en: "An e-money institution (EMI / MiCA EMT). Swaps bank euro for EURe 1:1, and back.",
    },
    ownership: {
      hr: "U Modu 1 IBAN je naš. U Modu 2 je klijentov i mi mu nemamo pristup.",
      en: "In Mode 1 the IBAN is ours. In Mode 2 it is the client's and we have no access to it.",
    },
    x: 260,
    y: 0,
  },
  {
    id: "rail",
    kind: "account",
    title: { hr: "Naše šine", en: "Our rail" },
    subtitle: {
      hr: "Referenca oblika mpt:0x<adresa>?sid=<id> veže uplatu uz točan projekt, a zatim se iznos prosljeđuje dalje.",
      en: "A reference shaped mpt:0x<address>?sid=<id> ties the payment to the right project, then forwards it on.",
    },
    ownership: {
      hr: "Postoji SAMO u Modu 1. U Modu 2 novac ide ravno na klijentov račun i ovaj čvor se ne dodiruje.",
      en: "Exists ONLY in Mode 1. In Mode 2 the money goes straight to the client's account and this node is never touched.",
    },
    x: 520,
    y: 0,
  },
  {
    id: "projectSafe",
    kind: "account",
    title: { hr: "Račun projekta", en: "Project account" },
    subtitle: {
      hr: "Safe multisig na Gnosisu. Traži M od N potpisa, saldo je javan, a potpisnici su članovi zajednice.",
      en: "A Safe multisig on Gnosis. Needs M of N signatures, the balance is public, and the signers are the community's members.",
    },
    ownership: {
      hr: "Uvijek članovi. U Modu 1 mi držimo najviše jedan ključ, u Modu 2 nijedan.",
      en: "Always the members. In Mode 1 we hold at most one key, in Mode 2 none.",
    },
    x: 780,
    y: 0,
  },
  {
    id: "contractor",
    kind: "account",
    title: { hr: "Izvođač", en: "Contractor" },
    subtitle: {
      hr: "Naplaćuje po situaciji: temelj, oprema na gradilištu, montaža, puštanje u pogon. Svaka isplata traži potpise članova.",
      en: "Paid per progress stage: foundation, equipment on site, mounting, commissioning. Every release needs the members' signatures.",
    },
    ownership: {
      hr: "U Modu 1 to smo mi, i to stoji na stranici projekta. U Modu 2 izvođača bira klijent.",
      en: "In Mode 1 that is us, and it says so on the project page. In Mode 2 the client picks the contractor.",
    },
    x: 1040,
    y: 0,
  },
  {
    id: "contractorBank",
    kind: "account",
    title: { hr: "Banka izvođača", en: "Contractor's bank" },
    subtitle: {
      hr: "Krug se zatvara ondje gdje je i počeo — u običnoj banci. Između je bio elektronički novac, ne špekulativna imovina.",
      en: "The circle closes where it began — at an ordinary bank. In between it was e-money, not a speculative asset.",
    },
    x: 1300,
    y: 0,
  },
  {
    id: "plant",
    kind: "outcome",
    title: { hr: "Elektrana", en: "The plant" },
    subtitle: {
      hr: "Ostaje u vlasništvu onih koji su je platili. Ako platforma nestane, elektrana i račun rade dalje.",
      en: "Stays owned by the people who paid for it. If the platform disappears, the plant and the account carry on.",
    },
    x: 1040,
    y: 200,
  },
];

export const nodeById: Readonly<Record<NodeId, FlowNode>> = Object.fromEntries(
  nodes.map((node) => [node.id, node]),
) as Record<NodeId, FlowNode>;

// ─────────────────────────────────────────────────────────────────────────────
// Veze (ono što dijagram crta)
// ─────────────────────────────────────────────────────────────────────────────

export type EdgeId =
  | "e-sepa"
  | "e-mint-rail"
  | "e-forward"
  | "e-mint-direct"
  | "e-situation"
  | "e-redeem"
  | "e-offramp"
  | "e-handover";

export interface FlowEdge {
  readonly id: EdgeId;
  readonly source: NodeId;
  readonly target: NodeId;
  readonly label: L10n;
  /** Veza koja ide ispod glavne linije (obilazak ili grana). */
  readonly lateral?: boolean;
}

export const edges: readonly FlowEdge[] = [
  {
    id: "e-sepa",
    source: "contributorBank",
    target: "monerium",
    label: { hr: "SEPA nalog s referencom", en: "SEPA order with a reference" },
  },
  {
    id: "e-mint-rail",
    source: "monerium",
    target: "rail",
    label: { hr: "izdavanje EURe 1:1", en: "EURe issued 1:1" },
  },
  {
    id: "e-forward",
    source: "rail",
    target: "projectSafe",
    label: { hr: "prosljeđivanje na račun projekta", en: "forwarded to the project account" },
  },
  {
    id: "e-mint-direct",
    source: "monerium",
    target: "projectSafe",
    label: { hr: "Mod 2: ravno na klijentov račun", en: "Mode 2: straight to the client's account" },
    lateral: true,
  },
  {
    id: "e-situation",
    source: "projectSafe",
    target: "contractor",
    label: { hr: "isplata po situaciji, M potpisa", en: "release per stage, M signatures" },
  },
  {
    id: "e-redeem",
    source: "contractor",
    target: "monerium",
    label: { hr: "potpisani zahtjev za isplatu", en: "signed redemption request" },
    lateral: true,
  },
  {
    id: "e-offramp",
    source: "monerium",
    target: "contractorBank",
    label: { hr: "SEPA natrag u banku", en: "SEPA back to a bank" },
    lateral: true,
  },
  {
    id: "e-handover",
    source: "contractor",
    target: "plant",
    label: { hr: "primopredaja", en: "handover" },
    lateral: true,
  },
];

export const edgeById: Readonly<Record<EdgeId, FlowEdge>> = Object.fromEntries(
  edges.map((edge) => [edge.id, edge]),
) as Record<EdgeId, FlowEdge>;

// ─────────────────────────────────────────────────────────────────────────────
// Prijelazi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tko snosi trošak koraka.
 *
 * ⚠️ `contributorOwnBank` postoji zato što je poštenije nego prešutjeti ga
 * (docs/04 §4). Uplatitelj NE plaća ništa nama, ali svojoj banci plaća naknadu
 * za nalog kao i za svaki drugi nalog. „0 €" koje bi to prešutjelo bilo bi ista
 * klasa greške kao „0 % naknada" bez napomene da smo izvođač (docs/14 §3.1).
 */
export type CostBearer =
  | "contributorOwnBank"
  | "monerium"
  | "platformRelayer"
  | "none";

export type TransitionId =
  | "openSafe"
  | "verifyIdentity"
  | "sepaOrder"
  | "mintToRail"
  | "forwardToSafe"
  | "mintToClientSafe"
  | "releaseSituation"
  | "redeemEure"
  | "sepaOfframp"
  | "handover";

export interface Transition {
  readonly id: TransitionId;
  /** Gdje novac mora biti da bi se ovo dogodilo; `null` = korak ne miče novac. */
  readonly from: NodeId | null;
  readonly to: NodeId | null;
  readonly edge: EdgeId;
  readonly label: L10n;
  readonly description: L10n;
  readonly costBearer: CostBearer;
  readonly costNote: L10n;
  readonly movesMoney: boolean;
  /**
   * Traži li korak M potpisa iz Safea.
   *
   * ⚠️ Ovo je invarijanta iz docs/06 §2 („iz Safea se ne može izaći bez M
   * potpisa") i ujedno glavna zaštita od sukoba interesa (docs/14 §4). Nije
   * ukras dijagrama — simulator odbija korak s premalo potpisa.
   */
  readonly requiresSignatures?: boolean;
  readonly minAmountCents?: number;
}

/** Najmanji doprinos koji rail propušta. Ispod toga naknada naloga guta iznos. */
export const MIN_CONTRIBUTION_CENTS = 1000;

const COST_NOTE_FREE: L10n = {
  hr: "Ovaj korak nitko ne plaća.",
  en: "Nobody pays for this step.",
};

export const transitions: readonly Transition[] = [
  {
    id: "openSafe",
    from: null,
    to: null,
    edge: "e-forward",
    label: { hr: "Otvaranje računa projekta", en: "Opening the project account" },
    description: {
      hr: "Zajednica otvara Safe i upisuje potpisnike. Prag mora odgovarati statutu nositelja — softver koji dopušta isplatu s manje potpisa nego statut tiho ruši pravilo koje smo obećali provoditi.",
      en: "The community opens a Safe and enrols the signers. The threshold must match the holder's statute — software that allows a release with fewer signatures than the statute quietly breaks the very rule we promised to enforce.",
    },
    costBearer: "none",
    costNote: COST_NOTE_FREE,
    movesMoney: false,
  },
  {
    id: "verifyIdentity",
    from: null,
    to: null,
    edge: "e-sepa",
    label: { hr: "Provjera identiteta", en: "Identity check" },
    description: {
      hr: "Kod modela zajednice članstvo je pravni odnos, pa uplatitelj potvrđuje identitet kroz eID. Kod donacije to nije uvjet — darovati se smije i bez toga.",
      en: "Under the community model, membership is a legal relationship, so the contributor confirms their identity through eID. Under the donation model it is not required — a gift needs no such check.",
    },
    costBearer: "none",
    costNote: COST_NOTE_FREE,
    movesMoney: false,
  },
  {
    id: "sepaOrder",
    from: "contributorBank",
    to: "monerium",
    edge: "e-sepa",
    label: { hr: "SEPA nalog s referencom", en: "SEPA order with a reference" },
    description: {
      hr: "Običan nalog iz vlastite banke. Referenca veže uplatu uz točan projekt, pa nitko ne mora ručno voditi evidenciju tko je što uplatio.",
      en: "An ordinary order from the contributor's own bank. The reference ties the payment to the right project, so nobody has to keep a manual ledger of who paid what.",
    },
    costBearer: "contributorOwnBank",
    costNote: {
      hr: `Nalog naplaćuje uplatiteljeva banka, ${SEPA_FEE_MIN.toFixed(2).replace(".", ",")}–${SEPA_FEE_MAX.toFixed(2).replace(".", ",")} € fiksno, kao i za svaki drugi nalog. Nama ne ide ništa.`,
      en: `The contributor's own bank charges for the order, a flat €${SEPA_FEE_MIN.toFixed(2)}–${SEPA_FEE_MAX.toFixed(2)}, exactly as it would for any other order. None of it comes to us.`,
    },
    movesMoney: true,
    minAmountCents: MIN_CONTRIBUTION_CENTS,
  },
  {
    id: "mintToRail",
    from: "monerium",
    to: "rail",
    edge: "e-mint-rail",
    label: { hr: "Izdavanje EURe 1:1", en: "EURe issued 1:1" },
    description: {
      hr: "Monerium za primljeni euro izdaje jednako toliko EURe. To je elektronički novac regulirane institucije, ne imovina kojoj cijena skače.",
      en: "For the euro it receives, Monerium issues the same amount of EURe. That is e-money from a regulated institution, not an asset whose price moves.",
    },
    costBearer: "monerium",
    costNote: {
      hr: "Izdavanje i poništavanje EURe Monerium ne naplaćuje.",
      en: "Monerium charges nothing for issuing or redeeming EURe.",
    },
    movesMoney: true,
  },
  {
    id: "forwardToSafe",
    from: "rail",
    to: "projectSafe",
    edge: "e-forward",
    label: { hr: "Prosljeđivanje na račun projekta", en: "Forwarded to the project account" },
    description: {
      hr: "Iznos odlazi na račun projekta, gdje mu je saldo javan. Trošak transakcije snosimo mi, pa ni ovdje uplatitelj ne plaća ništa.",
      en: "The amount moves to the project account, where its balance is public. We cover the transaction cost, so here too the contributor pays nothing.",
    },
    costBearer: "platformRelayer",
    costNote: {
      hr: "Trošak transakcije na Gnosisu je oko jednog centa i plaćamo ga mi.",
      en: "The Gnosis transaction costs about a cent and we pay it.",
    },
    movesMoney: true,
  },
  {
    id: "mintToClientSafe",
    from: "monerium",
    to: "projectSafe",
    edge: "e-mint-direct",
    label: { hr: "Mod 2: ravno na klijentov račun", en: "Mode 2: straight to the client's account" },
    description: {
      hr: "Na klijentovim šinama novac ide s njegova Monerium računa ravno na njegov Safe. Kroz nas ne prolazi nijednom, i to je razlog zašto se tvrdnja „ne držimo vaš novac“ može provjeriti, a ne samo pročitati.",
      en: "On the client's own rail the money goes from their Monerium account straight to their Safe. It never passes through us — which is why the claim „we do not hold your money“ can be checked rather than merely read.",
    },
    costBearer: "monerium",
    costNote: {
      hr: "Izdavanje EURe Monerium ne naplaćuje. Trošak transakcije snosi klijent i mjeri se u centima.",
      en: "Monerium charges nothing for issuing EURe. The client covers the transaction cost, measured in cents.",
    },
    movesMoney: true,
  },
  {
    id: "releaseSituation",
    from: "projectSafe",
    to: "contractor",
    edge: "e-situation",
    label: { hr: "Isplata po situaciji", en: "Release per stage" },
    description: {
      hr: "Izvođač se plaća po napretku gradnje, a svaka isplata traži M potpisa. Novac koji još nije zarađen ostaje na računu projekta — pa ako izvođač propadne, ostaje članovima.",
      en: "The contractor is paid as the build progresses, and every release needs M signatures. Money not yet earned stays in the project account — so if the contractor fails, it stays with the members.",
    },
    costBearer: "platformRelayer",
    costNote: {
      hr: "Trošak transakcije na Gnosisu je oko jednog centa.",
      en: "The Gnosis transaction costs about a cent.",
    },
    movesMoney: true,
    requiresSignatures: true,
  },
  {
    id: "redeemEure",
    from: "contractor",
    to: "monerium",
    edge: "e-redeem",
    label: { hr: "Zahtjev za isplatu u euro", en: "Request to cash out to euro" },
    description: {
      hr: "Izvođač potpisom traži da se EURe poništi i pretvori natrag u euro na njegov bankovni račun.",
      en: "With a signature, the contractor asks for the EURe to be redeemed and turned back into euro on their bank account.",
    },
    costBearer: "monerium",
    costNote: {
      hr: "Poništavanje EURe Monerium ne naplaćuje.",
      en: "Monerium charges nothing for redeeming EURe.",
    },
    movesMoney: true,
  },
  {
    id: "sepaOfframp",
    from: "monerium",
    to: "contractorBank",
    edge: "e-offramp",
    label: { hr: "SEPA natrag u banku", en: "SEPA back to a bank" },
    description: {
      hr: "Monerium šalje euro na običan bankovni račun. Krug je zatvoren: novac je ušao iz banke i izašao u banku, a između je cijelo vrijeme bio euro.",
      en: "Monerium sends euro to an ordinary bank account. The circle is closed: the money came in from a bank and went out to a bank, and in between it was euro the whole time.",
    },
    costBearer: "monerium",
    costNote: COST_NOTE_FREE,
    movesMoney: true,
  },
  {
    id: "handover",
    from: null,
    to: null,
    edge: "e-handover",
    label: { hr: "Primopredaja elektrane", en: "Handover of the plant" },
    description: {
      hr: "Elektrana prelazi onima koji su je platili. Od tog trenutka njihova su i proizvodnja i odluke o njoj — bez obzira na to postoji li još ova stranica.",
      en: "The plant passes to the people who paid for it. From then on both the output and the decisions about it are theirs — whether or not this website still exists.",
    },
    costBearer: "none",
    costNote: COST_NOTE_FREE,
    movesMoney: false,
  },
];

export const transitionById: Readonly<Record<TransitionId, Transition>> = Object.fromEntries(
  transitions.map((transition) => [transition.id, transition]),
) as Record<TransitionId, Transition>;

// ─────────────────────────────────────────────────────────────────────────────
// Scenariji
// ─────────────────────────────────────────────────────────────────────────────

/** Oblik Safea u scenariju. Ista polja kao `SafeAccount`, bez adrese i lanca. */
export interface ScenarioSafe {
  /** M iz M-od-N. */
  readonly threshold: number;
  /** N. */
  readonly owners: number;
  /** Koliko od tih potpisnika smo mi. U Modu 2 mora biti 0 (docs/14 §1). */
  readonly platform_signer_count: number;
}

export interface ScenarioStep {
  readonly t: TransitionId;
  /** Iznos u centima; obavezan za korake koji miču novac. */
  readonly amountCents?: number;
  /** Koliko je potpisa prikupljeno; bitno samo za korake s `requiresSignatures`. */
  readonly signatures?: number;
}

export interface Scenario {
  readonly id: string;
  readonly name: L10n;
  readonly description: L10n;
  readonly mode: ProjectMode;
  readonly rails: ProjectRails;
  readonly safe: ScenarioSafe;
  /** Početni saldo u banci uplatitelja, u centima. */
  readonly initialCents: number;
  /** Koliko ljudi stoji iza tog iznosa — za rečenicu „12 × 800 €“. */
  readonly contributors: number;
  readonly steps: readonly ScenarioStep[];
}

const EUR = (amount: number): number => Math.round(amount * 100);

/**
 * Zajednički početak za scenarije na NAŠIM šinama.
 *
 * ⚠️ Mod 2 ovo NE koristi — ondje je put kraći za jedan čvor, i to je cijela
 * razlika (docs/14 §1). Zajednička pomoćna funkcija koja bi „pokrila oba"
 * sakrila bi upravo ono što se želi pokazati.
 */
const onrampPlatform = (cents: number): readonly ScenarioStep[] => [
  { t: "sepaOrder", amountCents: cents },
  { t: "mintToRail", amountCents: cents },
  { t: "forwardToSafe", amountCents: cents },
];

export const scenarios: readonly Scenario[] = [
  {
    id: "susjedi",
    name: { hr: "1 · Susjedi grade zajedno", en: "1 · Neighbours build together" },
    description: {
      hr: "Dvanaest ljudi iz iste ulice skupi po 800 € za elektranu na zajedničkom krovu. Račun traži tri od pet potpisa, a naš je jedan — sami sebi ne možemo isplatiti ni cent.",
      en: "Twelve people from the same street put in €800 each for a plant on a shared roof. The account needs three of five signatures, and one is ours — we cannot release a single cent to ourselves.",
    },
    mode: "integrated",
    rails: "platform",
    safe: { threshold: 3, owners: 5, platform_signer_count: 1 },
    initialCents: EUR(9_600),
    contributors: 12,
    steps: [
      { t: "openSafe" },
      { t: "verifyIdentity" },
      ...onrampPlatform(EUR(9_600)),
      { t: "releaseSituation", amountCents: EUR(3_000), signatures: 3 },
      { t: "releaseSituation", amountCents: EUR(4_400), signatures: 3 },
      { t: "releaseSituation", amountCents: EUR(2_200), signatures: 4 },
      { t: "redeemEure", amountCents: EUR(9_600) },
      { t: "sepaOfframp", amountCents: EUR(9_600) },
      { t: "handover" },
    ],
  },
  {
    id: "skola",
    name: { hr: "2 · Škola dobiva krov", en: "2 · A school gets a roof" },
    description: {
      hr: "Općina i građani zajedno financiraju elektranu na krovu škole. Uplata je darovanje — ne daje pravo na novac, nego školi smanjuje račun za struju.",
      en: "A municipality and local residents together fund a plant on a school roof. The payment is a gift — it grants no claim to money; it cuts the school's electricity bill.",
    },
    mode: "integrated",
    rails: "platform",
    safe: { threshold: 3, owners: 5, platform_signer_count: 1 },
    initialCents: EUR(92_000),
    contributors: 214,
    steps: [
      { t: "openSafe" },
      ...onrampPlatform(EUR(92_000)),
      { t: "releaseSituation", amountCents: EUR(41_800), signatures: 3 },
      { t: "releaseSituation", amountCents: EUR(30_200), signatures: 3 },
      { t: "releaseSituation", amountCents: EUR(20_000), signatures: 5 },
      { t: "redeemEure", amountCents: EUR(92_000) },
      { t: "sepaOfframp", amountCents: EUR(92_000) },
      { t: "handover" },
    ],
  },
  {
    id: "zadruga",
    name: { hr: "3 · Zadruga širi kapacitet", en: "3 · A cooperative adds capacity" },
    description: {
      hr: "Postojeća zadruga prima nove članove i gradi drugu elektranu — na SVOM Monerium računu i SVOM Safeu, s izvođačem po svom izboru. Novac kroz nas ne prolazi nijednom, a softver je isti.",
      en: "An existing cooperative takes in new members and builds a second plant — on ITS own Monerium account and ITS own Safe, with a contractor of its choosing. The money never passes through us, and the software is the same.",
    },
    mode: "byo",
    rails: "client",
    safe: { threshold: 4, owners: 7, platform_signer_count: 0 },
    initialCents: EUR(46_000),
    contributors: 58,
    steps: [
      { t: "openSafe" },
      { t: "verifyIdentity" },
      { t: "sepaOrder", amountCents: EUR(46_000) },
      { t: "mintToClientSafe", amountCents: EUR(46_000) },
      { t: "releaseSituation", amountCents: EUR(28_000), signatures: 4 },
      { t: "releaseSituation", amountCents: EUR(18_000), signatures: 4 },
      { t: "redeemEure", amountCents: EUR(46_000) },
      { t: "sepaOfframp", amountCents: EUR(46_000) },
      { t: "handover" },
    ],
  },
  {
    id: "granice",
    name: { hr: "4 · Što pravila odbijaju", en: "4 · What the rules reject" },
    description: {
      hr: "Scenarij koji NE prolazi, i zato je ovdje. Prvo iznos ispod najmanjeg doprinosa, zatim isplata s premalo potpisa, pa isplata veća od salda. Tek onda ispravan slijed.",
      en: "A scenario that does NOT pass, which is exactly why it is here. First an amount below the minimum contribution, then a release with too few signatures, then a release larger than the balance. Only then a valid sequence.",
    },
    mode: "integrated",
    rails: "platform",
    safe: { threshold: 3, owners: 5, platform_signer_count: 1 },
    initialCents: EUR(1_000),
    contributors: 4,
    steps: [
      { t: "openSafe" },
      { t: "sepaOrder", amountCents: 500 },
      ...onrampPlatform(EUR(1_000)),
      // Dva potpisa uz prag tri — ovo je invarijanta, ne upozorenje.
      { t: "releaseSituation", amountCents: EUR(400), signatures: 2 },
      { t: "releaseSituation", amountCents: EUR(4_000), signatures: 3 },
      { t: "releaseSituation", amountCents: EUR(1_000), signatures: 3 },
    ],
  },
];

export const scenarioById: Readonly<Record<string, Scenario>> = Object.fromEntries(
  scenarios.map((scenario) => [scenario.id, scenario]),
);

// ─────────────────────────────────────────────────────────────────────────────
// Simulator
// ─────────────────────────────────────────────────────────────────────────────

export type RejectCode = "belowMin" | "notEnoughSignatures" | "insufficientFunds";

export interface SimStep {
  readonly index: number;
  readonly transition: Transition;
  readonly amountCents: number;
  readonly status: "ok" | "rejected";
  readonly rejectCode?: RejectCode;
  /** Gdje novac stoji nakon ovog koraka. */
  readonly location: NodeId;
  readonly balances: Readonly<Record<NodeId, number>>;
  /**
   * Koliko je uplatitelj do sada platio NAMA. Nula u svakom koraku svakog
   * scenarija — to je invarijanta koju cijela sekcija dokazuje (docs/06 §2).
   */
  readonly platformFeeCents: number;
  /** Koliko je uplatitelj platio svojoj banci. Nije nula, i tako se i piše. */
  readonly ownBankFeeCents: number;
  /** Koliko je potpisa stvarno trebalo za ovaj korak; `null` ako ih ne traži. */
  readonly signaturesRequired: number | null;
  readonly signaturesGiven: number | null;
}

export const REJECT_REASONS: Readonly<Record<RejectCode, L10n>> = {
  belowMin: {
    hr: "Odbijeno: iznos je ispod najmanjeg doprinosa koji šine propuštaju.",
    en: "Rejected: the amount is below the smallest contribution the rail accepts.",
  },
  notEnoughSignatures: {
    hr: "Odbijeno: premalo potpisa. Iz računa projekta ne izlazi ništa bez M od N.",
    en: "Rejected: too few signatures. Nothing leaves the project account without M of N.",
  },
  insufficientFunds: {
    hr: "Odbijeno: na polaznom računu nema toliko sredstava.",
    en: "Rejected: the source account does not hold that much.",
  },
};

function emptyBalances(): Record<NodeId, number> {
  return Object.fromEntries(nodes.map((node) => [node.id, 0])) as Record<NodeId, number>;
}

/**
 * Prolazak kroz scenarij, korak po korak.
 *
 * Deterministički i bez ijednog vanjskog ulaza — isti scenarij daje isti niz i
 * u testu i u pregledniku, pa se dijagram i simulacija ne mogu razići.
 *
 * ⚠️ Naknada uplatiteljevoj banci (`ownBankFeeCents`) računa se po GORNJOJ
 * granici raspona iz `lib/fees.ts`. Poštenije je pretpostaviti skuplju banku
 * nego jeftiniju: brojka koja izlazi iz usporedbe tada je najgori slučaj, a ne
 * najbolji.
 */
export function simulate(scenario: Scenario): readonly SimStep[] {
  const balances = emptyBalances();
  balances.contributorBank = scenario.initialCents;

  let location: NodeId = "contributorBank";
  let ownBankFee = 0;
  const steps: SimStep[] = [];

  scenario.steps.forEach((step, index) => {
    const transition = transitionById[step.t];
    const amountCents = step.amountCents ?? 0;
    const requiresSignatures = transition.requiresSignatures === true;
    const signaturesGiven = requiresSignatures ? (step.signatures ?? 0) : null;

    let status: SimStep["status"] = "ok";
    let rejectCode: RejectCode | undefined;

    if (transition.movesMoney) {
      if (transition.from === null || transition.to === null) {
        throw new Error(`prijelaz ${transition.id} miče novac, a nema from/to`);
      }
      if (
        transition.minAmountCents !== undefined &&
        amountCents < transition.minAmountCents
      ) {
        status = "rejected";
        rejectCode = "belowMin";
      } else if (requiresSignatures && (signaturesGiven ?? 0) < scenario.safe.threshold) {
        status = "rejected";
        rejectCode = "notEnoughSignatures";
      } else if (balances[transition.from] < amountCents) {
        status = "rejected";
        rejectCode = "insufficientFunds";
      } else {
        balances[transition.from] -= amountCents;
        balances[transition.to] += amountCents;
        location = transition.to;
        if (transition.costBearer === "contributorOwnBank") {
          ownBankFee += Math.round(SEPA_FEE_MAX * 100);
        }
      }
    } else if (transition.from !== null && transition.from !== location) {
      throw new Error(
        `scenarij ${scenario.id}: korak ${index} (${transition.id}) očekuje novac na ${transition.from}, a on je na ${location}`,
      );
    }

    steps.push({
      index,
      transition,
      amountCents,
      status,
      rejectCode,
      location,
      balances: { ...balances },
      // ⚠️ Nije zaokruženo na nulu — `PLATFORM_TAKE_PCT` JEST nula i to je
      // trajna odluka (docs/14 §3). Kad bi se ikad promijenila, ovaj bi izraz
      // prestao davati nulu i testovi bi pali prije nego copy postane netočan.
      platformFeeCents: Math.round(amountCents * PLATFORM_TAKE_PCT),
      ownBankFeeCents: ownBankFee,
      signaturesRequired: requiresSignatures ? scenario.safe.threshold : null,
      signaturesGiven,
    });
  });

  return steps;
}

/** Zbroj svih salda. Mora biti jednak početnom iznosu u svakom koraku. */
export function totalBalance(balances: Readonly<Record<NodeId, number>>): number {
  return Object.values(balances).reduce((sum, value) => sum + value, 0);
}

/**
 * Podskup grafa koji scenarij stvarno koristi.
 *
 * Ostatak dijagram crta prigušeno, pa se vidi da je scenarij dio cjeline, a ne
 * druga slika. Isti obrazac kao `scenarioSubset` u mpt-machineu (docs/10 §4).
 */
export function scenarioSubset(scenario: Scenario): {
  readonly nodes: ReadonlySet<NodeId>;
  readonly edges: ReadonlySet<EdgeId>;
} {
  const nodeSet = new Set<NodeId>();
  const edgeSet = new Set<EdgeId>();
  for (const step of scenario.steps) {
    const transition = transitionById[step.t];
    if (!transition.movesMoney && transition.from === null) {
      // Procesni korak nema svoju vezu na dijagramu — `edge` mu služi samo za
      // isticanje dijela grafa na koji se odnosi.
      continue;
    }
    edgeSet.add(transition.edge);
    if (transition.from !== null) nodeSet.add(transition.from);
    if (transition.to !== null) nodeSet.add(transition.to);
  }
  // Primopredaja je jedini korak koji vodi do ishoda, a ne miče novac.
  if (scenario.steps.some((step) => step.t === "handover")) {
    nodeSet.add("contractor");
    nodeSet.add("plant");
    edgeSet.add("e-handover");
  }
  return { nodes: nodeSet, edges: edgeSet };
}

/**
 * Krši li scenarij invarijantu sukoba interesa (P7, docs/14 §4).
 *
 * Namjerno posuđuje `violatesConflictInvariant` iz `lib/types.ts` umjesto da
 * pravilo prepiše: dvije kopije istog pravila raziđu se tiho, a ova se provodi
 * i na postojećem projektu i u čarobnjaku (dnevnik §7.2).
 */
export function scenarioViolatesConflict(scenario: Scenario): boolean {
  return violatesConflictInvariant({
    threshold: scenario.safe.threshold,
    platform_signer_count: scenario.safe.platform_signer_count,
  });
}
