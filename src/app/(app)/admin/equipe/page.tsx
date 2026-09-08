import { TeamManager } from "@/components/TeamManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamAdminPage() {
  await requireUser(true);
  const rows = (await prisma.teamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })).map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Pessoas & Liderança</span>
        <h1>Equipe Dirigente</h1>
        <p>Organize nomes, funções, fotos recortadas e ordem de exibição.</p>
      </header>
      <TeamManager initialMembers={rows} />
    </>
  );
}
