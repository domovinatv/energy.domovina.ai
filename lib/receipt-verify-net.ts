/**
 * Mrežni izvori za provjeru potvrde (`lib/receipt-verify.ts`). Namjerno NIJEDAN
 * nije rail: javni checkpointi su na GitHubu, Bitcoin headeri s dva neovisna
 * Esplora API-ja (uspoređuju se), Gnosis transakcije s javnog RPC-a.
 * Svaka domena ovdje mora biti i u CSP-u (`public/_headers`, connect-src).
 */
import { hexToBytes, type Hex } from "viem";
import { parseBlockHeader, type AnchorFields, type GnosisReceipt, type VerifyNet } from "@/lib/receipt-verify";

export const CHECKPOINTS_BASE = "https://raw.githubusercontent.com/domovinatv/mpt-receipts-checkpoints/main/anchors";
export const BITCOIN_APIS = ["https://mempool.space/api", "https://blockstream.info/api"] as const;
export const GNOSIS_RPC = "https://rpc.gnosischain.com";

const TIMEOUT_MS = 20_000;

async function get(url: string, fetchFn: typeof fetch): Promise<Response> {
  return fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
}

export function browserVerifyNet(fetchFn: typeof fetch = (...a) => fetch(...a)): VerifyNet {
  return {
    async checkpoint(seq) {
      const res = await get(`${CHECKPOINTS_BASE}/${seq}.json`, fetchFn);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`checkpoint ${seq}: HTTP ${res.status}`);
      const anchor = (await res.json()) as AnchorFields & { created_at?: number };
      const otsRes = await get(`${CHECKPOINTS_BASE}/${seq}.ots`, fetchFn);
      const ots = otsRes.ok ? new Uint8Array(await otsRes.arrayBuffer()) : null;
      return { anchor, ots };
    },

    async bitcoinHeaders(height) {
      return Promise.all(
        BITCOIN_APIS.map(async (api) => {
          try {
            const hashRes = await get(`${api}/block-height/${height}`, fetchFn);
            if (!hashRes.ok) throw new Error(`HTTP ${hashRes.status}`);
            const blockHash = (await hashRes.text()).trim().toLowerCase();
            const hRes = await get(`${api}/block/${blockHash}/header`, fetchFn);
            if (!hRes.ok) throw new Error(`HTTP ${hRes.status}`);
            const header = hexToBytes(`0x${(await hRes.text()).trim()}` as Hex);
            // Header mora dati upravo hash koji je isti API javio.
            if (parseBlockHeader(header).blockHash !== blockHash) throw new Error("header ne daje javljeni hash bloka");
            return { api, header };
          } catch (e) {
            return { api, header: null, error: e instanceof Error ? e.message : String(e) };
          }
        }),
      );
    },

    async gnosisReceipts(txs) {
      const out = new Map<string, GnosisReceipt | null>();
      for (let i = 0; i < txs.length; i += 20) {
        const chunk = txs.slice(i, i + 20);
        const res = await fetchFn(GNOSIS_RPC, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(chunk.map((tx, j) => ({ jsonrpc: "2.0", id: j, method: "eth_getTransactionReceipt", params: [tx] }))),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { id: number; result?: GnosisReceipt | null }[];
        for (const r of Array.isArray(body) ? body : []) {
          const tx = chunk[r.id];
          if (tx !== undefined) out.set(tx, r.result ?? null);
        }
      }
      return out;
    },
  };
}
