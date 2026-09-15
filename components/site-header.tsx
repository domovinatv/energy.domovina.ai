"use client";

/**
 * Zaglavlje. UZOR: `pinka-finance/energy/components/energy-header.tsx`.
 *
 * ⚠️ Riječ „crowdfunding" se NE koristi u navigaciji (docs/01 §1.1). Nosiva
 * priča su energetske zajednice, ne „crowdfunding za solar".
 *
 * Ime proizvoda dolazi iz `BRAND`, nikad hardkodirano (docs/12 §5).
 */
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-cream/90 backdrop-blur">
      <div className="container-content flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight text-ink"
        >
          {BRAND.name}
        </Link>

        <nav aria-label={t("nav.menu")} className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-sm text-inkSoft transition-colors hover:text-forest"
          >
            {t("nav.registry")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
