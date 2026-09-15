/**
 * Testovi invarijanti Faze 1c — marketplace.
 *
 * Isto pravilo kao u `invariants.test.ts` (docs/10 §4): testira se ono što bi,
 * ako padne, promijenilo PRAVNU ili ČINJENIČNU poziciju proizvoda, a ne
 * pokrivenost. Dva ispravka iz Faze 1a/1b izašla su upravo iz ovakvih testova,
 * a ne iz čitanja koda (dnevnik izvedbe §5).
 */
import { describe, expect, it } from "vitest";
import {
  COMMUNITIES,
  CONTRIBUTIONS,
  DEMO_NOW,
  MEMBERS,
  PROJECTS,
  SAFES,
  getContributionsForProject,
  getDocumentsForProject,
  getMembersForCommunity,
  getPlantForProject,
  getPlantsForCommunity,
  getProjectsForCommunity,
  getTimelineForProject,
  openProjects,
} from "../mock";
import {
  costTotals,
  daysBetween,
  hasLateStep,
  isOpenForContributions,
  milestoneTotals,
  progressPct,
  shareBasisPoints,
  timelineStepView,
} from "../project";
import {
  APPROVED_NEGATIONS,
  FORBIDDEN_EXAMPLES,
  FORBIDDEN_IDENTIFIER_EXAMPLES,
  FORBIDDEN_IDENTIFIER_NON_EXAMPLES,
  findForbidden,
  findForbiddenIdentifier,
} from "../forbidden-words";
import { TIMELINE_STEPS, violatesConflictInvariant } from "../types";

describe("razrada troška je cijena tvrdnje o 0 % (P5, docs/14 §3.1)", () => {
  // Ako se razrada ne zbraja u cilj, tvrdnja „cijena izvedbe je javna" pada:
  // negdje postoji iznos koji se prikuplja a nije objašnjen.
  it("zbroj razrade jednak je cilju projekta", () => {
    for (const project of PROJECTS) {
      expect(costTotals(project).total_cents, project.slug).toBe(project.goal_cents);
    }
  });

  // docs/14 §3.1 (P8): „0 %" se nikad ne piše bez napomene da smo izvođač. U
  // podacima to znači da integrirani projekt MORA imati maržu kao vidljivu
  // stavku — inače u UI-ju nema što stajati uz tvrdnju.
  it("marža postoji točno kad smo izvođač", () => {
    for (const project of PROJECTS) {
      const margin = costTotals(project).margin_cents;
      if (project.mode === "integrated") {
        expect(margin, project.slug).toBeGreaterThan(0);
        expect(project.contractor, project.slug).not.toBeNull();
      } else {
        // ⚠️ docs/14 §1: u Modu 2 nismo izvođač i ne zarađujemo ništa.
        expect(margin, project.slug).toBe(0);
        expect(project.contractor, project.slug).toBeNull();
      }
    }
  });

  it("marža nikad nije većina troška izvedbe", () => {
    for (const project of PROJECTS) {
      expect(costTotals(project).margin_share, project.slug).toBeLessThan(0.5);
    }
  });
});

describe("plaćanje po situaciji (P6, docs/14 §5.1)", () => {
  // Zbroj situacija mora pokriti cijeli cilj: ono što nije vezano uz situaciju
  // isplatilo bi se bez napretka radova, a upravo to je invarijanta koja kupce
  // drži izvan naše stečajne mase.
  it("zbroj situacija jednak je cilju projekta", () => {
    for (const project of PROJECTS) {
      expect(milestoneTotals(project.milestones).total_cents, project.slug).toBe(
        project.goal_cents,
      );
    }
  });

  it("isplaćeno i neisplaćeno zajedno daju ukupno", () => {
    for (const project of PROJECTS) {
      const totals = milestoneTotals(project.milestones);
      expect(totals.released_cents + totals.pending_cents).toBe(totals.total_cents);
    }
  });
});

