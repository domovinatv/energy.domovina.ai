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
            href="/karta/"
            className="hidden text-sm text-inkSoft transition-colors hover:text-forest sm:inline"
          >
            {t("nav.registry")}
          </Link>
          {/* Dijagram toka novca je sekcija landinga, ne zaseban ekran
              (docs/06 §1, sekcija 4) — poveznica vodi na sidro. */}
          <Link
            href="/#kako-radi"
            className="hidden text-sm text-inkSoft transition-colors hover:text-forest lg:inline"
          >
            {t("nav.how")}
          </Link>
          {/* Pravi projekti (docs/15) — jedini izlaz iz prototipa na pravi novac. */}
          <Link
            href="/beta/"
            className="whitespace-nowrap text-sm font-medium text-forest transition-colors hover:text-forest-700"
          >
            {t("nav.beta")}
          </Link>
          <Link
            href="/zajednice/"
            className="hidden text-sm text-inkSoft transition-colors hover:text-forest sm:inline"
          >
            {t("nav.communities")}
          </Link>
          <Link
            href="/novi-projekt/"
            className="hidden text-sm text-inkSoft transition-colors hover:text-forest lg:inline"
          >
            {t("nav.newProject")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
