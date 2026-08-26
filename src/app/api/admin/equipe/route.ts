import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({ name: z.string().min(1), role: z.string().min(1), bio: z.string().nullable().optional(), photoUrl: z.string().nullable().optional(), sortOrder: z.number().int().default(0), active: z.boolean().default(true) });
const clean = (value?: string | null) => value?.trim() || null;
const data = (value: z.infer<typeof schema>) => ({ ...value, bio: clean(value.bio), photoUrl: clean(value.photoUrl) });

export async function GET(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error) return auth.error; return routeResponse(request, { items: await prisma.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }) }); }
export async function POST(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const item = await prisma.teamMember.create({ data: data(schema.parse(await requestData(request))) }); await recordActivity(auth.user, "team", item.id, "CREATED", { name: item.name }); return routeResponse(request, { item }, 201, "/admin/equipe"); }
export async function PUT(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const raw = await requestData(request); const id = z.string().min(1).parse(raw.id); const item = await prisma.teamMember.update({ where: { id }, data: data(schema.parse(raw)) }); await recordActivity(auth.user, "team", id, "UPDATED", { name: item.name }); return routeResponse(request, { item }, 200, "/admin/equipe"); }
export async function DELETE(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const id = z.string().min(1).parse((await requestData(request)).id); await prisma.teamMember.delete({ where: { id } }); await recordActivity(auth.user, "team", id, "DELETED", {}); return routeResponse(request, { ok: true }, 200, "/admin/equipe"); }
