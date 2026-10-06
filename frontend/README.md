# Vestopia

Vestopia is a simulated investing game for beginners. Players build a pixel-art village from a portfolio of simulated stocks: sectors open districts, companies become lots, dividends become harvests, and loans show up as weather.

All prices and assets are simulated for educational purposes. They are not real stocks and this is not investment advice.

## Stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Phaser for the village map
- Zustand for state and data fetching
- Sonner for toasts

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Set `ADMIN_PASSWORD` in `.env.local`. The admin panel lives at `/admin`. A correct password sets an HttpOnly, SameSite=Strict session cookie that lasts one hour, so a reload does not lock you out.

## Scripts

- `pnpm dev` starts the development server
- `pnpm run build` creates the production build
- `pnpm lint` runs ESLint
- `pnpm format` formats `src` and `tests` with Prettier
- `pnpm test` runs the Vitest unit tests for game rules and the mock service
- `pnpm test:e2e` runs the Playwright suite (demo script, keyboard, mobile, axe accessibility). It needs Google Chrome and reuses a running `pnpm dev` server

## Project structure

- `src/app` routes: `(landing)`, `(village)/village`, `(admin)/admin`, `api/admin/verify`
- `src/components/pages/(scope)` page components, each scope with its own `index.ts`
- `src/config` stocks, sectors, rules, events, copy and asset paths
- `src/lib` pure game logic: levels, loans, weather, player view, change diffing
- `src/services` the game service. `mockGameService` runs the full rules in the browser
- `src/stores` Zustand stores for session, game, events and UI
- `src/types` shared types

## Data layer

The frontend talks to a `GameService` interface. The current implementation is a browser mock that follows the game rules (1,000 Coins to start, 100 Coins to open a district, 50% max loan to value, weather from health factor, Harvest Day dividends). To connect real contracts, add an implementation of `GameService` and export it from `src/services/index.ts`.

## Assets

Placeholder SVG art lives in `public/assets`. Real art can replace it with the same file names. Change `ASSET_EXTENSION` in `src/config/assets.ts` when switching to PNG.
