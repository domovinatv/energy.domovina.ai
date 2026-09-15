"use client";

/**
 * Sekcija 3 landinga — živi isječak registra (docs/06 §1).
 *
 * ⚠️ „Živi" je cijela poanta: ovo nije slika karte nego ista karta i isti
 * podaci kao na `/karta/`. Screenshot bi zastario prvi put kad se registar
 * promijeni, a posjetitelj bi to primijetio prije nas.
 *
 * ⚠️ Registar je jedini dio koji ima vrijednost bez ijednog projekta
 * (docs/01 §4.1), pa je ovo i pravi razlog da netko ostane na stranici. Zato
 * stoji visoko, odmah iza problema, a ne među dokazima na dnu.
 *
 * Karta se učitava dinamički, bez SSR-a — maplibre traži `window`, a stranica
 * je statički export.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { PLANTS } from "@/lib/mock";
import { PLANTS_ON_GRID } from "@/lib/facts";
import { computeStats } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { RegistryStatsBar } from "./registry-stats";

const PlantMap = dynamic(() => import("./plant-map").then((m) => m.PlantMap), {
  ssr: false,
});

export function LandingMap() {
  const { t } = useT();
  // Landing ne filtrira — isječak je cijeli registar. Filtri žive na `/karta/`,
  // gdje su u URL-u i gdje ih ima smisla dijeliti.
  const stats = useMemo(() => computeStats(PLANTS), []);

  return (
    <>
      <div className="mt-6">
        <RegistryStatsBar stats={stats} />
      </div>

      <div className="mt-4 h-[46vh] min-h-[300px] sm:h-[52vh]">
        <PlantMap plants={PLANTS} focusSlug={null} />
      </div>

      {/*
        ⚠️ docs/08 §4: dok se ne riješi licenca javnih registara, ne prikazuj
        agregat kao da je potpun. Ista poštena formulacija kao na `/karta/` —
        dvije različite bile bi dvije tvrdnje o istoj stvari.
      */}
      <p className="mt-4 text-sm text-inkMuted">
        {t("home.coverage", {
          total: formatNumber(PLANTS_ON_GRID.value),
          shown: formatNumber(PLANTS.length),
        })}{" "}
        {t("home.coverageNote")}
      </p>

      <Link
        href="/karta/"
        className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-700"
      >
        {t("landing.map.cta")}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </>
  );
}
