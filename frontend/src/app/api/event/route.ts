import { MARKET_EVENTS } from "@/config";
import { runEvent } from "@/lib/server/adminOps";
import { BadRequestError, handleError, isAdmin, json, readJson, unauthorized } from "@/lib/server/http";
import type { MarketEventId } from "@/types";

export async function POST(request: Request): Promise<Response> {
  try {
    if (!(await isAdmin())) return unauthorized();
    const body = await readJson(request);
    const event = MARKET_EVENTS.find((item) => item.id === body.eventId);
    if (!event) throw new BadRequestError("Unknown market event.");
    const result = await runEvent(event.id as MarketEventId);
    return json(result, result.status === "success" ? 200 : 422);
  } catch (error) {
    return handleError(error);
  }
}
