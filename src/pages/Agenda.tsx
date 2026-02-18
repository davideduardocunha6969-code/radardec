import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Plus, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgendaEventos, type AgendaEvento } from "@/hooks/useAgendaEventos";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { EventoFormDialog } from "@/components/agenda/EventoFormDialog";

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "list">("week");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<AgendaEvento | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();

  // Fetch range based on view
  const range = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start: start.toISOString(), end: end.toISOString() };
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [currentDate, view]);

  const { data: eventos = [], isLoading } = useAgendaEventos(range.start, range.end);

  const navigateWeek = (dir: "prev" | "next") => {
    setCurrentDate((d) => (dir === "prev" ? subWeeks(d, 1) : addWeeks(d, 1)));
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleEventClick = (ev: AgendaEvento) => {
    setSelectedEvento(ev);
    setDefaultDate(undefined);
    setDialogOpen(true);
  };

  const handleSlotClick = (date: Date) => {
    setSelectedEvento(null);
    setDefaultDate(date);
    setDialogOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedEvento(null);
    setDefaultDate(new Date());
    setDialogOpen(true);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie compromissos e veja a disponibilidade da equipe.
          </p>
        </div>
        <Button onClick={handleNewEvent} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2 capitalize">
            {format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "week" | "list")}>
          <TabsList>
            <TabsTrigger value="week" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : view === "week" ? (
        <AgendaWeekView
          currentDate={currentDate}
          eventos={eventos}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
        />
      ) : (
        <AgendaListView eventos={eventos} onEventClick={handleEventClick} />
      )}

      {/* Dialog */}
      <EventoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        evento={selectedEvento}
        defaultDate={defaultDate}
      />
    </div>
  );
}
