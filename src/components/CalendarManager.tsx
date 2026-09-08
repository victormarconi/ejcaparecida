"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  visibility: "PUBLIC" | "MEMBERS";
  createdAt: string;
  updatedAt: string;
};

const timeZone = "America/Fortaleza";

function zonedParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function dateKey(value: string | Date) {
  const p = zonedParts(value);
  return `${p.year}-${p.month}-${p.day}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = zonedParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function CalendarManager({ initialEvents }: { initialEvents: EventItem[] }) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Current month reference
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Day detail modal state
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    dayNum: number;
    formattedDate: string;
  } | null>(null);

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS">("PUBLIC");

  // Delete modal
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate(prefillDate?: string) {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setLocation("");
    if (prefillDate) {
      setStartsAt(`${prefillDate}T19:00`);
    } else {
      const now = new Date();
      setStartsAt(toLocalInput(now.toISOString()));
    }
    setEndsAt("");
    setVisibility("PUBLIC");
    setError("");
    setModalOpen(true);
  }

  function openEdit(event: EventItem) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setLocation(event.location || "");
    setStartsAt(toLocalInput(event.startsAt));
    setEndsAt(toLocalInput(event.endsAt));
    setVisibility(event.visibility);
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: null,
        visibility,
      };

      const url = "/api/admin/calendario";
      const method = editingEvent ? "PUT" : "POST";
      const body = editingEvent
        ? JSON.stringify({ ...payload, id: editingEvent.id })
        : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar evento");

      if (editingEvent) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...data.item } : ev))
        );
      } else {
        setEvents((prev) => [data.item, ...prev]);
      }

      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingEvent) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/calendario", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingEvent.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir evento");

      setEvents((prev) => prev.filter((ev) => ev.id !== deletingEvent.id));
      setDeletingEvent(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir evento");
    } finally {
      setBusy(false);
    }
  }

  // Calendar Grid calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const rawMonthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  // Events of selected day for the modal
  const dayModalEvents = selectedDay
    ? events.filter((ev) => dateKey(ev.startsAt) === selectedDay.dateStr)
    : [];

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
          marginBottom: "18px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            Calendário Paroquial
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
            Clique em qualquer dia para ver os detalhes completos ou agendar novos compromissos.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="module-tabs" style={{ margin: 0 }}>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
            >
              Grade de Dias
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              Lista ({events.length})
            </button>
          </div>

          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={() => openCreate()}
          >
            <Plus size={16} />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* VISÃO EM GRADE DE CALENDÁRIO */}
      {viewMode === "calendar" && (
        <div className="card" style={{ padding: "20px", borderRadius: "16px", background: "var(--surface)" }}>
          {/* Navegação de Mês */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#fff", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {monthLabel}
            </h3>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-small"
                onClick={prevMonth}
                title="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-small"
                onClick={nextMonth}
                title="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div
                key={d}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.06em",
                  padding: "6px 0",
                  textTransform: "uppercase",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Células dos dias */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {/* Espaços vazios antes do 1º dia */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: "90px",
                  background: "rgba(255, 255, 255, 0.01)",
                  borderRadius: "8px",
                  opacity: 0.2,
                }}
              />
            ))}

            {/* Dias do Mês */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

              // Filtrar eventos deste dia usando fuso America/Fortaleza consistente em SSR e cliente
              const dayEvents = events.filter((ev) => dateKey(ev.startsAt) === dateStr);
              const isToday = dateStr === dateKey(new Date());

              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dayNum}
                  style={{
                    minHeight: "88px",
                    minWidth: 0,
                    overflow: "hidden",
                    background: isToday
                      ? "rgba(2, 132, 199, 0.07)"
                      : hasEvents
                      ? "rgba(56, 189, 248, 0.04)"
                      : "rgba(255, 255, 255, 0.02)",
                    border: isToday
                      ? "1px solid #0284c7"
                      : hasEvents
                      ? "1px solid rgba(56, 189, 248, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "12px",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => {
                    const d = new Date(year, month, dayNum);
                    const formattedDate = d.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });

                    if (hasEvents) {
                      setSelectedDay({ dateStr, dayNum, formattedDate });
                    } else {
                      openCreate(dateStr);
                    }
                  }}
                  title={hasEvents ? `Clique para ver ${dayEvents.length} evento(s) detalhado(s)` : "Clique para agendar evento neste dia"}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    {isToday ? (
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "var(--brand)",
                          color: "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.80rem",
                          fontWeight: 800,
                          boxShadow: "0 0 10px rgba(2, 132, 199, 0.5)",
                        }}
                      >
                        {dayNum}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: hasEvents ? "#ffffff" : "#94a3b8",
                        }}
                      >
                        {dayNum}
                      </span>
                    )}

                    {hasEvents && (
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#38bdf8",
                          boxShadow: "0 0 6px #38bdf8",
                        }}
                        title={`${dayEvents.length} evento(s)`}
                      />
                    )}
                  </div>

                  {/* Pills de Eventos Limpas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" }}>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          fontSize: "0.74rem",
                          padding: "3px 6px",
                          borderRadius: "6px",
                          background:
                            ev.visibility === "PUBLIC"
                              ? "rgba(56, 189, 248, 0.12)"
                              : "rgba(168, 85, 247, 0.12)",
                          color: ev.visibility === "PUBLIC" ? "#38bdf8" : "#c084fc",
                          border:
                            ev.visibility === "PUBLIC"
                              ? "1px solid rgba(56, 189, 248, 0.25)"
                              : "1px solid rgba(168, 85, 247, 0.25)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          width: "100%",
                          minWidth: 0,
                          maxWidth: "100%",
                          overflow: "hidden",
                          lineHeight: 1.2,
                        }}
                      >
                        <strong style={{ flexShrink: 0, fontSize: "0.70rem" }}>{formatTime(ev.startsAt)}</strong>
                        <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {ev.title}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: "0.68rem", color: "#64748b",
                  letterSpacing: "0.06em", fontWeight: 600, paddingLeft: "2px" }}>
                        + {dayEvents.length - 2} outro(s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO EM LISTA */}
      {viewMode === "list" && (
        events.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <CalendarIcon size={42} style={{ color: "#64748b", margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.1rem" }}>
              Nenhum evento agendado
            </h3>
            <p style={{ margin: "0 0 16px", color: "#64748b",
                  letterSpacing: "0.06em", fontSize: "0.88rem" }}>
              Cadastre missas, encontros, reuniões de equipes ou eventos públicos.
            </p>
            <button
              type="button"
              className="pdm-btn-primary pdm-btn-compact"
              onClick={() => openCreate()}
            >
              <Plus size={15} />
              <span>Agendar Primeiro Evento</span>
            </button>
          </div>
        ) : (
          <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Data & Horário</th>
                  <th>Local</th>
                  <th>Visibilidade</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ color: "#f8fafc", fontSize: "0.92rem" }}>
                          {ev.title}
                        </strong>
                        {ev.description && (
                          <small style={{ color: "#64748b",
                  letterSpacing: "0.06em", fontSize: "0.78rem" }}>
                            {ev.description.slice(0, 65)}
                            {ev.description.length > 65 ? "..." : ""}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <CalendarIcon size={12} style={{ color: "#38bdf8" }} />
                          <strong>{formatDate(ev.startsAt)}</strong>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b",
                  letterSpacing: "0.06em", fontSize: "0.78rem", marginTop: "2px" }}>
                          <Clock size={12} />
                          <span>
                            {formatTime(ev.startsAt)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {ev.location ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", color: "#cbd5e1" }}>
                          <MapPin size={13} style={{ color: "#f87171" }} />
                          <span>{ev.location}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#64748b" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="pdm-badge"
                        style={{
                          background:
                            ev.visibility === "PUBLIC"
                              ? "rgba(14, 165, 233, 0.12)"
                              : "rgba(168, 85, 247, 0.12)",
                          color: ev.visibility === "PUBLIC" ? "#38bdf8" : "#c084fc",
                          borderColor:
                            ev.visibility === "PUBLIC"
                              ? "rgba(14, 165, 233, 0.25)"
                              : "rgba(168, 85, 247, 0.25)",
                        }}
                      >
                        {ev.visibility === "PUBLIC" ? (
                          <>
                            <Globe size={11} /> Público
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> Apenas Membros
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          className="table-action-btn edit"
                          onClick={() => openEdit(ev)}
                          title="Editar evento"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          className="table-action-btn delete"
                          onClick={() => setDeletingEvent(ev)}
                          title="Excluir evento"
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
        )
      )}

      {/* MODAL DETALHADO DOS EVENTOS DO DIA AO CLICAR NO DIA */}
      <PdmModal
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={`Eventos de ${selectedDay ? selectedDay.formattedDate : ""}`}
        subtitle={`${dayModalEvents.length} compromisso(s) agendado(s) neste dia.`}
        maxWidth="620px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="pdm-btn-primary pdm-btn-compact"
              onClick={() => {
                const d = selectedDay?.dateStr;
                setSelectedDay(null);
                openCreate(d);
              }}
            >
              <Plus size={15} />
              <span>Adicionar Outro Evento Neste Dia</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
            {dayModalEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#fff", fontWeight: 700 }}>
                      {ev.title}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.80rem",
                          color: "#38bdf8",
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={13} />
                        {formatTime(ev.startsAt)}
                      </span>

                      {ev.location && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.80rem",
                            color: "#cbd5e1",
                          }}
                        >
                          <MapPin size={13} style={{ color: "#f87171" }} />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="pdm-badge"
                    style={{
                      background:
                        ev.visibility === "PUBLIC"
                          ? "rgba(14, 165, 233, 0.12)"
                          : "rgba(168, 85, 247, 0.12)",
                      color: ev.visibility === "PUBLIC" ? "#38bdf8" : "#c084fc",
                      borderColor:
                        ev.visibility === "PUBLIC"
                          ? "rgba(14, 165, 233, 0.25)"
                          : "rgba(168, 85, 247, 0.25)",
                    }}
                  >
                    {ev.visibility === "PUBLIC" ? "Público" : "Membros"}
                  </span>
                </div>

                {ev.description && (
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b",
                  letterSpacing: "0.06em", lineHeight: 1.4 }}>
                    {ev.description}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="table-action-btn edit"
                    onClick={() => {
                      setSelectedDay(null);
                      openEdit(ev);
                    }}
                  >
                    <Edit2 size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="table-action-btn delete"
                    onClick={() => {
                      setSelectedDay(null);
                      setDeletingEvent(ev);
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setSelectedDay(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      </PdmModal>

      {/* MODAL PADRÃO PDM1 DE CRIAR / EDITAR EVENTO */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? "Editar Evento" : "Novo Evento"}
        subtitle="Agende compromissos pastorais com início, término e local."
        maxWidth="600px"
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="field">
            Título do Evento *
            <input
              required
              maxLength={160}
              placeholder="Ex: Missa de Entrega, Reunião de Equipe, Gincana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "12px" }}>
            <label className="field">
              Data & Horário *
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label className="field">
              Local do Evento
              <input
                placeholder="Ex: Salão Paroquial / Igreja Matriz"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            Visibilidade do Evento *
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "MEMBERS")}
            >
              <option value="PUBLIC">Público (Visível no site)</option>
              <option value="MEMBERS">Apenas Membros Internos</option>
            </select>
          </label>

          <label className="field">
            Descrição / Pauta
            <textarea
              rows={3}
              placeholder="Informações adicionais sobre o encontro..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {busy ? "Salvando..." : editingEvent ? "Salvar Alterações" : "Agendar Evento"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Evento"
        message={`Tem certeza que deseja cancelar e excluir o evento "${deletingEvent?.title}"?`}
        confirmLabel="Sim, excluir"
        busy={busy}
      />
    </div>
  );
}
