"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon, Lightbulb } from "lucide-react";

export type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  color?: string | null;
};

const timeZone = "America/Fortaleza";
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  sky: { bg: "rgba(2, 132, 199, 0.15)", border: "rgba(2, 132, 199, 0.3)", text: "#38bdf8", dot: "#38bdf8", label: "Geral" },
  paroquia: { bg: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc", dot: "#c084fc", label: "Paróquia" },
  emerald: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.35)", text: "#34d399", dot: "#34d399", label: "Pastoral" },
  gold: { bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.35)", text: "#facc15", dot: "#facc15", label: "Vendas" },
  amber: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.35)", text: "#fbbf24", dot: "#fbbf24", label: "Festa" },
  luto: { bg: "rgba(15, 23, 42, 0.95)", border: "rgba(255, 255, 255, 0.4)", text: "#f8fafc", dot: "#ffffff", label: "Homenagem" },
  preto: { bg: "rgba(15, 23, 42, 0.95)", border: "rgba(255, 255, 255, 0.4)", text: "#f8fafc", dot: "#ffffff", label: "Homenagem" },
  purple: { bg: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc", dot: "#c084fc", label: "Solene" },
  rose: { bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.35)", text: "#fb7185", dot: "#fb7185", label: "Mariano" },
};

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
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function dateKey(value: string | Date) {
  const parts = zonedParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function eventTime(value: string) {
  const parts = zonedParts(value);
  return `${parts.hour}:${parts.minute}`;
}

function formatDayParts(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone });
  const month = d.toLocaleDateString("pt-BR", { month: "short", timeZone }).toUpperCase().replace(".", "");
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone });
  return { day, month, weekday };
}

