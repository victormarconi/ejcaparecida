import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  const input = type.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const identifier = String(input.identifier || input.username || input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const callbackUrl = String(input.callbackUrl || "/membros");
  const user = identifier ? await prisma.user.findFirst({ where: { active: true, OR: [{ email: identifier }, { username: identifier }] } }) : null;
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    if (type.includes("application/json")) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    return NextResponse.redirect(new URL(`/login?erro=1&callbackUrl=${encodeURIComponent(callbackUrl.startsWith("/") ? callbackUrl : "/membros")}`, request.url), 303);
  }
  const target = callbackUrl.startsWith("/") ? callbackUrl : user.role === "ADMIN" ? "/admin" : "/membros";
  const response = type.includes("application/json") ? NextResponse.json({ ok: true, role: user.role }) : NextResponse.redirect(new URL(target, request.url), 303);
  setSessionCookie(response, user.id);
  return response;
}
