import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COOKIE_NAME, requestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdminApi(request: NextRequest) {
  const user = await requestUser(request.cookies.get(COOKIE_NAME)?.value);
  if (!user) return { user: null, error: NextResponse.json({ error: "authentication_required" }, { status: 401 }) };
  if (user.role !== "ADMIN") return { user: null, error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user, error: null };
}

export async function requestData(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json() as Record<string, unknown>;
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export function routeResponse(request: NextRequest, body: unknown, status = 200, redirectTo?: string) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json") && redirectTo) return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  return NextResponse.json(body, { status });
}

export async function recordActivity(user: { name: string }, entity: string, entityId: string, action: string, payload: Record<string, unknown>) {
  await prisma.activityLog.create({ data: { entity, entityId, action, actor: user.name, payload: JSON.stringify(payload) } });
}
