const coinFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const priceFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const shareFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

export const formatCoins = (value: number): string => coinFormatter.format(value);

export const formatPrice = (value: number): string => `$${priceFormatter.format(value)}`;

export const formatShares = (value: number): string => shareFormatter.format(value);

export const formatPercent = (value: number): string => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
};

export const formatSigned = (value: number): string => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${coinFormatter.format(Math.abs(value))}`;
};

export const formatHealth = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(2) : "No debt";

export const shortenAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
