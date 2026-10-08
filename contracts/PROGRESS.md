# Contracts progress

## 1. Status
- **Stage 2 of 3 complete** (tests, coverage, README, ABIs). Waiting for approval before Stage 3 (testnet deploy).
- Overall: **~85%** (only the Monad testnet deploy and smoke test remain).
- Last update: 2026-10-08 01:56 UTC

## 2. Checklist
- [x] Foundry skeleton, OpenZeppelin v5.1.0 + forge-std as submodules: `foundry.toml`, `.gitmodules`, `.env.example`, `.gitignore`
- [x] Koin, SimStock: `src/Koin.sol`, `src/SimStock.sol`
- [x] IPriceOracle, SimOracle (+ `getPreviousPrice`): `src/interfaces/IPriceOracle.sol`, `src/SimOracle.sol`
- [x] VillageMarket (+ cost basis): `src/VillageMarket.sol`
- [x] VillageBank: `src/VillageBank.sol`
- [x] VillageLens (+ costBasis, previousPrice, dynamic sectors): `src/VillageLens.sol`
- [x] Config from frontend: `config/stocks.json`, `config/prices.json`, `config/gen.mjs`
- [x] Deploy script: `script/Deploy.s.sol` (tested in `test/Deploy.t.sol`)
- [x] Tests: `test/Base.t.sol`, `Tokens.t.sol`, `Market.t.sol`, `Bank.t.sol`, `Lens.t.sol`, `Invariants.t.sol`, `Deploy.t.sol`, `mocks/*`
- [x] Coverage >= 90% on `src/` (100% lines)
- [x] README: `README.md`
- [x] ABI export: `abi/{Koin,SimStock,SimOracle,VillageMarket,VillageBank,VillageLens}.json`
- [x] This file: `PROGRESS.md`
- [ ] Monad testnet deploy (Stage 3, needs approval)
- [ ] On-chain smoke test with `cast` (Stage 3)
- [ ] `deployments/10143.json` (Stage 3)

## 3. Test summary
- `forge test`: **138 passed, 0 failed** (Tokens 16, Market 45, Bank 55, Lens 20, Deploy 1, Invariants 1 suite with 4 invariants).
- Fuzz: buy/sell round trip never creates Koin; borrow never exceeds 50% LTV; withdraw never leaves HF < 1; liquidation never repays more than 50%.
- Invariants (64 runs x depth 100, random buy/sell/deposit/withdraw/borrow/repay/liquidate/harvest/price moves):
  Koin supply = ghost accounting; total debt = borrowed - repaid; Bank stock balance = sum of deposits; stock supply fully held by players + Bank.
- Coverage of `src/` (lines / statements / branches / functions): every file **100% / 100% / 100% / 100%**
  (Koin, SimOracle, SimStock, VillageBank, VillageLens, VillageMarket). The forge "Total" row is lower only because it counts the script and test mocks.
- Gas (from `forge test --gas-report`, avg): buy ~136k, sell ~92k, deposit ~83k, withdraw ~94k, borrow ~131k, repay ~41k,
  liquidate ~119k, claimStarter ~97k, harvestAll ~90k. `getPlayer` ~139k avg with 3 stocks, **~1.15M max with 31 stocks** (read call only).

## 4. Decisions log
- Sector ids follow the frontend order (tech 0, media 1, retail 2, consumer 3, agri 4, commodity 5), not the spec enum. Reason: frontend wins.
- Level 1 means value > 0 (as briefed). The frontend adds a 0.005 Koin dust cutoff; the UI may keep it.
- `sell` / `deposit` / `withdraw` take **shares**, not Koin (spec 5.1). "Max" = exact share balance, so no dust is left.
- `buy`/`sell` round down. `buy` reverts if it would mint 0 shares. `sell` of dust paying 0 Koin succeeds so dust is never stuck.
- `repay` is capped at the debt (so "max" or an overshoot never reverts). Reverts only with no debt or zero amount.
- `withdraw` with debt: fresh prices needed, `debt <= 50%` of remaining collateral and HF >= 1. With **no debt** a stale price is allowed, so the oracle cannot trap collateral. (Deviation from "reject withdraw if stale"; easy to make strict.)
- `liquidate` also needs fresh prices (do not liquidate on a bad price).
- Stale = older than 1 hour. Exactly 1 hour is accepted; 1 hour + 1 second is rejected.
- Views never revert: price <= 0 counts as value 0. Lens still shows the raw oracle price.
- Dividend rate stored as `dividendRateBps` (100 = 1%) because Solidity JSON cannot parse decimals.
- Roles: `AccessControl` for Koin and Market, `Ownable` for the oracle. `SimStock` mint/burn only by its Market (immutable).
- Cost basis (Market): `buy` adds `koinIn`. `sell` removes the sold fraction of **shares bought through the Market** (average cost). Bank deposits/withdrawals do not change it, so it follows the whole position (wallet + collateral) without the Market knowing the Bank. Selling more than the tracked shares (e.g. shares won in a liquidation) clears the basis instead of underflowing. A liquidated user keeps a stale basis for the shares they lost.
- Previous price: `SimOracle.getPreviousPrice(id)`, outside `IPriceOracle`. On the first set it equals the current price. Lens calls it in a try/catch and returns 0 if the oracle lacks it.
- Lens returns extra fields the UI uses: `collateralValue`, `borrowLimit`, `borrowable`, `portfolioValue`, per-stock `collateralValue`, `costBasis`, `previousPrice`.
- Deploy script refuses chain 143 (Monad mainnet). Optional `ADMIN_ADDRESS` becomes oracle owner, `DIVIDEND_ADMIN` and role admin; the deployer renounces admin.
- Lint rules `block-timestamp`, `unused-return`, loop and reentrancy-event style lints are disabled in `foundry.toml` on purpose (see comment there). Build has 0 warnings.

