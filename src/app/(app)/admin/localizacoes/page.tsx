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

  return <LocationsManager initialLocations={rows} />;
}
