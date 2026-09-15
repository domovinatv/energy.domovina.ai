/**
 * Testovi invarijanti toka novca — Faza 1d.
 *
 * Isto pravilo kao u `invariants.test.ts` i `marketplace.test.ts` (docs/10 §4):
 * testira se ono što bi, ako padne, promijenilo PRAVNU ili ČINJENIČNU poziciju
 * proizvoda, a ne pokrivenost.
 *
 * docs/06 §2 imenuje četiri invarijante koje ovaj dijagram mora DOKAZATI, ne
 * samo nacrtati:
 *   1. doprinositelj plaća 0 € platformi u svakom koraku,
 *   2. zbroj salda je konstantan (novac se ne stvara ni ne gubi),
 *   3. saldo nikad nije negativan,
 *   4. iz Safea se ne može izaći bez M potpisa.
 *
 * Peta je došla iz docs/14 §1 i nije bila na popisu: u Modu 2 novac **ne
 * prolazi kroz nas**. Bez testa bi to bila tvrdnja na landingu koju ništa ne
 * drži.
 */
import { describe, expect, it } from "vitest";
import {
  MIN_CONTRIBUTION_CENTS,
  edges,
  nodeById,
  nodes,
  scenarioSubset,
  scenarioViolatesConflict,
  scenarios,
  simulate,
  totalBalance,
  transitionById,
  transitions,
  type NodeId,
} from "../energy-machine";
import { PLATFORM_TAKE_PCT } from "../fees";
import { findForbidden } from "../forbidden-words";
import { toMermaid } from "../../components/money-flow-mermaid";

// ─────────────────────────────────────────────────────────────────────────────
// Graf je cjelovit
// ─────────────────────────────────────────────────────────────────────────────

