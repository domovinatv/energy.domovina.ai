import { describe, expect, it } from "vitest";
import {
  BETA_PROJECTS,
  buildEpcText,
  formatIban,
  isPayable,
  isValidSafe,
  remittanceFor,
  weiToCents,
  type BetaProject,
} from "@/lib/beta-projects";
import { decodeAddressArray, decodeUint } from "@/lib/safe-rpc";

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

const RAIL = { kind: "rail", campaignId: "lukavec-fne", iban: "EE70 7777 0001 6292 1128", beneficiaryName: "ITalk d.o.o.", bic: null } as const;

describe("beta: tko smije primati uplate (docs/04 §3.3)", () => {
  it("projekt bez Safea nije naplativ", () => {
    expect(isPayable(project({ payment: RAIL }))).toBe(false);
  });
  it("nulta adresa nije Safe — uplata bi bila spaljena", () => {
    expect(isValidSafe("0x0000000000000000000000000000000000000000")).toBe(false);
    expect(isPayable(project({ safe: "0x0000000000000000000000000000000000000000", payment: RAIL }))).toBe(false);
  });
  it("Safe bez načina uplate nije naplativ", () => {
    expect(isPayable(project({ safe: SAFE }))).toBe(false);
  });
  it("Safe bez upisanih potpisnika nije naplativ — nitko ga nije provjerio", () => {
    expect(isPayable(project({ safe: SAFE, payment: RAIL }))).toBe(false);
  });
  it("prag veći od broja potpisnika nije naplativ", () => {
    expect(isPayable(project({ safe: SAFE, payment: RAIL, signers: { owners: [SAFE], threshold: 2 } }))).toBe(false);
  });
  it("Safe + potpisnici + način uplate jest naplativ", () => {
    expect(isPayable(project({ safe: SAFE, signers: SIGNERS, payment: RAIL }))).toBe(true);
  });
});

describe("beta: opis plaćanja i EPC QR", () => {
  it("rail opis je isti format kao pay.domovina.ai campaign-qr", () => {
    const p = project({ safe: SAFE, signers: SIGNERS, payment: RAIL });
    if (!isPayable(p)) throw new Error("očekivan naplativ projekt");
    expect(remittanceFor(p)).toBe(`cmp:${SAFE.toLowerCase()}?id=lukavec-fne`);
  });
  it("Monerium usmjeravanje po opisu: gnosis:<safe>", () => {
    const p = project({
      safe: SAFE,
      signers: SIGNERS,
      payment: { kind: "monerium", routing: "reference", iban: "X", beneficiaryName: "X", bic: null },
    });
    if (!isPayable(p)) throw new Error("očekivan naplativ projekt");
    expect(remittanceFor(p)).toBe(`gnosis:${SAFE}`);
  });
  it("EPC tekst ima deset redaka, IBAN bez razmaka, prazan iznos", () => {
    const lines = buildEpcText({ beneficiaryName: "ITalk d.o.o.", iban: RAIL.iban, bic: null, remittance: "cmp:x" }).split("\n");
    expect(lines).toHaveLength(10);
    expect(lines[0]).toBe("BCD");
    expect(lines[1]).toBe("001");
    expect(lines[6]).toBe("EE707777000162921128");
    expect(lines[7]).toBe("");
  });
  it("s BIC-om ide verzija 002", () => {
    expect(buildEpcText({ beneficiaryName: "X", iban: "X", bic: "TRWIBEB1XXX", remittance: "r" }).split("\n")[1]).toBe("002");
  });
  it("IBAN se grupira po četiri znaka", () => {
    expect(formatIban("EE707777000162921128")).toBe("EE70 7777 0001 6292 1128");
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
  it("adresa sadrži poštanski broj i mjesto kartice", () => {
    for (const p of BETA_PROJECTS) {
      expect(p.address).toMatch(/\b\d{5}\b/);
      expect(p.address.endsWith(p.place)).toBe(true);
    }
  });
  it("rail projekt ima ispravan id kampanje (pay.domovina.ai: 6–64 znaka)", () => {
    for (const p of BETA_PROJECTS) {
      if (p.payment?.kind === "rail") expect(p.payment.campaignId).toMatch(/^[A-Za-z0-9_-]{6,64}$/);
    }
  });
});
