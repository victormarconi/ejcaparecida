import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi } from "@/lib/http";
import { FORM_FIELD_TYPES } from "@/lib/forms";

const fieldSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(160),
  type: z.enum(FORM_FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(160)).max(50).optional(),
});

const campaignSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(4000).nullable().optional(),
  bannerUrl: z.string().max(2048).nullable().optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
  fields: z.array(fieldSchema).max(40),
}).superRefine((value, context) => {
  const ids = new Set<string>();
  value.fields.forEach((field, index) => {
    if (ids.has(field.id)) context.addIssue({ code: "custom", path: ["fields", index, "id"], message: "Cada campo precisa ter um identificador único." });
    ids.add(field.id);
    if (field.type === "select" && !field.options?.length) context.addIssue({ code: "custom", path: ["fields", index, "options"], message: `Inclua ao menos uma opção em “${field.label}”.` });
  });
});

const clean = (value?: string | null) => value?.trim() || null;
const campaignData = (value: z.infer<typeof campaignSchema>) => ({
  title: value.title,
  description: clean(value.description),
  bannerUrl: clean(value.bannerUrl),
  active: value.active,
  expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
  fieldsJson: JSON.stringify(value.fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    options: field.type === "select" ? field.options : undefined,
  }))),
});

function invalid(reason: unknown) {
  if (reason instanceof z.ZodError) return NextResponse.json({ error: reason.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  if (reason instanceof Prisma.PrismaClientKnownRequestError && reason.code === "P2025") return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  throw reason;
}

const campaignInclude = { _count: { select: { submissions: true } } } as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  const items = await prisma.formCampaign.findMany({ include: campaignInclude, orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const value = campaignSchema.parse(await requestData(request));
    const item = await prisma.$transaction(async (tx) => {
      if (value.active) await tx.formCampaign.updateMany({ where: { active: true }, data: { active: false } });
      return tx.formCampaign.create({ data: campaignData(value), include: campaignInclude });
    });
    await recordActivity(auth.user, "form-campaign", item.id, "CREATED", { title: item.title });
    return NextResponse.json({ item }, { status: 201 });
  } catch (reason) {
    return invalid(reason);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const raw = await requestData(request);
    const id = z.string().min(1).parse(raw.id);
    const value = campaignSchema.parse(raw);
    const item = await prisma.$transaction(async (tx) => {
      if (value.active) await tx.formCampaign.updateMany({ where: { active: true, id: { not: id } }, data: { active: false } });
      return tx.formCampaign.update({ where: { id }, data: campaignData(value), include: campaignInclude });
    });
    await recordActivity(auth.user, "form-campaign", item.id, "UPDATED", { title: item.title });
    return NextResponse.json({ item });
  } catch (reason) {
    return invalid(reason);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  try {
    const id = z.string().min(1).parse((await requestData(request)).id);
    const item = await prisma.formCampaign.delete({ where: { id } });
    await recordActivity(auth.user, "form-campaign", item.id, "DELETED", { title: item.title });
    return NextResponse.json({ ok: true });
  } catch (reason) {
    return invalid(reason);
  }
}
