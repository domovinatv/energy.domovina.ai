/**
 * Kampanje na /sandbox/ (docs/17): pravi rail, pravi Safe na Chiadu, Monerium
 * sandbox — ali NIJEDAN euro nije stvaran. Svaki zapis nosi `demo: true` i UI to
 * prikazuje (traka + oznaka na kartici, CLAUDE.md pravilo 3).
 *
 * Kampanja se dodaje ovako (pay.domovina.ai `tools/funding`):
 *   1. `node funding-init.mjs --env sandbox --project <id> --title "<naslov>"`
 *      → Safe na Chiadu, povezan s Monerium sandboxom, upis u projects.sandbox.json
 *   2. naredba [5b] iz ispisa u konzoli mpt.domovina.ai/admin → kampanja +
 *      whitelista tenanta `italk-sandbox`
 *   3. zapis ovdje s istim Safeom i potpisnicima
 */
import type { Address } from "@/lib/beta-projects";
import { RAIL_ITALK_SANDBOX, type RailProfile } from "@/lib/rail-profile";

type Localized = { hr: string; en: string };

export interface SandboxCampaign {
  slug: string;
  demo: true;
  title: Localized;
  /** Tko prikuplja — placeholder dok nema stvarnog klijenta. */
  organizer: Localized;
  summary: Localized;
  /** Na što ide prikupljeno, stavka po stavka. */
  uses: Localized[];
  goalCents: number;
  safe: Address;
  signers: { owners: Address[]; threshold: number };
  rail: RailProfile;
}

/** Iste tri adrese kao Safeovi u pay.domovina.ai `tools/funding/lib.mjs` (`DEFAULT_OWNERS`). */
const SANDBOX_SIGNERS = {
  owners: [
    "0x4924f440A12ac82F6e06B058a33d7fd8182f1944",
    "0xF3c4d416Fa863F0801605629097ffF07f1d46FB8",
    "0xC2386b03441C6104F8d40E52e74306EAE830A24B",
  ] as Address[],
  threshold: 2,
};

export const SANDBOX_CAMPAIGNS: readonly SandboxCampaign[] = [
  {
    slug: "primjer-kampanje",
    demo: true,
    title: { hr: "Primjer kampanje", en: "Example campaign" },
    organizer: { hr: "Nositelj kampanje (primjer)", en: "Campaign organiser (example)" },
    summary: {
      hr: "Zajednica prikuplja doprinose za zajednički projekt. Svaki doprinos ide izravno na račun s više potpisa koji drže nositelji projekta, a stanje računa je javno.",
      en: "A community collects contributions for a shared project. Every contribution goes straight to a multi-signature account held by the project's organisers, and its balance is public.",
    },
    uses: [
      { hr: "Oprema i materijal", en: "Equipment and materials" },
      { hr: "Izvedba i priključak", en: "Installation and connection" },
      { hr: "Pričuva za nepredviđeno", en: "Contingency reserve" },
    ],
    goalCents: 500_000,
    // pay.domovina.ai tools/funding/projects.sandbox.json, `energy-demo-kampanja` (20.10.2026.)
    safe: "0xb7A3d779E416C71b97A5bf81D6E6C5C98ac0241D",
    signers: SANDBOX_SIGNERS,
    rail: RAIL_ITALK_SANDBOX,
  },
];
