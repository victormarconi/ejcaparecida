import { PatrimonyManager } from "@/components/PatrimonyManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RentalsAdminPage() {
  await requireUser(true);
  const [rawItems, rawRentals] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.rental.findMany({ orderBy: [{ status: "asc" }, { dueAt: "asc" }] }),
  ]);
  const items = rawItems.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  const rentals = rawRentals.map((item) => ({ ...item, rentedAt: item.rentedAt.toISOString(), dueAt: item.dueAt.toISOString(), returnedAt: item.returnedAt?.toISOString() || null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Controle interno</span><h1>Patrimônio &amp; Estoque</h1><p>Catálogo de bens, disponibilidade, empréstimos e registro do estado antes da entrega.</p></header><PatrimonyManager initialItems={items} initialRentals={rentals} referenceDate={new Date().toISOString()} /></>;
}
