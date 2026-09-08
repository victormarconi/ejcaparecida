import { FinanceDashboard } from "@/components/FinanceDashboard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FinanceAdminPage() {
  const user = await requireUser(true);
  
  // Apenas o usuário "financas" pode lançar, editar ou excluir nas Finanças.
  // Demais usuários (ex: equipe) têm acesso exclusivo de visualização/consulta.
  const canManage = user.username === "financas" || user.email === "financas@ejc.local";

  const [entries, pixSettings] = await Promise.all([
    prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" } }),
    prisma.systemSetting.findMany({ where: { key: { in: ["pix_chave", "pix_beneficiario", "pix_titulo", "pix_descricao"] } } }),
  ]);
  const pixConfigMap = Object.fromEntries(pixSettings.map((s) => [s.key, s.value]));

  const rows = entries.map((item) => ({
    ...item,
    occurredAt: item.occurredAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  

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
        initialPixConfig={{
          pixKey: pixConfigMap.pix_chave || "ejcaparecida2000@gmail.com",
          beneficiary: pixConfigMap.pix_beneficiario || "Paróquia Nossa Senhora Aparecida",
          pixTitle: pixConfigMap.pix_titulo || "Apoie a missão do EJC",
          pixDescription: pixConfigMap.pix_descricao || "Quem desejar contribuir com a caminhada do grupo pode fazer uma doação pelo PIX.",
        }}
      />
    </>
  );
}
