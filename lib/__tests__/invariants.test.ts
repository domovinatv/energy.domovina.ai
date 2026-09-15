/**
 * Testovi invarijanti — ne pokrivenost, nego pravila koja se ne smiju tiho
 * pokvariti.
 *
 * Obrazac iz `mpt-landing/src/lib/mpt-machine.test.ts` (docs/10 §4): testira se
 * ono što bi, ako padne, promijenilo pravnu ili činjeničnu poziciju proizvoda.
 */
import { describe, expect, it } from "vitest";
import {
  CONTRIBUTIONS,
  PLANTS,
  PROJECTS,
  SAFES,
  demoSafeAddress,
  getPlantBySlug,
  getProjectForPlant,
} from "../mock";
import { violatesConflictInvariant } from "../types";
import {
  EMPTY_FILTERS,
  computeStats,
  filterPlants,
  filtersFromSearchParams,
  filtersToSearchParams,
} from "../filters";
import { HR_COUNTIES } from "../types";
import { PENDING_VERIFICATION } from "../facts";
import { plantsToGeoJson } from "../geojson";
import { SEPA_FEE_MAX, SEPA_FEE_MIN } from "../fees";

describe("mock podaci se deklariraju kao prototip", () => {
  // CLAUDE.md pravilo 3: svaki mock zapis nosi `demo: true`. To je jedina stvar
  // koja bi na sajmu izgledala kao prijevara umjesto kao maketa.
  it("svaka elektrana nosi demo: true", () => {
    expect(PLANTS.every((p) => p.demo)).toBe(true);
  });

  it("svaki projekt nosi demo: true", () => {
    expect(PROJECTS.every((p) => p.demo)).toBe(true);
  });

  it("slugovi elektrana su jedinstveni", () => {
    const slugs = PLANTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("registar je determinističan između poziva", () => {
    expect(demoSafeAddress("skolski-krov-sinj")).toBe(
      demoSafeAddress("skolski-krov-sinj"),
    );
  });

  it("Safe adrese imaju oblik 0x + 40 hex, ali nisu stvarne", () => {
    for (const project of PROJECTS) {
      expect(project.destination_address).toMatch(/^0x[0-9a-f]{40}$/);
    }
  });

  it("nijedan projekt nema nultu adresu — takav ne smije biti javan", () => {
    // docs/05 §3: `destination_address` = nulta adresa ⇒ projekt ne smije biti
    // javan. Marker bez Safea vodio bi u spaljene uplate (docs/08 §2).
    const zero = `0x${"0".repeat(40)}`;
    expect(PROJECTS.every((p) => p.destination_address !== zero)).toBe(true);
  });
});

describe("pravna granica", () => {
  // docs/03 §3 + docs/14 §2.4: samo modeli A (doprinos) i B (zajednica).
  // Ograničenje na A i B je JEDINA stvar koja Mod 2 drži izvan ECSP licence.
  it("nijedan projekt ne koristi model izvan A i B", () => {
    for (const project of PROJECTS) {
      expect(["donation", "community"]).toContain(project.model);
    }
  });

  // docs/05 §4.1 / docs/14 §4 (P7): naš potpisnik nikad ne čini većinu praga.
  // Konfiguracija u kojoj izvođač može sam sebi platiti poništava cijeli
  // argument platforme.
  it("naš potpisnik nikad ne čini većinu praga Safea", () => {
    for (const [slug, safe] of Object.entries(SAFES)) {
      expect(violatesConflictInvariant(safe), slug).toBe(false);
    }
  });

  // docs/14 §1: u Modu 2 Safe je KLIJENTOV i mi nismo potpisnik uopće. To je
  // ono što tvrdnju „ne držimo vaš novac" čini provjerljivom — ako se ovdje
  // pojavi naš ključ, tvrdnja pada.
  it("u BYO modu nismo potpisnik na klijentovom Safeu", () => {
    for (const project of PROJECTS) {
      if (project.mode !== "byo") continue;
      expect(SAFES[project.slug]?.platform_signer_count, project.slug).toBe(0);
      expect(project.rails, project.slug).toBe("client");
    }
  });

  it("prag Safea nije veći od broja potpisnika", () => {
    for (const [slug, safe] of Object.entries(SAFES)) {
      expect(safe.threshold, slug).toBeLessThanOrEqual(safe.owners.length);
      expect(safe.threshold, slug).toBeGreaterThan(0);
    }
  });

  // docs/14 §4 (P4): u `integrated` modu smo i platforma i izvođač — sukob
  // interesa je strukturni i mora biti objavljen, pa `contractor` mora postojati.
  it("integrirani projekti imenuju izvođača", () => {
    for (const project of PROJECTS) {
      if (project.mode === "integrated") {
        expect(project.contractor, project.slug).not.toBeNull();
      }
    }
  });

  // docs/14 §3.1 (P5): razrada troška izvedbe je javna, i marža je u njoj.
  it("integrirani projekti javno navode maržu izvođača", () => {
    for (const project of PROJECTS) {
      if (project.mode !== "integrated") continue;
      const hasMargin = project.cost_breakdown.some((i) => i.is_contractor_margin === true);
      expect(hasMargin, project.slug).toBe(true);
    }
  });

  // docs/05 §5: `share_basis_points` postoji SAMO kod modela `community`, jer
  // je to udio u proizvedenoj energiji i glasu — ne u dobiti.
  it("udio u bazičnim bodovima postoji samo kod modela zajednice", () => {
    const communityIds = new Set(
      PROJECTS.filter((p) => p.model === "community").map((p) => p.id),
    );
    for (const c of CONTRIBUTIONS) {
      if (c.share_basis_points !== null) {
        expect(communityIds.has(c.project_id)).toBe(true);
      }
    }
  });
});

describe("dug provjere se ne može slučajno prikazati", () => {
  // docs/dnevnik §3: V1–V8 NISU potvrđene i ne smiju u javni copy. Zato u
  // `PENDING_VERIFICATION` nema polja `value` — nema se što formatirati.
  it("nijedna neprovjerena tvrdnja nema vrijednost", () => {
    for (const [id, claim] of Object.entries(PENDING_VERIFICATION)) {
      expect(Object.keys(claim).sort(), id).toEqual(["claim", "how", "why"]);
    }
  });

  it("svih osam stavki duga provjere je zabilježeno", () => {
    expect(Object.keys(PENDING_VERIFICATION)).toHaveLength(8);
  });
});

describe("naknade", () => {
  // CLAUDE.md pravilo 2: SEPA nalog je 0,25–0,40 €, NE 0,45.
  // `mpt-landing/src/lib/market-fees.ts` ima grešku — ne prenositi je.
  it("SEPA raspon je 0,25–0,40 €", () => {
    expect(SEPA_FEE_MIN).toBe(0.25);
    expect(SEPA_FEE_MAX).toBe(0.4);
  });
});

describe("filtriranje: karta i popis gledaju isti skup", () => {
  it("prazan filtar vraća cijeli registar", () => {
    expect(filterPlants(PLANTS, EMPTY_FILTERS)).toHaveLength(PLANTS.length);
  });

  it("filtar po županiji vraća samo tu županiju", () => {
    const county = "Splitsko-dalmatinska";
    const result = filterPlants(PLANTS, { ...EMPTY_FILTERS, county });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.county === county)).toBe(true);
  });

  it("filtar po statusu priključka radi", () => {
    const result = filterPlants(PLANTS, { ...EMPTY_FILTERS, gridStatus: "not_requested" });
    expect(result.every((p) => p.grid_status === "not_requested")).toBe(true);
  });

  it("raspon snage je poluotvoren, pa se rasponi ne preklapaju", () => {
    const small = filterPlants(PLANTS, { ...EMPTY_FILTERS, kwpBucket: "do-10" });
    const mid = filterPlants(PLANTS, { ...EMPTY_FILTERS, kwpBucket: "10-50" });
    const overlap = small.filter((p) => mid.includes(p));
    expect(overlap).toHaveLength(0);
  });

  it("pretraga ne pada na dijakritici", () => {
    const withDiacritics = filterPlants(PLANTS, { ...EMPTY_FILTERS, search: "Križevci" });
    const without = filterPlants(PLANTS, { ...EMPTY_FILTERS, search: "krizevci" });
    expect(without.length).toBe(withDiacritics.length);
    expect(without.length).toBeGreaterThan(0);
  });

  it("filtar „traže suradnju” vraća samo elektrane s projektom", () => {
    const result = filterPlants(PLANTS, { ...EMPTY_FILTERS, seekingPartners: true });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.campaign_slug !== null)).toBe(true);
  });

  // ⚠️ docs/07 §2.1: karta i popis MORAJU gledati isti filtrirani skup.
  // Karta prikazuje samo značajke s koordinatama, pa je jedina dopuštena
  // razlika broj elektrana bez koordinata.
  it("GeoJSON za kartu sadrži točno filtrirani skup s koordinatama", () => {
    const filters = { ...EMPTY_FILTERS, county: "Istarska", status: "operational" } as const;
    const filtered = filterPlants(PLANTS, filters);
    const geo = plantsToGeoJson(filtered);
    const withCoords = filtered.filter((p) => p.latitude !== null && p.longitude !== null);
    expect(geo.features).toHaveLength(withCoords.length);
    expect(geo.features.map((f) => f.properties.slug).sort()).toEqual(
      withCoords.map((p) => p.slug).sort(),
    );
  });

  it("statistika se računa iz istog filtriranog skupa", () => {
    const filtered = filterPlants(PLANTS, { ...EMPTY_FILTERS, county: "Istarska" });
    const stats = computeStats(filtered);
    expect(stats.count).toBe(filtered.length);
    expect(stats.operational).toBe(
      filtered.filter((p) => p.status === "operational").length,
    );
  });
});

