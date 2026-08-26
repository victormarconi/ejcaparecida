import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NoticesAdminPage() {
  await requireUser(true);
  const rows = (await prisma.notice.findMany({ orderBy: { createdAt: "desc" } })).map((item) => ({ ...item, startsAt: item.startsAt?.toISOString() || null, endsAt: item.endsAt?.toISOString() || null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Conteúdo</span><h1>Avisos</h1><p>Publique comunicados, campanhas e destaques do site.</p></header><ResourceManager endpoint="/api/admin/avisos" initialRows={rows} fields={[{ key: "title", label: "Título", required: true }, { key: "summary", label: "Resumo", type: "textarea", required: true }, { key: "content", label: "Conteúdo", type: "textarea" }, { key: "assetUrl", label: "URL da imagem" }, { key: "secondaryAssetUrl", label: "URL secundária" }, { key: "type", label: "Tipo", type: "select", required: true, options: ["AVISO", "VENDA", "GINCANA", "EVENTO"].map((value) => ({ value, label: value })) }, { key: "highlight", label: "Destaque", type: "checkbox" }, { key: "published", label: "Publicado", type: "checkbox" }, { key: "startsAt", label: "Início", type: "datetime-local" }, { key: "endsAt", label: "Fim", type: "datetime-local" }]} columns={[{ key: "title", label: "Título" }, { key: "type", label: "Tipo" }, { key: "published", label: "Publicado" }, { key: "highlight", label: "Destaque" }]} /></>;
}
