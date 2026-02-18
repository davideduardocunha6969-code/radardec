import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AgendaEvento } from "@/hooks/useAgendaEventos";

interface AgendaWeekViewProps {
  currentDate: Date;
  eventos: AgendaEvento[];
  onEventClick: (evento: AgendaEvento) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h - 21h

export function AgendaWeekView({ currentDate, eventos, onEventClick, onSlotClick }: AgendaWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvento[]>();
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(
        key,
        eventos.filter((ev) => {
          const evStart = parseISO(ev.data_inicio);
          const evEnd = parseISO(ev.data_fim);
          return isSameDay(evStart, day) || isWithinInterval(day, { start: evStart, end: evEnd });
        })
      );
    });
    return map;
  }, [eventos, weekDays]);

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
        <div className="p-2 border-r bg-muted/30" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-2 text-center border-r last:border-r-0",
              isToday(day) && "bg-primary/10"
            )}
          >
            <div className="text-xs text-muted-foreground uppercase">
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center mx-auto rounded-full",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[52px]">
            <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r bg-muted/30">
              {String(hour).padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(dayKey) || [];
              const hourEvents = dayEvents.filter((ev) => {
                const evHour = parseISO(ev.data_inicio).getHours();
                return evHour === hour;
              });

              return (
                <div
                  key={`${dayKey}-${hour}`}
                  className={cn(
                    "border-r border-b last:border-r-0 p-0.5 cursor-pointer hover:bg-accent/30 transition-colors relative",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => {
                    const clickDate = new Date(day);
                    clickDate.setHours(hour, 0, 0, 0);
                    onSlotClick(clickDate);
                  }}
                >
                  {hourEvents.map((ev) => {
                    const tipo = ev.agenda_tipos_evento;
                    const cor = tipo?.cor || "#6366f1";
                    return (
                      <div
                        key={ev.id}
                        className="text-xs p-1 rounded mb-0.5 truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: cor + "22", borderLeft: `3px solid ${cor}`, color: cor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev);
                        }}
                      >
                        <span className="font-medium">{ev.titulo}</span>
                        <span className="ml-1 opacity-70">
                          {format(parseISO(ev.data_inicio), "HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
