import { EstoqueManager } from "@/components/EstoqueManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EstoqueAdminPage() {
  await requireUser(true);
  const items = (await prisma.inventoryItem.findMany({
    include: { rentals: { where: { status: "BORROWED" }, select: { quantity: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  })).map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const rentals = (await prisma.rental.findMany({
    orderBy: [{ status: "asc" }, { rentedAt: "desc" }],
    take: 100,
  })).map((r) => ({
    ...r,
    rentedAt: r.rentedAt.toISOString(),
    dueAt: r.dueAt.toISOString(),
    returnedAt: r.returnedAt?.toISOString() || null,
  }));

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Patrimônio e Materiais</span>
        <h1>Estoque</h1>
        <p>Controle unificado de itens materiais, quantidades e saídas/empréstimos.</p>
      </header>
      <EstoqueManager initialItems={items} initialRentals={rentals} />
    </>
  );
}
