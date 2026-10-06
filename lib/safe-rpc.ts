/**
 * Čitanje Safe ugovora izravnim JSON-RPC pozivom — za provjeru prije deploya
 * (`scripts/check-beta.mts`). Bez viema: tri `eth_call` poziva i ručno
 * dekodiranje ABI-ja, jer je to sve što provjera treba.
 */

export const GNOSIS_RPC = "https://rpc.gnosischain.com";

/** Selektori Safe ugovora (v1.3 / v1.4.1 imaju iste). */
const SELECTOR = {
  getOwners: "0xa0e67e2b",
  getThreshold: "0xe75235b8",
  /** ERC-20 `balanceOf(address)`. */
  balanceOf: "0x70a08231",
} as const;

export interface SafeOnChain {
  deployed: boolean;
  owners: string[];
  threshold: number;
}

/** `address[]` iz ABI odgovora: offset, duljina, pa po jedna riječ od 32 bajta. */
export function decodeAddressArray(hex: string): string[] {
  const data = hex.startsWith("0x") ? hex.slice(2) : hex;
  const word = (i: number) => data.slice(i * 64, (i + 1) * 64);
  const offsetWords = Number(BigInt("0x" + word(0)) / 32n);
  const length = Number(BigInt("0x" + word(offsetWords)));
  const out: string[] = [];
  for (let i = 0; i < length; i++) {
    out.push("0x" + word(offsetWords + 1 + i).slice(24).toLowerCase());
  }
  return out;
}

export function decodeUint(hex: string): number {
  return Number(BigInt(hex));
}

async function rpc(method: string, params: unknown[], signal?: AbortSignal): Promise<string> {
  const res = await fetch(GNOSIS_RPC, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await res.json()) as { result?: string; error?: { message: string } };
  if (body.error || body.result === undefined) {
    throw new Error(`${method}: ${body.error?.message ?? res.status}`);
  }
  return body.result;
}

/** Calldata za `balanceOf(holder)`: selektor + adresa poravnata na 32 bajta. */
export function balanceOfCalldata(holder: string): string {
  return SELECTOR.balanceOf + holder.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/**
 * ERC-20 saldo u wei, ravno s lanca. Blockscoutov `token-balances` osvježava se
 * lijeno i zna satima kasniti za prijenosima (6.10.2026.: 7,26 € umjesto 8,26 €),
 * pa saldo na /beta/ dolazi odavde.
 */
export async function readErc20Balance(token: string, holder: string, signal?: AbortSignal): Promise<bigint> {
  return BigInt(await rpc("eth_call", [{ to: token, data: balanceOfCalldata(holder) }, "latest"], signal));
}

export async function readSafe(address: string): Promise<SafeOnChain> {
  const code = await rpc("eth_getCode", [address, "latest"]);
  if (code === "0x" || code === "0x0") return { deployed: false, owners: [], threshold: 0 };
  const call = (data: string) => rpc("eth_call", [{ to: address, data }, "latest"]);
  const [owners, threshold] = await Promise.all([call(SELECTOR.getOwners), call(SELECTOR.getThreshold)]);
  return { deployed: true, owners: decodeAddressArray(owners), threshold: decodeUint(threshold) };
}
