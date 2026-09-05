import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocationsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] })).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Site público</span><h1>Localizações</h1><p>Gerencie paróquia, capelas, endereços e horários exibidos no site.</p></header><ResourceManager endpoint="/api/admin/localizacoes" initialRows={rows} fields={[{ key: "type", label: "Tipo", required: true }, { key: "title", label: "Título", required: true }, { key: "address", label: "Endereço", required: true }, { key: "query", label: "Busca do Google Maps", required: true }, { key: "mapUrl", label: "Link alternativo do mapa" }, { key: "massSchedule", label: "Horários das missas", type: "textarea" }, { key: "sortOrder", label: "Ordem", type: "number", required: true }]} columns={[{ key: "title", label: "Local" }, { key: "type", label: "Tipo" }, { key: "massSchedule", label: "Missas" }, { key: "sortOrder", label: "Ordem" }]} /></>;
}
