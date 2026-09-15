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

const ROOT = process.cwd();

/** Direktoriji koji se provjeravaju. `docs/` je namjerno izvan — ondje se o */
/** zabranjenim modelima RASPRAVLJA, i to je cijela svrha pravnog okvira. */
const SCAN_DIRS = ["app", "components", "lib", "scripts"];

const SKIP_DIRS = new Set(["node_modules", ".next", "out", ".git"]);

interface Rule {
  readonly pattern: RegExp;
  readonly why: string;
}

/**
 * Zabranjeni pojmovi iz CLAUDE.md §1 i docs/03 §3, u oba jezika.
 *
 * Granice riječi (`\b`) drže lažne pozitive niskima: „return" u `return;` je
 * ključna riječ jezika, pa se kod provjerava samo u STRING literalima
 * (vidi `extractStrings`).
 */
const RULES: readonly Rule[] = [
  { pattern: /\bprinos/i, why: "obećanje prinosa → ECSPR/MiFID (docs/03 §3)" },
  { pattern: /\bkamat/i, why: "kamata → zajam → ECSPR ili bankovna djelatnost" },
  { pattern: /\bdividend/i, why: "dividenda → udio u dobiti → ECSPR/MiFID" },
  { pattern: /\bpovrat na ulaganje/i, why: "povrat na ulaganje → ECSPR/MiFID" },
  { pattern: /\budio u dobiti/i, why: "udio u dobiti → ECSPR/MiFID" },
  { pattern: /\bsekundarno trži/i, why: "sekundarno tržište → model D, DLT Pilot" },
  { pattern: /\bprodaj (svoj )?udio/i, why: "prenosivost udjela → model D" },
  { pattern: /\byield\b/i, why: "yield → ECSPR/MiFID (docs/03 §3)" },
  { pattern: /\broi\b/i, why: "ROI → ECSPR/MiFID" },
  { pattern: /\bprofit share\b/i, why: "profit share → ECSPR/MiFID" },
  { pattern: /\bshare of profit\b/i, why: "share of profit → ECSPR/MiFID" },
  { pattern: /\binterest rate\b/i, why: "interest rate → zajam → ECSPR" },
  { pattern: /\bsecondary market\b/i, why: "secondary market → model D" },
  { pattern: /\bannual return\b/i, why: "annual return → ECSPR/MiFID" },
  { pattern: /\breturn on investment\b/i, why: "return on investment → ECSPR/MiFID" },
  {
    pattern: /\bvraćamo ti\b/i,
    why: "povratna uplata → primanje povratnih sredstava od javnosti (docs/14 §2.3)",
  },
];

/**
 * Imena polja i komponenti — provjeravaju se u CIJELOM izvoru, ne samo u
 * stringovima, jer završe u API-ju (docs/05 §5).
 */
const IDENTIFIER_RULES: readonly Rule[] = [
  { pattern: /\b\w*[yY]ield\w*\s*[:=(]/, why: "ime polja/komponente s `yield`" },
  { pattern: /\b\w*[dD]ividend\w*\s*[:=(]/, why: "ime polja/komponente s `dividend`" },
  { pattern: /\b\w*[rR]oi\w*\s*[:=(]/, why: "ime polja/komponente s `roi`" },
  { pattern: /\breturnOn\w*\s*[:=(]/, why: "ime polja/komponente s `returnOn`" },
];

/** Datoteke koje se ne provjeravaju — zasad samo sam ovaj linter. */
const ALLOWLIST: readonly string[] = ["scripts/check-copy.ts"];

/**
 * ODOBRENE NEGACIJE — jedine rečenice u kojima zabranjeni pojam smije stajati.
 *
 * docs/07 §2.3 traži da rečenica „Ne nudimo prinos ni udio u dobiti" bude
 * TRAJNO VIDLJIVA, ne u fusnoti. Odricanje mora imenovati ono čega se odriče,
 * pa se bez iznimke ne može napisati.
 *
 * Namjerno je to popis DOSLOVNIH rečenica, a ne uzorak „dopusti ako počinje s
 * ne". Uzorak bi propustio svako „ne nudimo prinos, ali…", a ova je rečenica
 * pravno nosiva — svako odstupanje od odobrene formulacije mora pasti na lintu
 * i proći kroz svjesnu odluku, kao i svaka druga izmjena pravnog teksta.
 *
 * Dodavanje retka ovdje je pravna odluka. Uz svaki ide dokument koji ga traži.
 */
const APPROVED_NEGATIONS: readonly string[] = [
  // docs/07 §2.3 — trajno vidljivo na stranici projekta
  "Ne nudimo prinos ni udio u dobiti.",
  "We do not offer a financial gain or a share of profit.",
  // docs/03 §3 — objašnjenje modela A
  "Doprinos financira izgradnju. Ne daje pravo na novac ni na udio u dobiti.",
  "A contribution funds construction. It grants no claim to money and no share of profit.",
];

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
    for (const rule of RULES) {
      if (rule.pattern.test(strings)) {
        findings.push({ file: rel, line: i + 1, text: line.trim(), why: rule.why });
      }
    }
    for (const rule of IDENTIFIER_RULES) {
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
