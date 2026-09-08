import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordActivity, requestData, requireAdminApi } from "@/lib/http";

const schema = z.object({
  pixKey: z.string().trim().min(3).max(140),
  beneficiary: z.string().trim().max(140).optional(),
  pixTitle: z.string().trim().max(140).optional(),
  pixDescription: z.string().trim().max(300).optional(),
});

function canMutateFinance(user?: { username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return user.username === "financas" || user.email === "financas@ejc.local";
}

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["pix_chave", "pix_beneficiario", "pix_titulo", "pix_descricao"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({
    pixKey: map.pix_chave || "ejcaparecida2000@gmail.com",
    beneficiary: map.pix_beneficiario || "Paróquia Nossa Senhora Aparecida",
    pixTitle: map.pix_titulo || "Apoie a missão do EJC",
    pixDescription: map.pix_descricao || "Quem desejar contribuir com a caminhada do grupo pode fazer uma doação pelo PIX.",
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

    if (value.beneficiary !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "pix_beneficiario" },
        update: { value: value.beneficiary },
        create: { key: "pix_beneficiario", value: value.beneficiary },
      });
    }

    if (value.pixTitle !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "pix_titulo" },
        update: { value: value.pixTitle },
        create: { key: "pix_titulo", value: value.pixTitle },
      });
    }

    if (value.pixDescription !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "pix_descricao" },
        update: { value: value.pixDescription },
        create: { key: "pix_descricao", value: value.pixDescription },
      });
    }

    await recordActivity(auth.user, "system-setting", "pix_chave", "UPDATED", {
      pixKey: value.pixKey,
      beneficiary: value.beneficiary,
      pixTitle: value.pixTitle,
    });

    return NextResponse.json({
      ok: true,
      pixKey: value.pixKey,
      beneficiary: value.beneficiary,
      pixTitle: value.pixTitle,
      pixDescription: value.pixDescription,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao salvar configurações do PIX." },
      { status: 400 }
    );
  }
}
