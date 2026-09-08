"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Calendar,
  FileText,
  DollarSign,
  Bell,
  Users,
  MapPin,
  Package,
  KeyRound,
  LogOut,
  Sparkles,
} from "lucide-react";

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: string; username?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Menu organizado em seções limpas estilo Gestor PDM1 (sem duplicidades)
  const navSections = [
    {
      title: "Principal",
      items: [
        { label: "Calendário", href: "/admin/calendario", icon: Calendar },
        { label: "Documentos", href: "/membros/documentos", icon: FileText },
      ],
    },
    {
      title: "Gestão & Paróquia",
      items: [
        { label: "Finanças", href: "/admin/financas", icon: DollarSign },
        { label: "Avisos & Murais", href: "/admin/avisos", icon: Bell },
        { label: "Equipe Dirigente", href: "/admin/equipe", icon: Users },
        { label: "Formulários", href: "/admin/formularios", icon: Sparkles },
        { label: "Estoque", href: "/admin/estoque", icon: Package },
        { label: "Localizações", href: "/admin/localizacoes", icon: MapPin },
      ],
    },
  ];

const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="ejc-layout">
      {/* SIDEBAR COM SCROLL INDEPENDENTE E ESTILO GESTOR PDM1 */}
      <aside className="ejc-sidebar" ref={sidebarRef} style={{ scrollTop: 0 } as any}>
        {/* Brand */}
        <div className="ejc-sidebar-brand">
          <Link href="/admin/calendario" className="brand-link">
            <Image
              src="/uploads/logo-ejc-white.png"
              width={34}
              height={34}
              alt="Logo EJC"
              className="brand-logo"
            />
            <div className="brand-text">
              <span className="brand-title">EJC Aparecida</span>
              <span className="brand-badge">Painel Oficial</span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="ejc-nav" aria-label="Menu do Sistema">
          {navSections.map((section) => (
            <div key={section.title} className="ejc-nav-section">
              <span className="ejc-nav-heading">{section.title}</span>
              <div className="ejc-nav-group">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`ejc-nav-link ${isActive ? "is-active" : ""}`}
                    >
                      <Icon size={18} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Seção Conta */}
          <div className="ejc-nav-section">
            <span className="ejc-nav-heading">Segurança</span>
            <div className="ejc-nav-group">
              <Link
                href="/perfil"
                className={`ejc-nav-link ${pathname === "/perfil" ? "is-active" : ""}`}
              >
                <KeyRound size={18} className="nav-icon" />
                <span className="nav-label">Alterar Senha</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="ejc-sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "EJ"}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.username === "financas"
                  ? "Financeiro"
                  : "Equipe Geral"}
              </span>
            </div>
          </div>
          <form action="/api/logout" method="post" className="logout-form">
            <button
              type="submit"
              className="logout-button"
              title="Sair da Conta"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL COM SCROLL FLUIDO */}
      <main className="ejc-main">
        <header className="ejc-topbar">
          <div className="topbar-left">
            <span className="status-dot" />
            <span className="portal-label">EJC Nossa Senhora Aparecida</span>
          </div>
          <div className="topbar-right">
            <Link className="topbar-btn primary" href="/" target="_blank">
              <span>Abrir Site</span>
            </Link>
          </div>
        </header>

        <div className="ejc-content">{children}</div>
      </main>
    </div>
  );
}
