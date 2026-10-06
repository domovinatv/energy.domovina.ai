/**
 * Čitanje Gnosis Chaina za /beta/ — iz preglednika, bez našeg backenda.
 *
 * Izvor je Blockscout API na gnosisscan.io (`/api/v2`, CORS `*`). Isti podaci
 * koje Gnosisscan prikazuje ljudima, pa se broj na stranici i broj na exploreru
 * ne mogu razići. Iznimka je saldo: njega Blockscout osvježava lijeno, pa se čita
 * `balanceOf` izravno s lanca (`lib/safe-rpc`). Nova domena ovdje = nova stavka
 * u CSP-u (public/_headers).
 */
import { EURE_ADDRESS, weiToCents, type Address } from "@/lib/beta-projects";
import { readErc20Balance } from "@/lib/safe-rpc";

const API = "https://gnosisscan.io/api/v2";

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

export async function fetchSafeActivity(safe: Address, signal: AbortSignal): Promise<SafeActivity> {
  const base = `${API}/addresses/${safe}/token-transfers?type=ERC-20&filter=to&token=${EURE_ADDRESS}`;
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

  const balanceWei = await readErc20Balance(EURE_ADDRESS, safe, signal).catch(() => {
    if (signal.aborted) throw signal.reason;
    return blockscoutBalanceWei(safe, signal);
  });

  return {
    receivedCents: transfers.reduce((sum, t) => sum + t.cents, 0),
    balanceCents: weiToCents(balanceWei.toString()),
    transfers,
    truncated: next !== null,
  };
}

/** Rezerva kad RPC ne odgovara — može kasniti za prijenosima, ali je bolja od ničega. */
async function blockscoutBalanceWei(safe: Address, signal: AbortSignal): Promise<bigint> {
  const balances = await getJson<TokenBalance[]>(`${API}/addresses/${safe}/token-balances`, signal);
  const eure = balances.find(
    (b) => (b.token.address_hash ?? b.token.address ?? "").toLowerCase() === EURE_ADDRESS.toLowerCase(),
  );
  return eure ? BigInt(eure.value) : 0n;
}
