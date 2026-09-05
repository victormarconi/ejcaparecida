import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import type { SiteData } from "../src/lib/site-data";

const prisma = new PrismaClient();

async function main() {
  const raw = await fs.readFile(path.join(process.cwd(), "data", "site-data.json"), "utf8");
  const data = JSON.parse(raw) as SiteData;

  await prisma.$transaction(async (tx) => {
    await tx.notice.deleteMany();
    await tx.event.deleteMany();
    await tx.teamMember.deleteMany();
    await tx.financeEntry.deleteMany();
    await tx.location.deleteMany();

    if (data.notices.length) {
      await tx.notice.createMany({
        data: data.notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          summary: notice.summary,
          content: notice.content,
          assetUrl: notice.assetUrl,
          secondaryAssetUrl: notice.secondaryAssetUrl,
          type: notice.type,
          highlight: notice.highlight,
          published: notice.published,
          createdAt: new Date(notice.createdAt),
        })),
      });
    }

    if (data.events.length) {
      await tx.event.createMany({
        data: data.events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startsAt: new Date(event.startsAt),
          visibility: event.visibility,
        })),
      });
    }

    if (data.team.length) {
      await tx.teamMember.createMany({
        data: data.team.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          photoUrl: member.photoUrl,
          sortOrder: member.sortOrder,
          active: member.active,
        })),
      });
    }

    if (data.locations?.length) {
      await tx.location.createMany({
        data: data.locations.map((location) => ({
          id: location.id,
          type: location.type,
          title: location.title,
          address: location.address,
          query: location.query,
          mapUrl: location.mapUrl,
          massSchedule: location.massSchedule,
          sortOrder: location.sortOrder,
        })),
      });
    }

    if (data.finances.length) {
      await tx.financeEntry.createMany({
        data: data.finances.map((entry) => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          description: entry.description,
          amountCents: entry.amountCents,
          occurredAt: new Date(entry.occurredAt),
          category: entry.category,
          receiptUrl: entry.receiptUrl,
        })),
      });
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
