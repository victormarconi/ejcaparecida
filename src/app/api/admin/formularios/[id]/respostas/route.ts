import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/http";
import { parseFormFields } from "@/lib/forms";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const campaign = await prisma.formCampaign.findUnique({
    where: { id },
    include: { submissions: { orderBy: { createdAt: "desc" }, take: 200 } },
  });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  const items = campaign.submissions.map((submission) => {
    try {
      const data: unknown = JSON.parse(submission.dataJson);
      return { id: submission.id, createdAt: submission.createdAt, data: data && typeof data === "object" && !Array.isArray(data) ? data : {} };
    } catch {
      return { id: submission.id, createdAt: submission.createdAt, data: {} };
    }
  });
  return NextResponse.json({ campaign: { id: campaign.id, title: campaign.title, fields: parseFormFields(campaign.fieldsJson) }, items });
}
