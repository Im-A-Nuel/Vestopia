import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json({ message: "The admin password is not configured on the server." }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  const password =
    typeof body === "object" && body !== null && "password" in body ? (body as { password: unknown }).password : null;
  if (typeof password !== "string") {
    return Response.json({ message: "A password is required." }, { status: 400 });
  }

  const matches = timingSafeEqual(digest(password), digest(expected));
  if (!matches) {
    return Response.json({ message: "That password is not correct." }, { status: 401 });
  }
  return Response.json({ ok: true }, { status: 200 });
}
