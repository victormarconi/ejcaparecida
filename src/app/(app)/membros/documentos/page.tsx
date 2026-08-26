import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireUser();
  const documents = await prisma.driveCache.findMany({ orderBy: [{ modifiedAt: "desc" }, { name: "asc" }] });
  return <><header className="page-heading"><span className="eyebrow">Arquivos</span><h1>Documentos</h1><p>Materiais sincronizados e disponíveis para a equipe.</p></header><div className="grid two">{documents.map((document) => <article className="card" key={document.id}><span className="badge">{document.mimeType}</span><h3>{document.name}</h3><p>{document.modifiedAt ? `Atualizado em ${shortDate(document.modifiedAt)}` : "Data não informada"}</p>{document.webViewUrl && <a className="button secondary small" href={document.webViewUrl} target="_blank" rel="noreferrer">Abrir documento</a>}</article>)}</div>{!documents.length && <div className="card empty">Nenhum documento sincronizado no momento.</div>}</>;
}
