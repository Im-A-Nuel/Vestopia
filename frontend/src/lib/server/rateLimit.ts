export class RateLimitError extends Error {}

interface Globals {
  __vestopiaHits?: Map<string, number[]>;
}

const globals = globalThis as Globals;

/** Sliding-window limiter kept in memory. Returns false when `key` already used `limit` hits in `windowMs`. */
export const takeHit = (key: string, limit: number, windowMs: number, now: number = Date.now()): boolean => {
  const hits = (globals.__vestopiaHits ??= new Map<string, number[]>());
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
};

export const clientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
};
