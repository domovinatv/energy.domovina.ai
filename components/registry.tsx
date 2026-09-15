"use client";

/**
 * Registar: statistika + karta + filtri + popis — ulazni ekran (docs/07 §2.1).
 *
 * ⚠️ OVDJE JE INVARIJANTA. `filtered` se računa JEDNOM i ide i karti i popisu i
 * statistici. Karta ne filtrira sama, popis ne filtrira sam. Najčešća greška u
 * ovom obrascu je da filtar mijenja popis, a ne kartu (docs/07 §2.1) — takva
 * greška ovdje nije moguća bez namjernog razdvajanja ove varijable.
 *
 * Karta se učitava dinamički, bez SSR-a: maplibre traži `window`, a stranica je
 * statički export.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import { PLANTS } from "@/lib/mock";
import { PLANTS_ON_GRID } from "@/lib/facts";
import { formatNumber } from "@/lib/format";
import {
  EMPTY_FILTERS,
  computeStats,
  filterPlants,
  filtersFromSearchParams,
  filtersToSearchParams,
  type PlantFilters,
} from "@/lib/filters";
import { replaceSearch, searchStore } from "@/lib/url-state";
import { HR_COUNTIES } from "@/lib/types";
import { OpenProjects } from "./open-projects";
import { PlantCard } from "./plant-card";
import { RegistryFilters } from "./registry-filters";
import { RegistryStatsBar } from "./registry-stats";

const PlantMap = dynamic(() => import("./plant-map").then((m) => m.PlantMap), {
  ssr: false,
});

/** Koliko kartica se prikaže odjednom. Ostatak ide iza „Prikaži još". */
const PAGE_SIZE = 24;

export function Registry() {
  const { t } = useT();
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Filtri žive u URL-u, ne u lokalnom stanju — deep-link, „natrag" i
  // „podijeli ovaj pogled" tada rade bez zrcaljenja u dva smjera.
  const search = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.getSnapshot,
    searchStore.getServerSnapshot,
  );

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const filters = useMemo(
    () => filtersFromSearchParams(params, HR_COUNTIES),
    [params],
  );
  // `?e={slug}` — karta doleti na elektranu i otvori popup jednom (docs/08 §2).
  const focusSlug = params.get("e");

  const setFilters = useCallback((next: PlantFilters) => {
    const nextParams = filtersToSearchParams(next);
    // Deep-link na elektranu preživi promjenu filtra.
    const current = new URLSearchParams(window.location.search).get("e");
    if (current !== null) nextParams.set("e", current);
    replaceSearch(nextParams);
    // Promjena filtra vraća straničenje na početak. U rukovatelju događajem,
    // ne u efektu — ovdje je to izravna posljedica korisnikove radnje.
    setVisible(PAGE_SIZE);
  }, []);

  // ⚠️ JEDAN filtrirani skup za sve troje. Ne razdvajati.
  const filtered = useMemo(() => filterPlants(PLANTS, filters), [filters]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  // `slice` sam ograničava kad je `visible` veći od skupa (npr. nakon „natrag").
  const shown = filtered.slice(0, visible);

  return (
    <div className="container-content py-6 sm:py-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-display-md font-semibold text-ink">
          {t("home.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">{t("home.lede")}</p>
        {/*
          ⚠️ docs/08 §4: dok se ne riješi licenca javnih registara, ne prikazuj
          agregat kao da je potpun. „44.000 u Hrvatskoj, N na ovoj karti" je
          poštena formulacija; prešutjeti razliku nije.
        */}
        <p className="mt-3 text-sm text-inkMuted">
          {t("home.coverage", {
            total: formatNumber(PLANTS_ON_GRID.value),
            shown: formatNumber(PLANTS.length),
          })}{" "}
          {t("home.coverageNote")}
        </p>
      </header>

      <div className="mt-6">
        <RegistryStatsBar stats={stats} />
      </div>

      <div className="mt-4 h-[52vh] min-h-[320px] sm:h-[58vh]">
        <PlantMap plants={filtered} focusSlug={focusSlug} />
      </div>

      <div className="mt-4">
        <RegistryFilters
          filters={filters}
          onChange={setFilters}
          shown={filtered.length}
          total={PLANTS.length}
        />
      </div>

      <section className="mt-8" aria-label={t("list.title")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-ink">{t("list.title")}</h2>
          <p className="text-xs text-inkMuted">{t("list.sameSet")}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-ink/15 bg-sand p-8 text-center">
            <p className="text-sm font-medium text-inkSoft">{t("filter.empty")}</p>
            <p className="mt-1 text-sm text-inkMuted">{t("filter.emptyHint")}</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-4 inline-flex rounded-sm bg-forest px-3 py-1.5 text-sm font-medium text-cream hover:bg-forest-700"
            >
              {t("filter.reset")}
            </button>
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((plant) => (
                <li key={plant.slug} className="flex">
                  <PlantCard plant={plant} />
                </li>
              ))}
            </ul>

            {visible < filtered.length ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft hover:border-forest hover:text-forest"
                >
                  {t("common.showMore")} ({formatNumber(filtered.length - visible)})
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/*
        Marketplace ulaz + trajna lista čekanja (K4, docs/07 §2.1). Stoji ISPOD
        registra namjerno: registar ima vrijednost i bez ijednog projekta i
        ostaje isporuka ako sve ostalo padne (docs/11 §Rizici, K8).

        ⚠️ Ne dira `filtered` — projekti nisu podskup filtriranih elektrana i ne
        smiju se vezati na filtre registra.
      */}
      <OpenProjects />

      <p className="mt-10 text-xs text-inkMuted">
        <Link href="/karta/" className="underline underline-offset-2 hover:text-forest">
          {t("map.resetView")}
        </Link>
      </p>
    </div>
  );
}
