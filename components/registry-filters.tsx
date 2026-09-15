"use client";

/**
 * Filtri registra — docs/07 §2.1: županija, status, `grid_status`, raspon kWp,
 * „traže suradnju" i tekstualna pretraga.
 *
 * Komponenta je bez stanja: stanje živi u `<Registry>`, koji njime hrani I
 * kartu I popis. Da filtar drži vlastito stanje, bilo bi moguće da se ta dva
 * raziđu — a to je upravo greška na koju docs/07 §2.1 upozorava.
 */
import { Search, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  EMPTY_FILTERS,
  KWP_BUCKETS,
  hasActiveFilters,
  type PlantFilters,
} from "@/lib/filters";
import { GRID_STATUSES, HR_COUNTIES, PLANT_STATUSES } from "@/lib/types";

const FIELD =
  "w-full rounded-sm border border-ink/12 bg-white px-2.5 py-2 text-sm text-ink " +
  "focus:border-teal focus:outline-none focus:ring-2 focus:ring-ring/30";

const LABEL = "block text-[11px] font-medium uppercase tracking-[0.1em] text-inkMuted";

interface Props {
  readonly filters: PlantFilters;
  readonly onChange: (next: PlantFilters) => void;
  readonly shown: number;
  readonly total: number;
}

export function RegistryFilters({ filters, onChange, shown, total }: Props) {
  const { t } = useT();
  const active = hasActiveFilters(filters);

  const set = <K extends keyof PlantFilters>(key: K, value: PlantFilters[K]): void => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section
      aria-label={t("filter.title")}
      className="rounded-md border border-ink/8 bg-sand p-3 sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={LABEL} htmlFor="f-search">
            {t("filter.search")}
          </label>
          <div className="relative mt-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-inkMuted"
            />
            <input
              id="f-search"
              type="search"
              value={filters.search}
              placeholder={t("filter.searchPlaceholder")}
              onChange={(e) => set("search", e.target.value)}
              className={`${FIELD} pl-8`}
            />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="f-county">
            {t("filter.county")}
          </label>
          <select
            id="f-county"
            className={`${FIELD} mt-1`}
            value={filters.county ?? ""}
            onChange={(e) => set("county", e.target.value === "" ? null : e.target.value)}
          >
            <option value="">{t("filter.allCounties")}</option>
            {HR_COUNTIES.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="f-status">
            {t("filter.status")}
          </label>
          <select
            id="f-status"
            className={`${FIELD} mt-1`}
            value={filters.status ?? ""}
            onChange={(e) =>
              set("status", e.target.value === "" ? null : (e.target.value as PlantFilters["status"]))
            }
          >
            <option value="">{t("filter.allStatuses")}</option>
            {PLANT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          {/* Mreža je usko grlo (docs/02 §4) — priključak je ravnopravan filtar. */}
          <label className={LABEL} htmlFor="f-grid">
            {t("filter.gridStatus")}
          </label>
          <select
            id="f-grid"
            className={`${FIELD} mt-1`}
            value={filters.gridStatus ?? ""}
            onChange={(e) =>
              set(
                "gridStatus",
                e.target.value === "" ? null : (e.target.value as PlantFilters["gridStatus"]),
              )
            }
          >
            <option value="">{t("filter.allGridStatuses")}</option>
            {GRID_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`grid.${status}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="f-kwp">
            {t("filter.capacity")}
          </label>
          <select
            id="f-kwp"
            className={`${FIELD} mt-1`}
            value={filters.kwpBucket ?? ""}
            onChange={(e) => set("kwpBucket", e.target.value === "" ? null : e.target.value)}
          >
            <option value="">{t("filter.allCapacities")}</option>
            {KWP_BUCKETS.map((bucket) => (
              <option key={bucket.key} value={bucket.key}>
                {bucket.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 py-2 text-sm text-inkSoft">
            <input
              type="checkbox"
              checked={filters.seekingPartners}
              onChange={(e) => set("seekingPartners", e.target.checked)}
              className="h-4 w-4 rounded-[4px] border-ink/20 text-forest focus:ring-ring/40"
            />
            {t("filter.seeking")}
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3">
        <p className="text-sm text-inkMuted">
          {t("filter.resultCount", { count: shown, total })}
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-medium text-forest hover:bg-forest/8"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            {t("filter.reset")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
