/* eslint-disable no-console -- CLI skripta: ispis JE njezin rezultat. */
/**
 * Provjera prije deploya za /beta/ (docs/15 §6). Dio `npm run deploy`.
 *
 * 1. SAFE — za svaki projekt s upisanim Safeom čita lanac: Safe mora biti
 *    DEPLOYAN (postmortem 0001 u pay.domovina.ai: novac na nedeployanoj adresi
 *    može ostati zarobljen), a vlasnici i prag moraju biti točno oni upisani u
 *    `lib/beta-projects.ts`. Kriva ili tipfelerom pokvarena adresa ne smije
 *    dobiti QR za uplatu.
 * 2. RAIL — za `kind: "rail"` pita pay.domovina.ai (`GET /campaign-qr`): rail
 *    tiho odbija uplate za neregistriranu kampanju.
 *
 * Monerium usmjeravanje (`gnosis:<safe>`) ovdje se ne može provjeriti bez
 * Monerium prijave: da je Safe povezan s profilom, potvrđuje test uplata od 1 €.
 */
import { BETA_PROJECTS, RAIL_API_BASE, remittanceFor, isPayable, isValidSafe } from "../lib/beta-projects.ts";
import { readSafe } from "../lib/safe-rpc.ts";

interface CampaignQr {
  memo: string;
  iban: string;
  beneficiary_name: string;
  bic: string | null;
}

const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();

let failures = 0;
const fail = (slug: string, problems: string[]) => {
  failures += 1;
  console.error(`✗  ${slug}:\n   ${problems.join("\n   ")}`);
};

for (const project of BETA_PROJECTS) {
  if (project.safe === null) {
    console.log(`·  ${project.slug}: u pripremi (nema Safea) — preskačem`);
    continue;
  }
  if (!isValidSafe(project.safe)) {
    fail(project.slug, [`neispravna adresa Safea: ${project.safe}`]);
    continue;
  }
  if (project.signers === null) {
    fail(project.slug, ["Safe je upisan bez potpisnika — upiši `signers` da se može provjeriti"]);
    continue;
  }

  // ── 1. Safe na lancu ──────────────────────────────────────────────────────
  const onChain = await readSafe(project.safe);
  if (!onChain.deployed) {
    fail(project.slug, [`${project.safe} nije deployan na Gnosis Chainu — napravi ga na app.safe.global prije objave`]);
    continue;
  }
  const expected = project.signers.owners.map((o) => o.toLowerCase()).sort();
  const actual = [...onChain.owners].sort();
  const problems: string[] = [];
  const missing = expected.filter((o) => !actual.includes(o));
  const extra = actual.filter((o) => !expected.includes(o));
  if (missing.length > 0) problems.push(`nisu vlasnici na lancu: ${missing.join(", ")}`);
  if (extra.length > 0) problems.push(`vlasnici na lancu kojih nema u konfiguraciji: ${extra.join(", ")}`);
  if (onChain.threshold !== project.signers.threshold) {
    problems.push(`prag: na lancu ${onChain.threshold}, u konfiguraciji ${project.signers.threshold}`);
  }
  if (problems.length > 0) {
    fail(project.slug, problems);
    continue;
  }
  console.log(`✓  ${project.slug}: Safe deployan, ${onChain.threshold}-od-${onChain.owners.length}, vlasnici odgovaraju`);

  // ── 2. Rail registracija ──────────────────────────────────────────────────
  if (!isPayable(project) || project.payment.kind !== "rail") continue;
  const url = `${RAIL_API_BASE}/campaign-qr?target=${project.safe}&id=${encodeURIComponent(project.payment.campaignId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    fail(project.slug, [`rail je odgovorio ${res.status} — ${await res.text()}`]);
    continue;
  }
  const qr = (await res.json()) as CampaignQr;
  const railProblems: string[] = [];
  if (qr.memo !== remittanceFor(project)) railProblems.push(`opis: rail „${qr.memo}", stranica „${remittanceFor(project)}"`);
  if (norm(qr.iban) !== norm(project.payment.iban)) railProblems.push(`IBAN: rail ${qr.iban}, stranica ${project.payment.iban}`);
  if (qr.beneficiary_name !== project.payment.beneficiaryName) {
    railProblems.push(`primatelj: rail „${qr.beneficiary_name}", stranica „${project.payment.beneficiaryName}"`);
  }
  if ((qr.bic ?? null) !== project.payment.bic) railProblems.push(`BIC: rail ${qr.bic}, stranica ${project.payment.bic}`);
  if (railProblems.length > 0) fail(project.slug, railProblems);
  else console.log(`✓  ${project.slug}: rail potvrđuje IBAN, primatelja i opis plaćanja`);
}

if (failures > 0) {
  console.error(`\n${failures} projekt(a) ne prolazi provjeru — deploy zaustavljen.`);
  process.exit(1);
}
console.log("\nBeta provjera prošla.");
