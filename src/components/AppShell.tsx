import Image from "next/image";
import Link from "next/link";

export function AppShell({ user, children }: { user: { name: string; role: string }; children: React.ReactNode }) {
  return <div className="app-layout">
    <aside className="sidebar">
      <Link className="brand" href="/"><Image src="/uploads/logo-ejc-white.png" width={34} height={34} alt="" /><span>EJC Aparecida</span></Link>
      <nav aria-label="Área interna">
        <Link href="/membros">Visão geral</Link>
        <Link href="/membros/calendario">Calendário</Link>
        <Link href="/membros/documentos">Documentos</Link>
        <Link href="/membros/financas">Finanças</Link>
        {user.role === "ADMIN" && <><Link href="/admin">Administração</Link><Link href="/admin/avisos">Avisos</Link><Link href="/admin/calendario">Eventos</Link><Link href="/admin/equipe">Equipe</Link><Link href="/admin/financas">Lançamentos</Link><Link href="/admin/localizacoes">Localizações</Link><Link href="/admin/aluguel">Empréstimos</Link></>}
      </nav>
      <div className="sidebar-footer"><span>{user.name}</span><form action="/api/logout" method="post"><button className="button secondary small" type="submit">Sair</button></form></div>
    </aside>
    <main className="app-main"><header className="app-header"><strong>Área interna</strong><Link className="button secondary small" href="/">Abrir site</Link></header><div className="app-content">{children}</div></main>
  </div>;
}
