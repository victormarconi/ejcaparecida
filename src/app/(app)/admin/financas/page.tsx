import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FinanceAdminPage() {
  await requireUser(true);
  const rows = (await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } })).map((item) => ({ ...item, occurredAt: item.occurredAt.toISOString(), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Controle</span><h1>Lançamentos financeiros</h1><p>Registre receitas e despesas em centavos para evitar arredondamentos.</p></header><ResourceManager endpoint="/api/admin/financas" initialRows={rows} fields={[{ key: "type", label: "Tipo", type: "select", required: true, options: [{ value: "INCOME", label: "Receita" }, { value: "EXPENSE", label: "Despesa" }] }, { key: "title", label: "Título", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "amountCents", label: "Valor em centavos", type: "number", required: true }, { key: "occurredAt", label: "Data", type: "datetime-local", required: true }, { key: "category", label: "Categoria" }]} columns={[{ key: "title", label: "Lançamento" }, { key: "type", label: "Tipo" }, { key: "amountCents", label: "Centavos" }, { key: "category", label: "Categoria" }]} /></>;
}
