import { FinanceDashboard } from "@/components/FinanceDashboard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireUser();
  const entries = (await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } })).map((item) => ({ ...item, occurredAt: item.occurredAt.toISOString(), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Transparência</span><h1>Finanças</h1><p>Caixa atual, movimentação recente e relatórios de consulta.</p></header><FinanceDashboard initialRows={entries} referenceDate={new Date().toISOString()} /></>;
}
