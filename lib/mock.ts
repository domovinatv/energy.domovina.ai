/**
 * Mock podaci prototipa — JEDINI izvor sadržaja za sve ekrane Faze 1.
 *
 * Obrazac iz zef-novcanik-prototip (`src/lib/mock.ts`) i airkuna/tokenizacija
 * (`data/properties.json`), docs/05 §9: jedna datoteka drži sve, a ekrani su
 * sadržaj-agnostični. To je ono što kasnije omogućuje bijelu etiketu i što čini
 * migraciju na backend zamjenom sloja dohvaćanja.
 *
 * ⚠️ SVAKI zapis nosi `demo: true` i UI to PRIKAZUJE (CLAUDE.md pravilo 3).
 * Elektrane su plauzibilne, NE stvarne — imena su izmišljena, a geografija je
 * stvarna (lib/mock-geo.ts). Kad se unesu stvarne elektrane, uz svaku ide izvor.
 *
 * ⚠️ Safe adrese su deterministički izvedene iz slug-a, oblika `0x` + 40 hex —
 * da UI vježba pravi format, ali da nitko ne pošalje novac na njih.
 *
 * ⚠️ Nijedan iznos ni postotak ovdje nije tvrdnja o tržištu. Tržišne brojke žive
 * u lib/facts.ts i citiraju docs/02.
 */
import { TOWNS, type Town } from "./mock-geo";
import type {
  Community,
  Contribution,
  GridStatus,
  Member,
  OwnerType,
  Plant,
  PlantStatus,
  Project,
  ProjectDocument,
  SafeAccount,
  TimelineStep,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Determinizam: isti build → isti podaci. Bez toga se deep-link sa štanda
// (docs/06 §6) raspadne na sljedećem deployu.
// ─────────────────────────────────────────────────────────────────────────────

/** mulberry32 — mali PRNG s ponovljivim nizom. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a — determinističan hash za izvedene identifikatore. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministički hex niz zadane duljine, izveden iz sjemena. */
function hexFrom(seed: string, length: number): string {
  let out = "";
  let i = 0;
  while (out.length < length) {
    out += fnv1a(`${seed}#${i}`).toString(16).padStart(8, "0");
    i += 1;
  }
  return out.slice(0, length);
}

/**
 * Safe adresa izvedena iz slug-a. NIJE stvarna adresa i na nju se ne šalje
 * novac — postoji da UI vježba točan format (docs/05 §9).
 */
export function demoSafeAddress(slug: string): string {
  return `0x${hexFrom(`safe:${slug}`, 40)}`;
}

/** Deterministički UUID-oblik iz slug-a, da mock zapisi imaju stabilan `id`. */
function demoId(kind: string, slug: string): string {
  const h = hexFrom(`${kind}:${slug}`, 32);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join("-");
}

/** Lažni tx hash — vidi napomenu uz `demoSafeAddress`. */
function demoTxHash(seed: string): string {
  return `0x${hexFrom(`tx:${seed}`, 64)}`;
}

/**
 * Translit + slug, isto ponašanje kao `solar_slugify()` u DB-MIGRATION.sql
 * (docs/05 §2): č/ć → c, đ → d, š → s, ž → z.
 */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    č: "c", ć: "c", đ: "d", š: "s", ž: "z",
    Č: "c", Ć: "c", Đ: "d", Š: "s", Ž: "z",
  };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Generirani registar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Koliko mock elektrana generiramo.
 *
 * ⚠️ Ovo NIJE procjena broja elektrana u Hrvatskoj. Stvarna brojka je
 * `PLANTS_ON_GRID` u lib/facts.ts (~44.000), i razlika se prikazuje otvoreno:
 * „44.000 elektrana u Hrvatskoj, N na ovoj karti" (docs/08 §4).
 */
const GENERATED_PLANT_COUNT = 340;

const rng = makeRng(20260915);

function pick<T>(items: readonly T[], r: number): T {
  const idx = Math.min(items.length - 1, Math.floor(r * items.length));
  const item = items[idx];
  /* c8 ignore next */
  if (item === undefined) throw new Error("pick: prazan niz");
  return item;
}

/** Odabir naselja razmjerno težini, da mock skup izgleda kao Hrvatska. */
function pickTown(r: number): Town {
  const total = TOWNS.reduce((sum, t) => sum + t.weight, 0);
  let acc = r * total;
  for (const town of TOWNS) {
    acc -= town.weight;
    if (acc <= 0) return town;
  }
  const last = TOWNS[TOWNS.length - 1];
  /* c8 ignore next */
  if (last === undefined) throw new Error("pickTown: TOWNS je prazan");
  return last;
}

/** Tip vlasnika — ~3/4 snage je poduzetnički, ali po BROJU dominiraju krovovi. */
function pickOwnerType(r: number): OwnerType {
  if (r < 0.62) return "person";
  if (r < 0.84) return "company";
  if (r < 0.9) return "municipality";
  if (r < 0.95) return "association";
  if (r < 0.98) return "cooperative";
  return "community";
}

/** Snaga po tipu vlasnika — raspon je logaritamski širok (krov ↔ poslovni objekt). */
function capacityFor(ownerType: OwnerType, r: number): number {
  const ranges: Record<OwnerType, readonly [number, number]> = {
    person: [3, 15],
    company: [20, 500],
    municipality: [15, 180],
    association: [8, 60],
    cooperative: [25, 300],
    community: [30, 250],
  };
  const range = ranges[ownerType];
  const [lo, hi] = range;
  // Logaritamska raspodjela — inače bi svaka elektrana bila blizu gornje granice.
  const value = lo * Math.pow(hi / lo, r);
  return Math.round(value * 10) / 10;
}

