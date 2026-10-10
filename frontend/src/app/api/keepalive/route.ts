import { runKeepalive } from "@/lib/server/adminOps";
import { handleError, isAdmin, json, unauthorized } from "@/lib/server/http";

export async function POST(): Promise<Response> {
  try {
    if (!(await isAdmin())) return unauthorized();
    const result = await runKeepalive();
    return json(result, result.status === "success" ? 200 : 422);
  } catch (error) {
    return handleError(error);
  }
}
