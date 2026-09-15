"use client";

/**
 * Traka prototipa na vrhu svake stranice.
 *
 * ⚠️ CLAUDE.md pravilo 3 + docs/12 §2.1: kad je produkcija ujedno i razvoj,
 * posjetitelj mora IZ SAME STRANICE znati u što gleda. Ovo je jedina stvar
 * koja bi na sajmu izgledala kao prijevara umjesto kao maketa ako je nema.
 *
 * Traka se NE može zatvoriti. Dostojanstvena, ne sramežljiva — na štandu se
 * čita izbliza (docs/06 §6).
 */
import { useT } from "@/lib/i18n";
import { LIVE_HOST } from "@/lib/brand";

export function DemoBar() {
  const { t } = useT();
  return (
    <div className="bg-sandDeep text-inkSoft">
      <div className="container-content flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rust"
          />
          <span className="sm:hidden">{t("demo.barShort")}</span>
          <span className="hidden sm:inline">{t("demo.bar")}</span>
        </p>
        <p className="font-medium tracking-wide text-inkMuted">
          {t("footer.stage")} · {LIVE_HOST}
        </p>
      </div>
    </div>
  );
}
