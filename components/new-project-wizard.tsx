"use client";

/**
 * `/novi-projekt` — čarobnjak (docs/07 §2.7).
 *
 * ⚠️ REDOSLIJED PITANJA JE PRAVNO ODREĐEN, NE UX PREFERENCIJA
 * (E1, E2, docs/03 §8). Tip nositelja je PRVO pitanje jer grana sve dalje:
 * koji su modeli mogući, kako se oporezuje uplata, tko sklapa ugovor. Preslagati
 * korake znači promijeniti pravnu logiku obrasca.
 *
 * ⚠️ Modeli C i D stoje na popisu ONEMOGUĆENI, s objašnjenjem (E2). To nije
 * mrtav gumb nego edukacijski trenutak — i kontrola usklađenosti: ograničenje na
 * modele A i B je jedina stvar koja Mod 2 drži izvan ECSP licence (docs/14 §2.4).
 *
 * ⚠️ Nacrt se sprema u `sessionStorage` PRIJE koraka s računom — naučeno u
 * `pinka-finance/app/dashboard/new/page.tsx`: wallet handoff odvede korisnika sa
 * stranice, a povratak na `dw_error` mora zateći ispunjen obrazac.
 */
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import { formatEur } from "@/lib/format";
import { findForbidden } from "@/lib/forbidden-words";
import { PLANTS } from "@/lib/mock";
import {
  HR_COUNTIES,
  violatesConflictInvariant,
  type HolderType,
  type ProjectModel,
  type SiteRight,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Nacrt
// ─────────────────────────────────────────────────────────────────────────────

interface CostDraft {
  readonly label: string;
  readonly amount: string;
}

interface Draft {
  readonly holder: HolderType | null;
  readonly model: ProjectModel | null;
  readonly plantMode: "existing" | "new";
  readonly plantSlug: string | null;
  readonly newPlantName: string;
  readonly newPlantCapacity: string;
  readonly newPlantCounty: string;
  readonly siteRight: SiteRight | null;
  readonly siteRightDoc: string;
  readonly goalEur: string;
  readonly costs: readonly CostDraft[];
  readonly surplus: string;
  readonly threshold: number;
  readonly owners: number;
  readonly ourSigner: boolean;
  readonly description: string;
}

const EMPTY_DRAFT: Draft = {
  holder: null,
  model: null,
  plantMode: "existing",
  plantSlug: null,
  newPlantName: "",
  newPlantCapacity: "",
  newPlantCounty: "",
  siteRight: null,
  siteRightDoc: "",
  goalEur: "",
  costs: [{ label: "", amount: "" }],
  surplus: "",
  threshold: 3,
  owners: 5,
  ourSigner: false,
  description: "",
};

const DRAFT_KEY = "domovina-energy:project-draft";

/**
 * Nacrt živi u `sessionStorage`, a čita se kroz `useSyncExternalStore` — isti
 * obrazac kao jezik u `lib/i18n` i filtri u `lib/url-state`.
 *
 * Zašto ne `useState` + efekt: stranica je statički export, pa bi čitanje
 * spremnika u inicijalizatoru stanja razišlo prerenderirani HTML i hidraciju.
 * `getServerSnapshot` vraća prazno, pa je prerenderirani obrazac uvijek prazan
 * i poklapa se.
 */
const DRAFT_EVENT = "domovina-energy:draft-changed";

const draftStore = {
  subscribe(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    window.addEventListener(DRAFT_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(DRAFT_EVENT, onChange);
    };
  },
  getSnapshot(): string {
    try {
      return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      // Privatni način rada: nacrt se ne čuva, ali obrazac radi.
      return "";
    }
  },
  getServerSnapshot(): string {
    return "";
  },
  write(raw: string): void {
    try {
      if (raw === "") window.sessionStorage.removeItem(DRAFT_KEY);
      else window.sessionStorage.setItem(DRAFT_KEY, raw);
    } catch {
      // Isto kao gore — unos se ne gubi u sesiji, samo ne preživi handoff.
    }
    window.dispatchEvent(new Event(DRAFT_EVENT));
  },
};

/** Neispravan zapis se ne ruši nego pada na prazan nacrt. */
function parseDraft(raw: string): Draft {
  if (raw === "") return EMPTY_DRAFT;
  try {
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return EMPTY_DRAFT;
  }
}

const HOLDER_TYPES: readonly HolderType[] = [
  "community",
  "association",
  "cooperative",
  "municipality",
  "company",
  "person",
];

const SITE_RIGHTS: readonly SiteRight[] = ["owner", "co_owner_consent", "building_right", "lease"];

const STEPS: readonly MessageKey[] = [
  "wizard.step.holder",
  "wizard.step.model",
  "wizard.step.plant",
  "wizard.step.siteRight",
  "wizard.step.cost",
  "wizard.step.account",
  "wizard.step.description",
  "wizard.step.review",
];

/** EUR u cente. Prazan ili neispravan unos je 0, ne NaN. */
function eurToCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function NewProjectWizard() {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  // Je li korisnik išta dirao u OVOM posjetu — samo tada napomena o vraćenom
  // nacrtu prestaje vrijediti.
  const [edited, setEdited] = useState(false);

  const raw = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.getSnapshot,
    draftStore.getServerSnapshot,
  );
  const draft = useMemo(() => parseDraft(raw), [raw]);
  const restored = !edited && raw !== "";

  const patch = (next: Partial<Draft>) => {
    setEdited(true);
    draftStore.write(JSON.stringify({ ...draft, ...next }));
  };

  const goalCents = eurToCents(draft.goalEur);
  const costTotalCents = draft.costs.reduce((sum, c) => sum + eurToCents(c.amount), 0);
  const forbidden = useMemo(() => findForbidden(draft.description), [draft.description]);
  const conflict = violatesConflictInvariant({
    threshold: draft.threshold,
    platform_signer_count: draft.ourSigner ? 1 : 0,
  });
  const thresholdBad = draft.threshold > draft.owners || draft.threshold < 1;

  const canAdvance = ((): boolean => {
    switch (index) {
      case 0:
        return draft.holder !== null;
      case 1:
        return draft.model !== null;
      case 2:
        return draft.plantMode === "existing"
          ? draft.plantSlug !== null
          : draft.newPlantName.trim() !== "";
      case 3:
        return draft.siteRight !== null && draft.siteRightDoc.trim() !== "";
      case 4:
        return goalCents > 0;
      case 5:
        return !conflict && !thresholdBad;
      case 6:
        return draft.description.trim() !== "" && forbidden.length === 0;
      default:
        return true;
    }
  })();

  if (submitted) {
    return (
      <div className="container-content py-10">
        <div className="mx-auto max-w-2xl rounded-lg border border-forest/25 bg-forest/6 p-6">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800">
            <Check aria-hidden="true" className="h-4 w-4" />
            {t("wizard.submitted")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("wizard.submittedHint")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/karta/"
              className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
            >
              {t("project.back")}
            </Link>
            <button
              type="button"
              onClick={() => {
                draftStore.write("");
                setIndex(0);
                setSubmitted(false);
                setEdited(false);
              }}
              className="rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft hover:border-forest hover:text-forest"
            >
              {t("wizard.startOver")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-content py-6 sm:py-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold text-ink">
          {t("wizard.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">{t("wizard.lead")}</p>
        {restored ? (
          <p className="mt-3 rounded-sm bg-solar-soft px-3 py-2 text-sm text-solar-ink">
            {t("wizard.draftRestored")}
          </p>
        ) : null}
      </header>

      <div className="mt-8 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.1em] text-inkMuted">
          {t("wizard.stepOf", { step: index + 1, total: STEPS.length })}
        </p>
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {STEPS.map((key, i) => (
            <li
              key={key}
              aria-current={i === index ? "step" : undefined}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                i === index
                  ? "bg-forest text-cream"
                  : i < index
                    ? "bg-forest/10 text-forest-800"
                    : "bg-ink/6 text-inkMuted"
              }`}
            >
              {t(key)}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-md border border-ink/8 bg-white/60 p-4 sm:p-6">
          {index === 0 ? <HolderStep draft={draft} patch={patch} /> : null}
          {index === 1 ? <ModelStep draft={draft} patch={patch} /> : null}
          {index === 2 ? <PlantStep draft={draft} patch={patch} /> : null}
          {index === 3 ? <SiteRightStep draft={draft} patch={patch} /> : null}
          {index === 4 ? (
            <CostStep
              draft={draft}
              patch={patch}
              goalCents={goalCents}
              costTotalCents={costTotalCents}
            />
          ) : null}
          {index === 5 ? (
            <AccountStep
              draft={draft}
              patch={patch}
              conflict={conflict}
              thresholdBad={thresholdBad}
            />
          ) : null}
          {index === 6 ? (
            <DescriptionStep draft={draft} patch={patch} forbidden={forbidden} />
          ) : null}
          {index === 7 ? (
            <ReviewStep draft={draft} goalCents={goalCents} costTotalCents={costTotalCents} />
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("wizard.prev")}
          </button>
          {index === STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
            >
              {t("wizard.submit")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={!canAdvance}
              className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("wizard.next")}
            </button>
          )}
        </div>

        <p className="mt-4 rounded-md border border-dashed border-ink/15 bg-sand p-3 text-xs leading-relaxed text-inkMuted">
          {t("wizard.simulated")}
        </p>
      </div>
    </div>
  );
}

interface StepProps {
  readonly draft: Draft;
  readonly patch: (next: Partial<Draft>) => void;
}

function Legend({ title, hint }: { readonly title: string; readonly hint?: string }) {
  return (
    <>
      <legend className="font-display text-lg font-semibold text-ink">{title}</legend>
      {hint !== undefined ? (
        <p className="mt-1 text-sm leading-relaxed text-inkMuted">{hint}</p>
      ) : null}
    </>
  );
}

/** Korak 1 — E1. Tip nositelja grana sve dalje (docs/03 §8). */
function HolderStep({ draft, patch }: StepProps) {
  const { t } = useT();
  return (
    <fieldset>
      <Legend title={t("wizard.holderQuestion")} hint={t("wizard.holderHint")} />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {HOLDER_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => patch({ holder: type })}
            aria-pressed={draft.holder === type}
            className={`rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              draft.holder === type
                ? "border-forest bg-forest/10 text-forest-800"
                : "border-ink/12 bg-white text-inkSoft hover:border-forest hover:text-forest"
            }`}
          >
            {t(`owner.${type}`)}
          </button>
        ))}
      </div>

      {/*
        ⚠️ docs/03 §4: model A je čist kad je korisnik KOLEKTIVAN, a mutan kad je
        pojedinac — elektrana na privatnom krovu podiže vrijednost privatne
        imovine. Upozorenje stoji uz izbor, ne u uvjetima.
      */}
      {draft.holder === "person" ? (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-rust/10 p-3 text-sm leading-relaxed text-rust">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {t("wizard.holderWarn.person")}
        </p>
      ) : null}
      {draft.holder === "company" ? (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-solar-soft p-3 text-sm leading-relaxed text-solar-ink">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {t("wizard.holderWarn.company")}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Korak 2 — E2. Samo modeli A i B; C i D su vidljivi i ONEMOGUĆENI.
 *
 * ⚠️ Ne pretvarati onemogućene kartice u mogući izbor bez odobrenja HANFA-e
 * (docs/03 §6, docs/14 §2.4). Objašnjenje uz njih je razlog zašto stoje ovdje.
 */
function ModelStep({ draft, patch }: StepProps) {
  const { t } = useT();
  const options: readonly { readonly model: ProjectModel; readonly explain: MessageKey }[] = [
    { model: "donation", explain: "model.donationExplain" },
    { model: "community", explain: "model.communityExplain" },
  ];

  return (
    <fieldset>
      <Legend title={t("wizard.modelQuestion")} hint={t("wizard.modelHint")} />

      <div className="mt-4 space-y-2">
        {options.map((option) => (
          <button
            key={option.model}
            type="button"
            onClick={() => patch({ model: option.model })}
            aria-pressed={draft.model === option.model}
            className={`block w-full rounded-md border p-3 text-left transition-colors ${
              draft.model === option.model
                ? "border-forest bg-forest/6"
                : "border-ink/12 bg-white hover:border-forest/40"
            }`}
          >
            <span className="block text-sm font-medium text-ink">
              {option.model === "donation" ? t("model.donation") : t("model.community")}
            </span>
            <span className="mt-0.5 block text-sm text-inkMuted">{t(option.explain)}</span>
          </button>
        ))}
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
        {t("wizard.modelDisabledTitle")}
      </h3>
      <div className="mt-2 space-y-2">
        {(
          [
            { title: "wizard.modelC", why: "wizard.modelCWhy" },
            { title: "wizard.modelD", why: "wizard.modelDWhy" },
          ] as const
        ).map((blocked) => (
          <div
            key={blocked.title}
            aria-disabled="true"
            className="rounded-md border border-dashed border-ink/15 bg-sand p-3"
          >
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-inkMuted">
              <X aria-hidden="true" className="h-3.5 w-3.5 text-rust" />
              {t(blocked.title)}
              <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {t("wizard.disabled")}
              </span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-inkMuted">{t(blocked.why)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-inkMuted">{t("wizard.modelDisabledNote")}</p>
    </fieldset>
  );
}

/** Korak 3 — elektrana iz registra ili nova. */
function PlantStep({ draft, patch }: StepProps) {
  const { t } = useT();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") return PLANTS.slice(0, 6);
    return PLANTS.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.location_name ?? "").toLowerCase().includes(needle),
    ).slice(0, 6);
  }, [query]);

  return (
    <fieldset>
      <Legend title={t("wizard.plantQuestion")} />

      <div className="mt-4 flex gap-2">
        {(["existing", "new"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => patch({ plantMode: mode })}
            aria-pressed={draft.plantMode === mode}
            className={`rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors ${
              draft.plantMode === mode
                ? "border-forest bg-forest/10 text-forest-800"
                : "border-ink/12 bg-white text-inkSoft hover:border-forest hover:text-forest"
            }`}
          >
            {mode === "existing" ? t("wizard.plantExisting") : t("wizard.plantNew")}
          </button>
        ))}
      </div>

      {draft.plantMode === "existing" ? (
        <div className="mt-4">
          <label className="block">
            <span className="text-sm text-inkMuted">{t("wizard.plantSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>

          {matches.length === 0 ? (
            <p className="mt-3 text-sm text-inkMuted">{t("wizard.plantNoResults")}</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {matches.map((plant) => (
                <li key={plant.slug}>
                  <button
                    type="button"
                    onClick={() => patch({ plantSlug: plant.slug })}
                    aria-pressed={draft.plantSlug === plant.slug}
                    className={`block w-full rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                      draft.plantSlug === plant.slug
                        ? "border-forest bg-forest/6 text-forest-800"
                        : "border-ink/12 bg-white text-inkSoft hover:border-forest/40"
                    }`}
                  >
                    <span className="block font-medium text-ink">{plant.name}</span>
                    <span className="block text-xs text-inkMuted">
                      {plant.location_name ?? plant.county}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-inkMuted">{t("wizard.plantNewName")}</span>
            <input
              type="text"
              value={draft.newPlantName}
              onChange={(e) => patch({ newPlantName: e.target.value })}
              className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-inkMuted">{t("wizard.plantNewCapacity")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={draft.newPlantCapacity}
                onChange={(e) => patch({ newPlantCapacity: e.target.value })}
                className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block">
              <span className="text-sm text-inkMuted">{t("wizard.plantNewCounty")}</span>
              <select
                value={draft.newPlantCounty}
                onChange={(e) => patch({ newPlantCounty: e.target.value })}
                className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="">{t("filter.allCounties")}</option>
                {HR_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </fieldset>
  );
}

/** Korak 4 — E6. Bez dokaza prava na lokaciju projekt se ne objavljuje. */
function SiteRightStep({ draft, patch }: StepProps) {
  const { t } = useT();
  return (
    <fieldset>
      <Legend title={t("wizard.siteRightQuestion")} hint={t("wizard.siteRightHint")} />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SITE_RIGHTS.map((right) => (
          <button
            key={right}
            type="button"
            onClick={() => patch({ siteRight: right })}
            aria-pressed={draft.siteRight === right}
            className={`rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              draft.siteRight === right
                ? "border-forest bg-forest/10 text-forest-800"
                : "border-ink/12 bg-white text-inkSoft hover:border-forest hover:text-forest"
            }`}
          >
            {t(`project.siteRight.${right}`)}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-sm text-inkMuted">{t("wizard.siteRightDoc")}</span>
        <input
          type="text"
          value={draft.siteRightDoc}
          onChange={(e) => patch({ siteRightDoc: e.target.value })}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>

      <p className="mt-3 text-xs leading-relaxed text-inkMuted">{t("project.siteRightNote")}</p>
    </fieldset>
  );
}

/** Korak 5 — cilj i javna razrada troška (P5) + izjava o namjeni viška (E5). */
function CostStep({
  draft,
  patch,
  goalCents,
  costTotalCents,
}: StepProps & { readonly goalCents: number; readonly costTotalCents: number }) {
  const { t } = useT();
  const matches = goalCents > 0 && costTotalCents === goalCents;

  return (
    <fieldset>
      <Legend title={t("wizard.goalQuestion")} />

      <label className="mt-4 block max-w-xs">
        <span className="text-sm text-inkMuted">{t("wizard.goalLabel")}</span>
        <input
          type="text"
          inputMode="decimal"
          value={draft.goalEur}
          onChange={(e) => patch({ goalEur: e.target.value })}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>

      <h3 className="mt-6 font-display text-base font-semibold text-ink">
        {t("wizard.costTitle")}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-inkMuted">{t("wizard.costHint")}</p>

      <ul className="mt-3 space-y-2">
        {draft.costs.map((cost, i) => (
          <li key={i} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t("wizard.costLabel")}</span>
              <input
                type="text"
                value={cost.label}
                placeholder={t("wizard.costLabel")}
                onChange={(e) =>
                  patch({
                    costs: draft.costs.map((c, j) =>
                      j === i ? { ...c, label: e.target.value } : c,
                    ),
                  })
                }
                className="w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="w-32">
              <span className="sr-only">{t("wizard.costAmount")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={cost.amount}
                placeholder={t("wizard.costAmount")}
                onChange={(e) =>
                  patch({
                    costs: draft.costs.map((c, j) =>
                      j === i ? { ...c, amount: e.target.value } : c,
                    ),
                  })
                }
                className="w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
              />
            </label>
            <button
              type="button"
              onClick={() => patch({ costs: draft.costs.filter((_, j) => j !== i) })}
              className="rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-inkMuted hover:border-rust hover:text-rust"
            >
              {t("wizard.costRemove")}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => patch({ costs: [...draft.costs, { label: "", amount: "" }] })}
        className="mt-3 rounded-sm border border-ink/12 bg-white px-3 py-1.5 text-sm font-medium text-inkSoft hover:border-forest hover:text-forest"
      >
        {t("wizard.costAdd")}
      </button>

      <p className="mt-4 text-sm text-inkSoft">
        {t("wizard.costTotal")}: <span className="font-medium">{formatEur(costTotalCents)}</span>
      </p>
      {goalCents > 0 ? (
        <p className={`mt-1 text-sm ${matches ? "text-teal-700" : "text-rust"}`}>
          {matches
            ? t("wizard.costMatch")
            : t("wizard.costMismatch", {
                total: formatEur(costTotalCents),
                goal: formatEur(goalCents),
              })}
        </p>
      ) : null}

      {/* E5 — izjava o namjeni viška PRIJE prelaska cilja, ne poslije. */}
      <label className="mt-6 block">
        <span className="text-sm text-inkMuted">{t("wizard.surplusLabel")}</span>
        <textarea
          rows={2}
          value={draft.surplus}
          onChange={(e) => patch({ surplus: e.target.value })}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>
      <p className="mt-1 text-xs leading-relaxed text-inkMuted">{t("wizard.surplusHint")}</p>
    </fieldset>
  );
}

/**
 * Korak 6 — račun projekta. Ovdje bi u pravoj verziji bio wallet handoff
 * (docs/04 §3.1), i zato je nacrt već spremljen prije nego korisnik stigne ovamo.
 *
 * ⚠️ P7 (docs/14 §4): naš potpis NIKAD ne smije činiti većinu praga. Provjera je
 * ista funkcija koja čuva postojeće račune (`violatesConflictInvariant`), ne
 * njezina kopija.
 */
function AccountStep({
  draft,
  patch,
  conflict,
  thresholdBad,
}: StepProps & { readonly conflict: boolean; readonly thresholdBad: boolean }) {
  const { t } = useT();
  return (
    <fieldset>
      <Legend title={t("wizard.accountQuestion")} hint={t("wizard.accountHint")} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-inkMuted">{t("wizard.threshold")}</span>
          <input
            type="number"
            min={1}
            max={draft.owners}
            value={draft.threshold}
            onChange={(e) => patch({ threshold: Number.parseInt(e.target.value, 10) || 1 })}
            className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm text-inkMuted">{t("wizard.owners")}</span>
          <input
            type="number"
            min={1}
            value={draft.owners}
            onChange={(e) => patch({ owners: Number.parseInt(e.target.value, 10) || 1 })}
            className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-inkSoft">
        <input
          type="checkbox"
          checked={draft.ourSigner}
          onChange={(e) => patch({ ourSigner: e.target.checked })}
          className="h-4 w-4 rounded-sm border-ink/20 text-forest"
        />
        {t("wizard.ourSigner")}
      </label>

      {thresholdBad ? (
        <p className="mt-3 rounded-md bg-rust/10 p-3 text-sm text-rust">
          {t("wizard.thresholdBad")}
        </p>
      ) : null}

      {conflict ? (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-rust/10 p-3 text-sm leading-relaxed text-rust">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {t("wizard.conflictBad")}
        </p>
      ) : draft.ourSigner ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-700">
          <Check aria-hidden="true" className="h-4 w-4" />
          {t("wizard.conflictOk")}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Korak 7 — E3. Opis se provjerava PRIJE predaje, ne poslije objave.
 *
 * ⚠️ Provjera koristi isti popis kao lint nad našim copyjem
 * (`lib/forbidden-words.ts`) — dvije kopije pravila raziđu se tiho, a ovdje bi
 * razlika značila da tuđi tekst prolazi ono što naš ne smije.
 */
function DescriptionStep({
  draft,
  patch,
  forbidden,
}: StepProps & { readonly forbidden: ReturnType<typeof findForbidden> }) {
  const { t } = useT();
  const hasText = draft.description.trim() !== "";

  return (
    <fieldset>
      <Legend title={t("wizard.descriptionQuestion")} hint={t("wizard.descriptionHint")} />

      <label className="mt-4 block">
        <span className="sr-only">{t("wizard.descriptionQuestion")}</span>
        <textarea
          rows={6}
          value={draft.description}
          placeholder={t("wizard.descriptionPlaceholder")}
          onChange={(e) => patch({ description: e.target.value })}
          className={`mt-1 w-full rounded-sm border bg-white px-3 py-2 text-sm text-ink ${
            forbidden.length > 0 ? "border-rust" : "border-ink/12"
          }`}
        />
      </label>

      {forbidden.length > 0 ? (
        <div className="mt-3 rounded-md bg-rust/10 p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-rust">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {t("wizard.blockedTitle")}
          </p>
          <ul className="mt-2 space-y-1">
            {forbidden.map((hit) => (
              <li key={hit.match} className="text-sm text-rust">
                {t("wizard.blockedItem", { match: hit.match, why: hit.why })}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-inkSoft">{t("wizard.blockedHint")}</p>
        </div>
      ) : hasText ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-700">
          <Check aria-hidden="true" className="h-4 w-4" />
          {t("wizard.descriptionOk")}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Korak 8 — pregled pa predaja na `review` (docs/07 §2.7). */
function ReviewStep({
  draft,
  goalCents,
  costTotalCents,
}: {
  readonly draft: Draft;
  readonly goalCents: number;
  readonly costTotalCents: number;
}) {
  const { t } = useT();
  const plant = draft.plantSlug === null ? null : PLANTS.find((p) => p.slug === draft.plantSlug);

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{t("wizard.reviewTitle")}</h2>

      <dl className="mt-4 rounded-md border border-ink/8 bg-cream/60 px-4">
        <ReviewRow
          label={t("project.holder")}
          value={draft.holder === null ? "—" : t(`owner.${draft.holder}`)}
        />
        <ReviewRow
          label={t("model.label")}
          value={
            draft.model === null
              ? "—"
              : draft.model === "donation"
                ? t("model.donation")
                : t("model.community")
          }
        />
        <ReviewRow
          label={t("wizard.step.plant")}
          value={plant?.name ?? (draft.newPlantName || "—")}
        />
        <ReviewRow
          label={t("project.siteRightLabel")}
          value={draft.siteRight === null ? "—" : t(`project.siteRight.${draft.siteRight}`)}
        />
        <ReviewRow label={t("project.goal")} value={formatEur(goalCents)} />
        <ReviewRow label={t("wizard.costTotal")} value={formatEur(costTotalCents)} />
        <ReviewRow
          label={t("account.threshold")}
          value={t("account.thresholdValue", {
            threshold: draft.threshold,
            owners: draft.owners,
          })}
        />
      </dl>

      {draft.description.trim() !== "" ? (
        <p className="mt-4 whitespace-pre-line rounded-md border border-ink/8 bg-white/60 p-3 text-sm leading-relaxed text-inkSoft">
          {draft.description}
        </p>
      ) : null}

      {/* ⚠️ docs/07 §2.3: granica se vidi i u čarobnjaku, ne tek na objavljenoj stranici. */}
      <p className="mt-4 text-sm font-medium text-inkSoft">{t("model.noPromise")}</p>
    </section>
  );
}

function ReviewRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/8 py-2.5 last:border-b-0">
      <dt className="text-sm text-inkMuted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
