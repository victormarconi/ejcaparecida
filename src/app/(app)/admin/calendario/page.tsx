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

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Agenda & Encontros</span>
        <h1>Calendário</h1>
        <p>Cadastre eventos públicos e compromissos internos com visão mensal e horários formatados.</p>
      </header>
      <CalendarManager initialEvents={rows} />
    </>
  );
}
