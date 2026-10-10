# Vestopia

Vestopia is a simulated investing game for beginners. Players build a pixel-art village from a portfolio of simulated stocks: sectors open districts, companies become lots, dividends become harvests, and loans show up as weather.

All prices and assets are simulated for educational purposes. They are not real stocks and this is not investment advice.

## Stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Phaser for the village map
- Zustand for state and data fetching
- viem for Monad Testnet (chain id 10143)
- Privy (`@privy-io/react-auth` 3.48.1) for email, Google and wallet login with embedded wallets (chain mode only, optional)
- Sonner for toasts

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

The admin panel lives at `/admin`. A correct `ADMIN_PASSWORD` sets an HttpOnly, SameSite=Strict session cookie that lasts one hour, so a reload does not lock you out.

## Backend modes: mock or chain

The game talks to one `GameService` interface. Two implementations exist and an env variable picks one:

| `NEXT_PUBLIC_GAME_BACKEND` | What happens |
| --- | --- |
| `mock` (default) | Everything runs in the browser and is saved in this browser only. Login is a simulated passkey. Good for demos without a wallet and for the e2e tests. |
| `chain` | Reads and writes the contracts deployed on Monad Testnet. Login is an injected wallet (MetaMask, Rabby, ...). |

> **Switch to chain mode:** set `NEXT_PUBLIC_GAME_BACKEND=chain` in `.env.local` and restart `pnpm dev`. Nothing else is required (addresses and ABIs are bundled in `src/config`). For chain mode the server routes also need `ADMIN_PRIVATE_KEY` and `DRIP_PRIVATE_KEY`.

`NEXT_PUBLIC_*` values are inlined at build time, so restart the dev server (or rebuild) after changing them.

## Environment variables

Everything goes in `frontend/.env.local` (gitignored). `.env.example` lists the same names with empty or safe placeholder values.

| Name | Where it is used | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | server | Password for `/admin` and for every admin route. |
| `NEXT_PUBLIC_GAME_BACKEND` | browser | `mock` (default) or `chain`. |
| `NEXT_PUBLIC_PRIVY_APP_ID` | browser | Optional. Privy App ID (public by design). Empty or missing = browser-wallet login only. There is no Privy secret anywhere in this app. |
| `NEXT_PUBLIC_MONAD_RPC_URL` | browser and server | Default `https://testnet-rpc.monad.xyz`. The public RPC limits `eth_getLogs` to 100 blocks. |
| `ADMIN_PRIVATE_KEY` | server only | Testnet wallet that owns the oracle and the dividend role. Needs MON for gas. |
| `DRIP_PRIVATE_KEY` | server only | Testnet wallet that sends gas MON to new players. May hold the same key as the admin wallet today. |
| `CRON_SECRET` | server only | Optional. Bearer token for `GET /api/cron/keepalive`. |
| `DRIP_AMOUNT_MON`, `DRIP_MIN_BALANCE_MON`, `DRIP_DAILY_CAP_MON`, `DRIP_PER_IP_PER_HOUR` | server | Optional faucet tuning. Defaults: 0.1, 0.05, 2, 5. |

Never put a private key in a variable that starts with `NEXT_PUBLIC_`. A missing key makes the related route return a clear 503 message; it never crashes the app. Only Monad Testnet (10143) is supported; the server refuses any other chain.

## Login: Privy and browser wallet

In chain mode the landing page offers two ways in:

- **Sign in** (only when `NEXT_PUBLIC_PRIVY_APP_ID` is set): the Privy modal with email, Google or "Continue with a wallet". Players without a wallet get an embedded wallet automatically and play without installing anything.
- **Use browser wallet** (always available as the fallback): the injected wallet (MetaMask, Rabby, ...). Without an App ID the page shows only the original "Connect wallet" button.

Mock mode never loads Privy, even if an App ID is present. If the App ID is missing or empty, the app silently uses the browser-wallet login.