describe("tijek (K1) pokazuje kašnjenje", () => {
  it("svaki projekt ima svih šest koraka, istim redom", () => {
    for (const project of PROJECTS) {
      const steps = getTimelineForProject(project.slug);
      expect(steps.map((s) => s.key), project.slug).toEqual([...TIMELINE_STEPS]);
    }
  });

  // ⚠️ Prototip u kojem sve teče po planu ne pokazuje ono zbog čega tab postoji
  // (docs/13 §4.2). Barem jedan projekt mora kasniti, inače se stanje `late`
  // nikad ne vidi — ni na sajmu ni u razvoju.
  it("barem jedan projekt vidljivo kasni", () => {
    const late = PROJECTS.filter((p) => hasLateStep(getTimelineForProject(p.slug), DEMO_NOW));
    expect(late.length).toBeGreaterThan(0);
  });

  it("korak bez plana je `unscheduled`, ne `pending`", () => {
    const view = timelineStepView(
      { key: "mounted", planned: null, actual: null, note: null },
      DEMO_NOW,
    );
    // Projekt koji nije postavio rok ne smije izgledati kao da ga ispunjava.
    expect(view.state).toBe("unscheduled");
    expect(view.drift_days).toBeNull();
  });

  it("plan u prošlosti bez ostvarenja je `late`, s brojem dana", () => {
    const view = timelineStepView(
      { key: "mounted", planned: "2026-08-30", actual: null, note: null },
      DEMO_NOW,
    );
    expect(view.state).toBe("late");
    expect(view.drift_days).toBe(daysBetween("2026-08-30", DEMO_NOW));
  });

  it("ostvareno poslije plana ostaje `done`, ali nosi pomak", () => {
    const view = timelineStepView(
      { key: "ordered", planned: "2026-06-15", actual: "2026-07-18", note: null },
      DEMO_NOW,
    );
    expect(view.state).toBe("done");
    expect(view.drift_days).toBe(33);
  });

  // Kašnjenje mora biti OBJAŠNJENO, ne samo obojano — inače je to ista šutnja
  // na koju se žalio Rippleov Trustpilot, samo u boji.
  it("svaki korak koji kasni nosi objašnjenje", () => {
    for (const project of PROJECTS) {
      for (const step of getTimelineForProject(project.slug)) {
        if (timelineStepView(step, DEMO_NOW).state !== "late") continue;
        expect(step.note, `${project.slug}:${step.key}`).not.toBeNull();
      }
    }
  });
});

describe("dokumenti se ne izmišljaju", () => {
  // ⚠️ docs/04 §6: lažna poveznica je jedina stvar koja bi na sajmu djelovala
  // kao prijevara, a ne kao maketa. U prototipu nijedan dokument ne postoji, pa
  // nijedan `url` ne smije biti postavljen.
  it("nijedan dokument u prototipu nema poveznicu", () => {
    for (const project of PROJECTS) {
      for (const doc of getDocumentsForProject(project.slug)) {
        expect(doc.url, `${project.slug}:${doc.key}`).toBeNull();
      }
    }
  });

  // E6 (docs/03 §8): dokaz prava na lokaciju je uvjet za objavu.
  it("svaki javni projekt navodi dokument o pravu na lokaciju", () => {
    for (const project of PROJECTS) {
      const kinds = getDocumentsForProject(project.slug).map((d) => d.kind);
      expect(kinds, project.slug).toContain("site_right");
    }
  });

  // Kod modela B statut je pravni temelj članstva, ne dodatak.
  it("projekti modela zajednice navode statut", () => {
    for (const project of PROJECTS) {
      if (project.model !== "community") continue;
      const kinds = getDocumentsForProject(project.slug).map((d) => d.kind);
      expect(kinds, project.slug).toContain("statute");
    }
  });
});

describe("udio je u proizvedenoj energiji, ne u dobiti", () => {
  // Ista računica u mocku i u tijeku doprinosa — inače bi ekran potvrde
  // pokazivao jedan broj, a knjiga doprinosa drugi.
  it("udjeli u mocku odgovaraju računici iz lib/project.ts", () => {
    for (const contribution of CONTRIBUTIONS) {
      if (contribution.share_basis_points === null) continue;
      const project = PROJECTS.find((p) => p.id === contribution.project_id);
      expect(project, contribution.id).toBeDefined();
      if (project === undefined) continue;
      expect(shareBasisPoints(contribution.amount_cents, project.goal_cents)).toBe(
        contribution.share_basis_points,
      );
    }
  });

  it("udio se ne računa kad nema cilja", () => {
    expect(shareBasisPoints(10_000, 0)).toBe(0);
  });
});

