import { requestDrip } from "@/lib/server/drip";
import { handleError, json, readJson } from "@/lib/server/http";
import { clientIp } from "@/lib/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const outcome = await requestDrip(String(body.address ?? ""), clientIp(request));
    if (outcome.status === "denied") return json(outcome, outcome.code === "already_dripped" ? 409 : 429);
    return json(outcome);
  } catch (error) {
    return handleError(error);
  }
}