How it is wired: `PrivyRoot` (mounted in `layout.tsx`, client only, lazy loaded) renders `PrivyProvider` plus `PrivyBridge`, which pushes the Privy state into `src/lib/web3/privyBridge.ts`. The `privy` `WalletConnector` (`privyConnector.ts`) reads from it, and `connectors.ts` picks the connector by the id saved in the session. The game service, stores and actions do not know which login was used.

Privy dashboard settings (dashboard.privy.io, your app):

- Login methods: email, Google and wallet enabled.
- Allowed origins: every origin you run the app on, for example `http://localhost:3000`. A different port or host is blocked (the browser shows a "Framing auth.privy.io violates the Content Security Policy" error and the embedded wallet cannot load).
- Embedded wallets: create automatically for users without a wallet.
- The app sets `embeddedWallets.showWalletUIs: false` so embedded wallets sign silently. If confirmation modals still appear, turn on "Disable confirmation modals" under Configuration > Authentication > Advanced.
- Monad Testnet is defined in code (chain id 10143, default and only supported chain); nothing to add in the dashboard.

Embedded wallets start with 0 MON. The first starter claim calls `/api/drip` automatically (status text "Getting a little MON for gas...").

## How to get testnet MON

- Players: nothing to do. On the first starter claim, the game calls `POST /api/drip`, which sends 0.1 MON once per address (skipped if the wallet already has at least 0.05 MON).
- If the faucet is empty or the daily cap is reached, send test MON to the wallet by hand (any Monad Testnet faucet, or from the admin wallet).
- The admin and drip wallets need MON too. Check `/admin` (Chain status) or `GET /api/health`.

## Admin panel (chain mode)

`/admin` shows the oracle price age, the latest event, registered players, the admin and faucet balances, a "Keepalive now" button and the last transactions (gas used and explorer links).

Safe order for a live demo: **Keepalive first, then trigger events.**

- Contracts reject prices older than 1 hour (`StalePrice`): borrow, liquidate and withdraw-with-debt stop working. The panel warns when prices are older than 30 minutes.
- Every event sends only the prices it changes. When the oldest price is older than 30 minutes, the event resends all 31 prices, which refreshes them as a side effect.
- "Reset markets" (and "Reset prices to base") puts every price back to `src/config/prices.json`. Player balances live on-chain and cannot be erased, so there is no full "wipe demo data" in chain mode.

### How to refresh prices

- From the UI: `/admin` then "Keepalive now".
- From a terminal (admin session cookie needed):
  ```bash
  curl -c jar -X POST localhost:3000/api/admin/verify -H 'content-type: application/json' -d '{"password":"<ADMIN_PASSWORD>"}'
  curl -b jar -X POST localhost:3000/api/keepalive
  ```
- Scheduled: `GET /api/cron/keepalive` with header `Authorization: Bearer <CRON_SECRET>`. It only sends a transaction when prices are older than 30 minutes. No scheduler is configured in this repo (no `vercel.json` cron). Run keepalive by hand before demos, or call this route from a GitHub Actions schedule later.
- The contracts folder also has `node config/set-prices.mjs keepalive` (needs Foundry).

## How Harvest Day works

1. The server keeps a list of players: an incremental scan of `StarterClaimed` logs (100-block windows, 8 in parallel, starting at the deploy block 69134208) plus `POST /api/players/register`, which the game calls after a successful claim (the server checks `starterClaimed` on-chain first).
2. `Lens.getPlayers(players)` returns what each player owns per stock.
3. For each stock: `amount = value * dividendRateBps / 10000`. Zero amounts and stocks without payees are skipped.
4. `Market.creditDividends(stock, players, amounts)` is sent once per stock. Players then see "Harvest All" and collect the Coins with `harvest` / `harvestAll`.

A single in-flight lock covers events, keepalive and Harvest Day, so a double click cannot send duplicate transactions.

## Demo checklist (chain mode)

