"use client";

/**
 * Kartica elektrane. KOPIJA obrasca iz
 * /Users/ms/git/pinka-finance/energy/components/plant-card.tsx (15.9.2026.),
 * proširena s `grid_status` redom i demo badgeom (docs/09 §5, docs/10 §1).
 *
 * Bez slike: prethodnik je imao `cover_image_url`, ali izmišljena elektrana ne
 * smije imati fotografiju — to bi bio prvi korak prema tome da maketa izgleda
 * kao stvarnost (CLAUDE.md pravilo 3).
 *
 * ⚠️ Bez emojija (docs/09 §6.2); ikone su `lucide-react`.
 */
import Link from "next/link";
import { MapPin, ShieldCheck, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatKwp } from "@/lib/format";
import type { Plant } from "@/lib/types";
import { DemoBadge, GridStatusBadge, SeekingBadge, StatusBadge } from "./badges";

export function PlantCard({ plant }: { plant: Plant }) {
  const { t } = useT();
  const seeking = plant.campaign_slug !== null;

  return (
    <Link
      href={`/elektrana/${plant.slug}/`}
      className="card-base group flex flex-col gap-3 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={plant.status} />
        {seeking ? <SeekingBadge /> : null}
        {plant.demo ? <DemoBadge /> : null}
      </div>

      <h3 className="font-display text-lg font-semibold leading-tight text-ink">
        {plant.name}
      </h3>

      <dl className="mt-auto space-y-1.5 text-sm text-inkMuted">
        {plant.location_name !== null || plant.county !== null ? (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("plant.location")}</dt>
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <dd>
              {plant.location_name ?? plant.county}
              {plant.location_name !== null && plant.county !== null ? (
                <span className="text-inkMuted/70"> · {plant.county}</span>
              ) : null}
            </dd>
          </div>
        ) : null}

        {plant.capacity_kwp !== null ? (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("plant.capacity")}</dt>
            <Zap aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <dd className="font-medium text-inkSoft">{formatKwp(plant.capacity_kwp)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3">
        {/* Status priključka je prvorazredan podatak, ne fusnota (docs/05 §2.2). */}
        <GridStatusBadge status={plant.grid_status} />
        {plant.is_verified ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-teal-700">
            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
            {t("plant.verifiedOwner")}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
