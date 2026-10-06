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
  errors: {
    passkeyUnsupported: "This browser doesn't support passkeys yet. Try the latest Chrome or Safari.",
    generic: "Hmm, that didn't go through. Let's try again.",
    borrowLimit: "Your collateral isn't enough for a loan that big.",
    unsafeWithdraw: "Taking that out would leave your loan too risky.",
    insufficientKoin: "You don't have enough Coins for that.",
    insufficientShares: "You don't own that many shares.",
    invalidAmount: "Enter an amount greater than zero.",
    nothingToHarvest: "There is nothing to harvest here yet.",
    alreadyClaimed: "You already claimed your starter Coins.",
    unauthorized: "That password is not correct.",
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
