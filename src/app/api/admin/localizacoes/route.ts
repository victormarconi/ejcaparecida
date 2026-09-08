import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi, routeResponse } from "@/lib/http";

const schema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  address: z.string().min(1),
  query: z.string().min(1),
  mapUrl: z.string().nullable().optional(),
  massSchedule: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

async function resolveLocationData(value: z.infer<typeof schema>) {
  let mapUrl = value.mapUrl?.trim() || null;
  let query = value.query?.trim() || "";

  if (mapUrl && (mapUrl.includes("maps.app.goo.gl") || mapUrl.includes("goo.gl"))) {
    try {
      const res = await fetch(mapUrl, { method: "HEAD", redirect: "follow" });
      if (res.url && res.url !== mapUrl) {
        mapUrl = res.url;
      }
    } catch {
      // Keep original mapUrl if fetch fails
    }
  }

  // Extract coordinates for the embed if available in mapUrl
  if (mapUrl) {
    const m = mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m && (!query || query === value.title)) {
      query = `${m[1]},${m[2]}`;
    }
  }

  return {
    ...value,
    query: query || value.query,
    mapUrl,
    massSchedule: value.massSchedule?.trim() || null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  return routeResponse(request, {
    items: await prisma.location.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  const parsed = schema.parse(await requestData(request));
  const resolved = await resolveLocationData(parsed);
  const item = await prisma.location.create({ data: resolved });
  await recordActivity(auth.user, "location", item.id, "CREATED", { title: item.title });
  return routeResponse(request, { item }, 201, "/admin/localizacoes");
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  const raw = await requestData(request);
  const id = z.string().min(1).parse(raw.id);
  const parsed = schema.parse(raw);
  const resolved = await resolveLocationData(parsed);
  const item = await prisma.location.update({ where: { id }, data: resolved });
  await recordActivity(auth.user, "location", id, "UPDATED", { title: item.title });
  return routeResponse(request, { item }, 200, "/admin/localizacoes");
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  const id = z.string().min(1).parse((await requestData(request)).id);
  const item = await prisma.location.delete({ where: { id } });
  await recordActivity(auth.user, "location", id, "DELETED", { title: item.title });
  return routeResponse(request, { ok: true }, 200, "/admin/localizacoes");
}
