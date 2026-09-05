import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi } from "@/lib/http";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  quantity: z.number().int().positive().max(100000),
  condition: z.enum(["GOOD", "FAIR", "MAINTENANCE", "UNUSABLE"]),
  photoUrl: z.string().max(2048).nullable().optional(),
  active: z.boolean().default(true),
});

const clean = (value?: string | null) => value?.trim() || null;
const itemData = (value: z.infer<typeof itemSchema>) => ({ ...value, description: clean(value.description), photoUrl: clean(value.photoUrl) });

function invalid(reason: unknown) {
  if (reason instanceof z.ZodError) return NextResponse.json({ error: reason.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  if (reason instanceof Prisma.PrismaClientKnownRequestError && reason.code === "P2025") return NextResponse.json({ error: "Bem não encontrado." }, { status: 404 });
  throw reason;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  const items = await prisma.inventoryItem.findMany({ include: { rentals: { where: { status: "BORROWED" }, select: { quantity: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const item = await prisma.inventoryItem.create({ data: itemData(itemSchema.parse(await requestData(request))) });
    await recordActivity(auth.user, "inventory-item", item.id, "CREATED", { item: item.name });
    return NextResponse.json({ item }, { status: 201 });
  } catch (reason) {
    return invalid(reason);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const raw = await requestData(request);
    const id = z.string().min(1).parse(raw.id);
    const value = itemSchema.parse(raw);
    const item = await prisma.$transaction(async (tx) => {
      const borrowed = await tx.rental.aggregate({ where: { inventoryItemId: id, status: "BORROWED" }, _sum: { quantity: true } });
      if ((borrowed._sum.quantity || 0) > value.quantity) throw new Error("BORROWED_QUANTITY");
      return tx.inventoryItem.update({ where: { id }, data: itemData(value) });
    });
    await recordActivity(auth.user, "inventory-item", id, "UPDATED", { item: item.name });
    return NextResponse.json({ item });
  } catch (reason) {
    if (reason instanceof Error && reason.message === "BORROWED_QUANTITY") return NextResponse.json({ error: "A quantidade total não pode ser menor que a quantidade atualmente emprestada." }, { status: 409 });
    return invalid(reason);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const id = z.string().min(1).parse((await requestData(request)).id);
    const linked = await prisma.rental.count({ where: { inventoryItemId: id } });
    if (linked) return NextResponse.json({ error: "Este bem possui histórico de empréstimos. Desative-o para preservar o histórico." }, { status: 409 });
    await prisma.inventoryItem.delete({ where: { id } });
    await recordActivity(auth.user, "inventory-item", id, "DELETED", {});
    return NextResponse.json({ ok: true });
  } catch (reason) {
    return invalid(reason);
  }
}
