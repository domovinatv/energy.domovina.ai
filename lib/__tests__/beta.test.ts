import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BETA_PROJECTS,
  PHOTO_WIDTHS,
  isPayable,
  isValidSafe,
  weiToCents,
  parseAmountEur,
  PRESET_AMOUNTS_EUR,
  DEFAULT_AMOUNT_EUR,
  type BetaProject,
} from "@/lib/beta-projects";
import { BETA_HEP } from "@/lib/beta-hep";
import { istaAdresa, zadnjeOcitanje, zadnjih12Mjeseci } from "@/lib/moja-mreza";
import { balanceOfCalldata, decodeAddressArray, decodeUint } from "@/lib/safe-rpc";

const SAFE = "0x6693a7D19486Dc45e9F90Fd2D515d972bBA2d65e" as const;

function project(overrides: Partial<BetaProject>): BetaProject {
  return {
    slug: "test",
    place: "Test",
    address: "Test 1, 10000 Test",
    county: "Test",
    powerKw: 1,
    connections: 1,
    gnosisNode: false,
    safe: null,
    signers: null,
    goalCents: null,
    payment: null,
    photos: null,
    ...overrides,
  };
}

const SIGNERS = {
  owners: [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333",
  ],
  threshold: 2,
} as const satisfies { owners: `0x${string}`[]; threshold: number };

const INTENT = { kind: "mpt-intent" } as const;

describe("beta: tko smije primati uplate (docs/04 §3.3)", () => {
  it("projekt bez Safea nije naplativ", () => {
    expect(isPayable(project({ payment: INTENT }))).toBe(false);
  });
  it("nulta adresa nije Safe — uplata bi bila spaljena", () => {
    expect(isValidSafe("0x0000000000000000000000000000000000000000")).toBe(false);
    expect(isPayable(project({ safe: "0x0000000000000000000000000000000000000000", payment: INTENT }))).toBe(false);
  });
  it("Safe bez načina uplate nije naplativ", () => {
    expect(isPayable(project({ safe: SAFE }))).toBe(false);
  });
  it("Safe bez upisanih potpisnika nije naplativ — nitko ga nije provjerio", () => {
    expect(isPayable(project({ safe: SAFE, payment: INTENT }))).toBe(false);
  });
  it("prag veći od broja potpisnika nije naplativ", () => {
    expect(isPayable(project({ safe: SAFE, payment: INTENT, signers: { owners: [SAFE], threshold: 2 } }))).toBe(false);
  });
  it("Safe + potpisnici + način uplate jest naplativ", () => {
    expect(isPayable(project({ safe: SAFE, signers: SIGNERS, payment: INTENT }))).toBe(true);
  });
});

describe("beta: čitanje Safea s lanca", () => {
  it("dekodira address[] iz getOwners()", () => {
    const hex =
      "0x" +
      "0000000000000000000000000000000000000000000000000000000000000020" +
      "0000000000000000000000000000000000000000000000000000000000000002" +
      "000000000000000000000000AbCdEf0000000000000000000000000000000001" +
      "0000000000000000000000002222222222222222222222222222222222222222";
    expect(decodeAddressArray(hex)).toEqual([
      "0xabcdef0000000000000000000000000000000001",
      "0x2222222222222222222222222222222222222222",
    ]);
  });
  it("dekodira uint iz getThreshold()", () => {
    expect(decodeUint("0x0000000000000000000000000000000000000000000000000000000000000002")).toBe(2);
  });
});

describe("beta: iznos intenta (obavezan u EPC QR-u)", () => {
  it("prihvaća zarez i točku, do dvije decimale", () => {
    expect(parseAmountEur("12,50")).toBe(12.5);
    expect(parseAmountEur("12.5")).toBe(12.5);
    expect(parseAmountEur(" 100 ")).toBe(100);
  });
  it("odbija prazno, nulu, tri decimale, slova i iznos preko maksimuma", () => {
    for (const bad of ["", "0", "0,00", "1,005", "abc", "-5", "15000,01"]) expect(parseAmountEur(bad)).toBeNull();
  });
  it("zadani i ponuđeni iznosi su valjani", () => {
    expect(PRESET_AMOUNTS_EUR).toContain(DEFAULT_AMOUNT_EUR);
    for (const a of PRESET_AMOUNTS_EUR) expect(parseAmountEur(String(a))).toBe(a);
  });
});

describe("beta: iznosi s lanca", () => {
  it("1 EURe (18 decimala) je 100 centi", () => {
    expect(weiToCents("1000000000000000000")).toBe(100);
  });
  it("ostatak ispod centa se odbacuje, ne zaokružuje nagore", () => {
    expect(weiToCents("1239999999999999999")).toBe(123);
  });
});

