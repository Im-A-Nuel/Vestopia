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
