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

## Deployed on Monad testnet (chain id 10143)

Deployed 2026-10-08 with `script/Deploy.s.sol`. Admin / oracle owner / `DIVIDEND_ADMIN`: `0x0a18fCB673099443CB8bA44AE7198529275b7c1f`.
Full list (also every stock): `deployments/10143.json`. RPC: set `MONAD_TESTNET_RPC_URL` (default public RPC `https://testnet-rpc.monad.xyz`).
Explorer links use `https://testnet.monadexplorer.com` (address pages).

| Contract | Address | Explorer |
|---|---|---|
| Koin | `0x3C2374f069dcEf39e41A252C506D4c87602197d0` | [link](https://testnet.monadexplorer.com/address/0x3C2374f069dcEf39e41A252C506D4c87602197d0) |
| SimOracle | `0xDAbf117371FCed6Ea2dfa53E36ee4a628cd2Cb69` | [link](https://testnet.monadexplorer.com/address/0xDAbf117371FCed6Ea2dfa53E36ee4a628cd2Cb69) |
| VillageMarket | `0xC23E914D96cd03f0a4C0E8C1D4e2F495786AC72e` | [link](https://testnet.monadexplorer.com/address/0xC23E914D96cd03f0a4C0E8C1D4e2F495786AC72e) |
| VillageBank | `0xddDD38381569556756F44176d0Dca3F9aA383787` | [link](https://testnet.monadexplorer.com/address/0xddDD38381569556756F44176d0Dca3F9aA383787) |
| VillageLens | `0x2fDcE5C6C07C9b29857041F3d4126720BB4aab34` | [link](https://testnet.monadexplorer.com/address/0x2fDcE5C6C07C9b29857041F3d4126720BB4aab34) |

<details><summary>31 stock tokens</summary>

| Token | Address | Explorer |
|---|---|---|
| sAAPL | `0xB8b1c4e68B9a1322d7D00cb2c4bF0DC87f377F1a` | [link](https://testnet.monadexplorer.com/address/0xB8b1c4e68B9a1322d7D00cb2c4bF0DC87f377F1a) |
| sADM | `0xcaFd05bb7b28f1488E1884249E4E8D1C435172Ab` | [link](https://testnet.monadexplorer.com/address/0xcaFd05bb7b28f1488E1884249E4E8D1C435172Ab) |
| sAMD | `0x95176bde7D0253A85f86A030dD7064818e9Fc03e` | [link](https://testnet.monadexplorer.com/address/0x95176bde7D0253A85f86A030dD7064818e9Fc03e) |
| sAMZN | `0x0D214dc7186a6A61b1Dd9C4B07589848b0Fbf381` | [link](https://testnet.monadexplorer.com/address/0x0D214dc7186a6A61b1Dd9C4B07589848b0Fbf381) |
| sAVGO | `0x32a7BBD063255e5768386b84fd07D2F95EC6cB59` | [link](https://testnet.monadexplorer.com/address/0x32a7BBD063255e5768386b84fd07D2F95EC6cB59) |
| sCAT | `0xDE958d9bE7Ae1896e8a248A18a46a10D0950eE9e` | [link](https://testnet.monadexplorer.com/address/0xDE958d9bE7Ae1896e8a248A18a46a10D0950eE9e) |
| sCOST | `0x363771B2462a73f2C4Dba597eF5888aE1a4B246e` | [link](https://testnet.monadexplorer.com/address/0x363771B2462a73f2C4Dba597eF5888aE1a4B246e) |
| sCSCO | `0x9429FbB044bcCA1B25A7F2fb2A7eC8c1468e9daB` | [link](https://testnet.monadexplorer.com/address/0x9429FbB044bcCA1B25A7F2fb2A7eC8c1468e9daB) |
| sDE | `0x57ccd5c7c8d2aaAe34e9bD7082FB3977a9933b1f` | [link](https://testnet.monadexplorer.com/address/0x57ccd5c7c8d2aaAe34e9bD7082FB3977a9933b1f) |
| sDIS | `0xffeAe0851f18Ab4ed388dd6aE549F6B62bB765f7` | [link](https://testnet.monadexplorer.com/address/0xffeAe0851f18Ab4ed388dd6aE549F6B62bB765f7) |
| sEBAY | `0xb03f214a59116e957Ee0355b9509930C5279F199` | [link](https://testnet.monadexplorer.com/address/0xb03f214a59116e957Ee0355b9509930C5279F199) |
| sGME | `0xFa14443d3F34907Af6332A3650484b9e89B35604` | [link](https://testnet.monadexplorer.com/address/0xFa14443d3F34907Af6332A3650484b9e89B35604) |
| sGOOGL | `0x4734bb7728D851E9c44A7d9Ec53c1E8590A5ffdB` | [link](https://testnet.monadexplorer.com/address/0x4734bb7728D851E9c44A7d9Ec53c1E8590A5ffdB) |
| sHD | `0xf5A40c76C488189f29D9b164A9825632436df269` | [link](https://testnet.monadexplorer.com/address/0xf5A40c76C488189f29D9b164A9825632436df269) |
| sINTC | `0xc0Abf23480256caCe8211d4B8EE4335d7c47FD7B` | [link](https://testnet.monadexplorer.com/address/0xc0Abf23480256caCe8211d4B8EE4335d7c47FD7B) |
| sKO | `0xaD5e86ea63Fa31BF03Fe1c1B743384989a252792` | [link](https://testnet.monadexplorer.com/address/0xaD5e86ea63Fa31BF03Fe1c1B743384989a252792) |
| sMCD | `0x8e87bD8a4B4eF71affEba0492a8D189a60cECdD1` | [link](https://testnet.monadexplorer.com/address/0x8e87bD8a4B4eF71affEba0492a8D189a60cECdD1) |
| sMETA | `0xf8228Bd04FEBbe0567F05eE21437C97A933dD59c` | [link](https://testnet.monadexplorer.com/address/0xf8228Bd04FEBbe0567F05eE21437C97A933dD59c) |
| sMSFT | `0x5ebAD03e7A8De8362741eD1365891006d06bB75B` | [link](https://testnet.monadexplorer.com/address/0x5ebAD03e7A8De8362741eD1365891006d06bB75B) |
| sNEM | `0x92c979287846C0CCe25eAebA3a8D545C8A70bf0A` | [link](https://testnet.monadexplorer.com/address/0x92c979287846C0CCe25eAebA3a8D545C8A70bf0A) |
| sNFLX | `0x1Fc250Ce231BF30d5112F416519626FD01FDA5f0` | [link](https://testnet.monadexplorer.com/address/0x1Fc250Ce231BF30d5112F416519626FD01FDA5f0) |
| sNKE | `0x0Af8bd7AF500705e556E8e0A472DA93B6eF235D1` | [link](https://testnet.monadexplorer.com/address/0x0Af8bd7AF500705e556E8e0A472DA93B6eF235D1) |
| sNVDA | `0x658861b01C8c4e55fC2Ad2166Ed9FD5AD5395c05` | [link](https://testnet.monadexplorer.com/address/0x658861b01C8c4e55fC2Ad2166Ed9FD5AD5395c05) |
| sPG | `0x3Be49a26Aa1eC93bE42E2471F45812450c59e2C1` | [link](https://testnet.monadexplorer.com/address/0x3Be49a26Aa1eC93bE42E2471F45812450c59e2C1) |
| sRDDT | `0xF7c0DF7EA4d4d5Fd9AE4d6750738c5D4c7199f7b` | [link](https://testnet.monadexplorer.com/address/0xF7c0DF7EA4d4d5Fd9AE4d6750738c5D4c7199f7b) |
| sSBUX | `0x0C46cD8E760e6A421e5AA2Ba12f53aA9d5fd7C5B` | [link](https://testnet.monadexplorer.com/address/0x0C46cD8E760e6A421e5AA2Ba12f53aA9d5fd7C5B) |
| sSPOT | `0x2959c86c9E546eED739d51F711aAC5D58694318E` | [link](https://testnet.monadexplorer.com/address/0x2959c86c9E546eED739d51F711aAC5D58694318E) |
| sTSLA | `0x4Eb528876294ec54431e8766e49D645a7e256Dc9` | [link](https://testnet.monadexplorer.com/address/0x4Eb528876294ec54431e8766e49D645a7e256Dc9) |
| sVZ | `0x7F35097Dff09b9b8a0A48ef0D9a48cC051B717EB` | [link](https://testnet.monadexplorer.com/address/0x7F35097Dff09b9b8a0A48ef0D9a48cC051B717EB) |
| sWMT | `0x1F222B070176b09Bb38cE2E55De971124e689247` | [link](https://testnet.monadexplorer.com/address/0x1F222B070176b09Bb38cE2E55De971124e689247) |
| sXOM | `0x759B4519d48Ff868AD89871982bAFAD5Ece849b7` | [link](https://testnet.monadexplorer.com/address/0x759B4519d48Ff868AD89871982bAFAD5Ece849b7) |

</details>

## Refreshing oracle prices

Prices older than 1 hour make `borrow`, `liquidate` and `withdraw` (with debt) revert. Keep them fresh with
`config/set-prices.mjs` (needs Foundry's `cast`, Node, and `contracts/.env` with the oracle owner key):

```bash
node config/set-prices.mjs keepalive                  # re-send current prices (no change, refreshes the timestamp)
node config/set-prices.mjs event NVDA:25 AAPL:10      # event preset: percent change from current on-chain price
node config/set-prices.mjs event NEM:-40 XOM:-10
node config/set-prices.mjs reset                      # back to config/prices.json (base prices)
node config/set-prices.mjs reset --dry                # any command with --dry only prints the prices
```

One `setPrices` tx for all 31 stocks costs about 745k gas; a single-stock event about 54k. Run `keepalive` at least every hour
(for example from cron or the server). `SimOracle.getPreviousPrice` keeps the price before each update, which the UI uses for price arrows.

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