## 5. Spec vs frontend mismatches
- Spec: 8 stocks, 4 sectors. Frontend: 31 stocks, 6 sectors (may grow). Contracts use a dynamic sector array and a roster from config.
- Spec sector enum order differs from the frontend order (see above).
- Spec says Koin/KOIN; frontend UI says "Coins". Token symbol stays `KOIN`.
- Frontend `GameService` sells/deposits/withdraws in Koin; contracts use shares (see handoff).
- Frontend level 1 has a dust cutoff; contract uses exact > 0.
- Frontend `dividends.ts` is mentioned in spec 5.5 but rates now live in `frontend/src/config/stocks.ts` and `contracts/config/stocks.json`.

## 6. Known limitations and risks
- Unaudited, simulated assets, admin controls prices (trusted). No upgradeability.
- Dividends are credited by a trusted server, not computed on-chain.
- `getPlayer` is heavy (~1.15M gas with 31 stocks): use `eth_call`, never in a tx. Cost grows with the roster.
- A stale oracle blocks borrow, liquidation and (with debt) withdraw. The server must keep prices fresh (< 1 hour), e.g. a periodic `setPrices`.
- No bad-debt handling after a deep crash.
- Liquidation seizes one chosen stock; the liquidator must choose a stock the user holds enough of.
- Monad testnet RPC behaviour (rate limits, gas estimates) is untested until Stage 3.
- Working tree note: ~144 files outside `contracts/` show as modified in `git status`, but `git diff --ignore-cr-at-eol` is empty, so these are line-ending (CRLF) differences that existed before this work. Nothing under `frontend/` was edited by the contracts work.
- Early in Stage 2 I mistakenly ran `git config core.filemode core.autocrlf`, which set a bad value in `.git/config`. I fixed it with `git config core.filemode false` (the repo has `symlinks=false`, `ignorecase=true`, so it was most likely `false` before). Please check `.git/config` if filemode matters to you.
- Stage 1 and early Stage 2 commits were made on `feat/contracts` before the "no git writes" rule. Uncommitted after `c08d896`: `test/Invariants.t.sol`, `test/Deploy.t.sol`, `abi/`, `README.md` (rewritten), `PROGRESS.md`, and the `[invariant]` block in `foundry.toml`.

## 7. Open questions for the orchestrator
1. Strict stale rule on `withdraw` even with no debt? (Current: allowed with no debt.)
2. Who keeps prices fresh on testnet (a cron calling `setPrices` at least every hour)?
3. Stage 3: which admin address should own the oracle and `DIVIDEND_ADMIN` (the server key)? Provide `PRIVATE_KEY` and `ADMIN_ADDRESS` by env.
4. Should `harvestAndReplant` (optional in spec) be added? Not built.

## 8. Handoff notes for the frontend agent

### Units
- Koin and every stock token: **18 decimals** (`1 ether` = 1 Koin / 1 share).
- Oracle prices: **8 decimals** USD (`230e8` = $230). Lens `price` and `previousPrice` are `int128` in this format.
- Health factor: 1e18-scaled (`1.5e18` = 1.5). No debt = `2^256-1` (treat as infinity).
- Weather: `0` sunny, `1` cloudy, `2` stormy. Level: `0` empty lot, `1`-`3`.

