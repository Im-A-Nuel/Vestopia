# Vestopia contracts

Foundry project for the Vestopia game (Monad **testnet**, chain id 10143). All assets are **simulated**.
Players claim Koin, buy simulated stocks, lock them as collateral in the Village Bank, borrow Koin, and harvest dividends.

> Unaudited hackathon code. Simulated assets only. Do not use with real money. No mainnet.

## Architecture

```
SimOracle ──price──▶ VillageMarket ──mint/burn──▶ Koin ◀──mint/burn── VillageBank
                         │  ▲ mint/burn                                   │
                         ▼  │                                             │ holds
                      SimStock (one per stock) ◀─────── deposit/withdraw ─┘
VillageLens ── read-only view of all of the above for one player
```

| Contract | What it does |
|---|---|
| `Koin` | ERC-20 (18 dec). Only `MINTER_ROLE` (Market, Bank) mints or burns. |
| `SimStock` | ERC-20 (18 dec), one deploy per stock. `sector()`, `ticker()`, `priceId() = keccak256(ticker)`. Only its Market mints/burns. |
| `IPriceOracle` | Anchored-compatible: `getPrice(bytes32) -> (int128 price, uint64 updatedAt, Session)`. Price has 8 decimals. |
| `SimOracle` | Owner sets prices. Extra (not in the interface): `getPreviousPrice(bytes32)`. |
| `VillageMarket` | Starter Koin, buy/sell at oracle price, dividend credit + harvest, cost basis, stock listing. |
| `VillageBank` | Deposit/withdraw collateral, borrow/repay Koin (0% interest), liquidation, health factor. |
| `VillageLens` | One-call read of everything the UI needs (`getPlayer`, `getPlayers`). |

## Roles

| Role / owner | Holder after deploy | Powers |
|---|---|---|
| `Koin.DEFAULT_ADMIN_ROLE` | `ADMIN_ADDRESS` (or deployer) | Grant/revoke roles |
| `Koin.MINTER_ROLE` | Market, Bank | Mint and burn Koin |
| `VillageMarket.DEFAULT_ADMIN_ROLE` | `ADMIN_ADDRESS` (or deployer) | `listStock`, grant roles |
| `VillageMarket.DIVIDEND_ADMIN` | `ADMIN_ADDRESS` (or deployer) | `creditDividends` |
| `SimOracle` owner | `ADMIN_ADDRESS` (or deployer) | `setPrices` |
| `SimStock` market | Market (immutable) | `mint` / `burn` |

## Rules (match `frontend/src/config/rules.ts`)

| Rule | Value |
|---|---|
| Starter | 1,000 Koin, once per address |
| Owned value | (wallet + Bank collateral) x oracle price |
| Stock level | 0 empty, 1 if value > 0, 2 if >= 250, 3 if >= 1,000 Koin |
| Sector unlocked | sector value >= 100 Koin |
| Max LTV | 50% of collateral value |
| Liquidation threshold | 80% |
| Health factor | `collateral x 0.8 / debt`, 1e18-scaled, no debt = `type(uint256).max` |
| Weather | HF >= 1.5 or no debt: 0 sunny. 1.1 <= HF < 1.5: 1 cloudy. HF < 1.1: 2 stormy |
| Liquidation | Only if HF < 1. Repay up to 50% of debt. Liquidator gets collateral worth repay x 1.05 |
| Stale price | Older than 1 hour is rejected (exactly 1 hour is fine) |
| Interest | 0% |

Level, unlock and weather are computed on every read and never stored.

Notes on edge cases:
- `buy` and `sell` round down. A buy/sell round trip never creates Koin.
- `sell` of dust that pays 0 Koin succeeds (so dust is never stuck). `buy` that would mint 0 shares reverts.
- `repay` caps at the debt, so "max" never reverts.
- `withdraw` with debt needs fresh prices, `debt <= 50%` of remaining collateral and HF >= 1. With no debt it does not need a price.
- Views (`healthFactor`, `collateralValue`, Lens) never revert on a bad price; they count it as 0.
- Cost basis (`Market.costBasis`): average cost of shares bought through the Market. Selling reduces it in proportion. Bank deposits/withdrawals do not change it.

## Dividends are not computed on-chain

A server holding `DIVIDEND_ADMIN` reads players (`StarterClaimed` events), reads values via `VillageLens.getPlayers`,
multiplies by the rate in `config/stocks.json` (`dividendRateBps`), and calls `creditDividends(stock, players, amounts)`.
Players then call `harvest(stock)` or `harvestAll()`. This avoids tracking every stock move, including stock held in the Bank.

## Setup, test, deploy

```bash
git submodule update --init --recursive   # forge-std + OpenZeppelin
forge build
forge test                                 # 138 tests, incl. fuzz + invariants
forge coverage --no-match-path test/Deploy.t.sol --report summary
```

Deploy to Monad testnet (needs a funded key):

```bash
cp .env.example .env     # fill MONAD_TESTNET_RPC_URL, PRIVATE_KEY, optional ADMIN_ADDRESS
set -a; source .env; set +a
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```

The script deploys everything, wires roles, lists every stock from `config/stocks.json`, sets prices from
`config/prices.json`, and writes `deployments/<chainId>.json`. It refuses to run on chain 143 (mainnet).

ABIs are in `abi/*.json` (regenerate: `forge inspect <Contract> abi --json > abi/<Contract>.json`).

## How to add a stock

1. Add a row to `frontend/src/config/stocks.ts` (and a sector to `sectors.ts` if new).
2. Run `node config/gen.mjs` to regenerate `config/stocks.json` and `config/prices.json`.
3. For a fresh deploy, run the Deploy script. For an existing deploy, with the admin key:
   - `new SimStock("Simulated X", "sX", "X", sectorId, market)`
   - `market.listStock(stock)`
   - `oracle.setPrices([keccak256("X")], [price8dec])`

Sector ids are the order in `sectors.ts` (tech 0, media 1, retail 2, consumer 3, agri 4, commodity 5).
`Market.sectorCount` grows automatically.

## Swapping in real tokenized stocks later

Point `VillageMarket`/`VillageBank`/`VillageLens` at an Anchored-compatible oracle (`IPriceOracle`). Lens already works
when the oracle has no `getPreviousPrice` (it returns 0). Note `SimStock` mint/burn is the Market's trading mechanism;
real tokens would need a different Market (buy/sell against a liquidity source).

## Known limitations

- **Unaudited.** Hackathon MVP, no upgradeability.
- **Simulated assets only.** Prices are set by an admin key; the admin can move prices at will.
- **Dividends are server-side** and trusted: the server decides who gets what.
- **Lens gas:** `getPlayer` costs about 1.1M gas with 31 stocks (fine for `eth_call`, do not call it in a transaction).
  `getPlayers` scales linearly with players.
- `borrow`/`withdraw`/`liquidate` loop over listed stocks the user holds as collateral.
- Liquidation needs fresh prices, so a stale oracle blocks liquidations as well as new borrows.
- Liquidation seizes from one chosen stock; if it holds too little, the liquidator picks a smaller amount or another stock.
- No bad-debt handling: a deep crash can leave debt larger than collateral.
- Cost basis is only tracked for shares bought through the Market. Shares won in a liquidation have no basis.
