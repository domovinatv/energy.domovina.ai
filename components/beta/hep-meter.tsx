"use client";

import { useT } from "@/lib/i18n";
import { formatDate, formatDateShort, formatNumber } from "@/lib/format";
import type { BetaHep } from "@/lib/beta-hep";
import {
  zadnjeOcitanje,
  zadnjih12Mjeseci,
  type RazdobljeZaPrikaz,
  type VrstaRazdoblja,
} from "@/lib/moja-mreza";

/**
 * Mjerno mjesto HEP ODS-a na lokaciji elektrane: OMM, brojilo, adresa kako je
 * vodi HEP i potrošnja zadnjih 12 mjeseci (Moja mreža, lib/moja-mreza.ts).
 *
 * Graf je po HEP-ovim obračunskim razdobljima, ne po kalendarskim mjesecima —
 * zbrajanjem bi se izgubilo koji je broj procjena, a koji korekcija. Vrsta
 * razdoblja nosi i oblik (puna / blijeda / prugasta traka) i legendu, nikad
 * samo boju.
 */
export function HepMeter({ hep }: { hep: BetaHep }) {
  const { t, locale } = useT();
  const { mjesto } = hep;
  const ocitanje = zadnjeOcitanje(mjesto);
  const godina = zadnjih12Mjeseci(mjesto);
  const ukupno = godina.reduce((s, p) => s + p.ukupno_kwh, 0);
  const max = Math.max(1, ...godina.map((p) => p.ukupno_kwh));
  const vrste = new Set(godina.map((p) => p.vrsta));

  return (
    <div className="mt-8 border-t border-ink/8 pt-6">
      <h3 className="font-medium text-ink">{t("beta.hepTitle")}</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <HepFact label={t("beta.hepOmm")} value={mjesto.omm} mono />
        <HepFact label={t("beta.hepMeter")} value={mjesto.broj_brojila} mono />
        <HepFact label={t("beta.hepAddress")} value={mjesto.adresa} />
        <HepFact label={t("beta.hepTariff")} value={mjesto.tarifni_model} />
        {ocitanje !== null && (
          <HepFact
            label={t("beta.hepReading", { date: formatDateShort(ocitanje.datum, locale) })}
            value={t("beta.hepReadingValue", {
              t1: formatNumber(ocitanje.t1_kwh),
              t2: formatNumber(ocitanje.t2_kwh),
            })}
            note={ocitanje.opis}
          />
        )}
        {godina.length > 0 && (
          <HepFact
            label={t("beta.hepYear")}
            value={`${formatNumber(ukupno)} kWh`}
            note={`${formatDateShort(godina[0]!.od, locale)} – ${formatDateShort(godina.at(-1)!.do, locale)}`}
          />
        )}
      </dl>

      {godina.length > 0 && (
        <figure className="mt-6">
          <figcaption className="text-xs uppercase tracking-wide text-inkMuted">
            {t("beta.hepChart")} <span className="normal-case">(kWh)</span>
          </figcaption>
          <ol className="mt-3 flex h-40 items-end gap-1 sm:gap-1.5" aria-label={t("beta.hepChart")}>
            {godina.map((p) => (
              <li
                key={p.od}
                className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
                title={`${periodLabel(p, locale)}: ${formatNumber(p.ukupno_kwh)} kWh · ${t(`beta.hepKind.${p.vrsta}`)}`}
              >
                <span className="sr-only">
                  {periodLabel(p, locale)}: {formatNumber(p.ukupno_kwh)} kWh, {t(`beta.hepKind.${p.vrsta}`)}
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs tabular-nums text-cream group-hover:block">
                  {formatNumber(p.ukupno_kwh)} kWh
                </span>
                <span
                  aria-hidden
                  className={`block w-full rounded-t-[4px] ${BAR[p.vrsta]}`}
                  style={{ height: `${Math.max(2, (p.ukupno_kwh / max) * 100)}%` }}
                />
              </li>
            ))}
          </ol>
          <ol aria-hidden className="mt-1 flex gap-1 text-center text-[10px] leading-tight text-inkMuted sm:gap-1.5 sm:text-xs">
            {godina.map((p) => (
              <li key={p.od} className="min-w-0 flex-1 truncate">
                {shortLabel(p, locale)}
              </li>
            ))}
          </ol>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-inkSoft">
            {(["izmjereno", "procjena", "korekcija"] as const)
              .filter((v) => vrste.has(v))
              .map((v) => (
                <li key={v} className="flex items-center gap-1.5">
                  <span aria-hidden className={`inline-block h-3 w-3 rounded-[3px] ${BAR[v]}`} />
                  {t(`beta.hepKind.${v}`)}
                </li>
              ))}
          </ul>
          {vrste.has("korekcija") && <p className="mt-2 text-xs text-inkMuted">{t("beta.hepCorrectionNote")}</p>}
        </figure>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-forest underline underline-offset-2">{t("beta.hepTable")}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-inkMuted">
              <tr>
                <th className="py-1 pr-3 font-normal">{t("beta.hepPeriod")}</th>
                <th className="py-1 pr-3 text-right font-normal">VT (T1)</th>
                <th className="py-1 pr-3 text-right font-normal">NT (T2)</th>
                <th className="py-1 pr-3 text-right font-normal">{t("beta.hepTotal")}</th>
                <th className="py-1 font-normal">{t("beta.hepKindHeader")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {[...godina].reverse().map((p) => (
                <tr key={p.od}>
                  <td className="py-1 pr-3 text-inkSoft">
                    {formatDateShort(p.od, locale)} – {formatDateShort(p.do, locale)}
                  </td>
                  <td className="py-1 pr-3 text-right">{formatNumber(p.t1_kwh)}</td>
                  <td className="py-1 pr-3 text-right">{formatNumber(p.t2_kwh)}</td>
                  <td className="py-1 pr-3 text-right font-medium text-ink">{formatNumber(p.ukupno_kwh)} kWh</td>
                  <td className="py-1 text-inkSoft">{t(`beta.hepKind.${p.vrsta}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-4 text-xs text-inkMuted">
        {t("beta.hepSource", { date: formatDate(hep.dohvaceno, locale) })}
      </p>
    </div>
  );
}

/** Puna = izmjereno, blijeda = HEP-ova procjena, prugasta = korekcija nakon procjena. */
const BAR: Record<VrstaRazdoblja, string> = {
  izmjereno: "bg-forest",
  procjena: "bg-forest/30",
  korekcija:
    "bg-forest/30 bg-[repeating-linear-gradient(135deg,theme(colors.forest.DEFAULT)_0_3px,transparent_3px_6px)]",
};

function HepFact({ label, value, note, mono }: { label: string; value: string; note?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-inkMuted">{label}</dt>
      <dd className={`mt-0.5 break-words text-ink ${mono ? "font-mono" : "font-medium"}`}>{value}</dd>
      {note !== undefined && <dd className="text-xs text-inkMuted">{note}</dd>}
    </div>
  );
}

function month(iso: string, locale: "hr" | "en"): string {
  return new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : "en-GB", { month: "short", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

function isWholeMonth(p: RazdobljeZaPrikaz): boolean {
  const end = new Date(`${p.do}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return p.od.endsWith("-01") && end.getUTCDate() === 1 && p.od.slice(0, 7) === p.do.slice(0, 7);
}

/**
 * Uvijek mjesec („lis"): na mobitelu ispod trake stane samo tri slova. Dio
 * mjeseca (srpanj 1.–26. i 27.–31.) dobije isti mjesec; točne datume nose
 * tooltip i tablica.
 */
function shortLabel(p: RazdobljeZaPrikaz, locale: "hr" | "en"): string {
  return month(p.od, locale);
}

function periodLabel(p: RazdobljeZaPrikaz, locale: "hr" | "en"): string {
  return isWholeMonth(p)
    ? `${month(p.od, locale)} ${p.od.slice(0, 4)}`
    : `${formatDateShort(p.od, locale)} – ${formatDateShort(p.do, locale)}`;
}
