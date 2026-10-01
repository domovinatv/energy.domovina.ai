"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { LanguageSwitcher } from "@/components/language-switcher";

/** Traka za prave projekte — parnjak `DemoBar`, ali u boji koja ne znači „maketa". */
export function BetaBar() {
  const { t } = useT();
  return (
    <header className="border-b border-ink/8 bg-cream">
      <div className="bg-forest text-cream">
        <div className="container-content flex items-center gap-2 py-2 text-xs">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-solar" />
          <span className="sm:hidden">{t("beta.barShort")}</span>
          <span className="hidden sm:inline">{t("beta.bar")}</span>
        </div>
      </div>
      <div className="container-content flex items-center justify-between gap-4 py-4">
        <Link href="/beta/" className="font-display text-lg font-semibold text-ink">
          {BRAND.name}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
