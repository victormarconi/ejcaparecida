import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/http";
import { parseFormFields } from "@/lib/forms";

type RouteContext = { params: Promise<{ id: string }> };

function spreadsheetSafe(value: unknown) {
  const normalized = value === true ? "Sim" : value === false ? "Não" : value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

function csvCell(value: unknown) {
  return `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;
}

function fileName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "respostas";
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const campaign = await prisma.formCampaign.findUnique({ where: { id }, include: { submissions: { orderBy: { createdAt: "asc" } } } });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  const fields = parseFormFields(campaign.fieldsJson);
  const lines = [["Enviado em", ...fields.map((field) => field.label)].map(csvCell).join(";")];
  for (const submission of campaign.submissions) {
    let data: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(submission.dataJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
    } catch {
      // Mantém a linha exportável mesmo se um registro legado estiver inválido.
    }
    lines.push([submission.createdAt.toISOString(), ...fields.map((field) => data[field.id])].map(csvCell).join(";"));
  }
  return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName(campaign.title)}-respostas.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
