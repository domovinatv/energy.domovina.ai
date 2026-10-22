/**
 * Čitanje Gnosis Chaina za /beta/ — iz preglednika, bez našeg backenda.
 *
 * Izvor je Blockscout API na gnosisscan.io (`/api/v2`, CORS `*`). Isti podaci
 * koje Gnosisscan prikazuje ljudima, pa se broj na stranici i broj na exploreru
 * ne mogu razići. Iznimka je saldo: njega Blockscout osvježava lijeno, pa se čita
 * `balanceOf` izravno s lanca (`lib/safe-rpc`). Nova domena ovdje = nova stavka
 * u CSP-u (public/_headers).
 *
 * Lanac, token i Blockscout daje profil raila (`lib/rail-profile`): Gnosis za
 * /beta/, Chiado za sandbox /sandbox/.
 *
 * Za Gnosis se isti Blockscout redovi i isti `balanceOf` čitaju kroz rail
 * `GET /api/activity/:address` (edge cache, rail ADR 0030, `docs/18`): pod navalom,
 * i na sajmu gdje su svi mobiteli iza jednog NAT-a, Blockscout tako vidi jedan
 * upit po Safeu u 10 s umjesto jednog po kartici. Izravno čitanje ostaje rezerva i
 * put za brza ponovna čitanja nakon vlastite uplate (`direct`), gdje 10 s cachea
 * ne smije sakriti upravo stigao prijenos. Svaki redak i dalje nosi hash za explorer.
 */
import { weiToCents, type Address } from "@/lib/beta-projects";
import { RAIL_ITALK, type RailProfile } from "@/lib/rail-profile";
import { readErc20Balance } from "@/lib/safe-rpc";

/** Gornja granica stranica po 50 prijenosa; 500 uplata je daleko iznad bete. */
const MAX_PAGES = 10;

export interface IncomingTransfer {
  hash: string;
  timestamp: string;
  cents: number;
}

export interface SafeActivity {
  /** Zbroj svih dolaznih EURe prijenosa — ono što je uplaćeno, ne ono što je ostalo. */
  receivedCents: number;
  balanceCents: number;
  /** Najnoviji prvi. */
  transfers: IncomingTransfer[];
  /** Dosegnuta je granica stranica — zbroj je donja granica, ne točan iznos. */
  truncated: boolean;
}

interface TransferItem {
  transaction_hash: string;
  timestamp: string;
  total: { value: string };
}

interface TransferPage {
  items: TransferItem[];
  next_page_params: Record<string, string | number> | null;
}

interface TokenBalance {
  token: { address_hash?: string; address?: string };
  value: string;
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

export function activityUrl(rail: RailProfile, safe: string): string {
  return `${rail.apiBase.replace(/\/intents$/, "/activity")}/${safe}`;
}

interface RailActivity {
  transfers: Array<{ hash: string; timestamp: string; value: string }>;
  balance_wei: string | null;
  truncated: boolean;
}

export function parseRailActivity(body: unknown): RailActivity | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.transfers) || typeof b.truncated !== "boolean") return null;
  const transfers = b.transfers.filter((t): t is RailActivity["transfers"][number] => {
    if (typeof t !== "object" || t === null) return false;
    const r = t as Record<string, unknown>;
    return (
      typeof r.hash === "string" &&
      typeof r.timestamp === "string" &&
      typeof r.value === "string" &&
      /^[0-9]+$/.test(r.value)
    );
  });
  if (transfers.length !== b.transfers.length) return null;
  const balance = typeof b.balance_wei === "string" && /^[0-9]+$/.test(b.balance_wei) ? b.balance_wei : null;
  return { transfers, balance_wei: balance, truncated: b.truncated };
}

async function fetchViaRail(safe: Address, signal: AbortSignal, rail: RailProfile): Promise<SafeActivity> {
  const parsed = parseRailActivity(await getJson<unknown>(activityUrl(rail, safe), signal));
  if (parsed === null) throw new Error("activity: neispravan odgovor");
  const transfers = parsed.transfers.map((t) => ({ hash: t.hash, timestamp: t.timestamp, cents: weiToCents(t.value) }));
  const balanceWei = parsed.balance_wei !== null ? BigInt(parsed.balance_wei) : await readBalance(safe, signal, rail);
  return {
    receivedCents: transfers.reduce((sum, t) => sum + t.cents, 0),
    balanceCents: weiToCents(balanceWei.toString()),
    transfers,
    truncated: parsed.truncated,
  };
}

export async function fetchSafeActivity(
  safe: Address,
  signal: AbortSignal,
  rail: RailProfile = RAIL_ITALK,
  opts: { direct?: boolean } = {},
): Promise<SafeActivity> {
  if (rail.activityViaRail && !opts.direct) {
    try {
      return await fetchViaRail(safe, signal, rail);
    } catch {
      if (signal.aborted) throw signal.reason;
    }
  }
  return fetchDirect(safe, signal, rail);
}

async function fetchDirect(safe: Address, signal: AbortSignal, rail: RailProfile): Promise<SafeActivity> {
  const base = `${rail.blockscoutApi}/addresses/${safe}/token-transfers?type=ERC-20&filter=to&token=${rail.eure}`;
  const transfers: IncomingTransfer[] = [];
  let next: Record<string, string | number> | null = null;
  let pages = 0;
  do {
    const query = next
      ? "&" + new URLSearchParams(Object.entries(next).map(([k, v]) => [k, String(v)])).toString()
      : "";
    const page: TransferPage = await getJson<TransferPage>(base + query, signal);
    for (const item of page.items) {
      transfers.push({
        hash: item.transaction_hash,
        timestamp: item.timestamp,
        cents: weiToCents(item.total.value),
      });
    }
    next = page.next_page_params;
    pages += 1;
  } while (next && pages < MAX_PAGES);

  const balanceWei = await readBalance(safe, signal, rail);

  return {
    receivedCents: transfers.reduce((sum, t) => sum + t.cents, 0),
    balanceCents: weiToCents(balanceWei.toString()),
    transfers,
    truncated: next !== null,
  };
}

function readBalance(safe: Address, signal: AbortSignal, rail: RailProfile): Promise<bigint> {
  return readErc20Balance(rail.eure, safe, signal, rail.rpcUrl).catch(() => {
    if (signal.aborted) throw signal.reason;
    return blockscoutBalanceWei(safe, signal, rail);
  });
}

/** Rezerva kad RPC ne odgovara — može kasniti za prijenosima, ali je bolja od ničega. */
async function blockscoutBalanceWei(safe: Address, signal: AbortSignal, rail: RailProfile): Promise<bigint> {
  const balances = await getJson<TokenBalance[]>(`${rail.blockscoutApi}/addresses/${safe}/token-balances`, signal);
  const eure = balances.find(
    (b) => (b.token.address_hash ?? b.token.address ?? "").toLowerCase() === rail.eure.toLowerCase(),
  );
  return eure ? BigInt(eure.value) : 0n;
}
