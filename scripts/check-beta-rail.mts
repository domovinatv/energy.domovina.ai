/* eslint-disable no-console -- CLI skripta: ispis JE njezin rezultat. */
/**
 * Provjera prije deploya za /beta/ (docs/15).
 *
 * Rail odbija svaku uplatu s `cmp:` opisom za kampanju koja nije registrirana
 * na pay.domovina.ai — tiho, s gledišta uplatitelja. Zato se prije svakog deploya
 * pita sam rail (`GET /api/intents/campaign-qr`) i uspoređuje IBAN, primatelja i
 * opis plaćanja s onim što stranica prikazuje. Neslaganje ruši deploy.
 *
 * Projekti s izravnim Monerium IBAN-om ovdje se ne mogu provjeriti bez
 * Monerium prijave — za njih vrijedi ručna provjera iz docs/15 §6.
 */
import { BETA_PROJECTS, RAIL_API_BASE, isPayable, remittanceFor } from "../lib/beta-projects.ts";

interface CampaignQr {
  memo: string;
  iban: string;
  beneficiary_name: string;
  bic: string | null;
}

const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();

let failures = 0;
let checked = 0;

for (const project of BETA_PROJECTS) {
  if (!isPayable(project)) {
    console.log(`·  ${project.slug}: u pripremi (nema Safea ili načina uplate) — preskačem`);
    continue;
  }
  if (project.payment.kind !== "rail") {
    console.log(`·  ${project.slug}: izravni Monerium IBAN — ručna provjera (docs/15 §6)`);
    continue;
  }
  checked += 1;
  const url = `${RAIL_API_BASE}/campaign-qr?target=${project.safe}&id=${encodeURIComponent(project.payment.campaignId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    failures += 1;
    console.error(`✗  ${project.slug}: rail je odgovorio ${res.status} — ${await res.text()}`);
    continue;
  }
  const qr = (await res.json()) as CampaignQr;
  const problems: string[] = [];
  if (qr.memo !== remittanceFor(project)) problems.push(`opis: rail „${qr.memo}", stranica „${remittanceFor(project)}"`);
  if (norm(qr.iban) !== norm(project.payment.iban)) problems.push(`IBAN: rail ${qr.iban}, stranica ${project.payment.iban}`);
  if (qr.beneficiary_name !== project.payment.beneficiaryName)
    problems.push(`primatelj: rail „${qr.beneficiary_name}", stranica „${project.payment.beneficiaryName}"`);
  if ((qr.bic ?? null) !== project.payment.bic) problems.push(`BIC: rail ${qr.bic}, stranica ${project.payment.bic}`);
  if (problems.length > 0) {
    failures += 1;
    console.error(`✗  ${project.slug}:\n   ${problems.join("\n   ")}`);
  } else {
    console.log(`✓  ${project.slug}: rail potvrđuje IBAN, primatelja i opis plaćanja`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} projekt(a) ne odgovara railu — deploy zaustavljen.`);
  process.exit(1);
}
console.log(`\nRail provjera: ${checked} provjereno, 0 grešaka.`);
