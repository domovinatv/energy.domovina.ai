"use client";

/**
 * Sekcija 5 landinga — „Zašto 0 %" (docs/06 §1, docs/04 §4).
 *
 * ⚠️ NIJEDNA STOPA SE NE PIŠE OVDJE. Sve dolazi iz `lib/fees.ts`, koji je
 * kopija kanonskog izvora. To je pravilo koje je u obitelji već jednom
 * prekršeno i proizvelo nesklad 0,40 vs 0,45 € (docs/06 §4.4).
 *
 * ⚠️ „0 %" SE NIKAD NE PIŠE SAMO (docs/14 §3.1). U istom vidnom polju mora
 * stajati da zarađujemo kao izvođač i da je cijena izvedbe javna. Zato je
 * napomena dio ove komponente, a ne nešto što se dodaje na stranici — kad bi
 * bila vani, netko bi jednog dana ubacio tablicu bez nje.
 *
 * ⚠️ Kalkulator je ILUSTRATIVAN i to piše uz njega, ne u fusnoti (docs/06 §4.5).
 * Usporedba je s tipičnom platformom za skupno financiranje, ne s imenovanim
 * proizvodom — imenovati tuđe stope znači tvrditi nešto što nismo provjerili
 * danas.
 */
import { useState } from "react";
import {
  CARD_FEE_FIXED,
  CARD_FEE_PCT,
  CREATOR_PLATFORM_FEE_PCT,
  PLATFORM_TAKE_PCT,
  SEPA_FEE_MAX,
  SEPA_FEE_MIN,
  cardFee,
} from "@/lib/fees";
import { formatEur, formatEurPrecise, formatNumber, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";

/** Zadani primjer: dvanaest susjeda po 800 €, isti kao prvi scenarij toka novca. */
const DEFAULT_PEOPLE = 12;
const DEFAULT_AMOUNT_EUR = 800;

/** Granice unosa. Postoje da se ne prikaže besmislen iznos, ne kao pravilo. */
const MIN_PEOPLE = 1;
const MAX_PEOPLE = 500;
const MIN_AMOUNT_EUR = 10;
const MAX_AMOUNT_EUR = 20_000;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function FeeCalculator() {
  const { t } = useT();
  const [people, setPeople] = useState(DEFAULT_PEOPLE);
  const [amountEur, setAmountEur] = useState(DEFAULT_AMOUNT_EUR);

  const perPersonCents = Math.round(amountEur * 100);
  const totalCents = perPersonCents * people;

  // Tipična platforma: postotak od prikupljenog + kartična naknada po uplati.
  const platformCutCents = Math.round(totalCents * CREATOR_PLATFORM_FEE_PCT);
  const cardFeesCents = Math.round(cardFee(amountEur) * 100) * people;
  const classicReachesCents = totalCents - platformCutCents - cardFeesCents;

  // Naš put: 0 % platforme. Uplatitelj plaća svojoj banci naknadu za nalog, i
  // taj se iznos NE skriva — samo nikad ne dolazi nama.
  const ourCutCents = Math.round(totalCents * PLATFORM_TAKE_PCT);
  const ownBankFeesCents = Math.round(SEPA_FEE_MAX * 100) * people;
  const oursReachesCents = totalCents - ourCutCents;

  const differenceCents = oursReachesCents - classicReachesCents;

  return (
    <div className="mt-8">
      {/* ── Poštena tablica: tko što plaća (docs/04 §4) ──────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <caption className="sr-only">{t("fees.tableCaption")}</caption>
          <thead>
            <tr className="border-b border-ink/12 text-left">
              <th scope="col" className="py-2 pr-4 font-medium text-inkMuted">
                {t("fees.colStep")}
              </th>
              <th scope="col" className="py-2 pr-4 font-medium text-inkMuted">
                {t("fees.colWhoPays")}
              </th>
              <th scope="col" className="py-2 font-medium text-inkMuted">
                {t("fees.colHowMuch")}
              </th>
            </tr>
          </thead>
          <tbody className="text-inkSoft">
            <tr className="border-b border-ink/8">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {t("fees.rowSepa")}
              </th>
              <td className="py-2.5 pr-4">{t("fees.paysContributorBank")}</td>
              <td className="py-2.5 font-medium text-ink">
                {formatEurPrecise(Math.round(SEPA_FEE_MIN * 100))}–
                {formatEurPrecise(Math.round(SEPA_FEE_MAX * 100))}
              </td>
            </tr>
            <tr className="border-b border-ink/8">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {t("fees.rowMint")}
              </th>
              <td className="py-2.5 pr-4">{t("fees.paysNobody")}</td>
              <td className="py-2.5 font-medium text-ink">{formatEur(0)}</td>
            </tr>
            <tr className="border-b border-ink/8">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {t("fees.rowChain")}
              </th>
              <td className="py-2.5 pr-4">{t("fees.paysUs")}</td>
              <td className="py-2.5 font-medium text-ink">{t("fees.aboutCent")}</td>
            </tr>
            <tr className="border-b border-ink/8">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {t("fees.rowContribution")}
              </th>
              <td className="py-2.5 pr-4">{t("fees.paysNobody")}</td>
              <td className="py-2.5 font-medium text-ink">{formatEur(0)}</td>
            </tr>
            <tr className="border-b border-ink/8">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {t("fees.rowPayout")}
              </th>
              <td className="py-2.5 pr-4">{t("fees.paysNobody")}</td>
              <td className="py-2.5 font-medium text-ink">{formatEur(0)}</td>
            </tr>
            <tr>
              <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                {t("fees.rowPlatform")}
              </th>
              <td className="py-2.5 pr-4">—</td>
              <td className="py-2.5 font-semibold text-forest-800">
                {formatPercent(PLATFORM_TAKE_PCT)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/*
        ⚠️ docs/14 §3.1 — tvrdnja i njezina cijena u istom vidnom polju. Ovo je
        jedini blok na stranici koji smije stajati odmah ispod „0 %", i mora.
      */}
      <div className="mt-4 rounded-md border border-solar/40 bg-solar-soft p-4">
        <p className="text-sm font-medium text-solar-ink">{t("fees.notFreeTitle")}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-solar-ink">
          {t("fees.notFreeBody")}
        </p>
      </div>

      {/* ── Kalkulator usporedbe ─────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-ink">
          {t("calc.title")}
        </h3>
        <p className="mt-1 text-sm text-inkMuted">{t("calc.lead")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-inkMuted">{t("calc.peopleLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_PEOPLE}
              max={MAX_PEOPLE}
              value={people}
              onChange={(e) => setPeople(clamp(e.target.valueAsNumber, MIN_PEOPLE, MAX_PEOPLE))}
              className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm text-inkMuted">{t("calc.amountLabel")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_AMOUNT_EUR}
              max={MAX_AMOUNT_EUR}
              step={10}
              value={amountEur}
              onChange={(e) =>
                setAmountEur(clamp(e.target.valueAsNumber, MIN_AMOUNT_EUR, MAX_AMOUNT_EUR))
              }
              className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>

        <p className="mt-4 text-sm text-inkSoft">
          {t("calc.total", {
            people: formatNumber(people),
            each: formatEur(perPersonCents),
            total: formatEur(totalCents),
          })}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-ink/12 bg-sand p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-inkMuted">
              {t("calc.classicTitle")}
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink">
              {formatEur(classicReachesCents)}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-inkMuted">
              <li>
                {t("calc.classicCut", {
                  pct: formatPercent(CREATOR_PLATFORM_FEE_PCT),
                  amount: formatEur(platformCutCents),
                })}
              </li>
              <li>
                {t("calc.classicCard", {
                  pct: formatPercent(CARD_FEE_PCT, 1),
                  fixed: formatEurPrecise(Math.round(CARD_FEE_FIXED * 100)),
                  amount: formatEur(cardFeesCents),
                })}
              </li>
            </ul>
          </div>

          <div className="rounded-md border border-forest/30 bg-forest/6 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-forest-800">
              {t("calc.oursTitle")}
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-forest-800">
              {formatEur(oursReachesCents)}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-inkSoft">
              <li>
                {t("calc.oursCut", {
                  pct: formatPercent(PLATFORM_TAKE_PCT),
                  amount: formatEur(ourCutCents),
                })}
              </li>
              {/* Naknada banci se PRIKAZUJE, iako nije naša. Prešutjeti je
                  značilo bi tvrditi da je uplata besplatna, a nije. */}
              <li>
                {t("calc.oursBank", { amount: formatEurPrecise(ownBankFeesCents) })}
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-ink">
          {t("calc.difference", { amount: formatEur(differenceCents) })}
        </p>

        {/* ⚠️ Oznaka ilustrativnosti stoji UZ rezultat, ne u fusnoti stranice. */}
        <p className="mt-3 text-xs leading-relaxed text-inkMuted">
          {t("calc.illustrative")}
        </p>
      </div>
    </div>
  );
}
