import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay, parseISO, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAgendaEventos, useCreateAgendaEvento, type AgendaEvento } from "@/hooks/useAgendaEventos";
import { useFunilClosers } from "@/hooks/useFunilMembros";
import { toast } from "sonner";

interface AgendaClosersTabProps {
  leadId: string;
  leadNome: string;
  funilId?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h - 19h

export function AgendaClosersTab({ leadId, leadNome, funilId }: AgendaClosersTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCloser, setSelectedCloser] = useState<string>("all");
  const [bookingSlot, setBookingSlot] = useState<{ date: Date; closerId: string } | null>(null);
  const [bookingTitle, setBookingTitle] = useState("");
  const [bookingDesc, setBookingDesc] = useState("");

  // Fetch closers assigned to this funnel
  const { data: funilClosers } = useFunilClosers(funilId);

  const closerProfiles = useMemo(() => {
    if (!funilClosers?.length) return [];
    return funilClosers.map(fc => fc.profiles).filter(Boolean);
  }, [funilClosers]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const { data: eventos = [], isLoading } = useAgendaEventos(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const createEvento = useCreateAgendaEvento();

  // Filter events by closers in this funnel and selected closer
  const filteredEventos = useMemo(() => {
    const closerIds = funilClosers?.map(fc => fc.profile_id) || [];
    let filtered = closerIds.length > 0
      ? eventos.filter(ev => ev.responsavel_id && closerIds.includes(ev.responsavel_id))
      : eventos;
    if (selectedCloser !== "all") {
      filtered = filtered.filter(ev => ev.responsavel_id === selectedCloser);
    }
    return filtered;
  }, [eventos, selectedCloser, funilClosers]);

  const getSlotEvents = (day: Date, hour: number) => {
    return filteredEventos.filter((ev) => {
      const evStart = parseISO(ev.data_inicio);
      return isSameDay(evStart, day) && evStart.getHours() === hour;
    });
  };

  const handleSlotClick = (day: Date, hour: number) => {
    if (selectedCloser === "all") {
      toast.info("Selecione um closer específico para agendar.");
      return;
    }
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    setBookingSlot({ date: slotDate, closerId: selectedCloser });
    setBookingTitle(`Reunião - ${leadNome}`);
    setBookingDesc("");
  };

  const handleConfirmBooking = async () => {
    if (!bookingSlot || !bookingTitle) return;
    await createEvento.mutateAsync({
      titulo: bookingTitle,
      descricao: bookingDesc || undefined,
      responsavel_id: bookingSlot.closerId,
      data_inicio: bookingSlot.date.toISOString(),
      data_fim: addHours(bookingSlot.date, 1).toISOString(),
    });
    setBookingSlot(null);
    toast.success("Reunião agendada com sucesso!");
  };

  const closerName = (id: string) =>
    closerProfiles.find((p) => p.id === id)?.display_name || "—";

  const isToday = (day: Date) => isSameDay(day, new Date());
  const isPast = (day: Date, hour: number) => {
    const now = new Date();
    const slot = new Date(day);
    slot.setHours(hour, 0, 0, 0);
    return slot < now;
  };

  if (!funilClosers?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CalendarDays className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">Nenhum closer cadastrado neste funil</p>
        <p className="text-xs mt-1">Edite o funil na tela de CRM Outbound para adicionar closers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Agenda dos Closers
          </h3>
          <p className="text-sm text-muted-foreground">
            Consulte a disponibilidade e agende reuniões para o lead <strong>{leadNome}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCloser} onValueChange={setSelectedCloser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os closers</SelectItem>
              {closerProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => subWeeks(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Hoje
        </Button>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => addWeeks(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium ml-2 capitalize">
          {format(weekStart, "dd MMM", { locale: ptBR })} – {format(addDays(weekStart, 4), "dd MMM yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b">
            <div className="p-2 border-r bg-muted/30" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn("p-2 text-center border-r last:border-r-0", isToday(day) && "bg-primary/10")}
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className={cn("text-base font-semibold mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[56px_repeat(5,1fr)] min-h-[44px]">
                <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r bg-muted/30 flex items-center justify-end">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const slotEvents = getSlotEvents(day, hour);
                  const free = slotEvents.length === 0;
                  const past = isPast(day, hour);

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        "border-r border-b last:border-r-0 p-0.5 transition-colors relative",
                        isToday(day) && "bg-primary/5",
                        free && !past && "cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20",
                        past && "opacity-50"
                      )}
                      onClick={() => { if (free && !past) handleSlotClick(day, hour); }}
                    >
                      {slotEvents.map((ev) => {
                        const tipo = ev.agenda_tipos_evento;
                        const cor = tipo?.cor || "#6366f1";
                        return (
                          <div
                            key={ev.id}
                            className="text-[11px] p-1 rounded mb-0.5 truncate"
                            style={{ backgroundColor: cor + "22", borderLeft: `3px solid ${cor}`, color: cor }}
                          >
                            <div className="font-medium truncate">{ev.titulo}</div>
                            {ev.profiles && (
                              <div className="flex items-center gap-1 opacity-70">
                                <User className="h-2.5 w-2.5" />
                                <span className="truncate">{ev.profiles.display_name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {free && !past && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950 border border-green-300" />
          Disponível
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40" />
          Ocupado
        </div>
        {selectedCloser === "all" && (
          <span className="ml-auto text-amber-600">⚠ Selecione um closer para agendar</span>
        )}
      </div>

      {/* Booking dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={(o) => !o && setBookingSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
          </DialogHeader>
          {bookingSlot && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CalendarDays className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium capitalize">
                    {format(bookingSlot.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(bookingSlot.date, "HH:mm")} – {format(addHours(bookingSlot.date, 1), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-accent/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Closer: <strong>{closerName(bookingSlot.closerId)}</strong></span>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} placeholder="Reunião de fechamento" />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={bookingDesc} onChange={(e) => setBookingDesc(e.target.value)} placeholder="Informações relevantes para o closer..." rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBookingSlot(null)}>Cancelar</Button>
                <Button onClick={handleConfirmBooking} disabled={createEvento.isPending || !bookingTitle} className="gap-2">
                  <Check className="h-4 w-4" />
                  {createEvento.isPending ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