function pickStatus(r: number): PlantStatus {
  if (r < 0.74) return "operational";
  if (r < 0.86) return "under_construction";
  if (r < 0.985) return "planned";
  return "decommissioned";
}

/**
 * Status priključka je uvjetovan statusom elektrane. Mreža je usko grlo
 * (docs/02 §4), pa među planiranima i onima u izgradnji ima realno dosta
 * `requested` i `not_requested`.
 */
function gridStatusFor(status: PlantStatus, r: number): GridStatus {
  switch (status) {
    case "operational":
      return r < 0.97 ? "connected" : "not_applicable";
    case "under_construction":
      if (r < 0.46) return "approved";
      if (r < 0.86) return "requested";
      return "not_requested";
    case "planned":
      if (r < 0.52) return "not_requested";
      if (r < 0.86) return "requested";
      if (r < 0.95) return "approved";
      return "rejected";
    case "decommissioned":
      return "not_applicable";
  }
}

/**
 * Godišnja proizvodnja kao PROCJENA iz snage. Specifični prinos varira po
 * geografskoj širini — sjever Hrvatske niže, Dalmacija više.
 *
 * ⚠️ Ovo je procjena, ne mjerenje. `production` tablica u Fazi 1 NE POSTOJI
 * (docs/05 §7) i UI mora reći da je riječ o procjeni.
 */
function estimateAnnualKwh(capacityKwp: number, lat: number): number {
  // ~1.250 kWh/kWp na sjeveru → ~1.500 na jugu. Usporedivo sa
  // SPECIFIC_YIELD_ZAGREB_KWH_PER_KWP (1.393 za Zagreb, docs/02 §2).
  const specific = 1500 - (lat - 42.4) * 60;
  return Math.round(capacityKwp * specific);
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generatePlants(count: number): Plant[] {
  const plants: Plant[] = [];
  const usedSlugs = new Map<string, number>();

  for (let i = 0; i < count; i += 1) {
    const town = pickTown(rng());
    const ownerType = pickOwnerType(rng());
    const status = pickStatus(rng());
    const capacity = capacityFor(ownerType, rng());
    const gridStatus = gridStatusFor(status, rng());

    // Raspršenje oko središta naselja, ~±6 km. Elektrana fizičke osobe ionako
    // ne nosi točnu adresu (docs/05 §8) — krov je dom.
    const lat = Math.round((town.lat + (rng() - 0.5) * 0.11) * 100000) / 100000;
    const lon = Math.round((town.lon + (rng() - 0.5) * 0.16) * 100000) / 100000;

    const baseName = nameFor(ownerType, town.name);
    const baseSlug = slugify(baseName);
    const seen = usedSlugs.get(baseSlug) ?? 0;
    usedSlugs.set(baseSlug, seen + 1);
    const slug = seen === 0 ? baseSlug : `${baseSlug}-${seen + 1}`;
    const name = seen === 0 ? baseName : `${baseName} ${seen + 1}`;

    const year = 2019 + Math.floor(rng() * 7);
    const month = 1 + Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);

    plants.push({
      id: demoId("plant", slug),
      slug,
      name,
      description: null,
      latitude: lat,
      longitude: lon,
      location_name: town.name,
      county: town.county,
      capacity_kwp: capacity,
      status,
      commissioning_date:
        status === "operational" || status === "decommissioned"
          ? isoDate(year, month, day)
          : null,
      annual_production_kwh: estimateAnnualKwh(capacity, town.lat),
      tech: {},
      hrote_id: null,
      cover_image_url: null,
      visibility: "public",
      is_verified: rng() < 0.38,
      campaign_slug: null,
      owner_type: ownerType,
      grid_status: gridStatus,
      grid_requested_at:
        gridStatus === "requested" ? isoDate(2025 + Math.floor(rng() * 2), month, day) : null,
      demo: true,
      created_at: isoDate(year, month, day),
    });
  }

  return plants;
}

/** Ime elektrane po tipu vlasnika. Izmišljeno i prepoznatljivo kao demo. */
function nameFor(ownerType: OwnerType, town: string): string {
  const templates: Record<OwnerType, readonly string[]> = {
    person: [`Krovna elektrana — ${town}`, `Kućni krov — ${town}`],
    company: [`Poslovni krov — ${town}`, `Pogonska elektrana — ${town}`],
    municipality: [`Krov javne zgrade — ${town}`, `Školski krov — ${town}`],
    association: [`Krov društvenog doma — ${town}`, `Krov vatrogasnog doma — ${town}`],
    cooperative: [`Zadružna elektrana — ${town}`],
    community: [`Zajednička elektrana — ${town}`],
  };
  return pick(templates[ownerType], rng());
}

// ─────────────────────────────────────────────────────────────────────────────
// Ručno napisane elektrane — nose demo priču i vežu se na projekte
// ─────────────────────────────────────────────────────────────────────────────

interface Handmade {
  readonly name: string;
  readonly town: string;
  readonly ownerType: OwnerType;
  readonly capacity: number;
  readonly status: PlantStatus;
  readonly gridStatus: GridStatus;
  readonly description: string;
  readonly tech: Plant["tech"];
  readonly campaignSlug: string | null;
}

