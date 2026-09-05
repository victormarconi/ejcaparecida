import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({ type: z.string().min(1), title: z.string().min(1), address: z.string().min(1), query: z.string().min(1), mapUrl: z.string().nullable().optional(), massSchedule: z.string().nullable().optional(), sortOrder: z.number().int().default(0) });
const data = (value: z.infer<typeof schema>) => ({ ...value, mapUrl: value.mapUrl?.trim() || null, massSchedule: value.massSchedule?.trim() || null });

export async function GET(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error) return auth.error; return routeResponse(request, { items: await prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }) }); }
export async function POST(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const item = await prisma.location.create({ data: data(schema.parse(await requestData(request))) }); await recordActivity(auth.user, "location", item.id, "CREATED", { title: item.title }); return routeResponse(request, { item }, 201, "/admin/localizacoes"); }
export async function PUT(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const raw = await requestData(request); const id = z.string().min(1).parse(raw.id); const item = await prisma.location.update({ where: { id }, data: data(schema.parse(raw)) }); await recordActivity(auth.user, "location", id, "UPDATED", { title: item.title }); return routeResponse(request, { item }, 200, "/admin/localizacoes"); }
export async function DELETE(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const id = z.string().min(1).parse((await requestData(request)).id); await prisma.location.delete({ where: { id } }); await recordActivity(auth.user, "location", id, "DELETED", {}); return routeResponse(request, { ok: true }, 200, "/admin/localizacoes"); }
