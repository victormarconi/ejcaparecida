import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso — EJC Aparecida",
  description: "Termos e condições do portal do EJC Nossa Senhora Aparecida.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-950/70 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-black text-white">EJC Aparecida</Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-400">Documento Legal</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Termos de Uso</h1>
            </div>
          </div>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300 border-t border-slate-800 pt-6">
            <section>
              <h2 className="text-base font-bold text-white mb-2">1. Finalidade</h2>
              <p>
                O portal oficial do <strong>EJC Nossa Senhora Aparecida</strong> (Paróquia Nossa Senhora Aparecida, Valentina - João Pessoa/PB) destina-se à divulgação de encontros, inscrições de jovens, controle patrimonial e prestação de contas das atividades comunitárias e pastorais.
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-white mb-2">2. Inscrições e Participação</h2>
              <p>
                As informações fornecidas em formulários de inscrição e eventos devem ser verídicas e destinam-se exclusivamente à organização e acolhimento dos encontristas pelas equipes pastorais autorizadas.
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-white mb-2">3. Contato</h2>
              <p>
                Em caso de dúvidas sobre eventos, inscrições ou uso do site, procure a coordenação pastoral do EJC na paróquia.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
