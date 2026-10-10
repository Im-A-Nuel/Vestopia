# 5. Smart Contracts

All contracts are deployed on **Monad Testnet** (chain id **10143**). This is a test network, so every token is worth nothing in real money.

- Public RPC: `https://testnet-rpc.monad.xyz`
- Explorer: https://testnet.monadexplorer.com
- Source code: the [`contracts/`](../contracts) folder (Foundry, Solidity 0.8.28, OpenZeppelin v5.1.0)
- Address source: [`contracts/deployments/10143.json`](../contracts/deployments/10143.json)

> Note: the contracts are not verified on the explorer and have not been audited. The explorer links below follow the common address URL pattern. If a page does not open, search the address in the explorer directly.

## Core contracts

| Contract | Address | Explorer | Purpose |
|---|---|---|---|
| Koin (ERC-20, 18 decimals) | `0x3C2374f069dcEf39e41A252C506D4c87602197d0` | [view](https://testnet.monadexplorer.com/address/0x3C2374f069dcEf39e41A252C506D4c87602197d0) | The game currency. Used to buy stocks and to borrow. |
| SimOracle | `0xDAbf117371FCed6Ea2dfa53E36ee4a628cd2Cb69` | [view](https://testnet.monadexplorer.com/address/0xDAbf117371FCed6Ea2dfa53E36ee4a628cd2Cb69) | Stores simulated stock prices (USD, 8 decimals). Filled by the admin. Prices go stale after 1 hour. |
| VillageMarket | `0xC23E914D96cd03f0a4C0E8C1D4e2F495786AC72e` | [view](https://testnet.monadexplorer.com/address/0xC23E914D96cd03f0a4C0E8C1D4e2F495786AC72e) | Claim 1,000 starter Coins, buy, sell and harvest dividends. |
| VillageBank | `0xddDD38381569556756F44176d0Dca3F9aA383787` | [view](https://testnet.monadexplorer.com/address/0xddDD38381569556756F44176d0Dca3F9aA383787) | Deposit stocks as collateral, withdraw, borrow, repay and liquidate. |
| VillageLens | `0x2fDcE5C6C07C9b29857041F3d4126720BB4aab34` | [view](https://testnet.monadexplorer.com/address/0x2fDcE5C6C07C9b29857041F3d4126720BB4aab34) | Read helper: fetches all player data and prices in a single call. |

## Admin wallet

| Role | Address | Explorer |
|---|---|---|
| Admin (oracle owner and dividend role) | `0x0a18fCB673099443CB8bA44AE7198529275b7c1f` | [view](https://testnet.monadexplorer.com/address/0x0a18fCB673099443CB8bA44AE7198529275b7c1f) |

This wallet also acts as the gas faucet in the current version. Planned: split them (see [Roadmap](04-roadmap.md)).

## Simulated stock tokens (31 stocks)

Each stock is its own ERC-20 token (`SimStock`). These are **not real stocks**. Tickers are only names for education.

| Ticker | Address | Explorer |
|---|---|---|
| AAPL | `0xB8b1c4e68B9a1322d7D00cb2c4bF0DC87f377F1a` | [view](https://testnet.monadexplorer.com/address/0xB8b1c4e68B9a1322d7D00cb2c4bF0DC87f377F1a) |
| ADM | `0xcaFd05bb7b28f1488E1884249E4E8D1C435172Ab` | [view](https://testnet.monadexplorer.com/address/0xcaFd05bb7b28f1488E1884249E4E8D1C435172Ab) |
| AMD | `0x95176bde7D0253A85f86A030dD7064818e9Fc03e` | [view](https://testnet.monadexplorer.com/address/0x95176bde7D0253A85f86A030dD7064818e9Fc03e) |
| AMZN | `0x0D214dc7186a6A61b1Dd9C4B07589848b0Fbf381` | [view](https://testnet.monadexplorer.com/address/0x0D214dc7186a6A61b1Dd9C4B07589848b0Fbf381) |
| AVGO | `0x32a7BBD063255e5768386b84fd07D2F95EC6cB59` | [view](https://testnet.monadexplorer.com/address/0x32a7BBD063255e5768386b84fd07D2F95EC6cB59) |
| CAT | `0xDE958d9bE7Ae1896e8a248A18a46a10D0950eE9e` | [view](https://testnet.monadexplorer.com/address/0xDE958d9bE7Ae1896e8a248A18a46a10D0950eE9e) |
| COST | `0x363771B2462a73f2C4Dba597eF5888aE1a4B246e` | [view](https://testnet.monadexplorer.com/address/0x363771B2462a73f2C4Dba597eF5888aE1a4B246e) |
| CSCO | `0x9429FbB044bcCA1B25A7F2fb2A7eC8c1468e9daB` | [view](https://testnet.monadexplorer.com/address/0x9429FbB044bcCA1B25A7F2fb2A7eC8c1468e9daB) |
| DE | `0x57ccd5c7c8d2aaAe34e9bD7082FB3977a9933b1f` | [view](https://testnet.monadexplorer.com/address/0x57ccd5c7c8d2aaAe34e9bD7082FB3977a9933b1f) |
| DIS | `0xffeAe0851f18Ab4ed388dd6aE549F6B62bB765f7` | [view](https://testnet.monadexplorer.com/address/0xffeAe0851f18Ab4ed388dd6aE549F6B62bB765f7) |
| EBAY | `0xb03f214a59116e957Ee0355b9509930C5279F199` | [view](https://testnet.monadexplorer.com/address/0xb03f214a59116e957Ee0355b9509930C5279F199) |
| GME | `0xFa14443d3F34907Af6332A3650484b9e89B35604` | [view](https://testnet.monadexplorer.com/address/0xFa14443d3F34907Af6332A3650484b9e89B35604) |
| GOOGL | `0x4734bb7728D851E9c44A7d9Ec53c1E8590A5ffdB` | [view](https://testnet.monadexplorer.com/address/0x4734bb7728D851E9c44A7d9Ec53c1E8590A5ffdB) |
| HD | `0xf5A40c76C488189f29D9b164A9825632436df269` | [view](https://testnet.monadexplorer.com/address/0xf5A40c76C488189f29D9b164A9825632436df269) |
| INTC | `0xc0Abf23480256caCe8211d4B8EE4335d7c47FD7B` | [view](https://testnet.monadexplorer.com/address/0xc0Abf23480256caCe8211d4B8EE4335d7c47FD7B) |
| KO | `0xaD5e86ea63Fa31BF03Fe1c1B743384989a252792` | [view](https://testnet.monadexplorer.com/address/0xaD5e86ea63Fa31BF03Fe1c1B743384989a252792) |
| MCD | `0x8e87bD8a4B4eF71affEba0492a8D189a60cECdD1` | [view](https://testnet.monadexplorer.com/address/0x8e87bD8a4B4eF71affEba0492a8D189a60cECdD1) |
| META | `0xf8228Bd04FEBbe0567F05eE21437C97A933dD59c` | [view](https://testnet.monadexplorer.com/address/0xf8228Bd04FEBbe0567F05eE21437C97A933dD59c) |
| MSFT | `0x5ebAD03e7A8De8362741eD1365891006d06bB75B` | [view](https://testnet.monadexplorer.com/address/0x5ebAD03e7A8De8362741eD1365891006d06bB75B) |
| NEM | `0x92c979287846C0CCe25eAebA3a8D545C8A70bf0A` | [view](https://testnet.monadexplorer.com/address/0x92c979287846C0CCe25eAebA3a8D545C8A70bf0A) |
| NFLX | `0x1Fc250Ce231BF30d5112F416519626FD01FDA5f0` | [view](https://testnet.monadexplorer.com/address/0x1Fc250Ce231BF30d5112F416519626FD01FDA5f0) |
| NKE | `0x0Af8bd7AF500705e556E8e0A472DA93B6eF235D1` | [view](https://testnet.monadexplorer.com/address/0x0Af8bd7AF500705e556E8e0A472DA93B6eF235D1) |
| NVDA | `0x658861b01C8c4e55fC2Ad2166Ed9FD5AD5395c05` | [view](https://testnet.monadexplorer.com/address/0x658861b01C8c4e55fC2Ad2166Ed9FD5AD5395c05) |
| PG | `0x3Be49a26Aa1eC93bE42E2471F45812450c59e2C1` | [view](https://testnet.monadexplorer.com/address/0x3Be49a26Aa1eC93bE42E2471F45812450c59e2C1) |
| RDDT | `0xF7c0DF7EA4d4d5Fd9AE4d6750738c5D4c7199f7b` | [view](https://testnet.monadexplorer.com/address/0xF7c0DF7EA4d4d5Fd9AE4d6750738c5D4c7199f7b) |
| SBUX | `0x0C46cD8E760e6A421e5AA2Ba12f53aA9d5fd7C5B` | [view](https://testnet.monadexplorer.com/address/0x0C46cD8E760e6A421e5AA2Ba12f53aA9d5fd7C5B) |
| SPOT | `0x2959c86c9E546eED739d51F711aAC5D58694318E` | [view](https://testnet.monadexplorer.com/address/0x2959c86c9E546eED739d51F711aAC5D58694318E) |
| TSLA | `0x4Eb528876294ec54431e8766e49D645a7e256Dc9` | [view](https://testnet.monadexplorer.com/address/0x4Eb528876294ec54431e8766e49D645a7e256Dc9) |
| VZ | `0x7F35097Dff09b9b8a0A48ef0D9a48cC051B717EB` | [view](https://testnet.monadexplorer.com/address/0x7F35097Dff09b9b8a0A48ef0D9a48cC051B717EB) |
| WMT | `0x1F222B070176b09Bb38cE2E55De971124e689247` | [view](https://testnet.monadexplorer.com/address/0x1F222B070176b09Bb38cE2E55De971124e689247) |
| XOM | `0x759B4519d48Ff868AD89871982bAFAD5Ece849b7` | [view](https://testnet.monadexplorer.com/address/0x759B4519d48Ff868AD89871982bAFAD5Ece849b7) |

## How it works in short

1. **Claim starter capital.** A player calls `claimStarter` on VillageMarket and receives 1,000 Coins, once per wallet.
2. **Buy.** `buy(stock, koinAmount)` swaps Coins for stock tokens at the oracle price.
3. **Sell.** `sell(stock, shareAmount)` swaps stock back into Coins.
4. **Collateral and loans.** `deposit` puts stocks in VillageBank as collateral. `borrow` borrows Coins up to 50% of collateral value (MAX_LTV 0.5).
5. **Weather.** The app computes the health factor from contract data: cloudy below 1.5, stormy below 1.1.
6. **Liquidation.** If a position becomes too risky (threshold 0.8), anyone can call `liquidate`.
7. **Dividends.** The admin runs Harvest Day (`creditDividends`), then players collect with `harvest`.

## Key rules

| Rule | Value |
|---|---|
| Starting capital | 1,000 Coins |
| Unlock a district | sector value of 100 Coins |
| Levels 2 and 3 | portfolio value of 250 and 1,000 Coins |
| Maximum loan (LTV) | 50% of collateral value |
| Liquidation threshold | 80% |
| Maximum price age | 1 hour |

Game-side rules are in [`frontend/src/config/rules.ts`](../frontend/src/config/rules.ts). On-chain rules are in the `contracts/src` folder.

## Sectors

Sector order in the contracts: tech (0), media (1), retail (2), consumer (3), agriculture (4), commodities (5).

## ABIs

The ABIs of all contracts are in [`contracts/abi/`](../contracts/abi) with a copy in `frontend/src/config/abi`.

## Security and limitations

- Testnet only. Do not send assets of value.
- Centralized admin: one wallet controls prices and dividends.
- The contracts have not been audited by an independent party.
- Existing tests: unit, fuzz and invariant tests in the `contracts/test` folder.
