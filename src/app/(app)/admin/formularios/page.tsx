import { FormsManager } from "@/components/FormsManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FormsAdminPage() {
  await requireUser(true);
  const campaigns = (await prisma.formCampaign.findMany({
    include: { _count: { select: { submissions: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  })).map((campaign) => ({
    ...campaign,
    expiresAt: campaign.expiresAt?.toISOString() || null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  }));
  return <><header className="page-heading"><span className="eyebrow">Site público</span><h1>Formulários &amp; Banners</h1><p>Crie campanhas integradas, publique um destaque no topo e exporte as respostas em CSV compatível com Excel.</p></header><FormsManager initialCampaigns={campaigns} /></>;
}
