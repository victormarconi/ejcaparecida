import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const accepted = {
  "image/jpeg": { extension: "jpg", valid: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", valid: (bytes: Uint8Array) => bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", valid: (bytes: Uint8Array) => bytes.length > 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" },
  "application/pdf": { extension: "pdf", valid: (bytes: Uint8Array) => bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 }, // %PDF
} as const;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });
    }

    const fileType = accepted[file.type as keyof typeof accepted];
    if (!fileType) {
      return NextResponse.json({ error: "Envie um arquivo válido (JPEG, PNG, WebP ou PDF)." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!fileType.valid(bytes)) {
      return NextResponse.json({ error: "O conteúdo do arquivo não é válido." }, { status: 400 });
    }

    const folder = "anexos";
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${fileType.extension}`;
    await writeFile(path.join(uploadDirectory, filename), bytes, { flag: "wx" });

    return NextResponse.json({ url: `/uploads/${folder}/${filename}`, name: file.name }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha ao enviar arquivo." }, { status: 500 });
  }
}
