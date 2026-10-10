import { GAME_BACKEND } from "@/config";
import { getConnector } from "@/lib/web3";
import type { GameService } from "@/types";
import { publicClient } from "./chainClient";
import { createChainGameService } from "./chainGameService";
import { mockGameService } from "./mockGameService";

export const gameService: GameService =
  GAME_BACKEND === "chain"
    ? createChainGameService({
        publicClient,
        wallet: {
          getAccount: () => getConnector().getAccount(),
          getChainId: () => getConnector().getChainId(),
          getWalletClient: (address) => getConnector().getWalletClient(address),
        },
      })
    : mockGameService;
