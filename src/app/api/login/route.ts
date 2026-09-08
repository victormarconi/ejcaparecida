import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  const input = type.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const identifier = String(input.identifier || input.username || input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const callbackUrl = String(input.callbackUrl || "");
  const remember = input.remember === true || input.remember === "true" || input.remember === "on" || input.remember === "1";

  const baseUrl = getBaseUrl(request);

  const user = identifier ? await prisma.user.findFirst({ where: { active: true, OR: [{ email: identifier }, { username: identifier }] } }) : null;
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    if (type.includes("application/json")) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    const errCallback = callbackUrl.startsWith("/") ? callbackUrl : "/membros";
    return NextResponse.redirect(`${baseUrl}/login?erro=1&callbackUrl=${encodeURIComponent(errCallback)}`, 303);
  }

  // Redirecionamento padrão: Visão Geral (/admin) para admins
  let target = "/membros";
  if (callbackUrl.startsWith("/") && callbackUrl !== "/login") {
    target = callbackUrl;
  } else if (user.role === "ADMIN") {
    target = "/admin";
  }

  const response = type.includes("application/json")
    ? NextResponse.json({ ok: true, role: user.role, redirectUrl: target })
    : NextResponse.redirect(`${baseUrl}${target}`, 303);

  setSessionCookie(response, user.id, remember);
  return response;
}
