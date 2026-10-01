/**
 * Uplate koje je Monerium ZAPRIMIO, a lanac ih još ne pokazuje.
 *
 * Rail javi „uplata je stigla" (`received_processing`) za nekoliko sekundi, a
 * EURe na Safeu elektrane sjedne tek nakon minta i forwarda — kod prve uplate s
 * novog IBAN-a i satima kasnije. Da uplatitelj odmah vidi da se njegov novac
 * pribrojio, iznos se privremeno dodaje prikupljenom. Kad se na lancu pojavi
 * prijenos s istim hashom kao railov forward, privremeni iznos se više ne broji
 * — inače bi ista uplata bila zbrojena dvaput.
 */

export interface PendingPayment {
  sid: string;
  cents: number;
  /** Hash railovog forwarda na Safe; poznat tek u fazi `settled`. */
  txHash: string | null;
}

export function unconfirmedCents(
  pending: readonly PendingPayment[],
  chainTxHashes: readonly string[],
): number {
  const onChain = new Set(chainTxHashes.map((h) => h.toLowerCase()));
  return pending
    .filter((p) => p.txHash === null || !onChain.has(p.txHash.toLowerCase()))
    .reduce((sum, p) => sum + p.cents, 0);
}

/** Dodaj ili ažuriraj po `sid` — rail se čita svake 2 s, ista uplata stiže više puta. */
export function upsertPending(list: readonly PendingPayment[], next: PendingPayment): PendingPayment[] {
  const i = list.findIndex((p) => p.sid === next.sid);
  if (i === -1) return [...list, next];
  const merged = { ...list[i]!, txHash: next.txHash ?? list[i]!.txHash };
  return [...list.slice(0, i), merged, ...list.slice(i + 1)];
}
