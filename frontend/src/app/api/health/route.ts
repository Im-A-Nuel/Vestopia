import { getHealth } from "@/lib/server/health";
import { handleError, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return json(await getHealth());
  } catch (error) {
    return handleError(error);
  }
}
