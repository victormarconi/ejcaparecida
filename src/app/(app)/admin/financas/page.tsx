import { FinanceDashboard } from "@/components/FinanceDashboard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FinanceAdminPage() {
  const user = await requireUser(true);
  
  // Apenas o usuário "financas" pode lançar, editar ou excluir nas Finanças.
  // Demais usuários (ex: equipe) têm acesso exclusivo de visualização/consulta.
  const canManage = user.username === "financas" || user.email === "financas@ejc.local";

  const [entries, pixSetting] = await Promise.all([
    prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } }),
    prisma.systemSetting.findUnique({ where: { key: "pix_chave" } }),
  ]);

  const rows = entries.map((item) => ({
    ...item,
    occurredAt: item.occurredAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const initialPixKey = pixSetting?.value || "ejcaparecida2000@gmail.com";

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">{canManage ? "Controle" : "Transparência"}</span>
        <h1>Finanças</h1>
        <p>
          {canManage
            ? "Controle completo do fluxo de caixa, lançamentos de receitas, despesas e comprovantes."
            : "Consulta ao fluxo de caixa, saldo atual e relatórios financeiros (Modo Visualização)."}
        </p>
      </header>
      <FinanceDashboard
        initialRows={rows}
        referenceDate={new Date().toISOString()}
        canManage={canManage}
        initialPixKey={initialPixKey}
      />
    </>
  );
}
