import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Trash2, Edit2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgendaEvento } from "@/hooks/useAgendaEventos";
import { useDeleteAgendaEvento } from "@/hooks/useAgendaEventos";

interface AgendaListViewProps {
  eventos: AgendaEvento[];
  onEventClick: (evento: AgendaEvento) => void;
}

export function AgendaListView({ eventos, onEventClick }: AgendaListViewProps) {
  const deleteEvento = useDeleteAgendaEvento();

  // Group by date
  const grouped = eventos.reduce<Record<string, AgendaEvento[]>>((acc, ev) => {
    const key = format(parseISO(ev.data_inicio), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
        <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">Nenhum evento neste período</p>
        <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Evento" para começar</p>
      </div>
    );
  }

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2 capitalize">
            {getDateLabel(dateStr)}
          </h3>
          <div className="space-y-1.5">
            {grouped[dateStr].map((ev) => {
              const tipo = ev.agenda_tipos_evento;
              const cor = tipo?.cor || "#6366f1";
              const inicio = parseISO(ev.data_inicio);
              const fim = parseISO(ev.data_fim);
              const passed = isPast(fim);

              return (
                <div
                  key={ev.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer group",
                    passed && "opacity-60"
                  )}
                  onClick={() => onEventClick(ev)}
                >
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{ev.titulo}</span>
                      {tipo && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: cor + "22", color: cor }}
                        >
                          {tipo.nome}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {ev.dia_inteiro
                        ? "Dia inteiro"
                        : `${format(inicio, "HH:mm")} - ${format(fim, "HH:mm")}`}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remover este evento?")) deleteEvento.mutate(ev.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
