import Image from "next/image";
import Link from "next/link";
import { CampaignForm } from "@/components/CampaignForm";
import { PublicCalendar } from "@/components/PublicCalendar";
import { CopyPix, ThemeToggle } from "@/components/PublicInteractions";
import { parseFormFields } from "@/lib/forms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const publicDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" });

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function HomePage() {
  const now = new Date();
  const [campaign, notices, events, team, locations] = await Promise.all([
    prisma.formCampaign.findFirst({
      where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notice.findMany({
      where: { published: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: [{ highlight: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.event.findMany({ where: { visibility: "PUBLIC" }, orderBy: { startsAt: "asc" }, take: 500 }),
    prisma.teamMember.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
  ]);
  const campaignFields = campaign ? parseFormFields(campaign.fieldsJson) : [];
  const serializedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() || null,
  }));

  return <main>
    <header className="topbar"><div className="container topbar-inner">
      <Link className="brand" href="/"><Image src="/uploads/logo-ejc.png" width={34} height={34} alt="" /><span>EJC Nossa Senhora Aparecida</span></Link>
      <nav className="public-nav" aria-label="Navegação pública">
        {campaign && <a href="#inscricoes">Inscrições</a>}<a href="#eventos">Calendário</a><a href="#equipe">Equipe</a><a href="#localizacao">Localização</a>
        <ThemeToggle /><Link className="button small" href="/login">Área interna</Link>
      </nav>
    </div></header>

    {campaign && <section className={`campaign-hero${campaign.bannerUrl ? " has-banner" : ""}`} id="inscricoes"><div className="container campaign-layout">
      {campaign.bannerUrl && <div className="campaign-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={campaign.bannerUrl} alt={`Banner: ${campaign.title}`} />
      </div>}
      <div className="campaign-copy"><span className="eyebrow">Inscrições e pedidos</span><h1>{campaign.title}</h1>{campaign.description && <p>{campaign.description}</p>}<CampaignForm campaignId={campaign.id} fields={campaignFields} /></div>
    </div></section>}

    <section className={`section calendar-section${campaign ? "" : " first-section"}`} id="eventos"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Calendário</span>{campaign ? <h2>Calendário público</h2> : <h1>Calendário público</h1>}</div><p>Datas importantes para acompanhar a caminhada do EJC e da comunidade.</p></div>
      <PublicCalendar events={serializedEvents} initialMonth={publicDate.format(now)} now={now.toISOString()} />
    </div></section>

    {notices.length > 0 && <section className="section alt" id="avisos"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Avisos</span><h2>O que está acontecendo</h2></div><p>Comunicados, campanhas e informações importantes para a comunidade.</p></div>
      <div className="grid two">{notices.map((notice) => <article className="card notice-card" key={notice.id}>
        {notice.assetUrl ? <Image src={notice.assetUrl} width={640} height={480} alt={notice.title} /> : <div className="notice-placeholder" aria-hidden="true" />}
        <div className="notice-content"><span className="eyebrow">{notice.type}</span><h3>{notice.title}</h3><p>{notice.summary}</p>{notice.content && <p>{notice.content}</p>}</div>
      </article>)}</div>
    </div></section>}

    <section className="section" id="equipe"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Jotado</span><h2>Equipe dirigente</h2></div><p>As pessoas que cuidam da organização, comunicação e caminhada pastoral do EJC.</p></div>
      <div className="grid team-grid">{team.map((member) => <article className="card team-card" key={member.id}>
        {member.photoUrl ? <Image src={member.photoUrl} width={520} height={520} alt={`Foto de ${member.name}, ${member.role}`} /> : <div className="team-fallback" aria-hidden="true">{initials(member.name)}</div>}
        <div className="team-caption"><strong>{member.name}</strong><span>{member.role}</span></div>
      </article>)}</div>
      {!team.length && <div className="card empty">A equipe dirigente será apresentada em breve.</div>}
    </div></section>

    <section className="section alt"><div className="container donation">
      <div className="card"><span className="eyebrow">Doação</span><h2>Apoie a missão do EJC</h2><p>Quem desejar contribuir com a caminhada do grupo pode fazer uma doação pelo PIX.</p></div>
      <div className="card pix-card"><span>PIX</span><strong>ejcaparecida2000@gmail.com</strong><CopyPix value="ejcaparecida2000@gmail.com" /></div>
    </div></section>

    <section className="section" id="instagram"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Instagram</span><h2>Acompanhe nossas páginas</h2></div><p>Direcionamento rápido para o Instagram do EJC e da Paróquia Nossa Senhora Aparecida.</p></div>
      <div className="grid two"><a className="card social-card" href="https://www.instagram.com/ejc.aparecida/" target="_blank" rel="noreferrer"><strong>EJC Nossa Senhora Aparecida</strong><span>@ejc.aparecida ↗</span></a><a className="card social-card" href="https://www.instagram.com/paroquiadeaparecida/" target="_blank" rel="noreferrer"><strong>Paróquia Nossa Senhora Aparecida</strong><span>@paroquiadeaparecida ↗</span></a></div>
    </div></section>

    <section className="section alt" id="localizacao"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Localização</span><h2>Paróquia e comunidades</h2></div><p>Endereços estáveis para chegar às celebrações, encontros e atividades.</p></div>
      <div className="location-grid">{locations.map((location) => <article className="card chapel-card" key={location.id}>
        <span className="eyebrow">{location.type}</span><h3>{location.title}</h3><p className="chapel-address">📍 {location.address}</p>
        <div className="mass-schedule"><strong>Horários das missas</strong><p>{location.massSchedule || "Consulte a programação atual da paróquia."}</p></div>
        <a className="button secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.query)}`} target="_blank" rel="noreferrer">Ver no Google Maps ↗</a>
      </article>)}</div>
      {!locations.length && <div className="card empty">As localizações serão atualizadas em breve.</div>}
    </div></section>

    <footer className="footer"><div className="container">EJC Nossa Senhora Aparecida · Valentina, João Pessoa/PB</div></footer>
  </main>;
}
