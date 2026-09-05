import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/http";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const accepted = {
  "image/jpeg": { extension: "jpg", valid: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", valid: (bytes: Uint8Array) => bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", valid: (bytes: Uint8Array) => bytes.length > 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" },
} as const;

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.error) return auth.error;

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
  if (kind !== "receipt" && kind !== "asset" && kind !== "banner") return NextResponse.json({ error: "Tipo de upload inválido." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });

  const imageType = accepted[file.type as keyof typeof accepted];
  if (!imageType) return NextResponse.json({ error: "Envie uma imagem JPEG, PNG ou WebP." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageType.valid(bytes)) return NextResponse.json({ error: "O conteúdo do arquivo não corresponde a uma imagem válida." }, { status: 400 });

  const folder = kind === "receipt" ? "receipts" : kind === "asset" ? "assets" : "banners";
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}.${imageType.extension}`;
  await writeFile(path.join(uploadDirectory, filename), bytes, { flag: "wx" });
  return NextResponse.json({ url: `/uploads/${folder}/${filename}` }, { status: 201 });
}

