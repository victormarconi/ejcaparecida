import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(true);
  const [notices, events, team, finance, locations, rentals] = await Promise.all([prisma.notice.count(), prisma.event.count(), prisma.teamMember.count(), prisma.financeEntry.count(), prisma.location.count(), prisma.rental.count()]);
  const cards = [["Avisos", notices, "/admin/avisos"], ["Eventos", events, "/admin/calendario"], ["Equipe", team, "/admin/equipe"], ["Finanças", finance, "/admin/financas"], ["Localizações", locations, "/admin/localizacoes"], ["Empréstimos", rentals, "/admin/aluguel"]] as const;
  return <><header className="page-heading"><span className="eyebrow">Administração</span><h1>Painel do EJC</h1><p>Gerencie o conteúdo público e as informações internas.</p></header><div className="grid three">{cards.map(([label, count, href]) => <Link className="card kpi" href={href} key={href}><span>{label}</span><strong>{count}</strong></Link>)}</div></>;
}
