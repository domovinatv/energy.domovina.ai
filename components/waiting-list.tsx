"use client";

/**
 * Trajna lista čekanja — K4 (docs/13 §K4, docs/07 §2.1).
 *
 * ⚠️ „Trajna" je cijela poanta. ZEZ zatvara pozive između projekata i nema gdje
 * poslati zainteresirane; tko dođe u krivom tjednu, ode i ne vrati se. Zato
 * obrazac stoji i kad je projekt otvoren, a ne samo kao utjeha kad nije.
 *
 * ⚠️ U prototipu se NIŠTA ne šalje i ništa ne sprema, i to piše prije nego
 * korisnik išta upiše — ne tek na ekranu potvrde. Obrazac koji izgleda kao da
 * prikuplja kontakte, a ne prikuplja, jednako je nepošten kao onaj koji
 * prikuplja a ne kaže.
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { HR_COUNTIES } from "@/lib/types";

export function WaitingList() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [county, setCounty] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);

  if (submitted) {
    return (
      <section className="rounded-lg border border-forest/25 bg-forest/6 p-5">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800">
          <Check aria-hidden="true" className="h-4 w-4" />
          {t("waitlist.done")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("waitlist.doneHint")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-ink/8 bg-white/70 p-5 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">{t("waitlist.title")}</h2>
      <p className="mt-1 text-sm leading-relaxed text-inkMuted">{t("waitlist.lead")}</p>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          // Namjerno labava provjera: obrazac ništa ne šalje, pa stroža ne bi
          // ništa zaštitila — samo bi glumila ozbiljnost koje nema.
          if (!email.includes("@")) {
            setInvalid(true);
            return;
          }
          setInvalid(false);
          setSubmitted(true);
        }}
      >
        <label className="block">
          <span className="text-sm text-inkMuted">{t("waitlist.emailLabel")}</span>
          <input
            type="email"
            value={email}
            placeholder={t("waitlist.emailPlaceholder")}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
          />
        </label>

        <label className="block">
          <span className="text-sm text-inkMuted">{t("waitlist.countyLabel")}</span>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">{t("waitlist.anyCounty")}</option>
            {HR_COUNTIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-700"
        >
          {t("waitlist.submit")}
        </button>
      </form>

      {invalid ? <p className="mt-2 text-sm text-rust">{t("waitlist.invalid")}</p> : null}
      <p className="mt-3 text-xs text-inkMuted">{t("waitlist.simulated")}</p>
    </section>
  );
}
