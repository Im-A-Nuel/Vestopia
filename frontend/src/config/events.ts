import type { MarketEventId, MarketEventPreset } from "@/types";

export const MARKET_EVENTS: readonly MarketEventPreset[] = [
  {
    id: "tech_boom",
    sector: "tech",
    title: "Tech boom",
    banner: "Nvidia unveils a new chip! The Tech Office is buzzing.",
    priceMultipliers: { nvda: 1.25, aapl: 1.1 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "gold_crash",
    sector: "commodity",
    title: "Gold crash",
    banner: "Gold prices crash! The Mine goes quiet.",
    priceMultipliers: { nem: 0.6, xom: 0.9 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "drought",
    sector: "agri",
    title: "Drought",
    banner: "A drought hits the Farm.",
    priceMultipliers: { de: 0.85, adm: 0.8 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "holiday_sale",
    sector: "consumer",
    title: "Holiday sale",
    banner: "Holiday shopping season! The Factory is busy.",
    priceMultipliers: { ko: 1.12, pg: 1.08 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "streaming_boom",
    sector: "media",
    title: "Streaming boom",
    banner: "A hit series breaks records! Media Row is glowing.",
    priceMultipliers: { nflx: 1.22, spot: 1.15, dis: 1.08, googl: 1.05 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "holiday_rush",
    sector: "retail",
    title: "Holiday rush",
    banner: "Shoppers flood Main Street for the holidays.",
    priceMultipliers: { amzn: 1.12, nke: 1.1, sbux: 1.08, ebay: 1.07, mcd: 1.06, hd: 1.05 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "retail_slowdown",
    sector: "retail",
    title: "Retail slowdown",
    banner: "Shoppers tighten their wallets. Main Street gets quiet.",
    priceMultipliers: { tsla: 0.82, gme: 0.85, nke: 0.9, sbux: 0.92, amzn: 0.94 },
    resetsPrices: false,
    paysDividends: false,
  },
  {
    id: "reset",
    title: "Reset markets",
    banner: "Markets are back to normal.",
    priceMultipliers: {},
    resetsPrices: true,
    paysDividends: false,
  },
  {
    id: "harvest_day",
    title: "Harvest Day",
    banner: "Harvest Day! Your companies paid dividends.",
    priceMultipliers: {},
    resetsPrices: false,
    paysDividends: true,
  },
];

export const getMarketEvent = (id: MarketEventId): MarketEventPreset => {
  const event = MARKET_EVENTS.find((item) => item.id === id);
  if (!event) {
    throw new Error(`Unknown market event: ${id}`);
  }
  return event;
};