1. `.env.local` has `NEXT_PUBLIC_GAME_BACKEND=chain`, `ADMIN_PASSWORD`, `ADMIN_PRIVATE_KEY`, `DRIP_PRIVATE_KEY`.
2. Open `/admin` and read Chain status:
   - Oracle price age is under 30 minutes. If not, press "Keepalive now".
   - Admin wallet has enough MON (a full price write costs about 0.075 MON).
   - Gas faucet wallet has enough MON for new players (0.1 MON each).
   - Players registered matches who you expect (new claims register themselves; a scan fills in older ones when Harvest Day runs).
3. Connect a wallet at `/`, claim the starter, buy, deposit, borrow.
4. Trigger an event, then Harvest Day, and collect with "Harvest All".

## Known limitations

- Server state (player list, drip history, event log) lives in memory and in `.data/server-state.json`. A serverless host (for example Vercel) has no durable disk and runs several instances, so use a real store (KV or Postgres) there. Rate limits and locks are per instance as well.
- Keepalive rewrites `previousPrice` with the current price (oracle behavior), so the price-change arrows in the village reset to 0 after a keepalive.
- The admin and drip keys may be the same wallet, so both spend from one balance.
- The drip is once per address. A wallet that spends its MON later has to be topped up by hand.
- Privy needs the exact origin (scheme, host and port) allowed in its dashboard. The `pnpm test:e2e` chain server runs without an App ID on purpose.
- The Mera passkey login is not built. `WalletConnector` in `src/lib/web3/wallet.ts` is the extension point.
- The public RPC limits `eth_getLogs` to 100 blocks per request, so a long gap since the last scan means many requests.
- Wallet transactions were checked with mocked clients in unit tests and with a fake wallet in the browser; a full real-wallet run is done by hand.

## Scripts

- `pnpm dev` starts the development server
- `pnpm run build` creates the production build
- `pnpm lint` runs ESLint
- `pnpm format` formats `src` and `tests` with Prettier
- `pnpm test` runs the Vitest unit tests (rules, mock service, Lens mapping, conversions, errors, dividends, server logic). No network is used
- `pnpm assets` regenerates the pixel-art PNGs in `public/assets` and the app icons in `public/icons`
- `pnpm test:e2e` runs the Playwright suite (demo script, keyboard, mobile, axe accessibility, plus the wallet-missing check). It needs Google Chrome. The config starts two dev servers: the main one on port 3100 forced to the mock backend, and a chain-mode one on port 3101 (separate `.next-chain` folder) used only by `wallet.spec.ts`. Running servers on those ports are reused

## Project structure

- `src/app` routes: `(landing)`, `(village)/village`, `(admin)/admin`, `api/*` (admin verify, drip, event, keepalive, cron, health, players)
- `src/components/pages/(scope)` page components, each scope with its own `index.ts`
- `src/config` stocks, sectors, rules, events, copy, asset paths, chain config, `abi/*.json`, `deployment.json`, `prices.json`
- `src/lib` pure game logic (`game`), Monad helpers (`web3`: units, Lens mapping, errors, wallet, prices, dividends) and server-only code (`server`, used by API routes only)
- `src/services` the game service: `mockGameService` (browser) and `chainGameService` (viem)
- `src/stores` Zustand stores for session, game, events, admin and UI
- `src/types` shared types

## Assets

All art is generated by code in `scripts/assets` (a small pixel canvas, palettes and one module per sprite group) and written as PNG files to `public/assets` with the sizes from the spec. Run `pnpm assets` after editing a sprite.

To use art made with an image generator instead, save PNG files with the same names and sizes over the generated ones. Nothing in the app needs to change.

## Mobile and install

- Layout adapts from 320px phones to tablets, in portrait and landscape, with safe-area insets for notches
- The map supports drag to pan, pinch or wheel to zoom, and on-screen zoom buttons
- `src/app/manifest.ts` and the icons make the app installable as a home-screen app
