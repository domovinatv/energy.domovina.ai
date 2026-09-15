/**
 * Lint na zabranjene riječi — zahtjev E3 (docs/03 §8).
 *
 * ⚠️ Ovo NIJE kozmetika nego KONTROLA USKLAĐENOSTI (docs/14 §2.4).
 *
 * Čim ono što korisnik drži nosi očekivanje prinosa, udio u dobiti ili
 * prenosivost s tržišnom cijenom, analiza se seli na ECSP/MiFID teritorij, a
 * licencu nemamo. U Modu 2 nas ne štiti non-custody — ECSPR ne traži
 * skrbništvo. Štiti nas isključivo to što su instrumenti izvan opsega, a to
 * drži samo ograničenje na modele A i B.
 *
 * Strože od ECSPR-a: uplata se nikad ne opisuje kao povratna — „daj novac pa ti
 * ga vraćamo" je primanje povratnih sredstava od javnosti, rezervirana bankovna
 * djelatnost (docs/14 §2.3).
 *
 * Provjerava se copy (i18n katalozi), imena polja i imena komponenti — jer
 * imena polja završe u API-ju i na screenshotovima (docs/05 §5).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  APPROVED_NEGATIONS,
  FORBIDDEN_IDENTIFIER_RULES,
  FORBIDDEN_RULES,
} from "../lib/forbidden-words";

const ROOT = process.cwd();

/** Direktoriji koji se provjeravaju. `docs/` je namjerno izvan — ondje se o */
/** zabranjenim modelima RASPRAVLJA, i to je cijela svrha pravnog okvira. */
const SCAN_DIRS = ["app", "components", "lib", "scripts"];

const SKIP_DIRS = new Set(["node_modules", ".next", "out", ".git"]);

/**
 * Datoteke koje se ne provjeravaju.
 *
 * Samo one koje zabranjene pojmove nose kao UZORKE — linter i popis iz kojeg
 * linter čita. Svaka druga iznimka je rupa u kontroli usklađenosti, ne olakšica.
 */
const ALLOWLIST: readonly string[] = ["scripts/check-copy.ts", "lib/forbidden-words.ts"];

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly why: string;
}

function walk(dir: string, out: string[]): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Je li redak komentar? Komentari smiju objašnjavati zašto je nešto zabranjeno. */
function isExplanatoryComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

/** Sadržaj string literala u retku — ondje živi copy koji korisnik vidi. */
function extractStrings(line: string): string {
  const matches = line.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g);
  return matches === null ? "" : matches.join(" ");
}

function checkFile(file: string): Finding[] {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.includes(rel)) return [];

  const findings: Finding[] = [];
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, i) => {
    if (isExplanatoryComment(line)) return;

    let strings = extractStrings(line);
    // Odobrene negacije se uklanjaju prije provjere, pa ostatak retka i dalje
    // prolazi kroz sva pravila — iznimka vrijedi za rečenicu, ne za redak.
    for (const approved of APPROVED_NEGATIONS) {
      strings = strings.split(approved).join(" ");
    }
    for (const rule of FORBIDDEN_RULES) {
      if (rule.pattern.test(strings)) {
        findings.push({ file: rel, line: i + 1, text: line.trim(), why: rule.why });
      }
    }
    for (const rule of FORBIDDEN_IDENTIFIER_RULES) {
      if (rule.pattern.test(line)) {
        findings.push({ file: rel, line: i + 1, text: line.trim(), why: rule.why });
      }
    }
  });

  return findings;
}

function main(): void {
  const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir), []));
  const findings = files.flatMap(checkFile);

  if (findings.length === 0) {
    console.log(`check-copy: ${files.length} datoteka, nema zabranjenih pojmova.`);
    return;
  }

  console.error("\ncheck-copy: PRAVNA GRANICA PREKORAČENA (docs/03 §3)\n");
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}`);
    console.error(`    ${f.text}`);
    console.error(`    → ${f.why}\n`);
  }
  console.error(
    "Dopušteno umjesto toga: doprinos · članski ulog · udio u proizvedenoj\n" +
      "energiji · glas u zajednici · javni dokaz doprinosa · predujam na elektranu.\n",
  );
  process.exit(1);
}

main();
