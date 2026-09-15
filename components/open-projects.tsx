"use client";

/**
 * Projekti koji traže suradnju, na ulaznom ekranu (docs/07 §2.1).
 *
 * ⚠️ K4: kad je popis prazan, ekran NE SMIJE biti slijepa ulica. Prazno stanje
 * ovdje nije kvar nego normalno razdoblje između dva projekta, i tako se i
 * opisuje — a lista čekanja stoji ispod u oba slučaja.
 */
import { useT } from "@/lib/i18n";
import { openProjects } from "@/lib/mock";
import { ProjectCard } from "./project-card";
import { WaitingList } from "./waiting-list";

export function OpenProjects() {
  const { t } = useT();
  const projects = openProjects();

  return (
    <section className="mt-12" aria-label={t("projects.title")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-ink">{t("projects.title")}</h2>
        {projects.length > 0 ? (
          <p className="text-xs text-inkMuted">
            {t("projects.openCount", { count: projects.length })}
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-inkMuted">{t("projects.lead")}</p>

      {projects.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-ink/15 bg-sand p-6">
          <p className="text-sm font-medium text-inkSoft">{t("projects.none")}</p>
          <p className="mt-1 text-sm text-inkMuted">{t("projects.noneHint")}</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug} className="flex">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}

      {/* ⚠️ Stoji UVIJEK, ne samo kad je popis prazan (K4). */}
      <div className="mt-6">
        <WaitingList />
      </div>
    </section>
  );
}
