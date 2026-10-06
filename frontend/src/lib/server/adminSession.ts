import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "vestopia_admin";

export const ADMIN_SESSION_SECONDS = 60 * 60;

const sign = (secret: string): string => createHmac("sha256", secret).update("vestopia-admin-session").digest("hex");

export const createSessionToken = (secret: string): string => sign(secret);

export const isValidSessionToken = (token: string | undefined, secret: string | undefined): boolean => {
  if (!token || !secret) return false;
  const given = Buffer.from(token);
  const expected = Buffer.from(sign(secret));
  return given.length === expected.length && timingSafeEqual(given, expected);
};
