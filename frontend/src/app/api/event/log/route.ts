import { getState } from "@/lib/server/state";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const state = await getState();
  return Response.json({ log: state.events.log });
}
