import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacidade e LGPD — EJC Aparecida",
  description: "Tratamento de dados pessoais no portal do EJC Nossa Senhora Aparecida.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-950/70 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-black text-white">EJC Aparecida</Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Privacidade Pastoral</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Política de Privacidade</h1>
            </div>
          </div>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300 border-t border-slate-800 pt-6">
            <section>
              <h2 className="text-base font-bold text-white mb-2">1. Tratamento de Dados com Respeito e Segurança</h2>
              <p>
                Os dados pessoais de jovens, voluntários e paroquianos (como nome, telefone, data de nascimento e contatos de emergência) coletados através deste portal são tratados com estrita confidencialidade nos termos da LGPD (Lei 13.709/2018), com o propósito exclusivo de organização pastoral e comunitária.
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-white mb-2">2. Não Compartilhamento Comercial</h2>
              <p>
                O EJC Aparecida não compartilha, não cede e não comercializa dados de membros ou participantes para quaisquer terceiros ou finalidades comerciais.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