const HANDMADE: readonly Handmade[] = [
  {
    name: "Krov osnovne škole — Sinj",
    town: "Sinj",
    ownerType: "municipality",
    capacity: 84,
    status: "planned",
    gridStatus: "requested",
    description:
      "Krov školske sportske dvorane. Grad je nositelj, roditelji i mještani financiraju izvedbu. Struja se troši u zgradi, višak ide u mrežu.",
    tech: { panels: "420 W monokristalni, 200 kom", inverters: "3× trofazni 25 kW", mounting: "Ravni krov, balastni nosači" },
    campaignSlug: "skolski-krov-sinj",
  },
  {
    name: "Zajednička elektrana Bilogora",
    town: "Bjelovar",
    ownerType: "community",
    capacity: 145,
    status: "under_construction",
    gridStatus: "approved",
    description:
      "Elektrana u vlasništvu zajednice od 34 kućanstva. Članovi dobivaju udio u proizvedenoj energiji i glas u zajednici — ne novac.",
    tech: { panels: "440 W monokristalni, 330 kom", inverters: "4× trofazni 33 kW", mounting: "Ravni krov gospodarske zgrade" },
    campaignSlug: "zajednica-bilogora",
  },
  {
    name: "Krov vatrogasnog doma — Vodice",
    town: "Vodice",
    ownerType: "association",
    capacity: 32,
    status: "planned",
    gridStatus: "not_requested",
    description:
      "Dobrovoljno vatrogasno društvo prikuplja sredstva za elektranu na krovu doma. Zahtjev za priključak još nije predan.",
    tech: { panels: "410 W monokristalni, 78 kom" },
    campaignSlug: "vatrogasni-dom-vodice",
  },
  {
    name: "Zadružna elektrana Slavonska ravnica",
    town: "Đakovo",
    ownerType: "cooperative",
    capacity: 260,
    status: "operational",
    gridStatus: "connected",
    description:
      "Energetska zadruga s 61 članom. U pogonu od 2024. Prva elektrana zadruge; druga je u pripremi.",
    tech: { panels: "450 W monokristalni, 578 kom", inverters: "8× trofazni 33 kW" },
    campaignSlug: null,
  },
  {
    name: "Krov gradske tržnice — Križevci",
    town: "Križevci",
    ownerType: "municipality",
    capacity: 118,
    status: "operational",
    gridStatus: "connected",
    description:
      "Krov gradske tržnice, u pogonu od 2025. Primjer modela u kojem je nositelj grad, a sredstva su prikupljena od građana.",
    tech: { panels: "430 W monokristalni, 274 kom", inverters: "4× trofazni 30 kW" },
    campaignSlug: null,
  },
  {
    name: "Krov doma zdravlja — Otočac",
    town: "Otočac",
    ownerType: "municipality",
    capacity: 56,
    status: "planned",
    gridStatus: "not_requested",
    description:
      "Projekt u pripremi. Nositelj još nije odabran, a elektroenergetska suglasnost nije zatražena.",
    tech: {},
    campaignSlug: null,
  },
  {
    name: "Krov društvenog doma — Imotski",
    town: "Imotski",
    ownerType: "association",
    capacity: 41,
    status: "under_construction",
    gridStatus: "approved",
    description:
      "Udruga je nositelj, radovi u tijeku. Elektroenergetska suglasnost izdana u ožujku 2026.",
    tech: { panels: "430 W monokristalni, 96 kom", inverters: "2× trofazni 20 kW" },
    campaignSlug: null,
  },
  {
    name: "Poslovni krov — Sveti Duh, Zagreb",
    town: "Zagreb",
    ownerType: "company",
    capacity: 380,
    status: "operational",
    gridStatus: "connected",
    description:
      "Elektrana za vlastitu potrošnju proizvodnog pogona. U registru je zato što je vlasnik sam prijavio — bez projekta financiranja.",
    tech: { panels: "450 W monokristalni, 845 kom", inverters: "10× trofazni 40 kW" },
    campaignSlug: null,
  },
  {
    name: "Krov đačkog doma — Osijek",
    town: "Osijek",
    ownerType: "municipality",
    capacity: 96,
    status: "planned",
    gridStatus: "rejected",
    description:
      "Zahtjev za priključak odbijen zbog ograničenja na postojećoj trafostanici. Projekt čeka jačanje mreže.",
    tech: {},
    campaignSlug: null,
  },
  {
    name: "Zajednička elektrana Kvarner",
    town: "Krk",
    ownerType: "community",
    capacity: 88,
    status: "planned",
    gridStatus: "requested",
    description:
      "Zajednica u nastajanju — 19 kućanstava, zajednica još nije registrirana. Zahtjev za priključak predan u srpnju 2026.",
    tech: {},
    campaignSlug: "zajednica-kvarner",
  },
  {
    name: "Krovna elektrana — Nin, obiteljska",
    town: "Nin",
    ownerType: "person",
    capacity: 9.8,
    status: "operational",
    gridStatus: "connected",
    description:
      "Krov obiteljske kuće. Vlasnik se sam upisao u registar; elektrana nema projekt financiranja i ne traži suradnju.",
    tech: { panels: "410 W monokristalni, 24 kom", inverters: "1× trofazni 10 kW" },
    campaignSlug: null,
  },
  {
    name: "Krov sportske dvorane — Čakovec",
    town: "Čakovec",
    ownerType: "municipality",
    capacity: 132,
    status: "under_construction",
    gridStatus: "requested",
    description:
      "Grad je nositelj. Radovi su počeli prije nego je izdana elektroenergetska suglasnost — to se na kartici projekta vidi otvoreno.",
    tech: { panels: "440 W monokristalni, 300 kom" },
    campaignSlug: null,
  },
];

