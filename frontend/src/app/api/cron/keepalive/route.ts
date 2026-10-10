import { timingSafeEqual } from "node:crypto";
import { runKeepaliveIfNeeded } from "@/lib/server/adminOps";
import { handleError, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const matches = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** Scheduled keepalive (for example Vercel Cron). Needs `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request): Promise<Response> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return json({ status: "error", message: "CRON_SECRET is not configured on the server." }, 503);
    const header = request.headers.get("authorization") ?? "";
    if (!matches(header, `Bearer ${secret}`)) return json({ status: "error", message: "Not allowed." }, 401);
    return json(await runKeepaliveIfNeeded());
  } catch (error) {
    return handleError(error);
  }
}
