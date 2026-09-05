import { FinanceDashboard } from "@/components/FinanceDashboard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FinanceAdminPage() {
  await requireUser(true);
  const rows = (await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } })).map((item) => ({ ...item, occurredAt: item.occurredAt.toISOString(), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Controle</span><h1>Finanças</h1><p>Fluxo de caixa compacto, comprovantes e relatórios em uma visão organizada.</p></header><FinanceDashboard initialRows={rows} referenceDate={new Date().toISOString()} canManage /></>;
}
