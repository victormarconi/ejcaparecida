import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormFields } from "@/lib/forms";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  if (Number(request.headers.get("content-length") || 0) > 512 * 1024) return NextResponse.json({ error: "Resposta muito grande." }, { status: 413 });
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
    if (field.dependsOn) {
      const parentVal = submitted[field.dependsOn.fieldId];
      const matches = Array.isArray(parentVal)
        ? parentVal.includes(field.dependsOn.value)
        : typeof parentVal === "boolean"
        ? (field.dependsOn.value.toLowerCase() === "sim" ? parentVal === true : parentVal === false)
        : String(parentVal ?? "").trim().toLowerCase() === field.dependsOn.value.trim().toLowerCase();
      if (!matches) {
        // Campo oculto pela condicional — ignora validação e não obriga preenchimento
        continue;
      }
    }
    const raw = submitted[field.id];
        if (field.type === "multiselect") {
      const selected = Array.isArray(raw)
        ? raw.filter((item): item is string => typeof item === "string" && Boolean(field.options?.includes(item)))
        : typeof raw === "string" && field.options?.includes(raw)
        ? [raw]
        : [];
      if (field.required && selected.length === 0) {
        return NextResponse.json({ error: `Selecione ao menos uma opção em “${field.label}”.` }, { status: 400 });
      }
      normalized[field.id] = selected.join(", ");
      continue;
    }
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
    } else if (field.type === "select" || field.type === "radio") {
      const selection = String(value);
      if (field.required && field.options && !field.options.includes(selection)) {
        return NextResponse.json({ error: `Selecione uma opção válida em “${field.label}”.` }, { status: 400 });
      }
      normalized[field.id] = selection;
    } else if (field.type === "file") {
      const fileUrl = String(value);
      if (field.required && !fileUrl) {
        return NextResponse.json({ error: `Anexe o comprovante ou documento em “${field.label}”.` }, { status: 400 });
      }
      normalized[field.id] = fileUrl;
    } else {
      normalized[field.id] = String(value).slice(0, 2000);
    }
  }

  await prisma.formSubmission.create({ data: { formId: campaign.id, dataJson: JSON.stringify(normalized) } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

