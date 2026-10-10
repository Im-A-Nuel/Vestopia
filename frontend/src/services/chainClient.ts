import { createPublicClient, http } from "viem";
import { MONAD_RPC_URL, monadTestnet } from "@/config";

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http(MONAD_RPC_URL) });
