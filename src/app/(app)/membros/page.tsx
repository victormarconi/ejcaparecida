import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const user = await requireUser();
  const [events, notices, documents] = await Promise.all([
    prisma.event.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 4 }),
    prisma.notice.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.driveCache.count(),
  ]);
  return <><header className="page-heading"><span className="eyebrow">Bem-vindo</span><h1>Olá, {user.name}</h1><p>Acompanhe os próximos compromissos e informações do EJC.</p></header>
    <div className="grid three"><Link className="card" href="/membros/calendario"><h3>Calendário</h3><p>{events.length} próximo(s) evento(s)</p></Link><Link className="card" href="/membros/documentos"><h3>Documentos</h3><p>{documents} arquivo(s) disponíveis</p></Link><Link className="card" href="/membros/financas"><h3>Finanças</h3><p>Transparência e acompanhamento</p></Link></div>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">Agenda</span><h2>Próximos eventos</h2></div></div><div className="grid two">{events.map((event) => <article className="card event-card" key={event.id}><span className="event-date">{shortDate(event.startsAt)}</span><h3>{event.title}</h3><p>{event.description}</p><span className="event-location">📍 {event.location || "A definir"}</span></article>)}</div></section>
    <section><div className="section-heading"><div><span className="eyebrow">Comunicados</span><h2>Avisos recentes</h2></div></div><div className="grid two">{notices.map((notice) => <article className="card" key={notice.id}><span className="badge">{notice.type}</span><h3>{notice.title}</h3><p>{notice.summary}</p></article>)}</div></section>
  </>;
}
