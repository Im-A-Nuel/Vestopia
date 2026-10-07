import type { QuestConfig } from "@/types";

export const QUESTS: readonly QuestConfig[] = [
  { id: "first-shares", title: "Buy your first shares", hint: "Open the Village Shop and pick any company." },
  { id: "unlock-district", title: "Unlock a district", hint: "Own at least 100 Coins in one sector." },
  { id: "collateral", title: "Put shares up as collateral", hint: "Deposit shares at the Village Bank." },
  { id: "borrow", title: "Borrow Coins from the bank", hint: "Keep an eye on the weather while you do." },
  { id: "harvest", title: "Collect a harvest", hint: "Wait for Harvest Day, then tap the crops on your lots." },
];