describe("graf je cjelovit", () => {
  it("svaki prijelaz pokazuje na postojeću vezu i postojeće čvorove", () => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edgeIds = new Set(edges.map((edge) => edge.id));
    for (const transition of transitions) {
      expect(edgeIds.has(transition.edge), transition.id).toBe(true);
      if (transition.from !== null) expect(nodeIds.has(transition.from)).toBe(true);
      if (transition.to !== null) expect(nodeIds.has(transition.to)).toBe(true);
    }
  });

  it("svaka veza spaja postojeće čvorove", () => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    for (const edge of edges) {
      expect(nodeIds.has(edge.source), edge.id).toBe(true);
      expect(nodeIds.has(edge.target), edge.id).toBe(true);
    }
  });

  it("svaku vezu koristi barem jedan prijelaz — nema ukrasnih strelica", () => {
    const used = new Set(transitions.map((transition) => transition.edge));
    for (const edge of edges) expect(used.has(edge.id), edge.id).toBe(true);
  });

  it("svaki prijelaz koji miče novac ima i polazište i odredište", () => {
    for (const transition of transitions) {
      if (!transition.movesMoney) continue;
      expect(transition.from, transition.id).not.toBeNull();
      expect(transition.to, transition.id).not.toBeNull();
    }
  });

  it("svaki scenarij koristi svaki svoj korak iz popisa prijelaza", () => {
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        expect(transitionById[step.t], `${scenario.id}/${step.t}`).toBeDefined();
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Četiri invarijante iz docs/06 §2
// ─────────────────────────────────────────────────────────────────────────────

describe.each(scenarios)("scenarij $id", (scenario) => {
  const steps = simulate(scenario);

  it("odigra svaki korak", () => {
    expect(steps).toHaveLength(scenario.steps.length);
  });

  // ⚠️ Invarijanta 1. Ovo je tvrdnja koju cijela sekcija „Zašto 0 %" nosi.
  it("uplatitelj nama plaća 0 € u svakom koraku", () => {
    for (const step of steps) {
      expect(step.platformFeeCents, `korak ${step.index}`).toBe(0);
    }
    expect(PLATFORM_TAKE_PCT).toBe(0);
  });

  // ⚠️ Invarijanta 2.
  it("zbroj salda je konstantan — novac se ne stvara ni ne gubi", () => {
    for (const step of steps) {
      expect(totalBalance(step.balances), `korak ${step.index}`).toBe(
        scenario.initialCents,
      );
    }
  });

  // ⚠️ Invarijanta 3.
  it("nijedan saldo nikad nije negativan", () => {
    for (const step of steps) {
      for (const [id, value] of Object.entries(step.balances)) {
        expect(value, `${id} u koraku ${step.index}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // ⚠️ Invarijanta 4.
  it("nijedna prihvaćena isplata iz računa projekta nije prošla s manje od M potpisa", () => {
    for (const step of steps) {
      if (step.status !== "ok" || step.signaturesRequired === null) continue;
      expect(step.signaturesGiven, `korak ${step.index}`).toBeGreaterThanOrEqual(
        step.signaturesRequired,
      );
      expect(step.signaturesRequired).toBe(scenario.safe.threshold);
    }
  });

  // docs/14 §4 (P7): naš potpis nikad ne čini većinu praga — ni u primjeru.
  it("naš potpisnik ne čini većinu praga", () => {
    expect(scenarioViolatesConflict(scenario), scenario.id).toBe(false);
  });

  // Elektrana je ishod, ne novčani čvor. Da jest, invarijanta očuvanja bi se
  // „zatvarala" tako što novac nestane u nju.
  it("čvor ishoda nema saldo ni u jednom koraku", () => {
    const outcomeIds = nodes
      .filter((node) => node.kind === "outcome")
      .map((node) => node.id);
    expect(outcomeIds.length).toBeGreaterThan(0);
    for (const step of steps) {
      for (const id of outcomeIds) {
        expect(step.balances[id], `${id} u koraku ${step.index}`).toBe(0);
      }
    }
  });

  it("odbijen korak ne pomiče ni cent", () => {
    // Stanje prije prvog koraka: sve je još u banci uplatitelja.
    const atStart = Object.fromEntries(
      nodes.map((node) => [
        node.id,
        node.id === "contributorBank" ? scenario.initialCents : 0,
      ]),
    ) as Record<NodeId, number>;

    for (const step of steps) {
      if (step.status !== "rejected") continue;
      const before = step.index === 0 ? atStart : steps[step.index - 1]?.balances;
      expect(before, `korak ${step.index} nema prethodno stanje`).toBeDefined();
      for (const node of nodes) {
        expect(step.balances[node.id], `${node.id} u koraku ${step.index}`).toBe(
          before?.[node.id],
        );
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Peta invarijanta: u Modu 2 novac ne prolazi kroz nas
// ─────────────────────────────────────────────────────────────────────────────

describe("Mod 2 — novac ne prolazi kroz nas (docs/14 §1)", () => {
  const byo = scenarios.filter((scenario) => scenario.mode === "byo");

  it("postoji barem jedan scenarij na klijentovim šinama", () => {
    expect(byo.length).toBeGreaterThan(0);
  });

  it.each(byo)("$id: naše šine nemaju saldo ni u jednom koraku", (scenario) => {
    for (const step of simulate(scenario)) {
      expect(step.balances.rail, `korak ${step.index}`).toBe(0);
    }
  });

  it.each(byo)("$id: nijedan korak ne prolazi kroz naš čvor", (scenario) => {
    const subset = scenarioSubset(scenario);
    expect(subset.nodes.has("rail")).toBe(false);
    expect(subset.edges.has("e-mint-rail")).toBe(false);
    expect(subset.edges.has("e-forward")).toBe(false);
  });

  it.each(byo)("$id: nismo potpisnik uopće", (scenario) => {
    expect(scenario.safe.platform_signer_count).toBe(0);
    expect(scenario.rails).toBe("client");
  });

  it("u Modu 1 novac JEST prošao kroz naše šine — inače usporedba nema smisla", () => {
    const integrated = scenarios.filter(
      (scenario) => scenario.mode === "integrated" && scenario.id !== "granice",
    );
    expect(integrated.length).toBeGreaterThan(0);
    for (const scenario of integrated) {
      const touched = simulate(scenario).some((step) => step.balances.rail > 0);
      expect(touched, scenario.id).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Granice — scenarij koji NE prolazi
// ─────────────────────────────────────────────────────────────────────────────

describe("granice odbijaju točno ono što trebaju", () => {
  const scenario = scenarios.find((item) => item.id === "granice");
  if (scenario === undefined) throw new Error("scenarij `granice` mora postojati");
  const steps = simulate(scenario);
  const rejected = steps.filter((step) => step.status === "rejected");

  it("odbijena su točno tri koraka, svaki iz drugog razloga", () => {
    expect(rejected.map((step) => step.rejectCode)).toEqual([
      "belowMin",
      "notEnoughSignatures",
      "insufficientFunds",
    ]);
  });

  it("iznos ispod najmanjeg doprinosa ne prolazi", () => {
    const first = rejected[0];
    expect(first?.transition.id).toBe("sepaOrder");
    expect(first?.amountCents).toBeLessThan(MIN_CONTRIBUTION_CENTS);
  });

  // ⚠️ Ovo je jedini test koji dokazuje da multisig nije ukras: dva potpisa uz
  // prag tri moraju pasti, i to na TOM razlogu, ne slučajno na nekom drugom.
  it("dva potpisa uz prag tri ne otvaraju račun projekta", () => {
    const second = rejected[1];
    expect(second?.transition.id).toBe("releaseSituation");
    expect(second?.signaturesGiven).toBe(2);
    expect(second?.signaturesRequired).toBe(3);
  });

  it("nakon odbijenih koraka ispravan slijed i dalje prolazi do kraja", () => {
    const last = steps.at(-1);
    expect(last?.status).toBe("ok");
    expect(last?.location).toBe("contractor");
    expect(last?.balances.projectSafe).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Terminalna stanja triju priča
// ─────────────────────────────────────────────────────────────────────────────

describe("priče završavaju ondje gdje kažu da završavaju", () => {
  const storyScenarios = scenarios.filter((scenario) => scenario.id !== "granice");

  it.each(storyScenarios)(
    "$id: krug se zatvara — sve završi u banci izvođača",
    (scenario) => {
      const last = simulate(scenario).at(-1);
      expect(last?.balances.contractorBank).toBe(scenario.initialCents);
      expect(last?.balances.projectSafe).toBe(0);
      expect(last?.balances.contributorBank).toBe(0);
    },
  );

  it.each(storyScenarios)("$id: elektrana se preda", (scenario) => {
    expect(scenario.steps.some((step) => step.t === "handover")).toBe(true);
  });

  it.each(storyScenarios)(
    "$id: uplatitelj je svojoj banci platio nešto, a nama ništa",
    (scenario) => {
      const last = simulate(scenario).at(-1);
      expect(last?.ownBankFeeCents).toBeGreaterThan(0);
      expect(last?.platformFeeCents).toBe(0);
    },
  );

  it("tri priče pokrivaju tri tražena slučaja (docs/06 §2)", () => {
    const ids = storyScenarios.map((scenario) => scenario.id);
    expect(ids).toEqual(["susjedi", "skola", "zadruga"]);
    expect(storyScenarios.length).toBeGreaterThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pravna granica u labelama machinea
// ─────────────────────────────────────────────────────────────────────────────

describe("pravna granica vrijedi i za tekst u machineu", () => {
  // `scripts/check-copy.ts` provjerava string literale u `lib/`, pa ovo je
  // druga brava na istim vratima — ali provjerava SASTAVLJENI tekst, uključujući
  // ono što nastane interpolacijom stopa iz `lib/fees.ts`.
  const everyText = [
    ...nodes.flatMap((node) => [
      node.title.hr,
      node.title.en,
      node.subtitle.hr,
      node.subtitle.en,
      node.ownership?.hr ?? "",
      node.ownership?.en ?? "",
    ]),
    ...edges.flatMap((edge) => [edge.label.hr, edge.label.en]),
    ...transitions.flatMap((transition) => [
      transition.label.hr,
      transition.label.en,
      transition.description.hr,
      transition.description.en,
      transition.costNote.hr,
      transition.costNote.en,
    ]),
    ...scenarios.flatMap((scenario) => [
      scenario.name.hr,
      scenario.name.en,
      scenario.description.hr,
      scenario.description.en,
    ]),
  ];

  it("nijedna labela ne sadrži zabranjen pojam", () => {
    for (const text of everyText) {
      expect(findForbidden(text), text).toEqual([]);
    }
  });

  it("svaki čvor ima obje labele u oba jezika", () => {
    for (const node of nodes) {
      expect(node.title.hr.length, node.id).toBeGreaterThan(0);
      expect(node.title.en.length, node.id).toBeGreaterThan(0);
      expect(node.subtitle.hr.length, node.id).toBeGreaterThan(0);
      expect(node.subtitle.en.length, node.id).toBeGreaterThan(0);
      expect(nodeById[node.id]).toBe(node);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mermaid izvor — sintaksa koja se inače lomi tek u pregledniku
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ NALAZ IZ FAZE 1d, i pronašao ga je preglednik, ne kod.
 *
 * `classDef off fill:#F5EFE6,stroke:rgba(26, 26, 26, 0.12)` razbije mermaidov
 * parser, jer je zarez u `classDef` razdjelnik SVOJSTAVA. Posljedica nije
 * ružan dijagram nego **nikakav** — host ostane prazan, a u konzoli nema ničega
 * jer je iznimka bila neuhvaćena promise rejekcija.
 *
 * Ista klasa tihog kvara kao maplibre worker pod Turbopackom (dnevnik §1).
 * Zato se izvor od sada provjerava ovdje: test je jeftiniji od drugog otkrića
 * u pregledniku, i vrijedi za svaki scenarij i oba jezika.
 */
describe("mermaid izvor je sintaktički siguran (dnevnik §10.2)", () => {
  const sources = scenarios.flatMap((scenario) =>
    (["hr", "en"] as const).map((locale) => ({
      id: `${scenario.id}/${locale}`,
      text: toMermaid(scenario, locale, null),
    })),
  );

  it("nijedan `classDef` ni `linkStyle` redak ne sadrži `rgba(`", () => {
    for (const source of sources) {
      const styleLines = source.text
        .split("\n")
        .filter((line) => /^\s*(classDef|linkStyle|style)\b/.test(line));
      expect(styleLines.length, source.id).toBeGreaterThan(0);
      for (const line of styleLines) {
        expect(line, `${source.id}: ${line}`).not.toContain("rgba(");
        expect(line, `${source.id}: ${line}`).not.toContain("(");
      }
    }
  });

  it("svaka boja u stilskim recima je heks bez zareza u vrijednosti", () => {
    for (const source of sources) {
      for (const line of source.text.split("\n")) {
        if (!/^\s*(classDef|linkStyle|style)\b/.test(line)) continue;
        // Nakon imena pravila svojstva su `kljuc:vrijednost`, odvojena zarezom.
        for (const pair of line.trim().split(/\s+/).slice(2).join(" ").split(",")) {
          if (!pair.includes(":")) continue;
          const value = pair.split(":")[1] ?? "";
          if (value.startsWith("#")) {
            expect(value, `${source.id}: ${line}`).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
          }
        }
      }
    }
  });

  it("labele nemaju znakove koji lome mermaid", () => {
    // Strelice (`-->`, `.->`) same sadrže `>`, pa se provjerava SADRŽAJ labele,
    // a ne cijeli redak: ono unutar navodnika i unutar uglatih zagrada.
    for (const source of sources) {
      for (const line of source.text.split("\n")) {
        if (/^\s*(classDef|linkStyle|style|flowchart)\b/.test(line)) continue;
        const labels = [
          ...[...line.matchAll(/"([^"]*)"/g)].map((m) => m[1] ?? ""),
          ...[...line.matchAll(/\(\[([^\]]*)\]\)/g)].map((m) => m[1] ?? ""),
        ];
        for (const label of labels) {
          expect(label, `${source.id}: ${line}`).not.toMatch(/[<>`'"]/);
          expect(label.trim().length, `${source.id}: prazna labela`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("svaki čvor i svaka veza iz machinea nađu se u izvoru", () => {
    for (const source of sources) {
      for (const node of nodes) {
        expect(source.text, `${source.id}: ${node.id}`).toContain(node.id);
      }
      // Sve veze su nacrtane; one izvan scenarija samo točkasto.
      const arrows = source.text.split("\n").filter((line) => /-->|\.->/.test(line));
      expect(arrows.length, source.id).toBe(edges.length);
    }
  });

  it("prigušeni čvorovi ostaju nacrtani, a ne izbačeni", () => {
    const byo = scenarios.find((item) => item.mode === "byo");
    if (byo === undefined) throw new Error("treba scenarij na klijentovim šinama");
    const text = toMermaid(byo, "hr", null);
    // `rail` nije u scenariju, ali mora biti na slici — prigušen.
    expect(text).toContain("class rail off");
    expect(text).toContain("class projectSafe on");
  });
});
