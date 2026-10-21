/**
 * Profil raila: na koji MPT tenant, lanac i token stranica šalje i iz kojeg čita
 * (docs/17). Kod koji miče novac (`mpt-intent`, `beta-chain`, `IntentPanel`) je
 * jedan; profil kaže samo GDJE.
 *
 * - `italk` — pravi novac: produkcijski Monerium, Gnosis Chain, /beta/.
 * - `italk-sandbox` — Monerium sandbox, Chiado: /sandbox/. Banka se simulira
 *   (`POST /api/intents/:sid/monerium-sandbox-transfer`), sve iza nje je pravi
 *   put raila: Monerium order, webhook, mint na Chiadu, status uživo.
 *
 * Nova domena ovdje = nova stavka u CSP-u (public/_headers).
 */
import type { Address } from "@/lib/beta-projects";
import type { MessageKey } from "@/lib/i18n/hr";

export interface RailProfile {
  /** Tenant na pay.domovina.ai. */
  tenant: "italk" | "italk-sandbox";
  /** Monerium sandbox: nema pravog novca, uplata se simulira, EPC QR se ne prikazuje. */
  sandbox: boolean;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  /** Blockscout API v2 (CORS `*`). */
  blockscoutApi: string;
  /** Explorer za ljude; `/tx/<hash>` i `/address/<adresa>`. */
  explorer: string;
  /** EURe (Monerium) na tom lancu. */
  eure: Address;
  /** MPT intent API. */
  apiBase: string;
  /**
   * Javni ključ tenanta (`pk_…`). `null` = zadani tenant raila (`italk`).
   * Javan je namjerno (ide u JS paket): smije samo stvoriti intent prema Safeu
   * s whiteliste tenanta.
   */
  tenantKey: string | null;
  /**
   * Tenant na railu objavljuje oznake uplatitelja (inicijali + ··1234,
   * `tenants.public_payer_tags`, lib/payer-tags). Mora se slagati s railom:
   * bez toga stranica ne obećava oznaku na obrascu za uplatu.
   */
  payerTags: boolean;
}

const RAIL_API_BASE = "https://mpt.domovina.ai/api/intents";

export const RAIL_ITALK: RailProfile = {
  tenant: "italk",
  sandbox: false,
  chainId: 100,
  chainName: "Gnosis Chain",
  rpcUrl: "https://rpc.gnosischain.com",
  blockscoutApi: "https://gnosisscan.io/api/v2",
  explorer: "https://gnosisscan.io",
  eure: "0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430",
  apiBase: RAIL_API_BASE,
  tenantKey: null,
  payerTags: true,
};

/**
 * Javni ključ tenanta `italk-sandbox` — izdaje ga admin raila
 * (`POST /admin/api/tenants/italk-sandbox/keys`, `kind: "public"`). Dok je `null`,
 * /sandbox/ kaže da uplata nije podešena umjesto da pošalje intent zadanom tenantu
 * (koji bi ga odbio s `target_not_whitelisted`).
 */
const ITALK_SANDBOX_PUBLIC_KEY: string | null = "pk_0f2aa3339d619acb1dd56239e97d33711c5452a7ab8a2057"; // izdan 20.10.2026.

export const RAIL_ITALK_SANDBOX: RailProfile = {
  tenant: "italk-sandbox",
  sandbox: true,
  chainId: 10200,
  chainName: "Chiado",
  rpcUrl: "https://rpc.chiadochain.net",
  blockscoutApi: "https://gnosis-chiado.blockscout.com/api/v2",
  explorer: "https://gnosis-chiado.blockscout.com",
  // pay.domovina.ai tools/funding/check-balances.mjs
  eure: "0x7a47605930002cc2cd2c3c408d1f33fc2a18ab71",
  apiBase: RAIL_API_BASE,
  tenantKey: ITALK_SANDBOX_PUBLIC_KEY,
  payerTags: false,
};

/** Tenant raila prima intente s ove stranice: zadani tenant ili tenant s ključem. */
export function isRailConfigured(rail: RailProfile): boolean {
  return rail.tenant === "italk" || rail.tenantKey !== null;
}

export function explorerTxUrl(rail: RailProfile, hash: string): string {
  return `${rail.explorer}/tx/${hash}`;
}

export function explorerAddressUrl(rail: RailProfile, address: Address): string {
  // gnosisscan.io (Blockscout) i Chiado Blockscout imaju isti tab za tokene.
  return `${rail.explorer}/address/${address}#tokentxns`;
}

/**
 * Copy dijeljenih komponenti (`IntentPanel`, `LiveActivity`) govori o elektrani i
 * Gnosis Chainu. U sandboxu ista poruka ide pod `sandbox.*`: Chiado, Safe kampanje,
 * testni EURe. Ključ bez zamjene ostaje isti.
 */
const SANDBOX_COPY: Partial<Record<MessageKey, MessageKey>> = {
  "beta.loading": "sandbox.loading",
  "beta.chainError": "sandbox.chainError",
  "beta.stepMinted": "sandbox.stepMinted",
  "beta.stepSettled": "sandbox.stepSettled",
  "beta.stepForwarding": "sandbox.stepForwarding",
  "beta.stepOwed": "sandbox.stepOwed",
  "beta.stepHintProcessing": "sandbox.stepHintProcessing",
  "beta.stepHintForwarding": "sandbox.stepHintForwarding",
  "beta.intentSettledSub": "sandbox.intentSettledSub",
  "beta.intentExpired": "sandbox.intentExpired",
  "beta.intentTx": "sandbox.intentTx",
  "beta.includesUnconfirmed": "sandbox.includesUnconfirmed",
  "beta.includesMinted": "sandbox.includesMinted",
  "beta.rowIndexing": "sandbox.rowIndexing",
  "beta.payErrorWhitelist": "sandbox.payErrorWhitelist",
};

export function railKey(rail: RailProfile, key: MessageKey): MessageKey {
  return rail.sandbox ? (SANDBOX_COPY[key] ?? key) : key;
}