export function PublicCalendar({
  events,
  initialMonth,
  now,
}: {
  events: PublicEvent[];
  initialMonth: string;
  now: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    dayNum: number;
    formattedDate: string;
  } | null>(null);

  const [year, month] = useMemo(
    () => currentMonth.split("-").map((v) => Number(v)),
    [currentMonth]
  );

  const monthLabel = useMemo(() => {
    const d = new Date(Date.UTC(year, month - 1, 1));
    const raw = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PublicEvent[]>();
    for (const event of events) {
      const key = dateKey(event.startsAt);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const todayKey = useMemo(() => dateKey(now), [now]);

  // Próximos 4 eventos a partir de hoje
  const upcomingEvents = useMemo(() => {
    const nowDate = new Date(now);
    // Include events from today onwards
    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    return events
      .filter((e) => new Date(e.startsAt) >= startOfToday)
      .slice(0, 4);
  }, [events, now]);

  const cells = useMemo(() => {
    const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const result: Array<{
      key: string;
      day: number | null;
      dateKey: string | null;
      today: boolean;
      events?: PublicEvent[];
    }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ key: `lead-${i}`, day: null, dateKey: null, today: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({
        key: `day-${d}`,
        day: d,
        dateKey: key,
        today: key === todayKey,
        events: eventsByDate.get(key) || [],
      });
    }

    while (result.length % 7 !== 0) {
      result.push({ key: `tail-${result.length}`, day: null, dateKey: null, today: false });
    }

    return result;
  }, [year, month, eventsByDate, todayKey]);

  function prevMonth() {
    const d = new Date(Date.UTC(year, month - 2, 1));
    setCurrentMonth(d.toISOString().slice(0, 7));
  }

  function nextMonth() {
    const d = new Date(Date.UTC(year, month, 1));
    setCurrentMonth(d.toISOString().slice(0, 7));
  }

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate.get(selectedDay.dateStr) || [];
  }, [selectedDay, eventsByDate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* CARD DO CALENDÁRIO MENSAL */}
      <div
        className="card"
        style={{
          background: "#0c1322",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          padding: "20px 24px",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Barra de Navegação do Mês (100% Centralizada no Celular e Desktop) */}
        <div
          className="cal-month-nav"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "8px",
          }}
        >
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={prevMonth}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
            <span className="cal-btn-text">Anterior</span>
          </button>

          <h3
            style={{
              margin: 0,
              fontSize: "clamp(1.05rem, 3.8vw, 1.35rem)",
              fontWeight: 800,
              color: "var(--gold)",
              letterSpacing: "-0.01em",
              textAlign: "center",
              flex: 1,
            }}
          >
            {monthLabel}
          </h3>

          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={nextMonth}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
            aria-label="Próximo mês"
          >
            <span className="cal-btn-text">Próximo</span>
            <ChevronRight size={16} />
          </button>
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
          {weekdays.map((day) => (
            <div
              key={day}
              style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "6px 0",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células dos dias do mês */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "6px",
          }}
        >
          {cells.map((cell) => {
            const hasEvents = Boolean(cell.events && cell.events.length > 0);
            return (
              <div
                key={cell.key}
                className="public-calendar-day"
                style={{
                  minHeight: "88px",
                  padding: "6px 8px",
                  borderRadius: "10px",
                  border: cell.today
                    ? "1px solid #0284c7"
                    : hasEvents
                    ? "1px solid rgba(56, 189, 248, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                  background: cell.today
                    ? "rgba(2, 132, 199, 0.10)"
                    : hasEvents
                    ? "rgba(56, 189, 248, 0.04)"
                    : "rgba(10, 16, 28, 0.6)",
                  cursor: hasEvents ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: 0,
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                }}
                onClick={() => {
                  if (!cell.day || !hasEvents) return;
                  const d = new Date(year, month - 1, cell.day);
                  const formattedDate = d.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                  const key = `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                  setSelectedDay({ dateStr: key, dayNum: cell.day, formattedDate });
                }}
                title={hasEvents ? `Toque para ver ${cell.events?.length} compromisso(s)` : ""}
              >
                {cell.day && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {cell.today ? (
                        <span
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "var(--brand)",
                            color: "#ffffff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                          }}
                        >
                          {cell.day}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.80rem",
                            fontWeight: 700,
                            color: hasEvents ? "#ffffff" : "var(--muted)",
                          }}
                        >
                          {cell.day}
                        </span>
                      )}


                    </div>

                    {/* Visualização Desktop: Pills com horário e nome do evento */}
                    <div className="calendar-desktop-events">
                      {cell.events?.slice(0, 2).map((event) => {
                        const col = EVENT_COLORS[event.color || "sky"] || EVENT_COLORS.sky;
                        return (
                          <div
                            key={event.id}
                            style={{
                              fontSize: "0.72rem",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              background: col.bg,
                              color: col.text,
                              border: `1px solid ${col.border}`,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              width: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: col.dot, flexShrink: 0 }} />
                            <strong style={{ flexShrink: 0 }}>{eventTime(event.startsAt)}</strong>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {event.title}
                            </span>
                          </div>
                        );
                      })}
                      {cell.events && cell.events.length > 2 && (
                        <span style={{ fontSize: "0.68rem", color: "var(--brand)", fontWeight: 700, paddingLeft: "4px" }}>
                          +{cell.events.length - 2} mais
                        </span>
                      )}
                    </div>

                    {/* Visualização Mobile: Apenas os pontos de luz (dots) coloridos para não poluir */}
                    <div className="calendar-mobile-dots">
                      {cell.events?.slice(0, 3).map((event) => {
                        const col = EVENT_COLORS[event.color || "sky"] || EVENT_COLORS.sky;
                        return (
                          <span
                            key={event.id}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: col.dot,
                              boxShadow: `0 0 6px ${col.dot}`,
                              display: "inline-block",
                            }}
                          />
                        );
                      })}
                      {cell.events && cell.events.length > 3 && (
                        <span style={{ fontSize: "0.60rem", color: "var(--brand)", fontWeight: 800 }}>
                          +
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Nota Explicativa para o Visitante */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "0.78rem",
            color: "var(--muted)",
          }}
        >
          <Lightbulb size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
          <span>
            Toque ou clique em qualquer dia destacado no calendário para ver a programação e horários detalhados.
          </span>
        </div>
      </div>

      {/* SEÇÃO: PRÓXIMOS EVENTOS (Ideal para celular e leitura rápida) */}
      {upcomingEvents.length > 0 && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: 800, color: "var(--gold)" }}>
              Próximos Eventos
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
              Aqui estão os próximos compromissos da paróquia e do EJC. Para consultar o calendário completo de outros meses, navegue na grade acima.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {upcomingEvents.map((event) => {
              const col = EVENT_COLORS[event.color || "sky"] || EVENT_COLORS.sky;
              const dateParts = formatDayParts(event.startsAt);

              return (
                <article
                  key={event.id}
                  className="card"
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    background: "#0c1322",
                    border: `1px solid ${col.border}`,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                  onClick={() => {
                    const d = new Date(event.startsAt);
                    const formattedDate = d.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });
                    const key = dateKey(event.startsAt);
                    setSelectedDay({ dateStr: key, dayNum: d.getDate(), formattedDate });
                  }}
                >
                  {/* Badge da Data */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "52px",
                      height: "56px",
                      borderRadius: "10px",
                      background: col.bg,
                      border: `1px solid ${col.border}`,
                      color: col.text,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {dateParts.month}
                    </span>
                    <strong style={{ fontSize: "1.25rem", fontWeight: 900, lineHeight: 1 }}>
                      {dateParts.day}
                    </strong>
                    <span style={{ fontSize: "0.62rem", opacity: 0.8, textTransform: "capitalize" }}>
                      {dateParts.weekday}
                    </span>
                  </div>

                  {/* Informações do Evento */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: col.bg,
                          color: col.text,
                        }}
                      >
                        {col.label}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={12} />
                        {eventTime(event.startsAt)}
                      </span>
                    </div>

                    <strong style={{ fontSize: "0.95rem", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </strong>

                    {event.location && (
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL PADRÃO DE DETALHES DO DIA SELECIONADO */}
      {selectedDay && (
        <div
          className="pdm-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDay(null);
          }}
        >
          <div
            className="pdm-modal-card pdm-modal-panel"
            style={{ maxWidth: "560px", padding: "20px 24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "14px",
                marginBottom: "16px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.76rem", color: "var(--brand)", textTransform: "uppercase", fontWeight: 700 }}>
                  Compromissos do Dia
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.25rem", color: "#ffffff", textTransform: "capitalize" }}>
                  {selectedDay.formattedDate}
                </h3>
              </div>
              <button
                type="button"
                className="pdm-modal-close"
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
              {selectedDayEvents.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                  Nenhum compromisso marcado para este dia.
                </p>
              ) : (
                selectedDayEvents.map((ev) => {
                  const col = EVENT_COLORS[ev.color || "sky"] || EVENT_COLORS.sky;
                  return (
                    <div
                      key={ev.id}
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: `1px solid ${col.border}`,
                        borderRadius: "12px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "1.05rem", color: "#ffffff" }}>
                          {ev.title}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: col.bg,
                            color: col.text,
                            border: `1px solid ${col.border}`,
                          }}
                        >
                          {col.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--muted)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={13} style={{ color: col.text }} />
                          {eventTime(ev.startsAt)}
                        </span>
                        {ev.location && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} style={{ color: col.text }} />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.45 }}>
                          {ev.description}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-compact"
                onClick={() => setSelectedDay(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
