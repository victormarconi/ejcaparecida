import { EventVisibility } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({ title: z.string().min(1), description: z.string().nullable().optional(), location: z.string().nullable().optional(), startsAt: z.string().datetime(), endsAt: z.string().datetime().nullable().optional(), visibility: z.nativeEnum(EventVisibility) });
const clean = (value?: string | null) => value?.trim() || null;
const data = (value: z.infer<typeof schema>) => ({ ...value, description: clean(value.description), location: clean(value.location), startsAt: new Date(value.startsAt), endsAt: value.endsAt ? new Date(value.endsAt) : null });

export async function GET(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error) return auth.error; return routeResponse(request, { items: await prisma.event.findMany({ orderBy: { startsAt: "desc" } }) }); }
export async function POST(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const item = await prisma.event.create({ data: data(schema.parse(await requestData(request))) }); await recordActivity(auth.user, "event", item.id, "CREATED", { title: item.title }); return routeResponse(request, { item }, 201, "/admin/calendario"); }
export async function PUT(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const raw = await requestData(request); const id = z.string().min(1).parse(raw.id); const item = await prisma.event.update({ where: { id }, data: data(schema.parse(raw)) }); await recordActivity(auth.user, "event", id, "UPDATED", { title: item.title }); return routeResponse(request, { item }, 200, "/admin/calendario"); }
export async function DELETE(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const id = z.string().min(1).parse((await requestData(request)).id); await prisma.event.delete({ where: { id } }); await recordActivity(auth.user, "event", id, "DELETED", {}); return routeResponse(request, { ok: true }, 200, "/admin/calendario"); }
