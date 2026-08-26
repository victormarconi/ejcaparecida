import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireUser();
  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  return <><header className="page-heading"><span className="eyebrow">Área interna</span><h1>Calendário</h1><p>Agenda pública e compromissos exclusivos dos membros.</p></header><div className="grid two">{events.map((event) => <article className="card event-card" key={event.id}><div className="actions"><span className="badge">{event.visibility === "PUBLIC" ? "Público" : "Membros"}</span><span className="event-date">{dateTime(event.startsAt)}</span></div><h3>{event.title}</h3><p>{event.description || "Sem descrição."}</p><span className="event-location">📍 {event.location || "A definir"}</span></article>)}</div>{!events.length && <div className="card empty">Nenhum evento cadastrado.</div>}</>;
}
