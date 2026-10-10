# Frontend progress (on-chain GameService)

## 1. Status
- Stage A (read-only chain service): done, approved.
- Stage B (wallet + write actions): done, approved on the code side. Real-wallet run is still to be done by hand.
- Stage C (server routes): done, approved. Verified on the real testnet.
- Stage D (tests, polish, docs): done, waiting for review.
- Default backend is still `mock`. Switching to chain only needs `NEXT_PUBLIC_GAME_BACKEND=chain` (plus the server keys for admin and drip routes). Waiting for the go-ahead to change the default.

## 2. Checklist
### Stage A
- [x] viem; `src/config/chain.ts`, `src/config/abi/*.json`, `src/config/deployment.json` (with `deployBlock` 69134208)
- [x] `src/lib/web3/{units,lens}.ts`, `src/services/chainGameService.ts`, `chainClient.ts`, backend switch in `src/services/index.ts`
- [x] Friendly read errors (`COPY.errors.network`, `gameStore.error`)
### Stage B
- [x] Wallet: `src/lib/web3/wallet.ts` (`WalletConnector`, `injectedConnector`, `getConnector()` = Mera extension point), `src/hooks/useWalletSync.ts`, `sessionStore` (address, chainId, switchNetwork)
- [x] Writes: claimStarter, buy, sell, deposit (approve + deposit), withdraw, borrow, repay, harvest, harvestAll in `chainGameService.ts`
- [x] Errors: `src/lib/web3/errors.ts`; pending phase `src/lib/web3/txStatus.ts`; `WalletBanner`
- [x] UI: Landing ("Connect wallet"), Village (starter retry), Info panel (explorer and contract links)
### Stage C
- [x] `src/lib/server/*` (env, state, lock, rateLimit, chain, oracle, players, drip, adminOps, health, http)
- [x] Routes: `/api/drip`, `/api/players/register`, `/api/event`, `/api/event/latest`, `/api/event/log`, `/api/keepalive`, `/api/cron/keepalive`, `/api/health`
- [x] Admin page chain status, "Keepalive now", last transactions; `src/config/prices.json`
### Stage D
- [x] Admin page for live demos (`AdminScreen.tsx`): oracle age, warning at 30 minutes or older, hint "Keepalive first, then trigger events."
- [x] E2E: full suite in mock mode (`playwright.config.ts` forces `NEXT_PUBLIC_GAME_BACKEND=mock`); new `tests/e2e/wallet.spec.ts` runs against a second chain-mode dev server (port 3101, `NEXT_DIST_DIR=.next-chain` via `next.config.ts`)
- [x] `README.md` rewritten (env table, mock vs chain, one-line switch, MON, refreshing prices, Harvest Day, demo checklist, limitations)
- [x] Review pass (section 8)
- [x] `.gitignore`: `/.data/`, `/.next-chain/`

## 3. Test summary
- `pnpm test`: 10 files, 135 tests passed. `pnpm lint`: clean. `tsc --noEmit`: clean.
- `pnpm exec playwright test` (Chrome): 29 passed (28 mock-mode tests: demo, keyboard, a11y, responsive, mobile; plus 1 chain-mode wallet-missing test).
- `NEXT_PUBLIC_GAME_BACKEND=chain pnpm build`: succeeds; client bundle scanned for private key names and for the actual secret values from `.env.local`: no hits.
- Real testnet (Stage C): health, keepalive, event + double-click lock, Harvest Day, reset, drip to a throwaway address, admin page in a browser.

## 4. Decisions log
- `getMarket()` uses `Lens.getPlayer(address(0))`.
- Default backend stays `mock` until told otherwise.
- `deposit` skips `approve` when the allowance already covers the shares. "Max repay" sends min(debt, Koin balance). Sell/deposit/withdraw clip dust (<= 1e-9 share) to the exact balance.
- Writes check that the wallet account equals the session address and the chain is 10143.
- Lot level comes from Lens; sector order follows the contract.
- Player list on the server: incremental log scan (100-block windows, 8 parallel, retries, cursor only moves on a fully successful batch) plus a register route that verifies `starterClaimed`; stored in memory and `.data/server-state.json`.
- One admin lock for events, keepalive and Harvest Day; sends per key are serialized.
- An event sends only changed prices unless the oldest price is older than 30 minutes (then all 31, acting as keepalive).
- `resetDemo` on chain = reset prices to base; "Reset demo data" is hidden in the player Info panel in chain mode.
- Chain-mode e2e uses a second dev server with its own dist dir so it can run next to the mock one.
- Prettier was run only on files I created or edited from now on; line endings of untouched files were restored to CRLF as before.

## 5. Mismatches found
- Public RPC limits `eth_getLogs` to 100 blocks.
- UI amounts are Koin for sell/deposit/withdraw; the contract uses shares (conversion is in the service).
- Village auto-claims the starter on load; on chain that is a wallet prompt (a retry screen handles a rejection).
- `SimOracle.setPrices` overwrites `previousPrice` with the current price, so a keepalive resets the price-change arrows.
- `next.config.ts` and `tsconfig.json` (target ES2020) were changed outside the original scope for the second dev server and BigInt literals.

