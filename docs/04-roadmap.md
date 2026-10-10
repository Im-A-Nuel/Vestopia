# 4. Roadmap

This roadmap is a **plan**, not a promise. Order and timing may change based on user testing and team resources.

*Last updated: 10 October 2026.*

## Done (as of 10 Oct 2026)

**Smart contracts (Monad Testnet, chain id 10143)**
- Koin token (ERC-20, the in-game currency).
- 31 simulated stock tokens across 6 sectors.
- A simulated price oracle (`SimOracle`).
- Market (`VillageMarket`): claim starter capital, buy, sell, harvest dividends.
- Bank (`VillageBank`): deposit collateral, withdraw, borrow, repay, liquidate.
- Lens (`VillageLens`): reads all player data in a single call.
- Testing: unit, fuzz and invariant tests.

**Application**
- Pixel-art village game (Next.js, Phaser) with two modes: mock and chain.
- Connected to the contracts through viem.
- Login with email, Google or a wallet (Privy), plus a MetaMask or Rabby fallback.
- Automatic embedded wallet for players without a wallet.
- Automatic gas faucet for new players.
- Admin panel: price keepalive, market events, Harvest Day, chain status.
- 149 unit tests and 30 end-to-end tests pass.

## Phase 1: Finishing the hackathon (until 13 Oct 2026)

- [ ] Full test with a real wallet and Privy login (email and Google).
- [ ] Change the admin password from the default value.
- [ ] Decide on hosting and add the origin to the Privy dashboard.
- [ ] Run the price keepalive before the demo.
- [ ] Record a demo video of about 2.5 minutes and write the project summary.
- [ ] Complete the project profile on the hackathon platform.
- [ ] Check the official rules at hackathon.monad.xyz (testnet or mainnet).

## Phase 2: Stabilization (1 to 4 weeks after submission)

Goal: the game keeps running by itself without manual babysitting.

- [ ] **Automatic keepalive** (cron) so prices never go stale.
- [ ] Separate the admin wallet from the faucet wallet.
- [ ] Store server state somewhere durable (not a local file).
- [ ] Verify the contracts on the Monad explorer.
- [ ] An in-game starter tutorial (3 to 5 steps) and an explanation of the weather.
- [ ] Indonesian text in the interface.
- [ ] Fix feedback from the first test players.

## Phase 3: Learning and retention (1 to 3 months)

Goal: make players come back and actually learn.

- [ ] A short quiz before and after playing to measure understanding.
- [ ] Staged learning missions: diversification, loan risk, dividends.
- [ ] Leaderboard and weekly challenges (with cosmetic rewards, not money).
- [ ] More varied market events with an explanation of "why prices move".
- [ ] A **classroom mode** panel for teachers: create a session, trigger events, see student results.
- [ ] Clear risk warnings, and avoid heavy celebration effects when a player takes high risk.

## Phase 4: More realistic data (3 to 6 months)

Goal: make prices feel like the real world, still with no real money.

- [ ] Prices follow real market data periodically (snapshot or oracle feed), clearly labeled as simulation.
- [ ] More stocks and sectors, including Indonesian stocks.
- [ ] Consider a third-party on-chain oracle if one is available on Monad.
- [ ] Market events based on simplified real news.
- [ ] Mobile layout optimization.

## Phase 5: Scale and partnerships (6 to 12 months)

Goal: reach communities and institutions.

- [ ] Partnerships with universities, schools and financial literacy communities.
- [ ] Educator plans with student progress reports.
- [ ] Independent security audit of the contracts.
- [ ] Social mode: friends' villages, visits and group competitions.
- [ ] A grant or ecosystem support plan.
- [ ] Launch on Monad mainnet **only if** assets stay free of monetary value or after an audit and legal review.

## Ideas to study (not scheduled)

- Automatic harvest and replant (`harvestAndReplant`), which we deliberately skipped for the hackathon version.
- Real passkey login (mock mode currently uses a simulated passkey).
- Personalized AI tips that explain a player's decisions in simple language.
- Other language versions for Southeast Asia.

## Risks and how we manage them

| Risk | Impact | Mitigation |
|---|---|---|
| Stale prices, transactions rejected | Confused players | Automatic keepalive, clear error messages |
| Public testnet RPC slow or limited | The game feels broken | Backup RPC, retries, a paid RPC provider |
| Faucet MON runs out | New players cannot claim | Daily cap, balance monitoring, regular top-ups |
| A single admin wallet | Single point of failure | Separate roles, later use a multisig |
| Gamification pushes excessive risk | Education goal undermined | Show consequences, test with real players |
| Seen as an investment product | Compliance problems | Simulation labels everywhere, no monetary value |
| Contracts unaudited | Bugs could hurt on mainnet | Stay on testnet until audited |

## Measures of success

| Time | Measure |
|---|---|
| Hackathon | The demo runs smoothly from login to loan and weather |
| 1 month | Dozens of test players complete one full round |
| 3 months | Hundreds of players, some returning more than once |
| 6 months | Thousands of players, quiz scores rise after playing, at least one campus or community partner |
