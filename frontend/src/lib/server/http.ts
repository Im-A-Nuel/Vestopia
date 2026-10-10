import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSessionToken } from "./adminSession";
import { BusyError } from "./lock";
import { RateLimitError } from "./rateLimit";
import { ServerConfigError } from "./env";

export class BadRequestError extends Error {}

export const json = (body: unknown, status = 200): Response => Response.json(body, { status });

/** Maps known errors to friendly responses. Unknown errors never leak details (they can hold RPC URLs). */
export const handleError = (error: unknown): Response => {
  if (error instanceof BadRequestError) return json({ status: "error", message: error.message }, 400);
  if (error instanceof ServerConfigError)
    return json({ status: "error", code: "not_configured", message: error.message }, 503);
  if (error instanceof BusyError) return json({ status: "error", code: "busy", message: error.message }, 409);
  if (error instanceof RateLimitError)
    return json({ status: "error", code: "rate_limited", message: error.message }, 429);
  const name = error instanceof Error ? error.name : "Error";
  const short =
    error instanceof Error && "shortMessage" in error ? String((error as { shortMessage: unknown }).shortMessage) : "";
  console.error(`[api] ${name}${short ? `: ${short}` : ""}`);
  return json({ status: "error", message: "The chain did not accept that request. Check the server logs." }, 502);
};

export const isAdmin = async (): Promise<boolean> => {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_COOKIE)?.value, process.env.ADMIN_PASSWORD);
};

export const unauthorized = (): Response =>
  json({ status: "error", code: "unauthorized", message: "Admin sign-in required." }, 401);

export const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) throw new BadRequestError("A JSON body is required.");
  return body as Record<string, unknown>;
};
