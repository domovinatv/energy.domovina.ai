"use client";

/**
 * Kartica projekta — popis na ulaznom ekranu i na stranici zajednice.
 *
 * ⚠️ docs/07 §2.3: model financiranja i rečenica da ne nudimo financijsku
 * korist stoje i OVDJE, ne samo na detalju. Kartica je mjesto s kojeg netko
 * odluči kliknuti; ako se granica vidi tek korak kasnije, vidjela se prekasno.
 *
 * ⚠️ Bez emojija (docs/09 §6.2); ikone su `lucide-react`.
 */
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatEur, formatDate } from "@/lib/format";
import { DEMO_NOW, getContributionsForProject } from "@/lib/mock";
import { daysToDeadline, progressPct } from "@/lib/project";
import type { Project } from "@/lib/types";
import { DemoBadge } from "./badges";

/**
 * Traka napretka. Jedna komponenta za sve ekrane — inače se zaobljenje i visina
 * raziđu između kartice i detalja, što izgleda kao dvije različite brojke.
 */
export function ProgressBar({ pct, label }: { readonly pct: number; readonly label: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink/8"
    >
      <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Badge stanja projekta. `active` je jedino stanje koje prima doprinose. */
export function ProjectStateBadge({ project }: { readonly project: Project }) {
  const { t } = useT();
  const style =
    project.state === "active"
      ? "bg-forest/10 text-forest-800"
      : project.state === "building"
        ? "bg-solar-soft text-solar-ink"
        : "bg-ink/6 text-inkMuted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${style}`}
    >
      {t(`project.state.${project.state}`)}
    </span>
  );
}

export function ProjectCard({ project }: { readonly project: Project }) {
  const { t, locale } = useT();
  const pct = progressPct(project);
  const contributors = getContributionsForProject(project.slug).length;
  const days = daysToDeadline(project, DEMO_NOW);

  return (
    <Link
      href={`/projekt/${project.slug}/`}
      className="card-base group flex flex-col gap-3 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectStateBadge project={project} />
        {project.demo ? <DemoBadge /> : null}
      </div>

      <h3 className="font-display text-lg font-semibold leading-tight text-ink">
        {project.title}
      </h3>
      <p className="text-sm text-inkMuted">{project.holder_name}</p>

      <div className="mt-auto space-y-2 pt-2">
        <ProgressBar pct={pct} label={t("project.raised")} />
        <p className="text-sm text-inkSoft">
          {t("plant.raisedOf", {
            raised: formatEur(project.raised_cents),
            goal: formatEur(project.goal_cents),
          })}{" "}
          <span className="text-inkMuted">({pct} %)</span>
        </p>
      </div>

      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-inkMuted">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t("project.contributors")}</dt>
          <Users aria-hidden="true" className="h-3.5 w-3.5" />
          <dd>{contributors}</dd>
        </div>
        {project.deadline !== null ? (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("project.deadline")}</dt>
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            <dd>
              {days !== null && days >= 0
                ? t("project.daysLeft", { days })
                : formatDate(project.deadline, locale)}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* ⚠️ docs/07 §2.3 — model i granica su vidljivi već na kartici. */}
      <div className="border-t border-ink/8 pt-3">
        <p className="text-xs font-medium text-inkSoft">
          {project.model === "donation" ? t("model.donation") : t("model.community")}
        </p>
        <p className="mt-1 text-xs text-inkMuted">{t("model.noPromise")}</p>
      </div>
    </Link>
  );
}
