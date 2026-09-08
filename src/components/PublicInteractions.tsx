"use client";

export function CommunityGrid({
  locations,
}: {
  locations: Array<{
    id: string;
    title: string;
    type: string;
    address: string;
    mapUrl: string | null;
    query: string;
    massSchedule?: string | null;
  }>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
      }}
    >
      {locations.map((loc) => {
        let embedTarget = loc.query;
        if (loc.mapUrl) {
          const coordMatch =
            loc.mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
            loc.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordMatch) {
            embedTarget = `${coordMatch[1]},${coordMatch[2]}`;
          }
        }
        const cleanTarget = embedTarget || `${loc.title} Valentina João Pessoa`;
        const map = `https://www.google.com/maps?q=${encodeURIComponent(cleanTarget)}&z=17&output=embed`;
        const directMapsUrl =
          loc.mapUrl?.trim() ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.title}, Valentina, João Pessoa - PB`)}`;

        return (
          <article
            key={loc.id}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "20px",
              borderRadius: "16px",
              background: "#0c1322",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--brand)",
                  letterSpacing: "0.06em",
                }}
              >
                {loc.type}
              </span>
              <h3 style={{ margin: "2px 0 4px", fontSize: "1.25rem", fontWeight: 800, color: "#ffffff" }}>
                {loc.title}
              </h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                📍 {loc.address}
              </p>
            </div>

            {loc.massSchedule && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                }}
              >
                <strong style={{ display: "block", color: "#38bdf8", marginBottom: "2px", fontSize: "0.76rem" }}>
                  ⏰ Horários das Missas
                </strong>
                <span style={{ color: "var(--muted)", whiteSpace: "pre-line", lineHeight: 1.4 }}>
                  {loc.massSchedule}
                </span>
              </div>
            )}

            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                height: "190px",
                border: "1px solid var(--border)",
                width: "100%",
                marginTop: "auto",
              }}
            >
              <iframe
                title={`Mapa de ${loc.title}`}
                src={map}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            </div>

            <div style={{ marginTop: "4px" }}>
              <a
                className="button secondary"
                href={directMapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "0.84rem",
                  padding: "8px 14px",
                }}
              >
                <span>📍 Abrir no Google Maps</span>
                <span>↗</span>
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}



import { useEffect, useState } from "react";

export function ThemeToggle() {
  useEffect(() => {
    const saved = localStorage.getItem("ejc-theme");
    const value = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }, []);
  function toggle() {
    const value = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = value ? "dark" : "light";
    localStorage.setItem("ejc-theme", value ? "dark" : "light");
  }
  return <button className="icon-button" type="button" onClick={toggle} aria-label="Alternar tema">◐</button>;
}

export function PixDonationSection({
  title = "Apoie a missão do EJC",
  description = "Quem desejar contribuir com a caminhada do grupo pode fazer uma doação pelo PIX.",
  pixKey,
  beneficiary,
}: {
  title?: string;
  description?: string;
  pixKey: string;
  beneficiary?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        alignItems: "center",
        padding: "24px 28px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, rgba(13, 21, 36, 0.95), rgba(7, 11, 20, 0.98))",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
    >
      <div>
        <span className="eyebrow" style={{ color: "#38bdf8", textTransform: "uppercase", fontSize: "0.76rem", letterSpacing: "0.06em", fontWeight: 700 }}>
          Doação e Apoio Pastoral
        </span>
        <h2 style={{ margin: "4px 0 8px", fontSize: "1.5rem", color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.90rem", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      <div
        style={{
          background: "rgba(10, 16, 28, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Chave PIX
          </span>
          {beneficiary && (
            <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
              Titular: <strong style={{ color: "#cbd5e1" }}>{beneficiary}</strong>
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            padding: "8px 12px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <code style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em", wordBreak: "break-all" }}>
            {pixKey}
          </code>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={copy}
            style={{
              flexShrink: 0,
              background: copied ? "#10b981" : "var(--brand)",
              transition: "all 0.2s ease",
            }}
          >
            {copied ? "✓ Copiado!" : "Copiar Chave PIX"}
          </button>
        </div>

        <small style={{ fontSize: "0.72rem", color: "#64748b" }}>
          Copie a chave acima e use a opção PIX no aplicativo do seu banco.
        </small>
      </div>
    </div>
  );
}

export function CopyPix({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <button className="button secondary" type="button" onClick={copy}>{copied ? "Chave copiada" : "Copiar chave PIX"}</button>;
}

export function LocationTabs({
  locations,
}: {
  locations: Array<{
    id: string;
    title: string;
    type: string;
    address: string;
    mapUrl: string | null;
    query: string;
    massSchedule?: string | null;
  }>;
}) {
  const [active, setActive] = useState(locations[0]?.id);
  const location = locations.find((item) => item.id === active) || locations[0];
  if (!location) return null;
  // Resolve embed map target and universal mobile-friendly links
  let mapTarget = location.query;
  if (location.mapUrl) {
    const coordMatch = location.mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || location.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      mapTarget = `${coordMatch[1]},${coordMatch[2]}`;
    }
  }

  const cleanTarget = mapTarget || `${location.title} Valentina João Pessoa`;
  const map = `https://www.google.com/maps?q=${encodeURIComponent(cleanTarget)}&z=18&output=embed`;
  const directMapsUrl =
    location.mapUrl?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.title}, Valentina, João Pessoa - PB`)}`;
  return (
    <div className="locations">
      <div className="tabs location-tabs" role="tablist" aria-label="Escolha uma localização" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
        {locations.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={item.id === active}
            className={`button ${item.id === active ? "" : "secondary"}`}
            style={{ fontSize: "0.86rem", padding: "8px 16px" }}
            onClick={() => setActive(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <article
        className="card location-card"
        role="tabpanel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px 28px",
          borderRadius: "18px",
        }}
      >
        {/* Topo com Título, Endereço e Botões de Rota */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <span
              className="eyebrow"
              style={{
                textTransform: "uppercase",
                fontSize: "0.76rem",
                color: "var(--brand)",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              {location.type}
            </span>
            <h3 style={{ margin: "2px 0 6px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>
              {location.title}
            </h3>
            <p className="chapel-address" style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
              📍 {location.address}
            </p>
          </div>

          <a
            className="button secondary"
            href={directMapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Abrir no Google Maps</span>
            <span>↗</span>
          </a>
        </div>

        {/* Horários das Missas */}
        {location.massSchedule && (
          <div
            className="mass-schedule"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#38bdf8" }}>
              ⏰ Horários das Missas
            </strong>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)", whiteSpace: "pre-line" }}>
              {location.massSchedule}
            </p>
          </div>
        )}

        {/* Mapa em Largura Total */}
        <div
          style={{
            borderRadius: "14px",
            overflow: "hidden",
            height: "380px",
            border: "1px solid var(--border)",
            width: "100%",
            marginTop: "4px",
          }}
        >
          <iframe
            title={`Mapa de ${location.title}`}
            src={map}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        </div>
      </article>
    </div>
  );
}