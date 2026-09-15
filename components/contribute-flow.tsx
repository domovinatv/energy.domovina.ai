"use client";

/**
 * `/projekt/:slug/doprinos` — tijek doprinosa do ekrana potvrde (docs/07 §2.4).
 *
 * Sve je SIMULIRANO: nijedna uplata se ne traži, nijedan podatak se ne šalje.
 * To piše na svakom koraku, ne samo na kraju (docs/04 §6).
 *
 * ⚠️ Kod modela `community` eID je OBAVEZAN — članstvo je pravni odnos, ne
 * anonimna uplata (docs/04 §5). Kod modela `donation` nije uvjet, i ne traži se.
 *
 * ⚠️ Ono što član dobiva je udio u PROIZVEDENOJ ENERGIJI i glas u zajednici.
 * Nikad novac (docs/03 §3).
 *
 * Stanje koraka je lokalno, ne u URL-u: za razliku od filtara registra, pola
 * ispunjenog obrasca nije pogled koji se dijeli.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { useT, type MessageKey } from "@/lib/i18n";
import { formatEur } from "@/lib/format";
import { shareBasisPoints } from "@/lib/project";
import type { ContributionRail, Project } from "@/lib/types";
import { DemoBadge } from "./badges";

/** Predloženi iznosi, izvedeni iz najmanjeg doprinosa projekta. */
function suggestedAmounts(minCents: number): readonly number[] {
  return [minCents, minCents * 5, minCents * 25, minCents * 100];
}

type StepKey = "amount" | "who" | "eid" | "membership" | "method" | "confirm";

/** Naslov koraka. `membership` nema par u `contribute.step.*` — ima svoj ključ. */
const STEP_LABEL: Record<StepKey, MessageKey> = {
  amount: "contribute.step.amount",
  who: "contribute.step.who",
  eid: "contribute.step.eid",
  membership: "contribute.membershipTitle",
  method: "contribute.step.method",
  confirm: "contribute.step.confirm",
};

function stepLabelKey(step: StepKey): MessageKey {
  return STEP_LABEL[step];
}

const RAILS: readonly ContributionRail[] = ["sepa", "eure", "card"];

/** Ključ poruke za način uplate. `card` je u copyju QR — isti red u docs/07 §2.4. */
const RAIL_COPY: Record<ContributionRail, { readonly name: MessageKey; readonly hint: MessageKey }> = {
  sepa: { name: "contribute.method.sepa", hint: "contribute.method.sepaHint" },
  eure: { name: "contribute.method.eure", hint: "contribute.method.eureHint" },
  card: { name: "contribute.method.qr", hint: "contribute.method.qrHint" },
};