describe("napredak i otvorenost projekta", () => {
  it("napredak je odrezan na 100 %", () => {
    for (const project of PROJECTS) {
      const pct = progressPct(project);
      expect(pct, project.slug).toBeGreaterThanOrEqual(0);
      expect(pct, project.slug).toBeLessThanOrEqual(100);
    }
  });

  it("doprinose prima samo projekt u stanju `active`", () => {
    for (const project of PROJECTS) {
      expect(isOpenForContributions(project), project.slug).toBe(project.state === "active");
    }
    expect(openProjects().every((p) => p.state === "active")).toBe(true);
  });

  // K4 (docs/13 §K4): popis SMIJE biti prazan i ekran to mora podnijeti. Test
  // čuva da funkcija ne baci kad projekata nema — prazno je stanje, ne greška.
  it("prazan popis otvorenih projekata nije greška", () => {
    expect(Array.isArray(openProjects())).toBe(true);
  });
});

describe("kontrola usklađenosti na tuđem tekstu (E3)", () => {
  // ⚠️ docs/14 §2.4: ograničenje na modele A i B je jedina stvar koja Mod 2 drži
  // izvan ECSP licence. Validacija opisa projekta je dio te kontrole, ne savjet.
  // Primjeri žive uz sama pravila (`lib/forbidden-words.ts`) — jedina datoteka
  // s iznimkom u lintu. Ovdje se samo provjerava da ih popis stvarno hvata, i
  // to preko OČEKIVANOG izraza, da test ne prođe slučajno preko drugog pravila.
  it("svaki zabilježeni primjer pada na očekivanom izrazu", () => {
    for (const example of FORBIDDEN_EXAMPLES) {
      const hits = findForbidden(example.text);
      expect(hits.length, example.text).toBeGreaterThan(0);
      expect(
        hits.map((h) => h.match.toLowerCase()),
        example.text,
      ).toContain(example.expected);
    }
  });

  it("popis primjera pokriva oba jezika", () => {
    expect(FORBIDDEN_EXAMPLES.length).toBeGreaterThan(8);
  });

  it("dopuštene formulacije prolaze", () => {
    expect(findForbidden("Doprinos financira izgradnju krova škole.")).toHaveLength(0);
    expect(
      findForbidden("Član dobiva glas u zajednici i udio u proizvedenoj energiji."),
    ).toHaveLength(0);
  });

  // ⚠️ Odobrene negacije su popis NAŠIH rečenica i NE vrijede za korisnički
  // unos: nitko izvana ne smije odobravati vlastite pravne formulacije kroz
  // obrazac. Ovo je namjerno, a ne rupa.
  it("odobrena negacija ne prolazi kroz korisnički unos", () => {
    for (const sentence of APPROVED_NEGATIONS) {
      expect(findForbidden(sentence).length, sentence).toBeGreaterThan(0);
    }
  });

  it("jedan tekst može pasti na više pravila odjednom", () => {
    const multi = FORBIDDEN_EXAMPLES[0];
    expect(multi).toBeDefined();
    if (multi === undefined) return;
    expect(findForbidden(`${multi.text} ${FORBIDDEN_EXAMPLES[1]?.text ?? ""}`).length).toBe(2);
  });
});

/**
 * ⚠️ Nalaz iz Faze 1d, ista klasa kao padeži iz 1c (dnevnik §7.1): uzorak pisan
 * za engleski ne prenosi se na hrvatski. Pravilo `\b\w*[rR]oi\w*\s*[:=(]`
 * padalo je na riječi „p·roi·zvoda:", jer `\w*` prije korijena pojede svaki
 * prefiks.
 *
 * Lažni pozitiv je ovdje skoro jednako štetan kao propust: rješenje na koje
 * navodi je nova iznimka u `ALLOWLIST`, a iznimka po iznimka ubija kontrolu.
 * Zato se pravila o imenima polja testiraju u OBA smjera.
 */
