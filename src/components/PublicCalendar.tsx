"use client";

import { useMemo, useState } from "react";

export type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
};

const timeZone = "America/Fortaleza";
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function zonedParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function dateKey(value: string | Date) {
  const parts = zonedParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function eventDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
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
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, PublicEvent[]>();
    for (const event of events) {
      const key = dateKey(event.startsAt);
      grouped.set(key, [...(grouped.get(key) || []), event]);
    }
    return grouped;
  }, [events]);
  const upcoming = useMemo(() => events.filter((event) => new Date(event.startsAt).getTime() >= new Date(now).getTime() - 60 * 60 * 1000).slice(0, 5), [events, now]);

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

  return <div className="public-calendar-wrap">
    <div className="card public-calendar">
      <div className="calendar-toolbar">
        <button className="button secondary small" type="button" onClick={() => move(-1)} aria-label="Mês anterior">← <span>Mês anterior</span></button>
        <h3 aria-live="polite">{monthLabel}</h3>
        <button className="button secondary small" type="button" onClick={() => move(1)} aria-label="Próximo mês"><span>Próximo mês</span> →</button>
      </div>
      <div className="calendar-grid calendar-weekdays">{weekdays.map((day) => <div key={day}>{day}</div>)}</div>
      <div className="calendar-grid calendar-days">
        {cells.map((cell) => (
          <div
            className={`calendar-day${cell.day ? "" : " outside"}${cell.today ? " today" : ""}${cell.events?.length ? " has-event" : ""}`}
            key={cell.key}
            style={{ minHeight: "96px", padding: "8px", overflow: "hidden" }}
          >
            {cell.day && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span className="day-number" style={{ fontSize: "0.82rem", fontWeight: 800 }}>
                    {cell.day}
                  </span>
                  {Boolean(cell.events && cell.events.length > 0) && (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--brand)",
                        boxShadow: "0 0 6px var(--brand)",
                      }}
                      title={`${cell.events?.length ?? 0} evento(s)`}
                    />
                  )}
                </div>

                {/* Eventos com nome e horário na célula */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden", width: "100%", minWidth: 0 }}>
                  {cell.events?.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 5px",
                        borderRadius: "5px",
                        background: "rgba(2, 132, 199, 0.12)",
                        color: "#38bdf8",
                        border: "1px solid rgba(2, 132, 199, 0.25)",
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
                  ))}
                  {Boolean(cell.events && cell.events.length > 2) && (
                    <small style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 600, paddingLeft: "2px" }}>
                      +{cell.events ? cell.events.length - 2 : 0} outro(s)
                    </small>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <section className="upcoming-events" aria-labelledby="proximos-eventos">
      <div className="section-heading compact"><div><span className="eyebrow">Agenda</span><h3 id="proximos-eventos">Próximos eventos</h3></div><p>Os próximos compromissos públicos do EJC.</p></div>
      <div className="event-summary-list">{upcoming.map((event) => <article className="card event-summary" key={event.id}>
        <time dateTime={event.startsAt}><strong>{eventDate(event.startsAt)}</strong><span>{eventTime(event.startsAt)}</span></time>
        <div><h4>{event.title}</h4>{event.description && <p>{event.description}</p>}<span className="event-location">📍 {event.location || "Local a definir"}</span></div>
      </article>)}</div>
      {!upcoming.length && <div className="card empty">Nenhum evento público futuro cadastrado.</div>}
    </section>
  </div>;
}