describe("deep-linkovi", () => {
  it("filtri prežive put kroz URL i natrag", () => {
    const filters = {
      county: "Zadarska",
      status: "planned",
      gridStatus: "requested",
      kwpBucket: "10-50",
      seekingPartners: true,
      search: "krov",
    } as const;
    const roundTripped = filtersFromSearchParams(
      filtersToSearchParams(filters),
      HR_COUNTIES,
    );
    expect(roundTripped).toEqual(filters);
  });

  it("nepoznate vrijednosti u URL-u se odbacuju, ne ruše stranicu", () => {
    const params = new URLSearchParams("zupanija=Atlantida&status=izmisljeno&snaga=xyz");
    expect(filtersFromSearchParams(params, HR_COUNTIES)).toEqual(EMPTY_FILTERS);
  });
});

describe("veze između entiteta", () => {
  it("svaki projekt pokazuje na postojeću elektranu", () => {
    for (const project of PROJECTS) {
      const plant = PLANTS.find((p) => p.id === project.plant_id);
      expect(plant, project.slug).toBeDefined();
    }
  });

  it("svaka elektrana s campaign_slug ima projekt i obrnuto", () => {
    for (const plant of PLANTS) {
      if (plant.campaign_slug === null) continue;
      expect(getProjectForPlant(plant), plant.slug).toBeDefined();
    }
    for (const project of PROJECTS) {
      const plant = PLANTS.find((p) => p.id === project.plant_id);
      expect(plant?.campaign_slug, project.slug).toBe(project.slug);
    }
  });

  it("svaki projekt ima Safe račun", () => {
    for (const project of PROJECTS) {
      expect(SAFES[project.slug], project.slug).toBeDefined();
    }
  });

  it("prikupljeno nikad ne prelazi cilj bez izjave o namjeni viška", () => {
    // Zahtjev E5 (docs/03 §8): prelazak cilja traži izjavu o namjeni viška.
    for (const project of PROJECTS) {
      if (project.raised_cents > project.goal_cents) {
        expect(project.surplus_intent, project.slug).not.toBeNull();
      }
    }
  });

  it("dohvat po slugu radi za svaku elektranu", () => {
    for (const plant of PLANTS) {
      expect(getPlantBySlug(plant.slug)?.id).toBe(plant.id);
    }
  });

  it("sve županije u registru su iz službenog popisa", () => {
    for (const plant of PLANTS) {
      if (plant.county === null) continue;
      expect(HR_COUNTIES, plant.slug).toContain(plant.county);
    }
  });
});
