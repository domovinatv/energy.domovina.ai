/* eslint-disable no-console -- CLI skripta: ispis JE njezin rezultat. */
/**
 * Provjera prije deploya za /beta/ (docs/15 §6). Dio `npm run deploy`.
 *
 * 1. SAFE — za svaki projekt s upisanim Safeom čita lanac: Safe mora biti
 *    DEPLOYAN (postmortem 0001 u pay.domovina.ai: novac na nedeployanoj adresi
 *    može ostati zarobljen), a vlasnici i prag moraju biti točno oni upisani u
 *    `lib/beta-projects.ts`. Kriva ili tipfelerom pokvarena adresa ne smije
 *    dobiti QR za uplatu.
 * Je li Safe na payout whitelisti raila ovdje se ne vidi (admin API); ako nije,
 * `/beta/` pri stvaranju intenta prikaže poruku umjesto checkouta.
 */
import { BETA_PROJECTS, isValidSafe } from "../lib/beta-projects.ts";
import { readSafe } from "../lib/safe-rpc.ts";



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

}

if (failures > 0) {
  console.error(`\n${failures} projekt(a) ne prolazi provjeru — deploy zaustavljen.`);
  process.exit(1);
}
console.log("\nBeta provjera prošla.");