function handmadePlants(): Plant[] {
  return HANDMADE.map((h, i) => {
    const town = TOWNS.find((t) => t.name === h.town);
    /* c8 ignore next */
    if (town === undefined) throw new Error(`Nepoznato naselje u HANDMADE: ${h.town}`);
    const slug = slugify(h.name);
    return {
      id: demoId("plant", slug),
      slug,
      name: h.name,
      description: h.description,
      latitude: Math.round((town.lat + (i % 5) * 0.004 - 0.008) * 100000) / 100000,
      longitude: Math.round((town.lon + (i % 7) * 0.005 - 0.015) * 100000) / 100000,
      location_name: h.town,
      county: town.county,
      capacity_kwp: h.capacity,
      status: h.status,
      commissioning_date: h.status === "operational" ? isoDate(2024 + (i % 2), 4 + (i % 6), 12) : null,
      annual_production_kwh: estimateAnnualKwh(h.capacity, town.lat),
      tech: h.tech,
      hrote_id: null,
      cover_image_url: null,
      visibility: "public",
      is_verified: true,
      campaign_slug: h.campaignSlug,
      owner_type: h.ownerType,
      grid_status: h.gridStatus,
      grid_requested_at: h.gridStatus === "requested" ? isoDate(2026, 3 + (i % 5), 8) : null,
      demo: true,
      created_at: isoDate(2026, 1 + (i % 9), 5),
    };
  });
}

/** Cijeli mock registar. Ručno napisane elektrane su prve — nose demo priču. */
export const PLANTS: readonly Plant[] = [
  ...handmadePlants(),
  ...generatePlants(GENERATED_PLANT_COUNT),
];

export function getPlantBySlug(slug: string): Plant | undefined {
  return PLANTS.find((p) => p.slug === slug);
}

// ─────────────────────────────────────────────────────────────────────────────
// Projekti financiranja — docs/05 §3. Samo modeli A i B (docs/03 §3).
// ─────────────────────────────────────────────────────────────────────────────

const EUR = (amount: number): number => Math.round(amount * 100);

/**
 * @param mode `integrated` → Safe je projektov i mi smo JEDAN od potpisnika.
 *             `byo` → Safe je KLIJENTOV i mi nismo potpisnik uopće
 *             (docs/14 §1). To je ono što tvrdnju „ne držimo vaš novac" čini
 *             provjerljivom, a ne marketinškom.
 */
function safeFor(
  slug: string,
  threshold: number,
  owners: number,
  mode: Project["mode"],
): SafeAccount {
  return {
    address: demoSafeAddress(slug),
    chain: "gnosis",
    threshold,
    owners: Array.from({ length: owners }, (_, i) => `0x${hexFrom(`owner:${slug}:${i}`, 40)}`),
    // ⚠️ P7 (docs/05 §4.1): naš potpisnik nikad ne čini većinu praga.
    // Prag 3-od-5 → mi držimo najviše jedan ključ. U Modu 2 — nijedan.
    platform_signer_count: mode === "integrated" ? 1 : 0,
    source: "domovina-wallet-account",
    salt_nonce: hexFrom(`salt:${slug}`, 16),
    deployed: false,
  };
}

function safeForProject(project: Project, threshold: number, owners: number): SafeAccount {
  return safeFor(project.slug, threshold, owners, project.mode);
}

