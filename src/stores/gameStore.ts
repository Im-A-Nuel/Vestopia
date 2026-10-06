import { toast } from "sonner";
import { create } from "zustand";
import { COPY } from "@/config";
import { gameService } from "@/services";
import type { ActionResult, ActivityEntry, Amount, PlayerView, StockId } from "@/types";
import { useSessionStore } from "./sessionStore";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

type PlayerAction = (address: string) => Promise<ActionResult>;

interface GameState {
  player: PlayerView | null;
  status: LoadStatus;
  busy: boolean;
  activity: ActivityEntry[];
  refresh: () => Promise<void>;
  reset: () => void;
  claimStarter: () => Promise<ActionResult>;
  buy: (stockId: StockId, koinAmount: number) => Promise<ActionResult>;
  sell: (stockId: StockId, koinAmount: Amount) => Promise<ActionResult>;
  deposit: (stockId: StockId, koinAmount: Amount) => Promise<ActionResult>;
  withdraw: (stockId: StockId, koinAmount: Amount) => Promise<ActionResult>;
  borrow: (koinAmount: number) => Promise<ActionResult>;
  repay: (koinAmount: Amount) => Promise<ActionResult>;
  harvest: (stockId: StockId) => Promise<ActionResult>;
  harvestAll: () => Promise<ActionResult>;
}

const MAX_ACTIVITY = 8;

let activitySequence = 0;

const unauthorized: ActionResult = { status: "error", code: "unauthorized", message: COPY.errors.generic };

export const useGameStore = create<GameState>()((set, get) => {
  const refresh = async (): Promise<void> => {
    const address = useSessionStore.getState().address;
    if (!address) return;
    try {
      const player = await gameService.getPlayer(address);
      set({ player, status: "ready" });
    } catch {
      set({ status: get().player ? "ready" : "error" });
    }
  };

  const recordActivity = (message: string): void => {
    activitySequence += 1;
    const entry: ActivityEntry = { id: activitySequence, message, at: Date.now() };
    set({ activity: [entry, ...get().activity].slice(0, MAX_ACTIVITY) });
  };

  const run = async (action: PlayerAction, options: { notifySuccess: boolean }): Promise<ActionResult> => {
    const address = useSessionStore.getState().address;
    if (!address) return unauthorized;
    set({ busy: true });
    try {
      const result = await action(address);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        recordActivity(result.message);
        if (options.notifySuccess) toast.success(result.message);
      }
      await refresh();
      return result;
    } catch {
      toast.error(COPY.errors.generic);
      return { status: "error", code: "unknown", message: COPY.errors.generic };
    } finally {
      set({ busy: false });
    }
  };

  return {
    player: null,
    status: "idle",
    busy: false,
    activity: [],
    refresh: async () => {
      if (get().status === "idle") set({ status: "loading" });
      await refresh();
    },
    reset: () => set({ player: null, status: "idle", busy: false, activity: [] }),
    claimStarter: () => run((address) => gameService.claimStarter(address), { notifySuccess: false }),
    buy: (stockId, koinAmount) => run((address) => gameService.buy(address, stockId, koinAmount), { notifySuccess: true }),
    sell: (stockId, koinAmount) => run((address) => gameService.sell(address, stockId, koinAmount), { notifySuccess: true }),
    deposit: (stockId, koinAmount) =>
      run((address) => gameService.deposit(address, stockId, koinAmount), { notifySuccess: true }),
    withdraw: (stockId, koinAmount) =>
      run((address) => gameService.withdraw(address, stockId, koinAmount), { notifySuccess: true }),
    borrow: (koinAmount) => run((address) => gameService.borrow(address, koinAmount), { notifySuccess: true }),
    repay: (koinAmount) => run((address) => gameService.repay(address, koinAmount), { notifySuccess: true }),
    harvest: (stockId) => run((address) => gameService.harvest(address, stockId), { notifySuccess: true }),
    harvestAll: () => run((address) => gameService.harvestAll(address), { notifySuccess: true }),
  };
});
