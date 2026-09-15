/**
 * Podatkovni model — ugovor iz docs/05-podatkovni-model.md.
 *
 * Vrijedi za mock podatke u prototipu I za kasniji backend. Prototip ga poštuje
 * doslovno, da migracija na pravi backend bude zamjena sloja dohvaćanja, a ne
 * prepisivanje UI-ja.
 *
 * Imena polja preuzeta iz /Users/ms/git/pinka-finance/app/lib/solar.ts i
 * docs/energy-solar/DB-MIGRATION.sql gdje god je bilo moguće (docs/10 §2) —
 * taj rad ne treba ponavljati. Dodaci označeni s „➕ docs/05".
 *
 * ⚠️ Imena polja završe u API-ju i na screenshotovima. Nikad `yield`, `return`,
 * `roi` ni `dividend` (docs/03 §3, docs/05 §5).
 */

// ─────────────────────────────────────────────────────────────────────────────
// plant — elektrana (registar), docs/05 §2
// ─────────────────────────────────────────────────────────────────────────────

/** Životni ciklus elektrane. Iz `PlantStatus` u solar.ts, nepromijenjen. */
export type PlantStatus =
  | "planned"
  | "under_construction"
  | "operational"
  | "decommissioned";

export const PLANT_STATUSES: readonly PlantStatus[] = [
  "planned",
  "under_construction",
  "operational",
  "decommissioned",
] as const;

/**
 * ➕ docs/05 §2.2 — status priključka. Mreža je usko grlo: proizvodni projekti
 * se realiziraju ~3× brže od jačanja mreže (docs/02 §4), pa „čeka priključak"
 * nije rubni slučaj nego prvorazredno stanje (zahtjev E4, docs/03 §8).
 */
export type GridStatus =
  | "not_applicable"
  | "not_requested"
  | "requested"
  | "approved"
  | "connected"
  | "rejected";

export const GRID_STATUSES: readonly GridStatus[] = [
  "not_applicable",
  "not_requested",
  "requested",
  "approved",
  "connected",
  "rejected",
] as const;

/** ➕ docs/05 §2 — tko posjeduje elektranu. */
export type OwnerType =
  | "person"
  | "association"
  | "cooperative"
  | "company"
  | "municipality"
  | "community";

export type Visibility = "public" | "unlisted" | "private";

/** Tehnički podaci (jsonb u shemi). */
export interface PlantTech {
  readonly panels?: string;
  readonly inverters?: string;
  readonly mounting?: string;
}

