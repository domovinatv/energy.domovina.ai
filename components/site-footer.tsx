"use client";

/**
 * Podnožje s impresumom i regulatornim okvirom.
 *
 * ⚠️ Formulacija iz docs/03 §7 se NE MIJENJA — konzistentna je kroz cijelu
 * obitelj proizvoda (mpt.hr → pinka.finance → ovdje) i to je pravno relevantno.
 *
 * ⚠️ docs/14 §3.1: „0 %" se nikad ne piše samo. Tvrdnja da ne uzimamo postotak
 * i napomena da zarađujemo kao izvođač stoje u ISTOM vidnom polju.
 */
import { BRAND, OPERATOR } from "@/lib/brand";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-ink/8 bg-sand">
      <div className="container-content grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">{BRAND.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-inkMuted">
            {t("footer.stage")}
          </p>
          {/* docs/14 §3.1 — tvrdnja i njezina cijena u istom vidnom polju. */}
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-inkSoft">
            {t("footer.noCommission")}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-inkMuted">
            {t("footer.impressum")}
          </h2>
          <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-inkSoft">
            <p>{OPERATOR.legalName}</p>
            <p>{OPERATOR.address}</p>
            <p>OIB {OPERATOR.oib} · MBS {OPERATOR.mbs}</p>
            <p>EUID {OPERATOR.euid}</p>
            <p>
              {t("footer.court")}: {OPERATOR.court}
            </p>
            <p>
              {t("footer.director")}: {OPERATOR.director}
            </p>
          </address>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-inkMuted">
            {t("footer.disclaimerTitle")}
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-inkMuted">
            {t("footer.disclaimer", { operator: OPERATOR.shortName })}
          </p>
        </div>
      </div>
    </footer>
  );
}
