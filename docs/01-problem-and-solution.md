# 1. Problem and Solution

## The problem

### 1. Many people want to invest but do not understand the basics
The S&P Global FinLit Survey found that only about one third of adults worldwide are financially literate, measured by understanding interest, compound interest, inflation and risk diversification. In Indonesia, the OJK survey (SNLIK 2025) reports national financial literacy of 66.46%, but **capital market literacy is only 17.78%** and capital market inclusion is **1.34%**. People are comfortable with banks, but not with stocks.

### 2. Learning with real money is scary
To understand risk, people have to feel it: prices fall, the portfolio shrinks, debt becomes dangerous. When that first experience happens with real money, the loss is real. Many beginners give up, or follow the crowd without understanding.

### 3. Financial concepts are abstract
Words like "dividend", "collateral", "loan-to-value" (LTV) and "liquidation" are hard to picture. Courses and articles explain the theory, but it is hard to keep young people motivated.

### 4. Existing simulators are dull and disconnected from Web3
Typical stock simulators are tables and charts. Real DeFi lending products are powerful but complex and risky for beginners.

## The solution: Vestopia

Vestopia turns investing into a **village-building game**. Every financial concept has a visual match that is easy to guess:

| Finance world | In the game |
|---|---|
| Sector (tech, media, retail, consumer, agriculture, commodities) | A **district** on the village map |
| A company's stock | A **lot** (building) in a district |
| Portfolio value | Districts unlock and the village levels up |
| Dividends | A **harvest** (Harvest Day) |
| Loan backed by stocks | **Weather**: sunny, cloudy or stormy |
| Liquidation (collateral sold by force) | A storm that gets too severe |
| Market event (prices rise or fall) | A banner and changes in the village |

Players learn by doing: buying stocks, watching districts unlock, borrowing, and feeling how a loan makes the village vulnerable to storms when prices drop.

### How to play (short flow)

1. **Sign in** with email, Google or a wallet. Players without a wallet get an embedded wallet through Privy automatically.
2. **Claim 1,000 Coins** as starting capital (once per wallet). The server faucet automatically sends a little MON for network fees.
3. **Buy simulated stocks** with Coins. A district unlocks when the sector value reaches 100 Coins.
4. **Level up** the village at portfolio values of 250 and 1,000 Coins.
5. **Deposit stocks as collateral** and **borrow Coins** (up to 50% of collateral value). Watch the weather:
   - Sunny: safe.
   - Cloudy: health factor below 1.5.
   - Stormy: health factor below 1.1. Be careful.
6. **Harvest dividends** when the admin runs Harvest Day.
7. **Face market events** (for example Tech boom or Gold crash) and see the effect on the village.

### Why a blockchain (Monad)?

- **Real in-game ownership.** Coins and simulated stocks are on-chain tokens in the player's wallet. Anyone can inspect them in the explorer.
- **Transparent rules.** Loan rules, the LTV limit and liquidation are written in smart contracts, not on a server that could be changed quietly.
- **A safe DeFi experience.** Players practice borrowing and protecting collateral, but with tokens that have no monetary value.
- **Fast and cheap.** Monad is EVM-compatible and built for high speed, which suits a game that needs many small transactions.

### What makes Vestopia different

- **Risk is shown, not hidden.** Village weather makes the danger of debt visible. This matters because research from the French regulator (AMF) found that gamification elements such as badges and confetti can push people toward riskier choices (see the Research document).
- **Easy to start.** Sign in with email or Google, with no wallet knowledge required.
- **Two modes.** A mock mode (in the browser, no wallet) for a quick try, and a chain mode for the full Web3 experience.

## Current limitations (stated plainly)

- Prices use a **simulated oracle** filled in by an admin. Prices count as stale after 1 hour, so a "keepalive" is needed or transactions are rejected.
- The admin and the faucet currently use one wallet.
- The contracts are unaudited and not verified on the explorer.
- Monad Testnet only. No real money.
