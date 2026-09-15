"use client";

/**
 * Sekcija 4 landinga — „Kako radi" (docs/06 §2).
 *
 * Najvrednija sekcija i ona koja se najlakše pokvari, pa je izvedena tako da se
 * NE MOŽE raziđi sa sobom: dijagram, koraci i testovi čitaju isti artefakt
 * (`lib/energy-machine.ts`). Nema druge kopije toka novca ni u jednom prikazu.
 *
 * ⚠️ Prebacivanje React Flow ↔ Mermaid ide preko `matchMedia` kroz
 * `useSyncExternalStore` (`lib/media-query.ts`), pa je prerenderirani HTML uvijek
 * uži prikaz i hidracija se poklapa. Oba se učitavaju dinamički — stranica ne
 * plaća oba crtača, a nijedan ne dira `window` pri prerenderu.
 */
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import {
  REJECT_REASONS,
  scenarios,
  simulate,
  type Scenario,
} from "@/lib/energy-machine";
import { DIAGRAM_BREAKPOINT, useMediaQuery } from "@/lib/media-query";
import { formatEur, formatEurPrecise, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";

const MoneyFlowReactFlow = dynamic(
  () => import("./money-flow-reactflow").then((m) => m.MoneyFlowReactFlow),
  { ssr: false },
);

const MoneyFlowMermaid = dynamic(
  () => import("./money-flow-mermaid").then((m) => m.MoneyFlowMermaid),
  { ssr: false },
);

function ScenarioPicker({
  active,
  onPick,
  locale,
}: {
  readonly active: Scenario;
  readonly onPick: (scenario: Scenario) => void;
  readonly locale: "hr" | "en";
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-orientation="horizontal">
      {scenarios.map((scenario) => {
        const isActive = scenario.id === active.id;
        return (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onPick(scenario)}
            className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "border-forest bg-forest text-cream"
                : "border-ink/12 bg-white text-inkSoft hover:border-forest hover:text-forest"
            }`}
          >
            {scenario.name[locale]}
          </button>
        );
      })}
    </div>
  );
}

export function MoneyFlow() {
  const { t, locale } = useT();
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "susjedi");
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const steps = useMemo(() => (scenario === undefined ? [] : simulate(scenario)), [scenario]);
  const wide = useMediaQuery(DIAGRAM_BREAKPOINT);

  if (scenario === undefined) return null;

  const current = steps[Math.min(stepIndex, steps.length - 1)];
  const activeEdge = current?.transition.edge ?? null;
  // Procesni korak ne miče novac, pa čvor ostaje ondje gdje je i bio.
  const activeNode = current?.location ?? null;

  const pick = (next: Scenario): void => {
    setScenarioId(next.id);
    setStepIndex(0);
  };

  return (
    <div className="mt-8">
      <ScenarioPicker active={scenario} onPick={pick} locale={locale} />

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-inkSoft">
        {scenario.description[locale]}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-inkMuted">
            {t("flow.totalLabel")}
          </dt>
          <dd className="font-display text-lg font-semibold text-ink">
            {formatEur(scenario.initialCents)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-inkMuted">
            {t("flow.peopleLabel")}
          </dt>
          <dd className="font-display text-lg font-semibold text-ink">
            {formatNumber(scenario.contributors)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-inkMuted">
            {t("flow.thresholdLabel")}
          </dt>
          <dd className="font-display text-lg font-semibold text-ink">
            {t("flow.threshold", {
              m: scenario.safe.threshold,
              n: scenario.safe.owners,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-inkMuted">
            {t("flow.ourKeysLabel")}
          </dt>
          <dd className="font-display text-lg font-semibold text-ink">
            {scenario.safe.platform_signer_count === 0
              ? t("flow.ourKeysNone")
              : t("flow.ourKeys", { count: scenario.safe.platform_signer_count })}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        {wide ? (
          <MoneyFlowReactFlow
            scenario={scenario}
            locale={locale}
            activeEdge={activeEdge}
            activeNode={activeNode}
          />
        ) : (
          <div className="rounded-md border border-ink/8 bg-cream p-3">
            <MoneyFlowMermaid
              scenario={scenario}
              locale={locale}
              activeEdge={activeEdge}
              activeNode={activeNode}
              failureText={t("flow.diagramFailed")}
            />
          </div>
        )}
      </div>

      {/* Upravljanje korakom */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1 rounded-sm border border-ink/12 bg-white px-3 py-1.5 text-sm text-inkSoft transition-colors hover:border-forest hover:text-forest disabled:opacity-40 disabled:hover:border-ink/12 disabled:hover:text-inkSoft"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          {t("flow.prev")}
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={stepIndex >= steps.length - 1}
          className="inline-flex items-center gap-1 rounded-sm bg-forest px-3 py-1.5 text-sm font-medium text-cream transition-colors hover:bg-forest-700 disabled:opacity-40 disabled:hover:bg-forest"
        >
          {t("flow.next")}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setStepIndex(0)}
          className="inline-flex items-center gap-1 rounded-sm border border-ink/12 bg-white px-3 py-1.5 text-sm text-inkSoft transition-colors hover:border-forest hover:text-forest"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t("flow.restart")}
        </button>
        <p className="text-xs text-inkMuted">
          {t("flow.stepOf", { index: stepIndex + 1, total: steps.length })}
        </p>
      </div>

      {/* Koraci. Popis je i pristupačan tekstualni ekvivalent dijagrama. */}
      <ol className="mt-5 space-y-2">
        {steps.map((step, index) => {
          const isCurrent = index === stepIndex;
          const rejected = step.status === "rejected";
          return (
            <li key={`${step.transition.id}-${index}`}>
              <button
                type="button"
                onClick={() => setStepIndex(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={`w-full rounded-md border p-4 text-left transition-colors ${
                  isCurrent
                    ? rejected
                      ? "border-rust bg-rust/6"
                      : "border-solar bg-solar-soft"
                    : "border-ink/8 bg-white/70 hover:border-forest/40"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${
                      rejected ? "text-rust" : isCurrent ? "text-solar-ink" : "text-ink"
                    }`}
                  >
                    {index + 1}. {step.transition.label[locale]}
                  </p>
                  {step.transition.movesMoney ? (
                    <p className="text-sm font-medium text-inkSoft">
                      {formatEur(step.amountCents)}
                    </p>
                  ) : (
                    <p className="text-xs uppercase tracking-[0.12em] text-inkMuted">
                      {t("flow.noMoney")}
                    </p>
                  )}
                </div>

                {isCurrent ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-inkSoft">
                      {step.transition.description[locale]}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-inkMuted">
                      {step.transition.costNote[locale]}
                    </p>
                  </>
                ) : null}

                {rejected ? (
                  <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-rust">
                    <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {step.rejectCode === undefined
                      ? ""
                      : REJECT_REASONS[step.rejectCode][locale]}
                  </p>
                ) : null}

                {step.signaturesRequired !== null && !rejected ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-forest-800">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    {t("flow.signatures", {
                      given: step.signaturesGiven ?? 0,
                      required: step.signaturesRequired,
                    })}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      {/*
        ⚠️ Ovo je tvrdnja koju testovi invarijanti dokazuju, a ne ukras
        (docs/06 §2). Uz nju odmah stoji i ono što uplatitelj DOISTA plati svojoj
        banci — „0 €" koje bi to prešutjelo bilo bi ista klasa greške kao „0 %"
        bez napomene da smo izvođač (docs/14 §3.1).
      */}
      <div className="mt-6 rounded-md border border-forest/25 bg-forest/6 p-5">
        <p className="text-sm font-medium text-forest-800">
          {t("flow.invariantTitle", { amount: formatEur(current?.platformFeeCents ?? 0) })}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-inkSoft">
          {t("flow.invariantBody", {
            bankFee: formatEurPrecise(current?.ownBankFeeCents ?? 0),
          })}
        </p>
      </div>
    </div>
  );
}
