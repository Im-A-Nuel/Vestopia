// Oracle price helper for the SimOracle (testnet). Uses the `cast` CLI; needs Foundry and contracts/.env.
//
//   node config/set-prices.mjs keepalive             re-send CURRENT on-chain prices (refreshes updatedAt, no price change)
//   node config/set-prices.mjs reset                 set every price back to config/prices.json
//   node config/set-prices.mjs event NVDA:25 AAPL:10 change tickers by percent from the CURRENT on-chain price
//   add --dry to any command to only print what would be sent
//
// Env (contracts/.env): MONAD_TESTNET_RPC_URL, PRIVATE_KEY (oracle owner). Optional CHAIN_ID (default 10143).
// Run `keepalive` at least every hour: prices older than 1 hour make borrow / liquidate / withdraw-with-debt revert.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

for (const line of read(".env").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { MONAD_TESTNET_RPC_URL: rpc, PRIVATE_KEY: key } = process.env;
const chainId = Number(process.env.CHAIN_ID ?? 10143);
if (chainId === 143) throw new Error("Mainnet is not supported");
if (!rpc || !key) throw new Error("Set MONAD_TESTNET_RPC_URL and PRIVATE_KEY in contracts/.env");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const [cmd, ...rest] = args.filter((a) => a !== "--dry");
const deployment = JSON.parse(read(`deployments/${chainId}.json`));
const base = JSON.parse(read("config/prices.json"));
const tickers = Object.keys(deployment.stocks).filter((t) => !t.startsWith("_"));

const cast = (a) => execFileSync("cast", a, { encoding: "utf8" }).trim();
const currentPrice = (ticker) => {
  const out = cast(["call", deployment.oracle, "getPrice(bytes32)(int128,uint64,uint8)", cast(["keccak", ticker]), "--rpc-url", rpc]);
  return BigInt(out.split("\n")[0].split(" ")[0]);
};

let next = {}; // ticker -> price (8 decimals)
if (cmd === "keepalive") {
  for (const t of tickers) next[t] = currentPrice(t);
} else if (cmd === "reset") {
  for (const t of tickers) next[t] = BigInt(base[t]);
} else if (cmd === "event" && rest.length > 0) {
  for (const spec of rest) {
    const [t, pct] = spec.split(":");
    if (!tickers.includes(t) || Number.isNaN(Number(pct))) throw new Error(`Bad spec "${spec}" (use TICKER:percent, e.g. NVDA:25 or NEM:-40)`);
    const factor = BigInt(Math.round((100 + Number(pct)) * 100)); // basis points of current price
    if (factor <= 0n) throw new Error(`${spec}: cannot drop 100% or more`);
    next[t] = (currentPrice(t) * factor) / 10000n;
  }
} else {
  console.log("Usage: node config/set-prices.mjs <keepalive | reset | event TICKER:pct ...> [--dry]");
  process.exit(1);
}

const entries = Object.entries(next);
for (const [t, p] of entries) console.log(`${t.padEnd(6)} $${(Number(p) / 1e8).toFixed(2)}`);
if (dry) {
  console.log(`(dry run) ${entries.length} prices not sent`);
  process.exit(0);
}
const ids = `[${entries.map(([t]) => cast(["keccak", t])).join(",")}]`;
const prices = `[${entries.map(([, p]) => p.toString()).join(",")}]`;
const out = cast(["send", deployment.oracle, "setPrices(bytes32[],int128[])", ids, prices, "--rpc-url", rpc, "--private-key", key, "--json"]);
const tx = JSON.parse(out);
console.log(`setPrices ${entries.length} prices: tx ${tx.transactionHash} status ${tx.status} gas ${parseInt(tx.gasUsed, 16)}`);
