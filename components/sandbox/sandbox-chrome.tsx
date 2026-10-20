"use client";

/**
 * Okvir za /sandbox/ (docs/17): traka „sandbox — ništa nije pravi novac",
 * neutralno zaglavlje s placeholder brendom i podnožje koje kaže tko stoji iza
 * prikaza. Bez navigacije i bez imena domovina.energy u zaglavlju — to je
 * mjesto brenda klijenta.
 */
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { OPERATOR } from "@/lib/brand";
import { WHITE_LABEL } from "@/lib/white-label";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SandboxHeader() {
  const { t } = useT();
  return (
    <header className="border-b border-ink/8 bg-white print:hidden">
      <div className="bg-solar text-ink">
        <div className="container-wide flex items-center gap-2 py-2 text-xs font-medium">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span className="sm:hidden">{t("sandbox.barShort")}</span>
          <span className="hidden sm:inline">{t("sandbox.bar")}</span>
        </div>
      </div>
      <div className="container-wide flex items-center justify-between gap-4 py-4">
        <Link href="/sandbox/" className="flex items-center gap-3 text-ink">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-dashed border-ink/30 text-xs font-semibold text-inkMuted"
          >
            {WHITE_LABEL.monogram}
          </span>
          <span className="text-lg font-semibold">{WHITE_LABEL.name}</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export function SandboxFooter() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-ink/8 bg-white print:hidden">
      <div className="container-wide space-y-2 py-8 text-xs text-inkMuted">
        <p>{t("sandbox.footerBrand", { brand: WHITE_LABEL.name })}</p>
        <p>{t("sandbox.footerTech", { poweredBy: WHITE_LABEL.poweredBy })}</p>
        <p>
          {OPERATOR.legalName} · {OPERATOR.address} · OIB {OPERATOR.oib}
        </p>
      </div>
    </footer>
  );
}
