import { formatUnits, maxUint256 } from "viem";

export const KOIN_DECIMALS = 18;
export const PRICE_DECIMALS = 8;

const PRICE_SCALE = 10n ** BigInt(PRICE_DECIMALS);

export const koinToNumber = (value: bigint): number => Number(formatUnits(value, KOIN_DECIMALS));

export const priceToNumber = (value: bigint): number => Number(formatUnits(value, PRICE_DECIMALS));

export const sharesToNumber = (value: bigint): number => Number(formatUnits(value, KOIN_DECIMALS));

export const healthToNumber = (value: bigint): number =>
  value === maxUint256 ? Number.POSITIVE_INFINITY : Number(formatUnits(value, 18));

export const numberToWei = (value: number): bigint => {
  if (!Number.isFinite(value) || value <= 0) return 0n;
  const [whole, fraction = ""] = value.toFixed(18).split(".");
  return BigInt(whole + fraction.padEnd(18, "0").slice(0, 18));
};

/** shares = koinWei * 1e8 / price8, rounded down (the contract's own direction). */
export const koinToShares = (koinWei: bigint, price8: bigint): bigint =>
  price8 > 0n ? (koinWei * PRICE_SCALE) / price8 : 0n;

/** koinWei = sharesWei * price8 / 1e8. */
export const sharesToKoin = (sharesWei: bigint, price8: bigint): bigint => (sharesWei * price8) / PRICE_SCALE;