export function ContributeFlow({ project }: { readonly project: Project }) {
  const { t } = useT();

  // Kod zajednice se ubacuju eID i pristupnica — redoslijed iz docs/07 §2.4.
  const steps = useMemo<readonly StepKey[]>(
    () =>
      project.model === "community"
        ? ["amount", "who", "eid", "membership", "method", "confirm"]
        : ["amount", "who", "method", "confirm"],
    [project.model],
  );

  const [index, setIndex] = useState(0);
  const [amountCents, setAmountCents] = useState(project.min_contribution_cents);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [eidDone, setEidDone] = useState(false);
  const [rail, setRail] = useState<ContributionRail>("sepa");

  const step = steps[index] ?? "amount";
  const tooLow = amountCents < project.min_contribution_cents;
  const bp = shareBasisPoints(amountCents, project.goal_cents);

  const canAdvance =
    step === "amount" ? !tooLow : step === "eid" ? eidDone : true;

  const displayName = anonymous || name.trim() === "" ? t("contribute.anonymous") : name.trim();

  return (
    <div className="container-content py-6 sm:py-10">
      <Link
        href={`/projekt/${project.slug}/`}
        className="inline-flex items-center gap-1.5 text-sm text-inkMuted transition-colors hover:text-forest"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("contribute.backToProject")}
      </Link>

      <header className="mt-4 max-w-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <DemoBadge />
        </div>
        <h1 className="mt-3 font-display text-display-md font-semibold text-ink">
          {t("contribute.title")}
        </h1>
        <p className="mt-2 text-base text-inkSoft">{project.title}</p>

        {/*
          ⚠️ docs/07 §2.3: model i granica ne nestaju kad korisnik uđe u tijek
          uplate. To je točno mjesto na kojem bi izostanak najviše zavarao.
        */}
        <div className="mt-4 rounded-md border border-forest/25 bg-forest/6 p-3">
          <p className="text-sm font-medium text-ink">
            {project.model === "donation" ? t("model.donation") : t("model.community")}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-inkSoft">
            {project.model === "donation"
              ? t("model.donationExplain")
              : t("model.communityExplain")}
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">{t("model.noPromise")}</p>
        </div>
      </header>

      <div className="mt-8 max-w-2xl">
        <StepBar steps={steps} index={index} />

        <div className="mt-6 rounded-md border border-ink/8 bg-white/60 p-4 sm:p-6">
          {step === "amount" ? (
            <AmountStep
              project={project}
              amountCents={amountCents}
              custom={customAmount}
              tooLow={tooLow}
              onPick={(cents) => {
                setAmountCents(cents);
                setCustomAmount("");
              }}
              onCustom={(value) => {
                setCustomAmount(value);
                const parsed = Number.parseFloat(value.replace(",", "."));
                setAmountCents(Number.isFinite(parsed) ? Math.round(parsed * 100) : 0);
              }}
            />
          ) : null}

          {step === "who" ? (
            <WhoStep
              name={name}
              anonymous={anonymous}
              message={message}
              onName={setName}
              onAnonymous={setAnonymous}
              onMessage={setMessage}
            />
          ) : null}

          {step === "eid" ? <EidStep done={eidDone} onConfirm={() => setEidDone(true)} /> : null}

          {step === "membership" ? <MembershipStep bp={bp} /> : null}

          {step === "method" ? <MethodStep rail={rail} onPick={setRail} /> : null}

          {step === "confirm" ? (
            <ConfirmStep
              project={project}
              amountCents={amountCents}
              displayName={displayName}
              message={message}
              rail={rail}
              bp={project.model === "community" ? bp : null}
            />
          ) : null}
        </div>

        {step !== "confirm" ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("contribute.prev")}
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
              disabled={!canAdvance}
              className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {index === steps.length - 2 ? t("contribute.finish") : t("contribute.next")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StepBar({
  steps,
  index,
}: {
  readonly steps: readonly StepKey[];
  readonly index: number;
}) {
  const { t } = useT();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.1em] text-inkMuted">
        {t("contribute.stepOf", { step: index + 1, total: steps.length })}
      </p>
      <ol className="mt-2 flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === index ? "step" : undefined}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              i === index
                ? "bg-forest text-cream"
                : i < index
                  ? "bg-forest/10 text-forest-800"
                  : "bg-ink/6 text-inkMuted"
            }`}
          >
            {t(stepLabelKey(s))}
          </li>
        ))}
      </ol>
    </div>
  );
}

function AmountStep({
  project,
  amountCents,
  custom,
  tooLow,
  onPick,
  onCustom,
}: {
  readonly project: Project;
  readonly amountCents: number;
  readonly custom: string;
  readonly tooLow: boolean;
  readonly onPick: (cents: number) => void;
  readonly onCustom: (value: string) => void;
}) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold text-ink">
        {t("contribute.amountLabel")}
      </legend>
      <p className="mt-1 text-sm text-inkMuted">
        {t("contribute.amountHint", { min: formatEur(project.min_contribution_cents) })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestedAmounts(project.min_contribution_cents).map((cents) => (
          <button
            key={cents}
            type="button"
            onClick={() => onPick(cents)}
            aria-pressed={custom === "" && amountCents === cents}
            className={`rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors ${
              custom === "" && amountCents === cents
                ? "border-forest bg-forest/10 text-forest-800"
                : "border-ink/12 bg-white text-inkSoft hover:border-forest hover:text-forest"
            }`}
          >
            {formatEur(cents)}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-sm text-inkMuted">{t("contribute.amountCustom")}</span>
        <input
          type="text"
          inputMode="decimal"
          value={custom}
          onChange={(e) => onCustom(e.target.value)}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>

      {tooLow ? <p className="mt-2 text-sm text-rust">{t("contribute.amountTooLow")}</p> : null}
    </fieldset>
  );
}

function WhoStep({
  name,
  anonymous,
  message,
  onName,
  onAnonymous,
  onMessage,
}: {
  readonly name: string;
  readonly anonymous: boolean;
  readonly message: string;
  readonly onName: (v: string) => void;
  readonly onAnonymous: (v: boolean) => void;
  readonly onMessage: (v: string) => void;
}) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold text-ink">
        {t("contribute.step.who")}
      </legend>

      <label className="mt-4 block">
        <span className="text-sm text-inkMuted">{t("contribute.nameLabel")}</span>
        <input
          type="text"
          value={name}
          disabled={anonymous}
          placeholder={t("contribute.namePlaceholder")}
          onChange={(e) => onName(e.target.value)}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink disabled:bg-sand disabled:text-inkMuted"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm text-inkSoft">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => onAnonymous(e.target.checked)}
          className="h-4 w-4 rounded-sm border-ink/20 text-forest"
        />
        {t("contribute.anonymous")}
      </label>

      <label className="mt-4 block">
        <span className="text-sm text-inkMuted">{t("contribute.messageLabel")}</span>
        <textarea
          value={message}
          rows={3}
          placeholder={t("contribute.messagePlaceholder")}
          onChange={(e) => onMessage(e.target.value)}
          className="mt-1 w-full rounded-sm border border-ink/12 bg-white px-3 py-2 text-sm text-ink"
        />
      </label>
    </fieldset>
  );
}

/**
 * ⚠️ Simulirani eID (docs/04 §6). Ne otvara se Certilia i ne poziva se WebAuthn.
 * Passkey u closed beti ostaje simuliran dok se ne odluči trajna domena
 * (docs/12 §4) — passkeyi ne migriraju preko registrable domaina.
 */
function EidStep({ done, onConfirm }: { readonly done: boolean; readonly onConfirm: () => void }) {
  const { t } = useT();
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{t("contribute.eidTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("contribute.eidWhy")}</p>
      <p className="mt-3 rounded-md border border-dashed border-ink/15 bg-sand p-3 text-sm text-inkMuted">
        {t("contribute.eidSimulated")}
      </p>

      {done ? (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-teal/10 px-3 py-2 text-sm text-teal-700">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          {t("contribute.eidDone")}
        </p>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
        >
          {t("contribute.eidConfirm")}
        </button>
      )}
    </section>
  );
}

function MembershipStep({ bp }: { readonly bp: number }) {
  const { t } = useT();
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">
        {t("contribute.membershipTitle")}
      </h2>
      {/* ⚠️ Udio u ENERGIJI i glasu, ne u novcu (docs/03 §3, docs/05 §5). */}
      <p className="mt-2 text-sm leading-relaxed text-inkSoft">{t("contribute.membershipNote")}</p>
      <p className="mt-3 rounded-md bg-forest/6 p-3 text-sm font-medium text-ink">
        {t("contribute.membershipShare", { bp })}
      </p>
    </section>
  );
}

function MethodStep({
  rail,
  onPick,
}: {
  readonly rail: ContributionRail;
  readonly onPick: (rail: ContributionRail) => void;
}) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="font-display text-lg font-semibold text-ink">
        {t("contribute.methodTitle")}
      </legend>

      <div className="mt-4 space-y-2">
        {RAILS.map((option) => {
          const copy = RAIL_COPY[option];
          const selected = option === rail;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onPick(option)}
              aria-pressed={selected}
              className={`block w-full rounded-md border p-3 text-left transition-colors ${
                selected
                  ? "border-forest bg-forest/6"
                  : "border-ink/12 bg-white hover:border-forest/40"
              }`}
            >
              <span className="block text-sm font-medium text-ink">
                {t(copy.name)}
              </span>
              <span className="mt-0.5 block text-sm text-inkMuted">
                {t(copy.hint)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Ekran potvrde. Dokle tijek ide u Fazi 1 (docs/07 §3).
 *
 * ⚠️ Nema poveznice na preglednik blokova i nema uplatnog koda: oboje bi bilo
 * izmišljeno. Umjesto toga piše što bi se dogodilo kad podaci postanu stvarni.
 */
function ConfirmStep({
  project,
  amountCents,
  displayName,
  message,
  rail,
  bp,
}: {
  readonly project: Project;
  readonly amountCents: number;
  readonly displayName: string;
  readonly message: string;
  readonly rail: ContributionRail;
  readonly bp: number | null;
}) {
  const { t } = useT();
  return (
    <section>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest-800">
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
        {t("contribute.confirmTitle")}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-inkSoft">{t("contribute.confirmLead")}</p>

      <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-inkMuted">
        {t("contribute.summary")}
      </h2>
      <dl className="mt-2 rounded-md border border-ink/8 bg-cream/60 px-4">
        <Summary label={t("project.raised")} value={formatEur(amountCents)} />
        <Summary label={t("ledger.who")} value={displayName} />
        <Summary
          label={t("contribute.methodTitle")}
          value={t(RAIL_COPY[rail].name)}
        />
        {bp !== null ? (
          <Summary label={t("ledger.share")} value={t("ledger.shareValue", { bp })} />
        ) : null}
        {message.trim() !== "" ? (
          <Summary label={t("contribute.messageLabel")} value={message.trim()} />
        ) : null}
      </dl>

      <section className="mt-6 rounded-md border border-ink/8 bg-sand p-4">
        <h2 className="text-sm font-medium text-ink">{t("contribute.proofTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-inkSoft">{t("contribute.proofNote")}</p>
        <p className="mt-2 text-xs text-inkMuted">{t("demo.noChain")}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/projekt/${project.slug}/?tab=knjiga`}
          className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
        >
          {t("ledger.title")}
        </Link>
        <Link
          href={`/projekt/${project.slug}/`}
          className="rounded-sm border border-ink/12 bg-white px-4 py-2 text-sm font-medium text-inkSoft hover:border-forest hover:text-forest"
        >
          {t("contribute.backToProject")}
        </Link>
      </div>
    </section>
  );
}

function Summary({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/8 py-2.5 last:border-b-0">
      <dt className="text-sm text-inkMuted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
