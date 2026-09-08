"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";

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

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  sky: { bg: "rgba(2, 132, 199, 0.15)", border: "rgba(2, 132, 199, 0.3)", text: "#38bdf8", dot: "#38bdf8" },
  paroquia: { bg: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc", dot: "#c084fc" },
  emerald: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.35)", text: "#34d399", dot: "#34d399" },
  gold: { bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.35)", text: "#facc15", dot: "#facc15" },
  amber: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.35)", text: "#fbbf24", dot: "#fbbf24" },
  purple: { bg: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc", dot: "#c084fc" },
  rose: { bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.35)", text: "#fb7185", dot: "#fb7185" },
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
  return new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function PublicCalendar({ events, initialMonth, now }: { events: PublicEvent[]; initialMonth: string; now: string }) {
  const [visibleMonth, setVisibleMonth] = useState(initialMonth.slice(0, 7));
  const [year, month] = visibleMonth.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  
  const rawMonthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay);
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  // Selected day for modal
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    dayNum: number;
    formattedDate: string;
  } | null>(null);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, PublicEvent[]>();
    for (const event of events) {
      const key = dateKey(event.startsAt);
      grouped.set(key, [...(grouped.get(key) || []), event]);
    }
    return grouped;
  }, [events]);

  function move(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setVisibleMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  const cells: Array<{ key: string; day?: number; events?: PublicEvent[]; today?: boolean }> = [];
  for (let index = 0; index < firstDay.getUTCDay(); index += 1) cells.push({ key: `empty-start-${index}` });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key, day, events: eventsByDay.get(key) || [], today: key === dateKey(now) });
  }
  while (cells.length % 7) cells.push({ key: `empty-end-${cells.length}` });

  const dayModalEvents = selectedDay
    ? events.filter((ev) => dateKey(ev.startsAt) === selectedDay.dateStr)
    : [];

  return (
    <div className="public-calendar-wrap">
      <div className="card public-calendar" style={{ padding: "22px", borderRadius: "18px" }}>
        {/* Toolbar de navegação */}
        <div className="calendar-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <button
            className="button secondary small"
            type="button"
            onClick={() => move(-1)}
            aria-label="Mês anterior"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ChevronLeft size={16} />
            <span>Mês anterior</span>
          </button>
          <h3 aria-live="polite" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
            {monthLabel}
          </h3>
          <button
            className="button secondary small"
            type="button"
            onClick={() => move(1)}
            aria-label="Próximo mês"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Próximo mês</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="calendar-grid calendar-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", marginBottom: "6px" }}>
          {weekdays.map((day) => (
            <div key={day} style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 0" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Células dos dias do mês */}
        <div className="calendar-grid calendar-days" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {cells.map((cell) => {
            const hasEvents = Boolean(cell.events && cell.events.length > 0);
            return (
              <div
                className={`calendar-day${cell.day ? "" : " outside"}${cell.today ? " today" : ""}${hasEvents ? " has-event" : ""}`}
                key={cell.key}
                style={{
                  minHeight: "92px",
                  padding: "8px 10px",
                  borderRadius: "12px",
                  border: cell.today ? "1px solid #0284c7" : hasEvents ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid var(--border)",
                  background: cell.today ? "rgba(2, 132, 199, 0.08)" : hasEvents ? "rgba(56, 189, 248, 0.04)" : "var(--surface)",
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
                title={hasEvents ? `Clique para ver ${cell.events?.length} compromisso(s)` : ""}
              >
                {cell.day && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {cell.today ? (
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
                          {cell.day}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: hasEvents ? "var(--text)" : "var(--muted)" }}>
                          {cell.day}
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
                          title={`${cell.events?.length ?? 0} evento(s)`}
                        />
                      )}
                    </div>

                    {/* Pills de Eventos com Nomes e Cores */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden", width: "100%", minWidth: 0, marginTop: "2px" }}>
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
                              minWidth: 0,
                              maxWidth: "100%",
                              overflow: "hidden",
                              lineHeight: 1.2,
                            }}
                            title={`${eventTime(event.startsAt)} - ${event.title}`}
                          >
                            <strong style={{ flexShrink: 0, fontSize: "0.68rem" }}>{eventTime(event.startsAt)}</strong>
                            <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              {event.title}
                            </span>
                          </div>
                        );
                      })}
                      {Boolean(cell.events && cell.events.length > 2) && (
                        <small style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 600, paddingLeft: "2px" }}>
                          +{cell.events ? cell.events.length - 2 : 0} outro(s)
                        </small>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALHADO AO CLICAR NO DIA NO SITE PÚBLICO */}
      {selectedDay && (
        <div
          className="form-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDay(null);
          }}
        >
          <div className="form-modal-card" style={{ maxWidth: "560px", padding: "24px" }}>
            <div className="form-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow" style={{ textTransform: "capitalize" }}>Programação</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.25rem", textTransform: "capitalize" }}>
                  {selectedDay.formattedDate}
                </h3>
              </div>
              <button
                type="button"
                className="form-modal-close"
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
              {dayModalEvents.map((ev) => {
                const col = EVENT_COLORS[ev.color || "sky"] || EVENT_COLORS.sky;
                return (
                  <div
                    key={ev.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${col.border}`,
                      borderRadius: "12px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text)" }}>{ev.title}</h4>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: col.text,
                          background: col.bg,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Clock size={12} />
                        {eventTime(ev.startsAt)}
                      </span>
                    </div>

                    {ev.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", color: "var(--muted)" }}>
                        <MapPin size={13} style={{ color: "#f87171" }} />
                        <span>{ev.location}</span>
                      </div>
                    )}

                    {ev.description && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--muted)", lineHeight: 1.4 }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className="button secondary small"
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
