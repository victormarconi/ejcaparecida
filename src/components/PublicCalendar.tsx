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
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay);
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
      <div className="calendar-grid calendar-days">{cells.map((cell) => <div className={`calendar-day${cell.day ? "" : " outside"}${cell.today ? " today" : ""}${cell.events?.length ? " has-event" : ""}`} key={cell.key}>
        {cell.day && <><span className="day-number">{cell.day}</span><div className="day-events">{cell.events?.slice(0, 3).map((event) => <span className="event-dot" title={event.title} aria-label={event.title} key={event.id} />)}</div>{Boolean(cell.events && cell.events.length > 3) && <small>+{cell.events!.length - 3}</small>}</>}
      </div>)}</div>
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
