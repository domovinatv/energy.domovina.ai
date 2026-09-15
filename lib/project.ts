/**
 * Izvedene veličine projekta — jedno mjesto za svaku računicu koju ekran
 * prikazuje (docs/07 §2.3).
 *
 * Isti razlog kao `filterPlants` u registru: kad napredak, zbroj troška i
 * kašnjenje računa svaka kartica za sebe, dvije se brojke na istom ekranu
 * raziđu i nitko ne zna koja je točna. Ovdje je računica jednom, a testovi
 * invarijanti je čuvaju.
 *
 * ⚠️ Nijedna funkcija ovdje ne smije proizvesti brojku koja liči na prinos,
 * povrat ili udio u dobiti (docs/03 §3). Postotak napretka je postotak
 * PRIKUPLJENOG prema cilju, a udio marže je udio u TROŠKU IZVEDBE — oboje
 * činjenice o projektu, ne obećanja uplatitelju.
 */
import type { CostItem, Milestone, Project, TimelineStep } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Napredak prikupljanja
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Udio prikupljenog u cilju, 0–100, zaokruženo i odrezano na 100.
 *
 * Odrezano jer traka napretka preko 100 % izgleda kao greška; stvarni iznos
 * iznad cilja stoji u brojkama uz traku, zajedno s izjavom o namjeni viška (E5).
 */
export function progressPct(project: Project): number {
  if (project.goal_cents <= 0) return 0;
  return Math.min(100, Math.round((project.raised_cents / project.goal_cents) * 100));
}

/** Koliko još nedostaje do cilja. Nikad negativno. */
export function remainingCents(project: Project): number {
  return Math.max(0, project.goal_cents - project.raised_cents);
}

/** Je li projekt prešao cilj — tada UI MORA prikazati izjavu o namjeni viška (E5). */
export function exceedsGoal(project: Project): boolean {
  return project.raised_cents > project.goal_cents;
}

/**
 * Prima li projekt doprinose.
 *
 * Samo `active`. `funded` i `building` više ne primaju, `draft`/`review` nisu
 * javni, `expired`/`completed` su gotovi.
 */
export function isOpenForContributions(project: Project): boolean {
  return project.state === "active";
}

// ─────────────────────────────────────────────────────────────────────────────
// Razrada troška (P5, docs/14 §3.1)
// ─────────────────────────────────────────────────────────────────────────────

export interface CostTotals {
  readonly total_cents: number;
  /** Naša marža. 0 u Modu 2 — tamo nismo izvođač (docs/14 §1). */
  readonly margin_cents: number;
  /** Udio marže u ukupnom trošku izvedbe, 0–1. */
  readonly margin_share: number;
  readonly items: readonly CostItem[];
}

/**
 * ⚠️ Ovo je cijena tvrdnje da ne uzimamo postotak od prikupljenog (docs/14 §3.1).
 * Marža se prikazuje kao zasebna stavka s vlastitim iznosom — nikad utopljena u
 * „ostalo" ni izostavljena iz zbroja.
 */
export function costTotals(project: Project): CostTotals {
  const items = project.cost_breakdown;
  const total = items.reduce((sum, item) => sum + item.amount_cents, 0);
  const margin = items
    .filter((item) => item.is_contractor_margin === true)
    .reduce((sum, item) => sum + item.amount_cents, 0);
  return {
    total_cents: total,
    margin_cents: margin,
    margin_share: total > 0 ? margin / total : 0,
    items,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Situacije (P6, docs/14 §5.1)
// ─────────────────────────────────────────────────────────────────────────────

export interface MilestoneTotals {
  readonly released_cents: number;
  readonly pending_cents: number;
  readonly total_cents: number;
  readonly released_count: number;
}

/**
 * Plaćanje po situaciji je ono što uplatitelje drži izvan naše stečajne mase
 * (docs/14 §5.1): novac koji nije zarađen nije ni isplaćen. Zbroj neisplaćenog
 * je zato prvorazredna brojka, ne zbroj radi zbroja.
 */
export function milestoneTotals(milestones: readonly Milestone[]): MilestoneTotals {
  let released = 0;
  let pending = 0;
  let releasedCount = 0;
  for (const milestone of milestones) {
    if (milestone.released_at !== null) {
      released += milestone.amount_cents;
      releasedCount += 1;
    } else {
      pending += milestone.amount_cents;
    }
  }
  return {
    released_cents: released,
    pending_cents: pending,
    total_cents: released + pending,
    released_count: releasedCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tijek (K1, docs/13 §K1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stanje jednog koraka.
 *
 * `late` postoji zato što se kašnjenje mora VIDJETI. Korak bez plana je
 * `unscheduled`, a ne „na vrijeme" — projekt koji nije postavio rok ne smije
 * izgledati kao projekt koji ga ispunjava.
 */
export type TimelineState = "done" | "late" | "pending" | "unscheduled";

export interface TimelineStepView {
  readonly step: TimelineStep;
  readonly state: TimelineState;
  /**
   * Pomak u danima. Pozitivan = kasni. Kod dovršenih koraka mjeri se ostvarenje
   * prema planu, kod nedovršenih današnji dan prema planu.
   */
  readonly drift_days: number | null;
}

const MS_PER_DAY = 86_400_000;

/** Cijeli dani od `from` do `to`. Ulaz su ISO datumi. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/**
 * Korak + izvedeno stanje. `now` se predaje izvana (u prototipu `DEMO_NOW`), da
 * računica bude deterministična i testabilna.
 */
export function timelineStepView(step: TimelineStep, now: string): TimelineStepView {
  if (step.actual !== null) {
    return {
      step,
      state: "done",
      drift_days: step.planned === null ? null : daysBetween(step.planned, step.actual),
    };
  }
  if (step.planned === null) {
    return { step, state: "unscheduled", drift_days: null };
  }
  const drift = daysBetween(step.planned, now);
  return {
    step,
    state: drift > 0 ? "late" : "pending",
    drift_days: drift,
  };
}

export function timelineView(
  steps: readonly TimelineStep[],
  now: string,
): readonly TimelineStepView[] {
  return steps.map((step) => timelineStepView(step, now));
}

/** Kasni li projekt u bilo kojem koraku — za oznaku na vrhu taba. */
export function hasLateStep(steps: readonly TimelineStep[], now: string): boolean {
  return timelineView(steps, now).some((view) => view.state === "late");
}

// ─────────────────────────────────────────────────────────────────────────────
// Rok
// ─────────────────────────────────────────────────────────────────────────────

/** Dana do roka. Negativno znači da je rok prošao; null ⇒ projekt nema rok. */
export function daysToDeadline(project: Project, now: string): number | null {
  if (project.deadline === null) return null;
  return daysBetween(now, project.deadline);
}

// ─────────────────────────────────────────────────────────────────────────────
// Udio u proizvedenoj energiji (model B)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Udio člana u PROIZVEDENOJ ENERGIJI i glasu, u bazičnim bodovima.
 *
 * ⚠️ Ovo nije udio u dobiti i ne smije se tako prikazati ni nazvati (docs/03 §3,
 * docs/05 §5). Član dobiva energiju i glas; novac od viška predanog u mrežu ide
 * u blagajnu zajednice, ne članu — čim bi se dijelio razmjerno ulogu, model
 * klizne u C (docs/03 §5.2).
 *
 * Razmjerno ulogu prema cilju projekta, ista računica po kojoj su izvedeni
 * doprinosi u `lib/mock.ts`.
 */
export function shareBasisPoints(amountCents: number, goalCents: number): number {
  if (goalCents <= 0) return 0;
  return Math.round((amountCents / goalCents) * 10_000);
}
