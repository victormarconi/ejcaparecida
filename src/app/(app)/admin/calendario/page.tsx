import { CalendarManager } from "@/components/CalendarManager";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventsAdminPage() {
  await requireUser(true);
  const rows = (await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
  })).map((item) => ({
    ...item,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <CalendarManager initialEvents={rows} />;
}
