import { ABIS, ADDRESSES, STOCK_ADDRESSES, getMarketEvent } from "@/config";
import { computeDividends, eventPriceChanges, type PlayerHoldings } from "@/lib/web3";
import type { LatestEvent, MarketEventId, TxReport } from "@/types";
import { sendFrom, serverClient } from "./chain";
import { getAdminKey } from "./env";
import { exclusive } from "./lock";
import { readOracle, sendPrices } from "./oracle";
import { getPlayerList, scanPlayers } from "./players";
import { appendEvent } from "./state";

/** One lock for every admin transaction flow, so a double-click cannot send duplicates. */
const ADMIN_LOCK = "admin-op";

/** Prices older than this are refreshed together with the next event (the contracts revert after 3600s). */
export const OPPORTUNISTIC_KEEPALIVE_SECONDS = 30 * 60;

const LENS_CHUNK = 10;

const PAYOUT_CHUNK = 150;

export interface OpResult {
  status: "success" | "error";
  message: string;
  code?: string;
  txs: TxReport[];
  event?: LatestEvent;
}

const fail = (message: string, code = "unknown", txs: TxReport[] = []): OpResult => ({
  status: "error",
  message,
  code,
  txs,
});

export const runKeepalive = (): Promise<OpResult> =>
  exclusive(ADMIN_LOCK, async () => {
    getAdminKey();
    const { prices } = await readOracle();
    const tx = await sendPrices("Keepalive (resend current prices)", prices);
    return { status: "success", message: "Oracle prices refreshed.", txs: [tx] };
  });

/** For the scheduled route: only spends gas when prices are getting old. */
export const runKeepaliveIfNeeded = (thresholdSeconds = OPPORTUNISTIC_KEEPALIVE_SECONDS): Promise<OpResult> =>
  exclusive(ADMIN_LOCK, async () => {
    getAdminKey();
    const { prices, oldestAgeSeconds } = await readOracle();
    if (oldestAgeSeconds < thresholdSeconds) {
      return { status: "success", message: "Prices are still fresh. Nothing sent.", txs: [] };
    }
    const tx = await sendPrices("Keepalive (resend current prices)", prices);
    return { status: "success", message: "Oracle prices refreshed.", txs: [tx] };
  });

const fetchHoldings = async (players: readonly `0x${string}`[]): Promise<PlayerHoldings[]> => {
  const holdings: PlayerHoldings[] = [];
  for (let index = 0; index < players.length; index += LENS_CHUNK) {
    const chunk = players.slice(index, index + LENS_CHUNK);
    const views = (await serverClient.readContract({
      address: ADDRESSES.lens,
      abi: ABIS.lens,
      functionName: "getPlayers",
      args: [chunk],
    })) as readonly { stocks: readonly { ticker: string; value: bigint }[] }[];
    views.forEach((view, offset) => {
      holdings.push({
        address: chunk[offset],
        stocks: view.stocks.map((stock) => ({ ticker: stock.ticker, value: stock.value })),
      });
    });
  }
  return holdings;
};

const runHarvestDay = async (): Promise<OpResult> => {
  const key = getAdminKey();
  const scan = await scanPlayers();
  const players = await getPlayerList();
  if (players.length === 0) return fail("No players are registered yet, so there is nobody to pay.", "no_players");

  const payouts = computeDividends(await fetchHoldings(players));
  if (payouts.length === 0) {
    return fail("Nobody owns shares of dividend-paying companies yet.", "nothing_to_pay");
  }

  const txs: TxReport[] = [];
  for (const payout of payouts) {
    const token = STOCK_ADDRESSES[payout.ticker];
    for (let index = 0; index < payout.players.length; index += PAYOUT_CHUNK) {
      txs.push(
        await sendFrom(key, {
          label: `Dividends ${payout.ticker}`,
          address: ADDRESSES.market,
          abi: ABIS.market,
          functionName: "creditDividends",
          args: [
            token,
            payout.players.slice(index, index + PAYOUT_CHUNK),
            payout.amounts.slice(index, index + PAYOUT_CHUNK),
          ],
        }),
      );
    }
  }
  const paid = new Set(payouts.flatMap((payout) => payout.players)).size;
  const note = scan.complete
    ? ""
    : " The player scan is still catching up; run Harvest Day again later to include newer players.";
  return {
    status: "success",
    message: `Harvest Day paid ${payouts.length} companies to ${paid} players.${note}`,
    txs,
  };
};

const runPriceEvent = async (eventId: MarketEventId): Promise<OpResult> => {
  getAdminKey();
  const event = getMarketEvent(eventId);
  const { prices, oldestAgeSeconds } = await readOracle();
  const changes = eventPriceChanges(event, prices);
  if (Object.keys(changes).length === 0) return fail("This event does not change any price.", "invalid_amount");
  // Opportunistic keepalive: when prices are old, resend all of them in the same transaction.
  const refreshAll = oldestAgeSeconds >= OPPORTUNISTIC_KEEPALIVE_SECONDS;
  const tx = await sendPrices(event.title, refreshAll ? { ...prices, ...changes } : changes);
  return { status: "success", message: `${event.title} triggered.`, txs: [tx] };
};

/** Applies a preset on-chain (prices) or pays dividends, then records it for the village banner. */
export const runEvent = (eventId: MarketEventId): Promise<OpResult> =>
  exclusive(ADMIN_LOCK, async () => {
    const event = getMarketEvent(eventId);
    const result = event.paysDividends ? await runHarvestDay() : await runPriceEvent(eventId);
    if (result.status === "success") {
      result.event = await appendEvent({ id: event.id, banner: event.banner, triggeredAt: Date.now() });
    }
    return result;
  });
