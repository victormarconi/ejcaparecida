import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RentalsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.rental.findMany({ orderBy: { dueAt: "desc" } })).map((item) => ({ ...item, rentedAt: item.rentedAt.toISOString(), dueAt: item.dueAt.toISOString(), returnedAt: item.returnedAt?.toISOString() || null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Patrimônio</span><h1>Empréstimos</h1><p>Acompanhe itens retirados, atrasados e devolvidos.</p></header><ResourceManager endpoint="/api/admin/aluguel" initialRows={rows} fields={[{ key: "itemName", label: "Item", required: true }, { key: "lenderName", label: "Responsável", required: true }, { key: "takenBy", label: "Retirado por", required: true }, { key: "rentedAt", label: "Retirada", type: "datetime-local", required: true }, { key: "dueAt", label: "Devolução prevista", type: "datetime-local", required: true }, { key: "returnedAt", label: "Devolvido em", type: "datetime-local" }, { key: "status", label: "Status", type: "select", required: true, options: [{ value: "BORROWED", label: "Emprestado" }, { value: "RETURNED", label: "Devolvido" }] }, { key: "description", label: "Descrição", type: "textarea" }, { key: "conditionNote", label: "Estado do item", type: "textarea" }]} columns={[{ key: "itemName", label: "Item" }, { key: "takenBy", label: "Retirado por" }, { key: "dueAt", label: "Prazo" }, { key: "status", label: "Status" }]} /></>;
}
