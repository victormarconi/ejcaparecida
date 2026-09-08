import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(true);
  const [notices, events, team, finance, locations, assets, campaigns] = await Promise.all([
    prisma.notice.count(),
    prisma.event.count(),
    prisma.teamMember.count(),
    prisma.financeEntry.count(),
    prisma.location.count(),
    prisma.inventoryItem.count(),
    prisma.formCampaign.count(),
  ]);

  const cards = [
    ["Formulários", campaigns, "/admin/formularios", "Inscrições e coletas ativas"],
    ["Calendário", events, "/admin/calendario", "Eventos paroquiais e pastorais"],
    ["Finanças", finance, "/admin/financas", "Fluxo de caixa e lançamentos"],
    ["Estoque", assets, "/admin/estoque", "Itens e patrimônio cadastrado"],
    ["Equipe Dirigente", team, "/admin/equipe", "Membros da liderança pastoral"],
    ["Avisos & Murais", notices, "/admin/avisos", "Comunicados e recados públicos"],
    ["Localizações", locations, "/admin/localizacoes", "Comunidades e capelas"],
  ] as const;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px", color: "var(--text)" }}>
          Visão Geral
        </h2>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)" }}>
          Acesso rápido aos módulos administrativos da Paróquia Nossa Senhora Aparecida e do EJC.
        </p>
      </div>

      <div className="grid three">
        {cards.map(([label, count, href, desc]) => (
          <Link
            className="card kpi"
            href={href}
            key={href}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "20px",
              borderRadius: "14px",
              textDecoration: "none",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
              {label}
            </span>
            <strong style={{ fontSize: "2rem", color: "var(--text)", fontWeight: 800, lineHeight: 1 }}>
              {count}
            </strong>
            <small style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "4px" }}>
              {desc}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}
