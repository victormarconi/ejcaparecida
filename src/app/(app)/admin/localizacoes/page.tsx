import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocationsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] })).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Site público</span><h1>Localizações</h1><p>Gerencie paróquia, comunidades, mapas e ordem das abas.</p></header><ResourceManager endpoint="/api/admin/localizacoes" initialRows={rows} fields={[{ key: "type", label: "Tipo", required: true }, { key: "title", label: "Título", required: true }, { key: "address", label: "Endereço", required: true }, { key: "query", label: "Busca do mapa", required: true }, { key: "mapUrl", label: "Link do Google Maps" }, { key: "sortOrder", label: "Ordem", type: "number", required: true }]} columns={[{ key: "title", label: "Local" }, { key: "type", label: "Tipo" }, { key: "address", label: "Endereço" }, { key: "sortOrder", label: "Ordem" }]} /></>;
}
