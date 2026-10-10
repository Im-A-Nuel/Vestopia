import type { Hex } from "viem";

/** Thrown when a server secret or setting is missing. The message is safe to show; it never contains a value. */
export class ServerConfigError extends Error {}

const readKey = (name: string): Hex => {
  const raw = process.env[name]?.trim();
  if (!raw) throw new ServerConfigError(`${name} is not configured on the server.`);
  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new ServerConfigError(`${name} is not a valid private key.`);
  return key as Hex;
};

export const getAdminKey = (): Hex => readKey("ADMIN_PRIVATE_KEY");

export const getDripKey = (): Hex => readKey("DRIP_PRIVATE_KEY");

export const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
