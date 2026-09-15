"use client";

/**
 * Statistika iznad karte — docs/07 §2.1.
 *
 * Brojke se računaju iz FILTRIRANOG skupa, pa se mijenjaju zajedno s kartom i
 * popisom. Statistika koja bi prikazivala cijeli registar dok karta prikazuje
 * odabrani je isti kvar kao filtar koji ne dira kartu.
 */
import { useT } from "@/lib/i18n";
import { formatAggregateCapacity, formatNumber } from "@/lib/format";
import type { RegistryStats } from "@/lib/filters";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-ink/8 bg-white/60 px-3 py-2.5 sm:px-4">
      <dd className="font-display text-xl font-semibold leading-none text-ink sm:text-2xl">
        {value}
      </dd>
      <dt className="mt-1 text-[11px] uppercase tracking-[0.1em] text-inkMuted">{label}</dt>
    </div>
  );
}

export function RegistryStatsBar({ stats }: { stats: RegistryStats }) {
  const { t } = useT();
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Stat value={formatNumber(stats.count)} label={t("stats.plants")} />
      <Stat value={formatAggregateCapacity(stats.totalKwp)} label={t("stats.capacity")} />
      <Stat value={formatNumber(stats.operational)} label={t("stats.operational")} />
      <Stat value={formatNumber(stats.seekingPartners)} label={t("stats.seeking")} />
      <Stat value={formatNumber(stats.awaitingGrid)} label={t("stats.awaitingGrid")} />
    </dl>
  );
}
