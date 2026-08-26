import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.event.findMany({ orderBy: { startsAt: "desc" } })).map((item) => ({ ...item, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt?.toISOString() || null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Agenda</span><h1>Calendário</h1><p>Cadastre eventos públicos e compromissos internos.</p></header><ResourceManager endpoint="/api/admin/calendario" initialRows={rows} fields={[{ key: "title", label: "Título", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "location", label: "Local" }, { key: "startsAt", label: "Início", type: "datetime-local", required: true }, { key: "endsAt", label: "Fim", type: "datetime-local" }, { key: "visibility", label: "Visibilidade", type: "select", required: true, options: [{ value: "PUBLIC", label: "Público" }, { value: "MEMBERS", label: "Membros" }] }]} columns={[{ key: "title", label: "Evento" }, { key: "startsAt", label: "Início" }, { key: "location", label: "Local" }, { key: "visibility", label: "Visibilidade" }]} /></>;
}
