import { LocationsManager } from "@/components/LocationsManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocationsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.location.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  })).map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Site Público</span>
        <h1>Localizações</h1>
        <p>Gerencie a paróquia matriz, comunidades, endereços e mapas interativos do Google.</p>
      </header>
      <LocationsManager initialLocations={rows} />
    </>
  );
}
