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

export function LocationTabs({ locations }: { locations: Array<{ id: string; title: string; type: string; address: string; mapUrl: string | null; query: string }> }) {
  const [active, setActive] = useState(locations[0]?.id);
  const location = locations.find((item) => item.id === active) || locations[0];
  if (!location) return null;
  const map = `https://www.google.com/maps?q=${encodeURIComponent(location.query)}&z=18&output=embed`;
  return <div className="locations">
    <div className="tabs" role="tablist" aria-label="Escolha uma localização">
      {locations.map((item) => <button key={item.id} role="tab" aria-selected={item.id === active} className={item.id === active ? "active" : ""} onClick={() => setActive(item.id)}>{item.title}</button>)}
    </div>
    <article className="location-card" role="tabpanel">
      <div><span className="eyebrow">{location.type}</span><h3>{location.title}</h3><p>{location.address}</p>{location.mapUrl && <a className="button secondary" href={location.mapUrl} target="_blank" rel="noreferrer">Ver rota no Google Maps</a>}</div>
      <iframe title={`Mapa de ${location.title}`} src={map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </article>
  </div>;
}