describe("beta: podaci o projektima", () => {
  it("tri lokacije, jedinstveni slugovi", () => {
    expect(BETA_PROJECTS).toHaveLength(3);
    expect(new Set(BETA_PROJECTS.map((p) => p.slug)).size).toBe(3);
  });
  it("snage: Lukavec 16 kW, Donja Lomnica 2 × 10 kW, Rab 8 kW", () => {
    const bySlug = Object.fromEntries(BETA_PROJECTS.map((p) => [p.slug, p]));
    expect(bySlug.lukavec?.powerKw).toBe(16);
    expect(bySlug["donja-lomnica"]?.powerKw).toBe(20);
    expect(bySlug["donja-lomnica"]?.connections).toBe(2);
    expect(bySlug.rab?.powerKw).toBe(8);
  });
  it("ciljevi kampanja: 11.200 €, 15.500 €, 6.500 €", () => {
    expect(BETA_PROJECTS.map((p) => p.goalCents)).toEqual([1_120_000, 1_550_000, 650_000]);
  });
  it("svaka slika kampanje ima obje širine u public/", () => {
    for (const p of BETA_PROJECTS) {
      for (const base of Object.values(p.photos ?? {})) {
        if (base === null) continue;
        for (const w of PHOTO_WIDTHS) {
          expect(existsSync(join(process.cwd(), "public", `${base}-${w}.webp`)), `${base}-${w}.webp`).toBe(true);
        }
      }
    }
  });
  it("adresa sadrži poštanski broj i mjesto kartice", () => {
    for (const p of BETA_PROJECTS) {
      expect(p.address).toMatch(/\b\d{5}\b/);
      expect(p.address.endsWith(p.place)).toBe(true);
    }
  });
});

describe("beta: saldo s lanca", () => {
  it("balanceOf calldata: selektor + adresa na 32 bajta, mala slova", () => {
    expect(balanceOfCalldata("0x4f7f1950B2CB6713CcB47b869F30C0ebc01d0173")).toBe(
      "0x70a08231" + "000000000000000000000000" + "4f7f1950b2cb6713ccb47b869f30c0ebc01d0173",
    );
  });
});

describe("beta: HEP ODS mjerna mjesta (Moja mreža)", () => {
  it("svako mjerno mjesto je na adresi svog projekta", () => {
    for (const [slug, hep] of Object.entries(BETA_HEP)) {
      const project = BETA_PROJECTS.find((p) => p.slug === slug);
      expect(project, slug).toBeDefined();
      expect(istaAdresa(hep.mjesto.adresa, project!.address), `${hep.mjesto.adresa} ≠ ${project!.address}`).toBe(true);
    }
  });
  it("ime nositelja se ne objavljuje", () => {
    for (const hep of Object.values(BETA_HEP)) expect(hep.mjesto.korisnik).toBeUndefined();
  });
  it("Lukavec: OMM, brojilo, zadnje stvarno očitanje i 12 mjeseci potrošnje", () => {
    const { mjesto } = BETA_HEP.lukavec!;
    expect(mjesto.omm).toBe("0100031779");
    expect(mjesto.broj_brojila).toBe("87071794");
    expect(zadnjeOcitanje(mjesto)).toMatchObject({ datum: "2026-10-05", t1_kwh: 15343, t2_kwh: 9019 });
    const godina = zadnjih12Mjeseci(mjesto);
    expect(godina[0]?.od).toBe("2025-10-01");
    expect(godina.at(-1)?.do).toBe("2026-09-30");
    expect(godina.reduce((s, p) => s + p.ukupno_kwh, 0)).toBe(9723);
  });
  it("vrsta razdoblja: procjena, korekcija nakon procjena, izmjereno", () => {
    const byOd = Object.fromEntries(zadnjih12Mjeseci(BETA_HEP.lukavec!.mjesto).map((p) => [p.od, p.vrsta]));
    expect(byOd["2026-03-01"]).toBe("procjena"); // kraj 31.3. = automatska procjena
    expect(byOd["2026-07-01"]).toBe("korekcija"); // 30.6. procjena → 26.7. ODS
    expect(byOd["2026-09-01"]).toBe("izmjereno"); // rubovi 1.9. i 1.10. su ODS-ova očitanja
  });
});

describe("Moja mreža: adresa", () => {
  it("HEP-ov zapis i naš zapis iste adrese se poklapaju", () => {
    expect(istaAdresa("CIGLENICE 38/A, LUKAVEC", "Ciglenice 38A, 10412 Lukavec")).toBe(true);
  });
  it("protuprimjer: drugi kućni broj nije ista adresa", () => {
    expect(istaAdresa("CIGLENICE 38/B, LUKAVEC", "Ciglenice 38A, 10412 Lukavec")).toBe(false);
    expect(istaAdresa("CIGLENICE 3, LUKAVEC", "Ciglenice 38A, 10412 Lukavec")).toBe(false);
  });
});
