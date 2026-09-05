import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormFields } from "@/lib/forms";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  if (Number(request.headers.get("content-length") || 0) > 64 * 1024) return NextResponse.json({ error: "Resposta muito grande." }, { status: 413 });
  const { id } = await params;
  const campaign = await prisma.formCampaign.findFirst({
    where: { id, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  if (!campaign) return NextResponse.json({ error: "Este formulário não está mais disponível." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("data" in body) || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  if ("website" in body && body.website) return NextResponse.json({ ok: true }, { status: 201 });

  const fields = parseFormFields(campaign.fieldsJson);
  const submitted = body.data as Record<string, unknown>;
  const normalized: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    const raw = submitted[field.id];
    if (field.type === "checkbox") {
      const checked = raw === true;
      if (field.required && !checked) return NextResponse.json({ error: `Confirme “${field.label}”.` }, { status: 400 });
      normalized[field.id] = checked;
      continue;
    }
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (field.required && (value === "" || value === null || value === undefined)) return NextResponse.json({ error: `Preencha “${field.label}”.` }, { status: 400 });
    if (value === "" || value === null || value === undefined) {
      normalized[field.id] = "";
      continue;
    }
    if (field.type === "number") {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number)) return NextResponse.json({ error: `Informe um número válido em “${field.label}”.` }, { status: 400 });
      normalized[field.id] = number;
    } else if (field.type === "select") {
      const selection = String(value);
      if (!field.options?.includes(selection)) return NextResponse.json({ error: `Selecione uma opção válida em “${field.label}”.` }, { status: 400 });
      normalized[field.id] = selection;
    } else {
      normalized[field.id] = String(value).slice(0, 2000);
    }
  }

  await prisma.formSubmission.create({ data: { formId: campaign.id, dataJson: JSON.stringify(normalized) } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

