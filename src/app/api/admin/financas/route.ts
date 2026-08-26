import { FinanceType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({ type: z.nativeEnum(FinanceType), title: z.string().min(1), description: z.string().nullable().optional(), amountCents: z.number().int().nonnegative(), occurredAt: z.string().datetime(), category: z.string().nullable().optional() });
const clean = (value?: string | null) => value?.trim() || null;
const data = (value: z.infer<typeof schema>) => ({ ...value, description: clean(value.description), category: clean(value.category), occurredAt: new Date(value.occurredAt) });

export async function GET(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error) return auth.error; return routeResponse(request, { items: await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } }) }); }
export async function POST(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const item = await prisma.financeEntry.create({ data: data(schema.parse(await requestData(request))) }); await recordActivity(auth.user, "finance", item.id, "CREATED", { title: item.title, type: item.type }); return routeResponse(request, { item }, 201, "/admin/financas"); }
export async function PUT(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const raw = await requestData(request); const id = z.string().min(1).parse(raw.id); const item = await prisma.financeEntry.update({ where: { id }, data: data(schema.parse(raw)) }); await recordActivity(auth.user, "finance", id, "UPDATED", { title: item.title, type: item.type }); return routeResponse(request, { item }, 200, "/admin/financas"); }
export async function DELETE(request: NextRequest) { const auth = await requireAdminApi(request); if (auth.error || !auth.user) return auth.error!; const id = z.string().min(1).parse((await requestData(request)).id); await prisma.financeEntry.delete({ where: { id } }); await recordActivity(auth.user, "finance", id, "DELETED", {}); return routeResponse(request, { ok: true }, 200, "/admin/financas"); }
