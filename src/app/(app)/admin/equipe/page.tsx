import { ResourceManager } from "@/components/ResourceManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamAdminPage() {
  await requireUser(true);
  const rows = (await prisma.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }));
  return <><header className="page-heading"><span className="eyebrow">Pessoas</span><h1>Equipe dirigente</h1><p>Organize nomes, funções, fotos e ordem de exibição.</p></header><ResourceManager endpoint="/api/admin/equipe" initialRows={rows} fields={[{ key: "name", label: "Nome", required: true }, { key: "role", label: "Função", required: true }, { key: "bio", label: "Biografia", type: "textarea" }, { key: "photoUrl", label: "URL da foto" }, { key: "sortOrder", label: "Ordem", type: "number", required: true }, { key: "active", label: "Ativo", type: "checkbox" }]} columns={[{ key: "name", label: "Nome" }, { key: "role", label: "Função" }, { key: "sortOrder", label: "Ordem" }, { key: "active", label: "Ativo" }]} /></>;
}