export interface Plant {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly location_name: string | null;
  /** Jedna od 21 hrvatske županije — `HR_COUNTIES`. */
  readonly county: string | null;
  readonly capacity_kwp: number | null;
  readonly status: PlantStatus;
  readonly commissioning_date: string | null;
  /** Procijenjena ILI stvarna. UI mora reći koja (docs/05 §7). */
  readonly annual_production_kwh: number | null;
  readonly tech: PlantTech;
  /** Vanjski registar. OIB operatera se NE sprema u čistom obliku (docs/05 §8). */
  readonly hrote_id: string | null;
  readonly cover_image_url: string | null;
  readonly visibility: Visibility;
  /** ⚠️ Server-computed iz eID-a, NIKAD iz klijentskog patcha (zahtjev E7). */
  readonly is_verified: boolean;
  /** Denormaliziran slug aktivnog projekta, za deep-link. */
  readonly campaign_slug: string | null;
  readonly owner_type: OwnerType;
  readonly grid_status: GridStatus;
  /** Uz `requested` — datum predaje zahtjeva. */
  readonly grid_requested_at: string | null;
  /**
   * ⚠️ true za SVE seed podatke prototipa, i UI to MORA prikazati (CLAUDE.md
   * pravilo 3): traka na vrhu + badge na kartici. To je jedina stvar koja bi na
   * sajmu izgledala kao prijevara umjesto kao maketa.
   */
  readonly demo: boolean;
  readonly created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// project — projekt financiranja, docs/05 §3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Model financiranja. SAMO A (doprinos) i B (zajednica).
 *
 * ⚠️ C (zajam/udio) i D (tokenizirani udio) su u UI-ju ONEMOGUĆENI s
 * objašnjenjem (zahtjev E2). To nije kozmetika nego kontrola usklađenosti:
 * ograničenje na A i B je jedina stvar koja Mod 2 drži izvan ECSP licence
 * (docs/14 §2.4). Ne dodavati varijante u ovaj tip bez odobrenja HANFA-e.
 */
export type ProjectModel = "donation" | "community";

/** P1 (docs/14 §6) — mod rada je polje, ne pretpostavka. */
export type ProjectMode = "integrated" | "byo";

/** P2 — čiji su Monerium IBAN i Safe. */
export type ProjectRails = "platform" | "client";

/** Zahtjev E1 — prvo pitanje pri kreiranju projekta. */
export type HolderType =
  | "association"
  | "cooperative"
  | "municipality"
  | "company"
  | "person"
  | "community";

/** Zahtjev E6 — dokaz prava na lokaciju, uvjet za objavu (pouka iz RealT-a). */
export type SiteRight = "owner" | "co_owner_consent" | "building_right" | "lease";

export type ProjectState =
  | "draft"
  | "review"
  | "active"
  | "funded"
  | "expired"
  | "building"
  | "completed";

/** P5 — razrada troška izvedbe, javna PRIJE uplate (docs/14 §3.1). */
export interface CostItem {
  readonly label: string;
  readonly amount_cents: number;
  /** true za našu maržu — cijena tvrdnje da ne uzimamo proviziju. */
  readonly is_contractor_margin?: boolean;
}

/** P6 — plaćanje po situaciji, svaka isplata uz potpise članova. */
export interface Milestone {
  readonly key: string;
  readonly label: string;
  readonly amount_cents: number;
  readonly released_at: string | null;
}

export interface Project {
  readonly id: string;
  readonly plant_id: string;
  readonly slug: string;
  readonly title: string;
  readonly model: ProjectModel;
  readonly mode: ProjectMode;
  readonly rails: ProjectRails;
  /** U `integrated` modu to smo mi → obavezna objava sukoba interesa (P4). */
  readonly contractor: string | null;
  readonly cost_breakdown: readonly CostItem[];
  readonly milestones: readonly Milestone[];
  readonly holder_type: HolderType;
  readonly holder_name: string;
  /** Prikazuje se, ne pretražuje. Za pravne osobe javan podatak. */
  readonly holder_oib: string | null;
  readonly goal_cents: number;
  /** Izvedeno iz doprinosa, ne upisano ručno. */
  readonly raised_cents: number;
  readonly min_contribution_cents: number;
  readonly state: ProjectState;
  readonly deadline: string | null;
  /** Safe projekta. Nulta adresa ⇒ projekt NE SMIJE biti javan. */
  readonly destination_address: string;
  readonly site_right: SiteRight;
  readonly site_right_doc_url: string | null;
  /** Zahtjev E5 — izjava o namjeni viška kad projekt prijeđe cilj. */
  readonly surplus_intent: string | null;
  /** K2 — gornja granica suvlasnika. Trošak po članu je ubio Sun Exchange. */
  readonly max_coowners: number | null;
  readonly demo: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// project_document — tab „Dokumenti", docs/07 §2.3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ➕ docs/07 §2.3 — dokumenti projekta. U docs/05 nema ovog entiteta, ali tab
 * ga traži poimence: dokaz prava na lokaciju, statut (kod zajednice), ponuda
 * instalatera.
 *
 * ⚠️ `url: null` znači da dokument NIJE priložen, i UI to mora reći tim
 * riječima. Prototip nema nijedan stvaran dokument, pa je `null` normalno
 * stanje — lažna poveznica na nepostojeći PDF je ista klasa greške kao lažni
 * „provjeri na Gnosisscanu" link (docs/04 §6).
 */
export type DocumentKind =
  | "site_right"
  | "statute"
  | "installer_quote"
  | "grid_decision"
  | "other";

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  "site_right",
  "statute",
  "installer_quote",
  "grid_decision",
  "other",
] as const;

export interface ProjectDocument {
  readonly key: string;
  readonly kind: DocumentKind;
  /** Naziv iz izvora, ne prevodi se — dokument se tako zove. */
  readonly label: string;
  /** null ⇒ nije priložen. NIKAD placeholder poveznica. */
  readonly url: string | null;
  readonly issued_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// timeline — tab „Tijek" (K1), docs/07 §2.3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ➕ docs/13 §K1 — vremenska crta od uplate do prve kWh.
 *
 * ⚠️ Ovo NIJE UX finesa nego higijena usklađenosti (docs/14 §5.2): kad smo mi
 * izvođač, kašnjenje je naše neispunjenje ugovora, a dokumentirani rokovi i
 * njihove izmjene su ono što se gleda u sporu. Ripple je povjerenje izgubio na
 * kašnjenjima i lošoj komunikaciji (docs/13 §4.2).
 *
 * Zato korak nosi I plan I ostvarenje. Da nosi samo ostvarenje, kašnjenje se ne
 * bi vidjelo — a cijela je poanta da se vidi.
 */
export type TimelineStepKey =
  | "submitted"
  | "funded"
  | "signed"
  | "ordered"
  | "mounted"
  | "connected";

/** Redoslijed je fiksan i vrijedi za svaki projekt (docs/07 §2.3). */
export const TIMELINE_STEPS: readonly TimelineStepKey[] = [
  "submitted",
  "funded",
  "signed",
  "ordered",
  "mounted",
  "connected",
] as const;

export interface TimelineStep {
  readonly key: TimelineStepKey;
  /** Planirani datum. null ⇒ plan još nije postavljen. */
  readonly planned: string | null;
  /** Ostvareni datum. null ⇒ nije se dogodilo. */
  readonly actual: string | null;
  /** Objašnjenje pomaka. Stoji na stranici, ne u mailu (K1). */
  readonly note: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// safe_account — račun projekta, docs/05 §4
// ─────────────────────────────────────────────────────────────────────────────

export interface SafeAccount {
  readonly address: string;
  readonly chain: "gnosis";
  /** M iz M-od-N. */
  readonly threshold: number;
  /** N adresa. */
  readonly owners: readonly string[];
  /** Koliko od tih potpisnika smo mi. Vidi `violatesConflictInvariant`. */
  readonly platform_signer_count: number;
  readonly source: "domovina-wallet-account" | "legacy-derive";
  readonly salt_nonce: string | null;
  /** Counterfactual dok je false. */
  readonly deployed: boolean;
}

/**
 * P7 / docs/05 §4.1 — invarijanta sukoba interesa.
 *
 * Naš potpisnik NIKAD ne smije činiti VEĆINU praga. Prag 3-od-5 → mi držimo
 * najviše jedan ključ (docs/14 §4). Konfiguracija u kojoj izvođač može sam sebi
 * isplatiti novac poništava cijeli argument platforme.
 *
 * Većina je STROGO više od polovice: uz prag 3 većina je 2, pa je jedan ključ
 * dopušten — točno kako docs/14 §4 i kaže. Uz prag 2 dopušten je također jedan,
 * jer i tada treba tuđi potpis; dva bi značila da potpisujemo sami.
 *
 * ⚠️ U Modu 2 (`byo`) nismo potpisnik uopće — Safe je klijentov (docs/14 §1).
 * Tamo `platform_signer_count` mora biti 0, što ovaj uvjet propušta, ali se
 * provjerava zasebno.
 *
 * Prima samo prag i broj naših potpisnika, ne cijeli `SafeAccount`, da ista
 * provjera radi i na POSTOJEĆEM računu i na onome koji se tek slaže u čarobnjaku
 * (docs/07 §2.7 korak 6). Dvije kopije pravila raziđu se tiho.
 *
 * @returns true ako konfiguracija krši invarijantu — tada se projekt ne sprema.
 */
export function violatesConflictInvariant(
  safe: Pick<SafeAccount, "threshold" | "platform_signer_count">,
): boolean {
  return safe.platform_signer_count * 2 > safe.threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// contribution — doprinos / članski ulog, docs/05 §5
// ─────────────────────────────────────────────────────────────────────────────

export type ContributionRail = "sepa" | "eure" | "card";

export interface Contribution {
  readonly id: string;
  readonly project_id: string;
  readonly amount_cents: number;
  readonly currency: "EUR";
  readonly rail: ContributionRail;
  readonly tx_hash: string | null;
  /** Ime ili „Anonimno". */
  readonly contributor_display: string;
  readonly contributor_verified: boolean;
  readonly message: string | null;
  readonly created_at: string;
  /**
   * Samo kod modela `community`.
   *
   * ⚠️ Udio u PROIZVEDENOJ ENERGIJI i glasačkoj snazi, ne u dobiti. Svaki label
   * u UI-ju mora to nositi (docs/03 §3).
   */
  readonly share_basis_points: number | null;
  readonly member_id: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// community i member, docs/05 §6
// ─────────────────────────────────────────────────────────────────────────────

export type CommunityLegalForm = "association" | "cooperative" | "not_yet_registered";

/**
 * `idea` i `preparing` su NORMALNA I VIDLJIVA stanja, ne greška — cijela je
 * poanta pratiti zajednicu prije nego pravno postoji (docs/03 §5.3).
 */
export type CommunityRegistrationState = "idea" | "preparing" | "filed" | "registered";

export interface Community {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly legal_form: CommunityLegalForm;
  readonly registration_state: CommunityRegistrationState;
  readonly oib: string | null;
  readonly statute_url: string | null;
  readonly safe_address: string;
  readonly demo: boolean;
}

export type MemberRole = "member" | "board" | "signer";

export interface Member {
  readonly id: string;
  readonly community_id: string;
  readonly person_ref: string;
  readonly role: MemberRole;
  readonly share_basis_points: number;
  readonly joined_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hrvatske županije — KOPIJA iz pinka-finance/app/lib/solar.ts, 15.9.2026.
// ─────────────────────────────────────────────────────────────────────────────

export const HR_COUNTIES: readonly string[] = [
  "Zagrebačka",
  "Krapinsko-zagorska",
  "Sisačko-moslavačka",
  "Karlovačka",
  "Varaždinska",
  "Koprivničko-križevačka",
  "Bjelovarsko-bilogorska",
  "Primorsko-goranska",
  "Ličko-senjska",
  "Virovitičko-podravska",
  "Požeško-slavonska",
  "Brodsko-posavska",
  "Zadarska",
  "Osječko-baranjska",
  "Šibensko-kninska",
  "Vukovarsko-srijemska",
  "Splitsko-dalmatinska",
  "Istarska",
  "Dubrovačko-neretvanska",
  "Međimurska",
  "Grad Zagreb",
] as const;
