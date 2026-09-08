import { FinanceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({
  type: z.nativeEnum(FinanceType),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  amountCents: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  category: z.string().max(100).nullable().optional(),
  receiptUrl: z.string().max(2048).nullable().optional(),
});

const clean = (value?: string | null) => value?.trim() || null;
const data = (value: z.infer<typeof schema>) => ({
  ...value,
  description: clean(value.description),
  category: clean(value.category),
  receiptUrl: value.type === "EXPENSE" ? clean(value.receiptUrl) : null,
  occurredAt: new Date(value.occurredAt),
});

function canMutateFinance(user?: { username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return user.username === "financas" || user.email === "financas@ejc.local";
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  return routeResponse(request, {
    items: await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  if (!canMutateFinance(auth.user)) {
    return NextResponse.json({ error: "Apenas o usuário de Finanças pode realizar lançamentos." }, { status: 403 });
  }

  const item = await prisma.financeEntry.create({ data: data(schema.parse(await requestData(request))) });
  await recordActivity(auth.user, "finance", item.id, "CREATED", { title: item.title, type: item.type });
  return routeResponse(request, { item }, 201, "/admin/financas");
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  if (!canMutateFinance(auth.user)) {
    return NextResponse.json({ error: "Apenas o usuário de Finanças pode alterar lançamentos." }, { status: 403 });
  }

  const raw = await requestData(request);
  const id = z.string().min(1).parse(raw.id);
  const item = await prisma.financeEntry.update({ where: { id }, data: data(schema.parse(raw)) });
  await recordActivity(auth.user, "finance", id, "UPDATED", { title: item.title, type: item.type });
  return routeResponse(request, { item }, 200, "/admin/financas");
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  if (!canMutateFinance(auth.user)) {
    return NextResponse.json({ error: "Apenas o usuário de Finanças pode excluir lançamentos." }, { status: 403 });
  }

  const raw = await requestData(request);
  const id = z.string().min(1).parse(raw.id);
  const item = await prisma.financeEntry.delete({ where: { id } });
  await recordActivity(auth.user, "finance", id, "DELETED", { title: item.title });
  return routeResponse(request, { ok: true }, 200, "/admin/financas");
}
