import { useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarOff, Plus, Trash2, X, CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useIndisponibilidades } from "@/hooks/useUserSchedule";

export function IndisponibilidadeSection() {
  const { data: items, isLoading, addBatch, remove, clearAll } = useIndisponibilidades();
  const [open, setOpen] = useState(false);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [diaInteiro, setDiaInteiro] = useState(true);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [motivo, setMotivo] = useState("");
  const [singleDates, setSingleDates] = useState<Date[]>([]);

  const handleAddBatch = () => {
    let dates: Date[] = [];
    if (startDate && endDate) {
      dates = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (singleDates.length > 0) {
      dates = singleDates;
    }
    if (dates.length === 0) return;
    const rows = dates.map(d => ({
      data: format(d, "yyyy-MM-dd"),
      dia_inteiro: diaInteiro,
      hora_inicio: diaInteiro ? null : horaInicio,
      hora_fim: diaInteiro ? null : horaFim,
      motivo: motivo || null,
    }));
    addBatch.mutate(rows as any, {
      onSuccess: () => { setStartDate(undefined); setEndDate(undefined); setSingleDates([]); setMotivo(""); },
    });
  };

  const futureItems = items?.filter(i => new Date(i.data + "T23:59:59") >= new Date()) || [];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">Indisponibilidades</span>
          <span className="text-xs text-muted-foreground">({items?.length || 0})</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        {/* Multi-date calendar */}
        <Calendar
          mode="multiple"
          selected={singleDates}
          onSelect={(dates) => setSingleDates(dates || [])}
          locale={ptBR}
          className="rounded-md border pointer-events-auto mx-auto"
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
        {singleDates.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {singleDates.map((d, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                {format(d, "dd/MM")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSingleDates(prev => prev.filter((_, j) => j !== i))} />
              </Badge>
            ))}
          </div>
        )}

        {/* Range shortcut */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Ou intervalo - Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-7 text-xs", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {startDate ? format(startDate, "dd/MM/yy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-7 text-xs", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {endDate ? format(endDate, "dd/MM/yy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Switch checked={diaInteiro} onCheckedChange={setDiaInteiro} className="scale-90" />
            <Label className="text-xs">Dia inteiro</Label>
          </div>
          {!diaInteiro && (
            <div className="flex items-center gap-1">
              <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-22 h-7 text-xs" />
              <span className="text-[10px] text-muted-foreground">–</span>
              <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="w-22 h-7 text-xs" />
            </div>
          )}
        </div>

        <Input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="h-7 text-xs" />

        <Button onClick={handleAddBatch} disabled={addBatch.isPending || (singleDates.length === 0 && (!startDate || !endDate))} className="w-full h-7 text-xs" size="sm">
          <Plus className="h-3 w-3 mr-1" />
          {addBatch.isPending ? "Adicionando..." : `Adicionar ${singleDates.length > 0 ? `${singleDates.length} data(s)` : "período"}`}
        </Button>

        {/* Existing list */}
        {(items?.length || 0) > 0 && (
          <div className="space-y-1.5 border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Cadastradas ({items?.length})</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-[10px] h-6 px-2">
                    <Trash2 className="h-3 w-3 mr-1" />Limpar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover todas?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearAll.mutate()}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <ScrollArea className="max-h-[150px]">
              <div className="space-y-1">
                {futureItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-xs">
                    <div>
                      <span className="font-medium">{format(new Date(item.data + "T12:00:00"), "dd/MM/yy (EEE)", { locale: ptBR })}</span>
                      {item.dia_inteiro ? <Badge variant="secondary" className="text-[9px] ml-1.5 py-0">Dia inteiro</Badge> : <span className="text-muted-foreground ml-1">{item.hora_inicio?.slice(0, 5)}-{item.hora_fim?.slice(0, 5)}</span>}
                      {item.motivo && <span className="text-muted-foreground ml-1">• {item.motivo}</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => remove.mutate(item.id)}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
