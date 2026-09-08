import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi } from "@/lib/http";

const schema = z.object({
  pixKey: z.string().trim().min(3).max(140),
  beneficiary: z.string().trim().max(140).optional(),
});

function canMutateFinance(user?: { username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return user.username === "financas" || user.email === "financas@ejc.local";
}

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["pix_chave", "pix_beneficiario"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({
    pixKey: map.pix_chave || "ejcaparecida2000@gmail.com",
    beneficiary: map.pix_beneficiario || "Paróquia Nossa Senhora Aparecida",
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error || !auth.user) return auth.error!;
  if (!canMutateFinance(auth.user)) {
    return NextResponse.json({ error: "Apenas o usuário de Finanças pode alterar a chave PIX." }, { status: 403 });
  }

  try {
    const raw = await requestData(request);
    const value = schema.parse(raw);

    await prisma.systemSetting.upsert({
      where: { key: "pix_chave" },
      update: { value: value.pixKey },
      create: { key: "pix_chave", value: value.pixKey },
    });

    if (value.beneficiary) {
      await prisma.systemSetting.upsert({
        where: { key: "pix_beneficiario" },
        update: { value: value.beneficiary },
        create: { key: "pix_beneficiario", value: value.beneficiary },
      });
    }

    await recordActivity(auth.user, "system-setting", "pix_chave", "UPDATED", {
      pixKey: value.pixKey,
      beneficiary: value.beneficiary,
    });

    return NextResponse.json({
      ok: true,
      pixKey: value.pixKey,
      beneficiary: value.beneficiary || "Paróquia Nossa Senhora Aparecida",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao salvar chave PIX." },
      { status: 400 }
    );
  }
}