### Koin <-> shares conversion (frontend must do this)
- Koin to shares: `shares = koinWei * 1e8 / price8` (round down).
- Shares to Koin: `koinWei = sharesWei * price8 / 1e8`.
- `buy(stock, koinIn)` takes **Koin**. `sell`, `deposit`, `withdraw` take **shares**.
- "Max" sell/deposit/withdraw: use Lens `walletBal` (sell, deposit) or `collateralBal` (withdraw) exactly.
- "Max" repay: pass `debt` (or `type(uint256).max`; it is capped). `borrow(koin)` takes Koin.
- Before `deposit` the player must `approve(bank, shares)` on the stock token (2 txs). `buy`, `sell`, `borrow`, `repay`, `harvest` need no approval.

### Functions
```
Market:  claimStarter()
         buy(address stock, uint256 koinIn) -> shares
         sell(address stock, uint256 shares) -> koinOut
         harvest(address stock) -> amount        // reverts NothingToHarvest if 0
         harvestAll() -> total                   // reverts NothingToHarvest if 0
         creditDividends(address stock, address[] players, uint256[] amounts)   // DIVIDEND_ADMIN only
         listStock(address stock)                // admin only
         views: starterClaimed(a), pendingHarvest(a, stock), costBasis(a, stock),
                totalPendingHarvest(a), stockCount(), stockAt(i), isListed(s), sectorCount()
Bank:    deposit(address stock, uint256 shares)  // needs approve
         withdraw(address stock, uint256 shares)
         borrow(uint256 koin)
         repay(uint256 koin) -> repaid
         liquidate(address user, address stock, uint256 repayKoin)
         views: healthFactor(a), collateralValue(a), debtOf(a), collateralOf(a, stock)
Oracle:  setPrices(bytes32[] ids, int128[] prices)  // owner only; id = keccak256(bytes(TICKER))
         getPrice(id) -> (price, updatedAt, session), getPreviousPrice(id)
Lens:    getPlayer(address) -> PlayerView, getPlayers(address[]) -> PlayerView[]
```

### Reading the Lens (one `eth_call` per poll)
`PlayerView`: `koin, debt, healthFactor, weather, starterClaimed, totalPendingHarvest, collateralValue, borrowLimit, borrowable, portfolioValue, stocks[], sectors[]`.
- `stocks[i]` (same order as `Market.stockAt(i)`; match the frontend stock by `ticker.toLowerCase()`):
  `token, ticker, sector, price, previousPrice, walletBal, collateralBal, value, collateralValue, level, pendingHarvest, costBasis`.
  All Koin-valued fields are 18-decimal Koin. `previousPrice` is 0 if the oracle cannot provide it (use `price`).
- `sectors[j]` indexed by sector id (tech 0 ... commodity 5): `value, unlocked`.
- Shares in the UI = `walletBal / 1e18`; `walletShares + collateralShares` = `walletBal + collateralBal`.

### Events to index
- `VillageMarket.StarterClaimed(address indexed player)` - the server builds the player list for Harvest Day from this.
- Also useful: `Bought`, `Sold`, `DividendCredited`, `Harvested` (Market); `Deposited`, `Withdrawn`, `Borrowed`, `Repaid`, `Liquidated` (Bank); `PriceSet` (Oracle); `StockListed` (Market).

### Errors the UI should map (custom errors)
Market: `AlreadyClaimed`, `NotListed`, `InvalidPrice`, `StalePrice`, `ZeroAmount`, `NothingToHarvest`, `LengthMismatch`.
Bank: `ExceedsBorrowLimit` (exceeds_borrow_limit), `UnsafeWithdraw` (unsafe_withdraw), `InsufficientCollateral`, `NoDebt`, `NotLiquidatable`, `RepayTooLarge`, `StalePrice`, `InvalidPrice`, `ZeroAmount`.
Token balance errors are standard ERC-20 `ERC20InsufficientBalance` / `ERC20InsufficientAllowance`.

### Dividend flow (server)
1. Players = addresses from `StarterClaimed` logs. 2. `Lens.getPlayers(players)` for `stocks[i].value`.
3. `amount = value * dividendRateBps / 10000` (rates in `contracts/config/stocks.json`). 4. `Market.creditDividends(stock, players, amounts)` once per stock, skipping zero amounts.
Keep prices fresh: call `setPrices` at least once an hour or borrow/liquidate will revert with `StalePrice`.

### Addresses
After Stage 3 they will be in `contracts/deployments/10143.json` (`koin, oracle, market, bank, lens, stocks{TICKER: address}`).
