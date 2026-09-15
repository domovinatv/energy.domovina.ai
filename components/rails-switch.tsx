"use client";

/**
 * `/projekt/:slug/sine` — „Prebaci na svoje šine" (P3, docs/07 §2.10).
 *
 * ⚠️ Ovo nije ustupak nego DOKAZ (docs/14 §1). Mogućnost da klijent u nekoliko
 * klikova prebaci sve na svoj račun je ono što tvrdnju „ne držimo vaš novac"
 * čini provjerljivom umjesto marketinškom. Zato mora biti nekoliko koraka, a ne
 * razgovor s prodajom, i zato poveznica stoji vidljivo na stranici projekta, a
 * ne iza postavki.
 *
 * ⚠️ Nakon prebacivanja `rails = client` i mi PRESTAJEMO biti potpisnik. Ako
 * klijent i dalje želi nas kao izvođača, to je zaseban odnos — plaća nas sa svog
 * računa (docs/14 §1).
 */
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import type { Project } from "@/lib/types";
import { DemoBadge } from "./badges";

const STEPS: readonly MessageKey[] = ["rails.step1", "rails.step2", "rails.step3", "rails.step4"];

export function RailsSwitch({ project }: { readonly project: Project }) {
  const { t } = useT();
  // Koliko je koraka odigrano. Simulacija — ništa se ne sprema ni ne šalje.
  const [done, setDone] = useState(0);
  const finished = done >= STEPS.length;

  return (
    <div className="container-content py-6 sm:py-10">
      <Link
        href={`/projekt/${project.slug}/?tab=racun`}
        className="inline-flex items-center gap-1.5 text-sm text-inkMuted transition-colors hover:text-forest"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("contribute.backToProject")}
      </Link>

      <header className="mt-4 max-w-2xl">
        <DemoBadge />
        <h1 className="mt-3 font-display text-display-md font-semibold text-ink">
          {t("rails.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">{t("rails.lead")}</p>
      </header>

      <div className="mt-8 max-w-2xl">
        <section className="rounded-md border border-ink/8 bg-white/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
            {t("rails.current")}
          </h2>
          <p className="mt-1 text-sm text-inkSoft">
            {project.rails === "platform" ? t("rails.currentPlatform") : t("rails.currentClient")}
          </p>
        </section>

        <ol className="mt-4 space-y-2">
          {STEPS.map((key, i) => {
            const complete = i < done;
            const current = i === done;
            return (
              <li
                key={key}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  complete
                    ? "border-forest/25 bg-forest/6"
                    : current
                      ? "border-forest/40 bg-white"
                      : "border-ink/8 bg-white/60"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                    complete ? "bg-forest text-cream" : "bg-ink/8 text-inkMuted"
                  }`}
                >
                  {complete ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="text-sm text-inkSoft">{t(key)}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-4">
          {finished ? (
            <p className="inline-flex items-center gap-1.5 rounded-sm bg-teal/10 px-3 py-2 text-sm text-teal-700">
              <Check aria-hidden="true" className="h-4 w-4" />
              {t("rails.done")}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setDone((d) => d + 1)}
              className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
            >
              {done === 0 ? t("rails.start") : t("contribute.next")}
            </button>
          )}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-inkSoft">{t("rails.accountLevel")}</p>
        <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("rails.afterNote")}</p>
        <p className="mt-4 rounded-md border border-dashed border-ink/15 bg-sand p-3 text-xs text-inkMuted">
          {t("rails.simulated")}
        </p>
      </div>
    </div>
  );
}
