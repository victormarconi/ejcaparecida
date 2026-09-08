"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Map, ExternalLink } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";

export type LocationItem = {
  id: string;
  type: string;
  title: string;
  address: string;
  query: string;
  mapUrl: string | null;
  massSchedule: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function LocationsManager({ initialLocations }: { initialLocations: LocationItem[] }) {
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocationItem | null>(null);

  // Form state
  const [type, setType] = useState("Comunidade");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [massSchedule, setMassSchedule] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  // Map preview modal
  const [viewingMap, setViewingMap] = useState<LocationItem | null>(null);

  // Delete modal
  const [deletingItem, setDeletingItem] = useState<LocationItem | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingItem(null);
    setType("Comunidade");
    setTitle("");
    setAddress("");
    setQuery("");
    setMapUrl("");
    setMassSchedule("");
    setSortOrder(String(locations.length + 1));
    setError("");
    setModalOpen(true);
  }

  function openEdit(loc: LocationItem) {
    setEditingItem(loc);
    setType(loc.type);
    setTitle(loc.title);
    setAddress(loc.address);
    setQuery(loc.query);
    setMapUrl(loc.mapUrl || "");
    setMassSchedule(loc.massSchedule || "");
    setSortOrder(String(loc.sortOrder));
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        type: type.trim(),
        title: title.trim(),
        address: address.trim(),
        query: query.trim() || `${title.trim()} Valentina`,
        mapUrl: mapUrl.trim() || null,
        massSchedule: massSchedule.trim() || null,
        sortOrder: Number(sortOrder),
      };

      const url = "/api/admin/localizacoes";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem ? JSON.stringify({ ...payload, id: editingItem.id }) : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar localização");

      if (editingItem) {
        setLocations((prev) =>
          prev.map((l) => (l.id === editingItem.id ? { ...l, ...data.item } : l))
        );
      } else {
        setLocations((prev) => [...prev, data.item]);
      }

      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingItem) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/localizacoes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingItem.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir localização");

      setLocations((prev) => prev.filter((l) => l.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* CABEÇALHO PADRÃO PDM1 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            Localizações & Capelas
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
            Gerencie a matriz, comunidades, endereços, horários de missas e integração com Google Maps.
          </p>
        </div>
        <button
          type="button"
          className="pdm-btn-primary pdm-btn-compact"
          onClick={openCreate}
        >
          <Plus size={16} />
          <span>Nova Localização</span>
        </button>
      </div>

      {/* TABELA DE LOCALIZAÇÕES */}
      <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
        <table>
          <thead>
            <tr>
              <th>Localização</th>
              <th>Endereço</th>
              <th>Horários de Missas</th>
              <th>Mapa</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "#fff", fontSize: "0.92rem" }}>{loc.title}</strong>
                      <span
                        className="pdm-badge"
                        style={{
                          background: loc.type === "Paróquia" ? "rgba(2, 132, 199, 0.15)" : "rgba(255, 255, 255, 0.06)",
                          color: loc.type === "Paróquia" ? "#38bdf8" : "#cbd5e1",
                          fontSize: "0.72rem",
                        }}
                      >
                        {loc.type}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#cbd5e1", fontSize: "0.82rem" }}>
                    <MapPin size={13} style={{ color: "#f87171" }} />
                    <span>{loc.address}</span>
                  </div>
                </td>
                <td>
                  {loc.massSchedule ? (
                    <span style={{ fontSize: "0.80rem", color: "#94a3b8", whiteSpace: "pre-line" }}>
                      {loc.massSchedule.slice(0, 60)}{loc.massSchedule.length > 60 ? "..." : ""}
                    </span>
                  ) : (
                    <span style={{ color: "#64748b" }}>—</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="table-action-btn"
                    style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#34d399",
                      borderColor: "rgba(16, 185, 129, 0.25)",
                    }}
                    onClick={() => setViewingMap(loc)}
                  >
                    <Map size={13} />
                    <span>Ver Mapa</span>
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="table-action-btn edit"
                      onClick={() => openEdit(loc)}
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className="table-action-btn delete"
                      onClick={() => setDeletingItem(loc)}
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DO GOOGLE MAPS */}
      <PdmModal
        open={Boolean(viewingMap)}
        onClose={() => setViewingMap(null)}
        title={`Mapa: ${viewingMap?.title || ""}`}
        subtitle={viewingMap?.address ? `Endereço: ${viewingMap.address}` : ""}
        maxWidth="740px"
      >
        {viewingMap && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.12)", minHeight: "360px" }}>
              <iframe
                title={`Mapa de ${viewingMap.title}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                (() => {
                  if (viewingMap.mapUrl) {
                    const m = viewingMap.mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || viewingMap.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (m) return `${m[1]},${m[2]}`;
                  }
                  return viewingMap.query;
                })()
              )}&z=18&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ width: "100%", height: "100%", minHeight: "360px", border: 0, display: "block" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <a
                href={
                  viewingMap.mapUrl?.trim() ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${viewingMap.title}, Valentina, João Pessoa - PB`)}`
                }
                target="_blank"
                rel="noreferrer"
                className="pdm-btn-primary pdm-btn-compact"
              >
                <ExternalLink size={14} />
                <span>Abrir no Google Maps Oficial</span>
              </a>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-compact"
                onClick={() => setViewingMap(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </PdmModal>

      {/* MODAL PADRÃO PDM1 DE CRIAR / EDITAR LOCALIZAÇÃO */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Editar Localização" : "Nova Localização"}
        subtitle="Informe o nome, tipo, endereço e busca no Google Maps."
        maxWidth="600px"
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px" }}>
            <label className="field">
              Tipo *
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Paróquia">Paróquia</option>
                <option value="Comunidade">Comunidade</option>
                <option value="Capela">Capela</option>
              </select>
            </label>
            <label className="field">
              Título / Nome do Local *
              <input
                required
                placeholder="Ex: Comunidade São Sebastião"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            Endereço / Bairro *
            <input
              required
              placeholder="Ex: R. Francisco Alves Rodrigues, Valentina, João Pessoa"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              Termo de Busca Google Maps *
              <input
                required
                placeholder="Ex: Comunidade São Sebastião Valentina"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="field">
              Link Direto do Maps (Opcional)
              <input
                placeholder="https://maps.app.goo.gl/..."
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            Horários das Missas
            <textarea
              rows={2}
              placeholder="Ex: Domingos às 08h e 19h..."
              value={massSchedule}
              onChange={(e) => setMassSchedule(e.target.value)}
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pdm-btn-primary pdm-btn-compact"
              disabled={busy}
            >
              {busy ? "Salvando..." : editingItem ? "Salvar Alterações" : "Cadastrar Local"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Localização"
        message={`Tem certeza que deseja excluir "${deletingItem?.title}"?`}
        confirmLabel="Sim, excluir"
        busy={busy}
      />
    </div>
  );
}
