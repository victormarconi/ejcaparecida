import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "ejc_session";
const SESSION_SECONDS = 60 * 60 * 8;

type SessionPayload = { userId: string; expiresAt: number };

function secret() {
  const value = process.env.SESSION_SECRET || "";
  if (value.length < 32) throw new Error("SESSION_SECRET precisa ter ao menos 32 caracteres");
  return value;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const payload = encode(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_SECONDS * 1000 } satisfies SessionPayload));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!decoded.userId || !Number.isFinite(decoded.expiresAt) || decoded.expiresAt <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function currentUser() {
  const store = await cookies();
  const session = verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!session) return null;
  return prisma.user.findFirst({
    where: { id: session.userId, active: true },
    select: { id: true, name: true, email: true, username: true, role: true },
  });
}

export async function requireUser(admin = false) {
  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=${admin ? "/admin" : "/membros"}`);
  if (admin && user.role !== "ADMIN") redirect("/membros");
  return user;
}

export async function requestUser(token?: string | null) {
  const session = verifySessionToken(token);
  if (!session) return null;
  return prisma.user.findFirst({ where: { id: session.userId, active: true }, select: { id: true, name: true, role: true } });
}

export { COOKIE_NAME };
