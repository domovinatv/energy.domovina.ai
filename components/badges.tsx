"use client";

/**
 * Badgevi statusa. KOPIJA obrasca iz
 * /Users/ms/git/pinka-finance/energy/components/status-badge.tsx (15.9.2026.),
 * proširena s `grid_status` i demo oznakom (docs/09 §5, docs/10 §1).
 *
 * ⚠️ Boja nosi značenje na tri mjesta — karta, kartica, badge — i mora biti
 * ista (docs/09 §3). Ako se mijenja ovdje, mijenja se i u lib/map-colors.ts.
 */
import { useT } from "@/lib/i18n";
import type { GridStatus, OwnerType, PlantStatus } from "@/lib/types";

const BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide";

/** `solar` jantar samo kao PODLOGA s tamnim tekstom — nikad kao tekst na bijelom. */
const PLANT_STATUS_STYLES: Record<PlantStatus, string> = {
  planned: "bg-ink/6 text-inkSoft",
  under_construction: "bg-solar-soft text-solar-ink ring-1 ring-inset ring-dashed ring-solar/60",
  operational: "bg-solar-soft text-solar-ink",
  decommissioned: "bg-ink/6 text-inkMuted",
};

export function StatusBadge({ status }: { status: PlantStatus }) {
  const { t } = useT();
  return <span className={`${BASE} ${PLANT_STATUS_STYLES[status]}`}>{t(`status.${status}`)}</span>;
}

/**
 * Status priključka. `not_requested` i `rejected` nose `rust` jer su
 * upozorenje: projekt koji prikuplja novac za elektranu bez zatraženog
 * priključka to MORA vidljivo reći (docs/05 §2.2).
 */
const GRID_STATUS_STYLES: Record<GridStatus, string> = {
  not_applicable: "bg-ink/6 text-inkMuted",
  not_requested: "bg-rust/10 text-rust",
  requested: "bg-teal/10 text-teal-700",
  approved: "bg-teal/10 text-teal-700",
  connected: "bg-forest/10 text-forest-800",
  rejected: "bg-rust/10 text-rust",
};

export function GridStatusBadge({ status }: { status: GridStatus }) {
  const { t } = useT();
  return <span className={`${BASE} ${GRID_STATUS_STYLES[status]}`}>{t(`grid.${status}`)}</span>;
}

/**
 * Demo oznaka. Dio dizajna, ne naljepnica zalijepljena na kraju
 * (CLAUDE.md pravilo 3). Stoji na SVAKOJ kartici s `demo: true`.
 */
export function DemoBadge() {
  const { t } = useT();
  return (
    <span className={`${BASE} bg-sandDeep text-inkMuted`} title={t("demo.plantNotice")}>
      {t("demo.badge")}
    </span>
  );
}

/** „Traži suradnju" — `forest`, primarni akcent (docs/09 §3). */
export function SeekingBadge() {
  const { t } = useT();
  return <span className={`${BASE} bg-forest/10 text-forest-800`}>{t("plant.hasProject")}</span>;
}

export function OwnerTypeLabel({ ownerType }: { ownerType: OwnerType }) {
  const { t } = useT();
  return <>{t(`owner.${ownerType}`)}</>;
}