export const PROJECTS: readonly Project[] = [
  {
    id: demoId("project", "skolski-krov-sinj"),
    plant_id: demoId("plant", slugify("Krov osnovne škole — Sinj")),
    slug: "skolski-krov-sinj",
    title: "Krov osnovne škole u Sinju",
    model: "donation",
    mode: "integrated",
    rails: "platform",
    contractor: "domovina.energy",
    cost_breakdown: [
      { label: "Oprema — paneli i nosači", amount_cents: EUR(41_800) },
      { label: "Inverteri i elektroinstalacija", amount_cents: EUR(14_200) },
      { label: "Montaža", amount_cents: EUR(12_600) },
      { label: "Projektna dokumentacija i ishođenje", amount_cents: EUR(6_400) },
      { label: "Priključak i mjerno mjesto", amount_cents: EUR(4_900) },
      { label: "Rezerva za nepredviđeno", amount_cents: EUR(3_100) },
      { label: "Marža izvođača (domovina.energy)", amount_cents: EUR(9_000), is_contractor_margin: true },
    ],
    milestones: [
      { key: "signed", label: "Ugovor potpisan", amount_cents: EUR(0), released_at: "2026-08-20" },
      { key: "equipment", label: "Oprema na gradilištu", amount_cents: EUR(41_800), released_at: null },
      { key: "mounted", label: "Montaža dovršena", amount_cents: EUR(26_800), released_at: null },
      { key: "commissioned", label: "Puštanje u pogon", amount_cents: EUR(23_400), released_at: null },
    ],
    holder_type: "municipality",
    holder_name: "Grad Sinj",
    holder_oib: "00000000001",
    goal_cents: EUR(92_000),
    raised_cents: EUR(38_450),
    min_contribution_cents: EUR(20),
    state: "active",
    deadline: "2026-12-15",
    destination_address: demoSafeAddress("skolski-krov-sinj"),
    site_right: "owner",
    site_right_doc_url: null,
    surplus_intent:
      "Višak iznad cilja koristi se za proširenje elektrane na krov susjedne zgrade ili se vraća doprinositeljima.",
    max_coowners: null,
    demo: true,
  },
  {
    id: demoId("project", "zajednica-bilogora"),
    plant_id: demoId("plant", slugify("Zajednička elektrana Bilogora")),
    slug: "zajednica-bilogora",
    title: "Zajednička elektrana Bilogora",
    model: "community",
    mode: "integrated",
    rails: "platform",
    contractor: "domovina.energy",
    cost_breakdown: [
      { label: "Oprema — paneli i nosači", amount_cents: EUR(68_400) },
      { label: "Inverteri i elektroinstalacija", amount_cents: EUR(24_900) },
      { label: "Montaža", amount_cents: EUR(21_300) },
      { label: "Projektna dokumentacija i ishođenje", amount_cents: EUR(8_800) },
      { label: "Priključak i mjerno mjesto", amount_cents: EUR(7_200) },
      { label: "Rezerva za nepredviđeno", amount_cents: EUR(5_400) },
      { label: "Marža izvođača (domovina.energy)", amount_cents: EUR(15_000), is_contractor_margin: true },
    ],
    milestones: [
      { key: "signed", label: "Ugovor potpisan", amount_cents: EUR(0), released_at: "2026-05-04" },
      { key: "equipment", label: "Oprema na gradilištu", amount_cents: EUR(68_400), released_at: "2026-07-18" },
      { key: "mounted", label: "Montaža dovršena", amount_cents: EUR(46_200), released_at: null },
      { key: "commissioned", label: "Puštanje u pogon", amount_cents: EUR(36_400), released_at: null },
    ],
    holder_type: "cooperative",
    holder_name: "Energetska zadruga Bilogora",
    holder_oib: "00000000002",
    goal_cents: EUR(151_000),
    raised_cents: EUR(151_000),
    min_contribution_cents: EUR(250),
    state: "building",
    deadline: null,
    destination_address: demoSafeAddress("zajednica-bilogora"),
    site_right: "building_right",
    site_right_doc_url: null,
    surplus_intent: null,
    // K2 — gornja granica suvlasnika. Trošak administriranja po članu je ono što
    // je ubilo Sun Exchange (docs/13 §5.1); bez provizije mora biti ~0.
    max_coowners: 60,
    demo: true,
  },
  {
    id: demoId("project", "vatrogasni-dom-vodice"),
    plant_id: demoId("plant", slugify("Krov vatrogasnog doma — Vodice")),
    slug: "vatrogasni-dom-vodice",
    title: "Krov vatrogasnog doma u Vodicama",
    model: "donation",
    mode: "byo",
    rails: "client",
    contractor: null,
    cost_breakdown: [
      { label: "Oprema — paneli i nosači", amount_cents: EUR(14_600) },
      { label: "Inverteri i elektroinstalacija", amount_cents: EUR(5_200) },
      { label: "Montaža", amount_cents: EUR(4_700) },
      { label: "Projektna dokumentacija i ishođenje", amount_cents: EUR(2_900) },
      { label: "Priključak i mjerno mjesto", amount_cents: EUR(2_400) },
    ],
    milestones: [
      { key: "signed", label: "Ugovor potpisan", amount_cents: EUR(0), released_at: null },
      { key: "equipment", label: "Oprema na gradilištu", amount_cents: EUR(14_600), released_at: null },
      { key: "mounted", label: "Montaža dovršena", amount_cents: EUR(9_900), released_at: null },
      { key: "commissioned", label: "Puštanje u pogon", amount_cents: EUR(5_300), released_at: null },
    ],
    holder_type: "association",
    holder_name: "DVD Vodice",
    holder_oib: "00000000003",
    goal_cents: EUR(29_800),
    raised_cents: EUR(6_120),
    min_contribution_cents: EUR(10),
    state: "active",
    deadline: "2027-03-31",
    destination_address: demoSafeAddress("vatrogasni-dom-vodice"),
    site_right: "owner",
    site_right_doc_url: null,
    surplus_intent: "Višak se koristi za baterijski spremnik.",
    max_coowners: null,
    demo: true,
  },
  {
    id: demoId("project", "zajednica-kvarner"),
    plant_id: demoId("plant", slugify("Zajednička elektrana Kvarner")),
    slug: "zajednica-kvarner",
    title: "Zajednička elektrana Kvarner",
    model: "community",
    mode: "byo",
    rails: "client",
    contractor: null,
    cost_breakdown: [
      { label: "Oprema — paneli i nosači", amount_cents: EUR(39_200) },
      { label: "Inverteri i elektroinstalacija", amount_cents: EUR(13_800) },
      { label: "Montaža", amount_cents: EUR(12_100) },
      { label: "Projektna dokumentacija i ishođenje", amount_cents: EUR(6_900) },
      { label: "Priključak i mjerno mjesto", amount_cents: EUR(5_600) },
    ],
    milestones: [
      { key: "signed", label: "Ugovor potpisan", amount_cents: EUR(0), released_at: null },
      { key: "equipment", label: "Oprema na gradilištu", amount_cents: EUR(39_200), released_at: null },
      { key: "mounted", label: "Montaža dovršena", amount_cents: EUR(25_900), released_at: null },
      { key: "commissioned", label: "Puštanje u pogon", amount_cents: EUR(12_500), released_at: null },
    ],
    holder_type: "community",
    holder_name: "Zajednica Kvarner (u osnivanju)",
    holder_oib: null,
    goal_cents: EUR(77_600),
    raised_cents: EUR(14_900),
    min_contribution_cents: EUR(300),
    state: "active",
    deadline: "2027-06-30",
    destination_address: demoSafeAddress("zajednica-kvarner"),
    site_right: "co_owner_consent",
    site_right_doc_url: null,
    surplus_intent: null,
    max_coowners: 40,
    demo: true,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** Projekt koji financira zadanu elektranu, ako postoji. */
export function getProjectForPlant(plant: Plant): Project | undefined {
  if (plant.campaign_slug === null) return undefined;
  return getProjectBySlug(plant.campaign_slug);
}

/** Safe računi projekata, ključ je slug projekta. */
/** Prag i broj potpisnika po projektu; mora odgovarati statutu (docs/05 §4). */
const SAFE_SHAPE: Readonly<Record<string, readonly [threshold: number, owners: number]>> = {
  "skolski-krov-sinj": [3, 5],
  "zajednica-bilogora": [4, 7],
  "vatrogasni-dom-vodice": [2, 3],
  "zajednica-kvarner": [3, 5],
};

export const SAFES: Readonly<Record<string, SafeAccount>> = Object.fromEntries(
  PROJECTS.map((project) => {
    const shape = SAFE_SHAPE[project.slug] ?? ([3, 5] as const);
    return [project.slug, safeForProject(project, shape[0], shape[1])];
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Zajednice — docs/05 §6. `idea`/`preparing` su normalna, vidljiva stanja.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMUNITIES: readonly Community[] = [
  {
    id: demoId("community", "bilogora"),
    slug: "bilogora",
    name: "Energetska zadruga Bilogora",
    legal_form: "cooperative",
    registration_state: "registered",
    oib: "00000000002",
    statute_url: null,
    safe_address: demoSafeAddress("community:bilogora"),
    demo: true,
  },
  {
    id: demoId("community", "kvarner"),
    slug: "kvarner",
    name: "Zajednica Kvarner",
    legal_form: "not_yet_registered",
    registration_state: "preparing",
    oib: null,
    statute_url: null,
    safe_address: demoSafeAddress("community:kvarner"),
    demo: true,
  },
  {
    id: demoId("community", "sinjsko-polje"),
    slug: "sinjsko-polje",
    name: "Zajednica Sinjsko polje",
    legal_form: "not_yet_registered",
    registration_state: "idea",
    oib: null,
    statute_url: null,
    safe_address: demoSafeAddress("community:sinjsko-polje"),
    demo: true,
  },
];

export function getCommunityBySlug(slug: string): Community | undefined {
  return COMMUNITIES.find((c) => c.slug === slug);
}

// ─────────────────────────────────────────────────────────────────────────────
// Doprinosi — docs/05 §5
// ─────────────────────────────────────────────────────────────────────────────

interface SeedContribution {
  readonly project: string;
  readonly eur: number;
  readonly who: string;
  readonly verified: boolean;
  readonly message: string | null;
  readonly at: string;
  /** Samo kod modela `community` — udio u ENERGIJI i glasu, ne u dobiti. */
  readonly shareBp: number | null;
}

const CONTRIBUTION_SEED: readonly SeedContribution[] = [
  { project: "skolski-krov-sinj", eur: 5000, who: "Grad Sinj — proračunska stavka", verified: true, message: "Sufinanciranje iz proračuna.", at: "2026-08-22T09:14:00Z", shareBp: null },
  { project: "skolski-krov-sinj", eur: 1200, who: "Anonimno", verified: true, message: null, at: "2026-08-24T18:02:00Z", shareBp: null },
  { project: "skolski-krov-sinj", eur: 250, who: "Ivana M.", verified: true, message: "Dijete mi ide u tu školu.", at: "2026-08-25T07:41:00Z", shareBp: null },
  { project: "skolski-krov-sinj", eur: 100, who: "Anonimno", verified: false, message: null, at: "2026-08-26T20:19:00Z", shareBp: null },
  { project: "skolski-krov-sinj", eur: 20, who: "Marko P.", verified: false, message: "Koliko mogu.", at: "2026-08-27T11:05:00Z", shareBp: null },
  { project: "zajednica-bilogora", eur: 8000, who: "Obitelj Horvat", verified: true, message: null, at: "2026-04-11T10:30:00Z", shareBp: 530 },
  { project: "zajednica-bilogora", eur: 3500, who: "Anonimno", verified: true, message: null, at: "2026-04-13T14:55:00Z", shareBp: 232 },
  { project: "zajednica-bilogora", eur: 2000, who: "Društveni dom Bilogora", verified: true, message: "Dom ulazi kao član.", at: "2026-04-16T08:20:00Z", shareBp: 132 },
  { project: "zajednica-bilogora", eur: 750, who: "Ana K.", verified: true, message: null, at: "2026-04-21T19:47:00Z", shareBp: 50 },
  { project: "vatrogasni-dom-vodice", eur: 2500, who: "Anonimno", verified: true, message: null, at: "2026-09-02T12:12:00Z", shareBp: null },
  { project: "vatrogasni-dom-vodice", eur: 500, who: "Turistička zajednica", verified: true, message: null, at: "2026-09-05T15:38:00Z", shareBp: null },
  { project: "vatrogasni-dom-vodice", eur: 120, who: "Anonimno", verified: false, message: "Hvala vatrogascima.", at: "2026-09-08T21:03:00Z", shareBp: null },
  { project: "zajednica-kvarner", eur: 6000, who: "Obitelj Šupraha", verified: true, message: null, at: "2026-07-14T09:00:00Z", shareBp: 773 },
  { project: "zajednica-kvarner", eur: 3000, who: "Anonimno", verified: true, message: null, at: "2026-07-19T16:22:00Z", shareBp: 387 },
  { project: "zajednica-kvarner", eur: 1500, who: "Petar B.", verified: true, message: "Nemam svoj krov.", at: "2026-08-01T10:41:00Z", shareBp: 193 },
];

export const CONTRIBUTIONS: readonly Contribution[] = CONTRIBUTION_SEED.map((c, i) => ({
  id: demoId("contribution", `${c.project}:${i}`),
  project_id: demoId("project", c.project),
  amount_cents: EUR(c.eur),
  currency: "EUR",
  rail: i % 3 === 0 ? "sepa" : i % 3 === 1 ? "eure" : "card",
  tx_hash: i % 3 === 1 ? demoTxHash(`${c.project}:${i}`) : null,
  contributor_display: c.who,
  contributor_verified: c.verified,
  message: c.message,
  created_at: c.at,
  share_basis_points: c.shareBp,
  member_id: c.shareBp === null ? null : demoId("member", `${c.project}:${i}`),
}));

export function getContributionsForProject(projectSlug: string): readonly Contribution[] {
  const id = demoId("project", projectSlug);
  return CONTRIBUTIONS.filter((c) => c.project_id === id).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fiksni „danas" prototipa
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sat prototipa stoji, i to je namjerno.
 *
 * Tab „Tijek" (K1) prikazuje kašnjenja u danima, a rok projekta odbrojava. Da
 * se računa iz stvarnog vremena, demo bi trulio: na sajmu 28.10.2026. isti bi
 * projekt kasnio šest tjedana više nego danas, bez ijedne izmjene podataka.
 * Isti razlog kao determinističko sjeme — deep-link sa štanda mora pokazati
 * ono što je pokazivao kad je snimljen (docs/06 §6).
 *
 * ⚠️ Vrijedi SAMO za mock. Kad stignu pravi podaci, ovo se briše zajedno s njima.
 */
export const DEMO_NOW = "2026-09-15";

// ─────────────────────────────────────────────────────────────────────────────
// Dokumenti projekta — tab „Dokumenti", docs/07 §2.3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Svaki `url` je `null`, i tako mora ostati dok ne postoji stvaran dokument.
 * Prototip pokazuje KOJI se dokumenti traže i je li priložen — ne izmišlja
 * sadržaj. Poveznica na nepostojeći PDF je ista klasa greške kao lažni
 * „provjeri na Gnosisscanu" link (docs/04 §6, CLAUDE.md pravilo 3).
 */
const DOCUMENT_SEED: Readonly<Record<string, readonly ProjectDocument[]>> = {
  "skolski-krov-sinj": [
    {
      key: "site-right",
      kind: "site_right",
      label: "Odluka Grada Sinja o davanju krova na korištenje",
      url: null,
      issued_at: "2026-06-12",
    },
    {
      key: "quote",
      kind: "installer_quote",
      label: "Ponuda instalatera s troškovnikom",
      url: null,
      issued_at: "2026-07-30",
    },
    {
      key: "grid",
      kind: "grid_decision",
      label: "Zahtjev za elektroenergetsku suglasnost",
      url: null,
      issued_at: "2026-08-04",
    },
  ],
  "zajednica-bilogora": [
    {
      key: "site-right",
      kind: "site_right",
      label: "Ugovor o pravu građenja na gospodarskoj zgradi",
      url: null,
      issued_at: "2026-03-18",
    },
    {
      key: "statute",
      kind: "statute",
      label: "Statut Energetske zadruge Bilogora",
      url: null,
      issued_at: "2026-02-02",
    },
    {
      key: "quote",
      kind: "installer_quote",
      label: "Ponuda instalatera s troškovnikom",
      url: null,
      issued_at: "2026-04-05",
    },
    {
      key: "grid",
      kind: "grid_decision",
      label: "Elektroenergetska suglasnost",
      url: null,
      issued_at: "2026-06-21",
    },
  ],
  "vatrogasni-dom-vodice": [
    {
      key: "site-right",
      kind: "site_right",
      label: "Izvadak iz zemljišne knjige — DVD Vodice kao vlasnik",
      url: null,
      issued_at: "2026-08-28",
    },
    {
      key: "quote",
      kind: "installer_quote",
      label: "Ponuda instalatera s troškovnikom",
      url: null,
      issued_at: "2026-09-01",
    },
  ],
  "zajednica-kvarner": [
    {
      key: "site-right",
      kind: "site_right",
      label: "Suglasnost suvlasnika zgrade",
      url: null,
      issued_at: "2026-05-22",
    },
    {
      key: "statute",
      kind: "statute",
      label: "Nacrt statuta — zajednica još nije registrirana",
      url: null,
      issued_at: null,
    },
    {
      key: "quote",
      kind: "installer_quote",
      label: "Ponuda instalatera s troškovnikom",
      url: null,
      issued_at: "2026-07-02",
    },
  ],
};

export function getDocumentsForProject(projectSlug: string): readonly ProjectDocument[] {
  return DOCUMENT_SEED[projectSlug] ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tijek (K1) — docs/07 §2.3, docs/13 §K1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ Bilogora namjerno KASNI.
 *
 * Prototip u kojem svaki projekt teče po planu ne pokazuje ono zbog čega ovaj
 * tab postoji. Ripple je povjerenje izgubio na kašnjenjima i na tome što se o
 * njima šutjelo (docs/13 §4.2); kad smo mi izvođač, kašnjenje je naše
 * neispunjenje ugovora (docs/14 §5.2). Korak „montaža" zato ima plan u prošlosti
 * i prazno ostvarenje — točno stanje koje UI mora znati prikazati.
 */
const TIMELINE_SEED: Readonly<Record<string, readonly TimelineStep[]>> = {
  "skolski-krov-sinj": [
    { key: "submitted", planned: "2026-08-10", actual: "2026-08-12", note: null },
    { key: "funded", planned: "2026-12-15", actual: null, note: null },
    { key: "signed", planned: "2027-01-15", actual: null, note: null },
    { key: "ordered", planned: "2027-02-01", actual: null, note: null },
    { key: "mounted", planned: "2027-04-10", actual: null, note: null },
    {
      key: "connected",
      planned: "2027-06-30",
      actual: null,
      note: "Rok ovisi o operatoru distribucijskog sustava, ne o izvođaču.",
    },
  ],
  "zajednica-bilogora": [
    { key: "submitted", planned: "2026-04-01", actual: "2026-04-01", note: null },
    { key: "funded", planned: "2026-05-31", actual: "2026-04-28", note: null },
    { key: "signed", planned: "2026-05-10", actual: "2026-05-04", note: null },
    { key: "ordered", planned: "2026-06-15", actual: "2026-07-18", note: "Isporuka panela pomaknuta za pet tjedana." },
    {
      key: "mounted",
      planned: "2026-08-30",
      actual: null,
      note: "Montaža nije dovršena u planiranom roku. Novi procijenjeni rok je listopad 2026.",
    },
    { key: "connected", planned: "2026-11-15", actual: null, note: null },
  ],
  "vatrogasni-dom-vodice": [
    { key: "submitted", planned: "2026-08-25", actual: "2026-08-30", note: null },
    { key: "funded", planned: "2027-03-31", actual: null, note: null },
    { key: "signed", planned: null, actual: null, note: null },
    { key: "ordered", planned: null, actual: null, note: null },
    { key: "mounted", planned: null, actual: null, note: null },
    {
      key: "connected",
      planned: null,
      actual: null,
      note: "Zahtjev za priključak još nije predan, pa rok nije moguće postaviti.",
    },
  ],
  "zajednica-kvarner": [
    { key: "submitted", planned: "2026-07-01", actual: "2026-07-05", note: null },
    {
      key: "funded",
      planned: "2027-06-30",
      actual: null,
      note: "Zajednica se paralelno registrira; prikupljanje traje dok registracija ne završi.",
    },
    { key: "signed", planned: null, actual: null, note: null },
    { key: "ordered", planned: null, actual: null, note: null },
    { key: "mounted", planned: null, actual: null, note: null },
    { key: "connected", planned: null, actual: null, note: null },
  ],
};

export function getTimelineForProject(projectSlug: string): readonly TimelineStep[] {
  return TIMELINE_SEED[projectSlug] ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Članovi zajednica — docs/05 §6
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ K7 (docs/13 §6): registar članova vodi ZADRUGA, ne mi. Ovdje stoji koliko
 * je potrebno da se vidi tko potpisuje i koliki je čiji udio u proizvedenoj
 * energiji — ne evidencija članstva umjesto zadruge.
 *
 * `person_ref` je nadimak ili naziv, nikad OIB ni e-pošta (docs/05 §8).
 */
interface SeedMember {
  readonly community: string;
  readonly person: string;
  readonly role: Member["role"];
  readonly shareBp: number;
  readonly joined: string;
}

const MEMBER_SEED: readonly SeedMember[] = [
  { community: "bilogora", person: "Obitelj Horvat", role: "signer", shareBp: 530, joined: "2026-04-11" },
  { community: "bilogora", person: "Društveni dom Bilogora", role: "board", shareBp: 132, joined: "2026-04-16" },
  { community: "bilogora", person: "Ana K.", role: "member", shareBp: 50, joined: "2026-04-21" },
  { community: "bilogora", person: "Anonimni član", role: "member", shareBp: 232, joined: "2026-04-13" },
  { community: "kvarner", person: "Obitelj Šupraha", role: "signer", shareBp: 773, joined: "2026-07-14" },
  { community: "kvarner", person: "Petar B.", role: "member", shareBp: 193, joined: "2026-08-01" },
  { community: "kvarner", person: "Anonimni član", role: "member", shareBp: 387, joined: "2026-07-19" },
];

export const MEMBERS: readonly Member[] = MEMBER_SEED.map((m, i) => ({
  id: demoId("member", `${m.community}:${i}`),
  community_id: demoId("community", m.community),
  person_ref: m.person,
  role: m.role,
  share_basis_points: m.shareBp,
  joined_at: m.joined,
}));

export function getMembersForCommunity(communitySlug: string): readonly Member[] {
  const id = demoId("community", communitySlug);
  return MEMBERS.filter((m) => m.community_id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Veze zajednica ↔ projekt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zajednica → slugovi njezinih projekata.
 *
 * Stoji kao zasebna tablica, a ne kao polje na `Project`, jer docs/05 §3 takvo
 * polje nema. Kad ga dobije, ovo se briše i veza ide kroz `project.community_id`
 * — do tada bi izmišljeno polje u ugovoru bilo skuplje od jedne mape ovdje.
 *
 * „Zajednica Sinjsko polje" namjerno nema projekt: `idea` je normalno stanje
 * (docs/05 §6) i ekran ga mora znati prikazati kao takvo, ne kao prazninu.
 */
const COMMUNITY_PROJECT_SLUGS: Readonly<Record<string, readonly string[]>> = {
  bilogora: ["zajednica-bilogora"],
  kvarner: ["zajednica-kvarner"],
  "sinjsko-polje": [],
};

export function getProjectsForCommunity(communitySlug: string): readonly Project[] {
  const slugs = COMMUNITY_PROJECT_SLUGS[communitySlug] ?? [];
  return slugs.flatMap((slug) => {
    const project = getProjectBySlug(slug);
    return project === undefined ? [] : [project];
  });
}

/** Elektrane u vlasništvu zajednice — izvedene iz njezinih projekata. */
export function getPlantsForCommunity(communitySlug: string): readonly Plant[] {
  const ids = new Set(getProjectsForCommunity(communitySlug).map((p) => p.plant_id));
  return PLANTS.filter((p) => ids.has(p.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Dohvat projekata
// ─────────────────────────────────────────────────────────────────────────────

/** Elektrana koju projekt financira. */
export function getPlantForProject(project: Project): Plant | undefined {
  return PLANTS.find((p) => p.id === project.plant_id);
}

/**
 * Projekti koji primaju doprinose.
 *
 * ⚠️ K4 (docs/13 §K4): ovaj popis SMIJE biti prazan i ekran to mora podnijeti.
 * ZEZ zatvara pozive između projekata i nema gdje poslati zainteresirane —
 * zato lista čekanja stoji trajno, a ne samo kad je prazno (docs/07 §2.1).
 */
export function openProjects(): readonly Project[] {
  return PROJECTS.filter((p) => p.state === "active");
}
