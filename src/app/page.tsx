import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/format";
import { CopyPix, LocationTabs, ThemeToggle } from "@/components/PublicInteractions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const [notices, events, team, locations] = await Promise.all([
    prisma.notice.findMany({ where: { published: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }, orderBy: [{ highlight: "desc" }, { createdAt: "desc" }], take: 6 }),
    prisma.event.findMany({ where: { visibility: "PUBLIC", startsAt: { gte: new Date(now.getTime() - 86400000) } }, orderBy: { startsAt: "asc" }, take: 6 }),
    prisma.teamMember.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
  ]);

  return <main>
    <header className="topbar"><div className="container topbar-inner">
      <Link className="brand" href="/"><Image src="/uploads/logo-ejc.png" width={34} height={34} alt="" /><span>EJC Nossa Senhora Aparecida</span></Link>
      <nav className="public-nav" aria-label="Navegação pública">
        <a href="#avisos">Avisos</a><a href="#eventos">Eventos</a><a href="#equipe">Equipe</a><a href="#localizacao">Localização</a>
        <ThemeToggle /><Link className="button small" href="/login">Área interna</Link>
      </nav>
    </div></header>

    <section className="hero"><div className="container">
      <span className="eyebrow">EJC Aparecida</span>
      <h1>Encontro de Jovens com Cristo</h1>
      <p>Fé, amizade e serviço na Paróquia Nossa Senhora Aparecida, no Valentina.</p>
      <div className="hero-actions"><a className="button" href="#eventos">Ver próximos eventos</a><a className="button secondary" href="https://www.instagram.com/ejc.aparecida/" target="_blank" rel="noreferrer">Acompanhar no Instagram</a></div>
    </div></section>

    <section className="section" id="avisos"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Avisos</span><h2>O que está acontecendo</h2></div><p>Comunicados, campanhas e informações importantes para a comunidade.</p></div>
      <div className="grid two">{notices.map((notice) => <article className="card notice-card" key={notice.id}>
        {notice.assetUrl ? <Image src={notice.assetUrl} width={640} height={480} alt={notice.title} /> : <div className="notice-placeholder" />}
        <div className="notice-content"><span className="eyebrow">{notice.type}</span><h3>{notice.title}</h3><p>{notice.summary}</p>{notice.content && <p>{notice.content}</p>}</div>
      </article>)}</div>
      {!notices.length && <div className="card empty">Nenhum aviso publicado no momento.</div>}
    </div></section>

    <section className="section alt"><div className="container donation">
      <div className="card"><span className="eyebrow">Doação</span><h2>Apoie a missão do EJC</h2><p>Quem desejar contribuir com a caminhada do grupo pode fazer uma doação pelo PIX.</p></div>
      <div className="card pix-card"><span>PIX</span><strong>ejcaparecida2000@gmail.com</strong><CopyPix value="ejcaparecida2000@gmail.com" /></div>
    </div></section>

    <section className="section" id="eventos"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Calendário</span><h2>Eventos futuros</h2></div><p>Datas importantes para os jovens acompanharem sem precisar entrar na área interna.</p></div>
      <div className="grid three">{events.map((event) => <article className="card event-card" key={event.id}><span className="event-date">{shortDate(event.startsAt)}</span><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}<span className="event-location">📍 {event.location || "A definir"}</span></article>)}</div>
      {!events.length && <div className="card empty">A agenda pública será atualizada em breve.</div>}
    </div></section>

    <section className="section alt" id="equipe"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Jotado</span><h2>Equipe dirigente</h2></div><p>As pessoas que ajudam a cuidar da organização, comunicação e caminhada do EJC.</p></div>
      <div className="grid team-grid">{team.map((member) => <article className="card team-card" key={member.id}>{member.photoUrl ? <Image src={member.photoUrl} width={520} height={520} alt={`Equipe dirigente - ${member.name}`} /> : null}<div className="team-caption"><strong>{member.name}</strong><span>{member.role}</span></div></article>)}</div>
    </div></section>

    <section className="section" id="instagram"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Instagram</span><h2>Acompanhe nossas páginas</h2></div><p>Direcionamento rápido para o Instagram do EJC e da Paróquia Nossa Senhora Aparecida.</p></div>
      <div className="grid two"><a className="card social-card" href="https://www.instagram.com/ejc.aparecida/" target="_blank" rel="noreferrer"><strong>EJC Nossa Senhora Aparecida</strong><span>@ejc.aparecida ↗</span></a><a className="card social-card" href="https://www.instagram.com/paroquiadeaparecida/" target="_blank" rel="noreferrer"><strong>Paróquia Nossa Senhora Aparecida</strong><span>@paroquiadeaparecida ↗</span></a></div>
    </div></section>

    <section className="section alt" id="localizacao"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Localização</span><h2>Paróquia e comunidades</h2></div><p>Onde acontecem os encontros, missas e atividades do EJC.</p></div>
      <LocationTabs locations={locations} />
    </div></section>

    <footer className="footer"><div className="container">EJC Nossa Senhora Aparecida · Valentina, João Pessoa/PB</div></footer>
  </main>;
}
