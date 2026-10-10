import type { NpcId } from "@/types";

export const APP_NAME = "Vestopia";

export const COPY = {
  tagline: "Build your village from your portfolio (simulated).",
  disclaimer:
    "All prices and assets are simulated for educational purposes. They are not real stocks and this is not investment advice.",
  infoFooter:
    "Built on Monad. Designed to work with real tokenized stocks (e.g., Anchored) by swapping the asset and price-feed addresses.",
  welcome: "Welcome, traveler! Here are 1,000 Coins to start your village.",
  shopGreeting: "Fresh shares, straight from the market! What catches your eye?",
  bankGreeting: "Put your shares up as collateral and I'll lend you Coins. Just keep an eye on the sky.",
  bankRisk:
    "If a storm hits (health below 1.0), other traders can repay part of your loan and take some of your collateral.",
  firstHarvest: "Dividends are a share of company profits, paid to people who own the stock.",
  stormWarning: "Storm's coming! Repay some of your loan or add more collateral.",
  harvestDay: "Harvest Day! Your companies paid dividends.",
  unlockedBanner: (district: string) => `New district unlocked: ${district}!`,
  relocked: (district: string) => `The ${district} is resting for now. Own shares again to reopen it.`,
  chainNotice:
    "Connected to Monad Testnet: your village is built from simulated tokens that live in your wallet. Test MON is needed for network fees.",
  demoNotice: "Demo mode: your passkey is simulated and your village is saved in this browser only.",
  explain: {
    borrowLimit: "You can borrow up to 50% of the value of the shares you put in collateral.",
    health:
      "Health compares your collateral to your loan. Above 1.5 the village stays Sunny, between 1.1 and 1.5 it turns Cloudy, and below 1.1 it turns Stormy. Below 1.0 other traders may repay part of your loan and take collateral.",
    dividend:
      "On Harvest Day each company pays a share of the value you own. Simulated rates are faster than real ones.",
  },
  errors: {
    sharesInCollateral: "Those shares are in collateral. Withdraw them at the Village Bank first.",
    passkeyUnsupported: "This browser doesn't support passkeys yet. Try the latest Chrome or Safari.",
    mapFailed: "The village map could not load. You can still use the location buttons below once it is back.",
    generic: "Hmm, that didn't go through. Let's try again.",
    borrowLimit: "Your collateral isn't enough for a loan that big.",
    unsafeWithdraw: "Taking that out would leave your loan too risky.",
    insufficientKoin: "You don't have enough Coins for that.",
    insufficientShares: "You don't own that many shares.",
    invalidAmount: "Enter an amount greater than zero.",
    nothingToHarvest: "There is nothing to harvest here yet.",
    alreadyClaimed: "You already claimed your starter Coins.",
    unauthorized: "That password is not correct.",
    network: "We can't reach Monad Testnet right now. Retrying...",
    noWallet: "No wallet found. Install MetaMask or Rabby, then reload this page.",
    wrongNetwork: "Your wallet is on a different network. Switch to Monad Testnet to continue.",
    wrongAccount: "Your wallet switched to another account. Reconnect to keep playing.",
    cancelled: "No problem, nothing was sent. You cancelled the request in your wallet.",
    insufficientGas: "Your wallet needs a little MON to pay network fees on Monad Testnet.",
    stalePrice: "Market prices are resting. Try again in a moment.",
    busy: "Hold on, your last action is still going through.",
    reverted: "The transaction was rejected by the network. Let's try again.",
    connectFailed: "Could not connect to your wallet. Open it and try again.",
  },
} as const;

export const NPC_NAMES: Record<NpcId, string> = {
  guide: "Elder Oak",
  merchant: "Mira the Merchant",
  banker: "Mr. Ledger the Banker",
};

export const NPC_ROLES: Record<NpcId, string> = {
  guide: "Guide",
  merchant: "Village Shop",
  banker: "Village Bank",
};
