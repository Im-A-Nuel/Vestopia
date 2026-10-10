import { handleError, json, readJson } from "@/lib/server/http";
import { clientIp, takeHit } from "@/lib/server/rateLimit";
import { registerPlayer } from "@/lib/server/players";

export async function POST(request: Request): Promise<Response> {
  try {
    if (!takeHit(`register:${clientIp(request)}`, 30, 60 * 60 * 1000)) {
      return json({ status: "error", code: "rate_limited", message: "Too many requests. Try again later." }, 429);
    }
    const body = await readJson(request);
    const saved = await registerPlayer(String(body.address ?? ""));
    if (!saved) return json({ status: "error", message: "That wallet has not claimed its starter Coins." }, 404);
    return json({ status: "success" });
  } catch (error) {
    return handleError(error);
  }
}