## 6. Risks
- Server state is not durable on serverless hosting (memory and local file only); rate limits and locks are per instance.
- Admin and drip share one wallet (about 5.8 MON): a full price write costs about 0.075 MON, a drip 0.1 MON.
- Prices go stale after 1 hour; nothing calls keepalive automatically (no cron configured on purpose). Run keepalive before demos.
- Real-wallet transactions (claim, buy, deposit, borrow, repay, withdraw, sell, harvest) have only been checked with mocked clients and a fake wallet.
- The drip is once per address.

## 7. Open questions
- When should the default backend change to `chain`?
- Should a GitHub Actions schedule call `/api/cron/keepalive` later? (needs `CRON_SECRET` set on the host)
- Is a real store (KV or Postgres) wanted if the app is deployed to a serverless host?

## 8. Review pass (Stage D)
- Secrets: private keys are read only in `src/lib/server/env.ts` and used only by API routes. No client file imports `@/lib/server`. A production build with the chain flag was scanned: no key names and no secret values in `.next/static`.
- Logging: the only `console` call is `console.error` in `src/lib/server/http.ts`, which prints the error name and viem `shortMessage` for unknown API errors (no keys, no RPC URLs, no addresses).
- Env: only `NEXT_PUBLIC_GAME_BACKEND` and `NEXT_PUBLIC_MONAD_RPC_URL` are public. `.env.local`, `.data/` and `.next-chain/` are gitignored.
- Leftovers: no TODO, FIXME or debugger. Temporary check scripts were deleted. `generateAddress` and `isPasskeySupported` are still used by the mock login.
- Server state file holds only public wallet addresses and timestamps.

## 9. Privy login (email, Google, wallet, embedded wallet)
### Status
Code done and unit tested; the login modal opens and closes correctly in a real browser with the real App ID. A full real login (email code, Google, embedded wallet, drip, claim, buy) is NOT verified yet: needs a human.

### Checklist
- [x] `@privy-io/react-auth@3.48.1` (only new dependency). `pnpm-workspace.yaml`: native build scripts of optional deps (`@reown/appkit`, `bufferutil`, `keccak`, `utf-8-validate`) set to `false`; pnpm added `minimumReleaseAgeExclude` for the three Privy packages.
- [x] Config: `PRIVY_APP_ID`, `PRIVY_ENABLED` in `src/config/chain.ts`; `.env.example` placeholder.
- [x] `src/components/providers/{PrivyRoot,PrivyShell,PrivyBridge,index}`; `layout.tsx` mounts `<PrivyRoot />` (no wrapping of the app, so pages still render on the server).
- [x] `src/lib/web3/{privyBridge,privyConnector,connectors}.ts`; `wallet.ts` (optional `disconnect`); session wiring in `sessionStore.ts` (persisted `connectorId`); `useWalletSync.ts` keeps the session when Privy is still loading; `services/index.ts` picks the connector lazily.
- [x] Landing: "Sign in" + "Use browser wallet" when Privy is enabled; text "Getting a little MON for gas..." for the first drip.
- [x] Tests: `tests/unit/connectors.test.ts`, `tests/e2e/browser-wallet.spec.ts`; Playwright servers force `NEXT_PUBLIC_PRIVY_APP_ID=""`.

### Decisions
- Privy is mounted next to the app, not around it, via `next/dynamic` with `ssr: false` inside a client component (Next docs: `ssr: false` only works in Client Components). No hydration difference: `PRIVY_ENABLED` is a build-time constant and the session is read only after mount.
- `loginMethods` checked against the installed types: `'email' | 'google' | 'wallet'` are valid values.
- `showWalletUIs: false` is set in `embeddedWallets`. The type docs say it overrides the embedded wallet UI for all actions, but only the per-call `sendTransaction` option is documented explicitly; whether it applies to `eth_sendTransaction` through the EIP-1193 provider is unproven (see "Not verified").
- `getWalletClient` stays synchronous: the Privy provider is fetched lazily on each request.
- If Privy cannot load within 10 s, reading the account throws (the session is kept) instead of reporting "no wallet".
- Closing the Privy modal shows the existing "cancelled" message. Other SDK errors show a generic "Could not connect" message; no SDK internals are logged or shown.
- Running a chain-mode dev server with a custom `NEXT_DIST_DIR` makes Next rewrite `tsconfig.json` (formatting plus `.next-*/types` includes). I restored the file; it can happen again after `pnpm test:e2e`.

### Not verified (needs a human)
- Email code login, Google login, external wallet via Privy, embedded wallet creation, first drip for an embedded wallet, claim and buy through the embedded wallet, sign out, reload restore.
- Whether embedded-wallet transactions are really silent (`showWalletUIs: false` on the EIP-1193 path).
- `http://localhost:3000` is the only origin allowed in the dashboard: other ports are blocked by Privy (seen on port 3300).

### Risks
- First load of Privy adds a large lazy chunk (chain mode with App ID only).
- Privy session persistence is handled by Privy itself; if it expires the village sends the player back to the landing page.