describe("pravila o imenima polja podnose hrvatski (dnevnik §10.1)", () => {
  it("svako ime koje mora pasti — pada, i na očekivanom izrazu", () => {
    for (const example of FORBIDDEN_IDENTIFIER_EXAMPLES) {
      const hit = findForbiddenIdentifier(example.text);
      expect(hit, example.text).not.toBeNull();
      expect(hit?.match, example.text).toContain(example.expected);
    }
  });

  it("obična hrvatska riječ s engleskim slogom NE pada", () => {
    for (const line of FORBIDDEN_IDENTIFIER_NON_EXAMPLES) {
      expect(findForbiddenIdentifier(line), line).toBeNull();
    }
  });

  it("popis protuprimjera postoji i nije prazan", () => {
    // Pravilo bez protuprimjera nitko ne provjerava dok ne pukne.
    expect(FORBIDDEN_IDENTIFIER_NON_EXAMPLES.length).toBeGreaterThan(0);
    expect(FORBIDDEN_IDENTIFIER_EXAMPLES.length).toBeGreaterThan(0);
  });
});

describe("invarijanta sukoba interesa vrijedi i na nacrtu iz čarobnjaka", () => {
  // Ista funkcija čuva postojeći Safe i račun koji se tek slaže (docs/07 §2.7
  // korak 6). Dvije kopije pravila raziđu se tiho.
  it("jedan naš ključ uz prag 3 je dopušten", () => {
    expect(violatesConflictInvariant({ threshold: 3, platform_signer_count: 1 })).toBe(false);
  });

  it("jedan naš ključ uz prag 2 je dopušten — i tada treba tuđi potpis", () => {
    expect(violatesConflictInvariant({ threshold: 2, platform_signer_count: 1 })).toBe(false);
  });

  it("dva naša ključa uz prag 2 znače da potpisujemo sami", () => {
    expect(violatesConflictInvariant({ threshold: 2, platform_signer_count: 2 })).toBe(true);
  });

  it("dva naša ključa uz prag 3 čine većinu praga", () => {
    expect(violatesConflictInvariant({ threshold: 3, platform_signer_count: 2 })).toBe(true);
  });
});

describe("zajednice", () => {
  // docs/05 §6: `idea` i `preparing` su NORMALNA stanja. Prototip mora sadržati
  // barem jedno takvo, inače ekran koji ih prikazuje nikad nije viđen.
  it("prototip sadrži zajednicu koja pravno još ne postoji", () => {
    const early = COMMUNITIES.filter(
      (c) => c.registration_state === "idea" || c.registration_state === "preparing",
    );
    expect(early.length).toBeGreaterThan(0);
  });

  it("neregistrirana zajednica nema OIB", () => {
    for (const community of COMMUNITIES) {
      if (community.registration_state === "registered") continue;
      expect(community.oib, community.slug).toBeNull();
    }
  });

  it("svaki član pripada postojećoj zajednici", () => {
    const ids = new Set(COMMUNITIES.map((c) => c.id));
    for (const member of MEMBERS) {
      expect(ids.has(member.community_id), member.id).toBe(true);
    }
  });

  it("veze zajednica → projekt → elektrana se razrješavaju", () => {
    for (const community of COMMUNITIES) {
      const projects = getProjectsForCommunity(community.slug);
      const plants = getPlantsForCommunity(community.slug);
      expect(plants.length, community.slug).toBe(projects.length);
      for (const project of projects) {
        expect(getPlantForProject(project), project.slug).toBeDefined();
      }
    }
  });

  it("zajednica bez projekta je dopuštena — `idea` nije prazan zapis", () => {
    const idea = COMMUNITIES.find((c) => c.registration_state === "idea");
    expect(idea).toBeDefined();
    if (idea === undefined) return;
    expect(getProjectsForCommunity(idea.slug)).toHaveLength(0);
  });

  it("članovi zajednice odgovaraju doprinositeljima njezinih projekata", () => {
    for (const community of COMMUNITIES) {
      const members = getMembersForCommunity(community.slug);
      const contributions = getProjectsForCommunity(community.slug).flatMap((p) =>
        getContributionsForProject(p.slug),
      );
      expect(members.length, community.slug).toBe(contributions.length);
    }
  });
});

describe("Safe računi projekata", () => {
  it("prag je uvijek veći od jedan — jedan potpis nije multisig", () => {
    for (const [slug, safe] of Object.entries(SAFES)) {
      expect(safe.threshold, slug).toBeGreaterThan(1);
    }
  });
});
