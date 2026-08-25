import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
import { calendarMonth, scheduleEntries } from "@/data/scheduleData";
import { cn } from "@/lib/utils";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function ScheduleCalendar() {
  const firstWeekday = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = new Map<string, typeof scheduleEntries>();
  scheduleEntries.forEach((e) => {
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  });

  const dateFor = (day: number) =>
    `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const listed = selected ? (byDate.get(selected) ?? []) : scheduleEntries;

  return (
    <section className="card-soft mt-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
          <CalendarDays size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Match schedule</h2>
          <p className="text-xs text-gray-text">
            {calendarMonth.label} · mock upcoming and past rooms
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-text">
            {weekdays.map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: calendarMonth.days }).map((_, i) => {
              const day = i + 1;
              const date = dateFor(day);
              const items = byDate.get(date) ?? [];
              const upcoming = items.some((e) => e.status === "upcoming");
              const isSelected = selected === date;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!items.length}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={cn(
                    "relative aspect-square rounded-xl text-xs font-semibold transition-colors",
                    items.length ? "text-ink hover:bg-secondary" : "text-gray-text/50",
                    isSelected && "bg-navy text-white hover:bg-navy",
                  )}
                >
                  {day}
                  {items.length ? (
                    <span
                      className={cn(
                        "absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                        upcoming ? "bg-sky" : "bg-lime",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-text">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" /> Upcoming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Played
            </span>
            {selected ? (
              <button
                type="button"
                className="ml-auto font-semibold text-sky hover:underline"
                onClick={() => setSelected(null)}
              >
                Show all
              </button>
            ) : null}
          </div>
        </div>

        <ul className="space-y-2">
          {listed.map((e) => (
            <li key={e.id}>
              <Link
                to="/rooms/$roomId"
                params={{ roomId: e.roomId }}
                className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold",
                    e.status === "upcoming" ? "bg-sky/15 text-navy" : "bg-lime/25 text-lime-deep",
                  )}
                >
                  {e.date.slice(8)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {e.sport} · {e.venue}
                  </span>
                  <span className="block truncate text-xs text-gray-text">
                    {e.time} · {e.city} · {e.note}
                  </span>
                </span>
                {e.result ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                      e.result === "Win"
                        ? "bg-lime/25 text-lime-deep"
                        : e.result === "Loss"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-gray-text",
                    )}
                  >
                    {e.result}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-sky/15 px-2.5 py-1 text-xs font-bold text-navy">
                    Upcoming
                  </span>
                )}
                <ChevronRight size={16} className="shrink-0 text-gray-text" />
              </Link>
            </li>
          ))}
          {!listed.length ? (
            <li className="rounded-2xl bg-secondary/60 px-4 py-6 text-center text-sm text-gray-text">
              No matches on this day.
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
