import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createSessionToken, isValidSessionToken } from "@/lib/server";

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

export async function GET(): Promise<Response> {
  const store = await cookies();
  const valid = isValidSessionToken(store.get(ADMIN_COOKIE)?.value, process.env.ADMIN_PASSWORD);
  if (!valid) {
    return Response.json({ message: "Not signed in." }, { status: 401 });
  }
  return Response.json({ ok: true }, { status: 200 });
}

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

  const store = await cookies();
  store.set({
    name: ADMIN_COOKIE,
    value: createSessionToken(expected),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return Response.json({ ok: true }, { status: 200 });
}

export async function DELETE(): Promise<Response> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return Response.json({ ok: true }, { status: 200 });
}
