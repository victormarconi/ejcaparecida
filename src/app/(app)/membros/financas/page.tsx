import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireUser();
  const entries = await prisma.financeEntry.findMany({ orderBy: { occurredAt: "desc" }, take: 100 });
  const income = entries.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amountCents, 0);
  const expense = entries.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amountCents, 0);
  return <><header className="page-heading"><span className="eyebrow">Transparência</span><h1>Finanças</h1><p>Acompanhamento das receitas e despesas registradas.</p></header><div className="grid three kpis"><div className="card kpi"><span>Receitas</span><strong>{money(income)}</strong></div><div className="card kpi"><span>Despesas</span><strong>{money(expense)}</strong></div><div className="card kpi"><span>Saldo</span><strong>{money(income - expense)}</strong></div></div><section className="section"><div className="card table-card"><table><thead><tr><th>Data</th><th>Lançamento</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{shortDate(entry.occurredAt)}</td><td><strong>{entry.title}</strong><br /><span>{entry.description}</span></td><td>{entry.category || "—"}</td><td><span className={`badge ${entry.type === "INCOME" ? "positive" : "negative"}`}>{entry.type === "INCOME" ? "+" : "-"}{money(entry.amountCents)}</span></td></tr>)}</tbody></table>{!entries.length && <div className="empty">Nenhum lançamento cadastrado.</div>}</div></section></>;
}
