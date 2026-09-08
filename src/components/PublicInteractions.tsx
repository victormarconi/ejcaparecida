"use client";

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
  const map = `https://www.google.com/maps?q=${encodeURIComponent(location.query)}&z=18&output=embed`;
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
      <article className="card location-card" role="tabpanel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", padding: "24px", borderRadius: "16px" }}>
        <div>
          <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.78rem", color: "var(--brand)" }}>{location.type}</span>
          <h3 style={{ margin: "4px 0 8px", fontSize: "1.35rem" }}>{location.title}</h3>
          <p className="chapel-address" style={{ margin: "0 0 14px", color: "var(--muted)" }}>📍 {location.address}</p>
          {location.massSchedule && (
            <div className="mass-schedule" style={{ marginTop: "12px", background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem" }}>Horários das Missas</strong>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--muted)", whiteSpace: "pre-line" }}>{location.massSchedule}</p>
            </div>
          )}
          <div style={{ marginTop: "18px" }}>
            <a
              className="button secondary"
              href={location.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.query)}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>Abrir no Google Maps</span>
              <span>↗</span>
            </a>
          </div>
        </div>
        <div style={{ borderRadius: "12px", overflow: "hidden", minHeight: "320px", border: "1px solid var(--border)" }}>
          <iframe
            title={`Mapa de ${location.title}`}
            src={map}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: "100%", height: "100%", minHeight: "320px", border: 0, display: "block" }}
          />
        </div>
      </article>
    </div>
  );
}