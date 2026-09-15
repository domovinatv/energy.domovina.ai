"use client";

/** Prekidač jezika. HR je izvor istine, EN izveden (CLAUDE.md §Konvencije). */
import { useT, type Locale } from "@/lib/i18n";

const LOCALES: readonly Locale[] = ["hr", "en"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();
  return (
    <div
      className="inline-flex items-center rounded-sm border border-ink/12 p-0.5"
      role="group"
      aria-label={t("lang.switch")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={
            "rounded-[6px] px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors " +
            (locale === code
              ? "bg-forest text-cream"
              : "text-inkMuted hover:text-ink")
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}
