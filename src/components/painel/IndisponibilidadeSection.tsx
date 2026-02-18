import { useState } from "react";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarOff, Plus, Trash2, X, CalendarRange, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useIndisponibilidades, type Indisponibilidade } from "@/hooks/useUserSchedule";

export function IndisponibilidadeSection() {
  const { data: items, isLoading, addBatch, remove, clearAll } = useIndisponibilidades();

  // Batch form state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [diaInteiro, setDiaInteiro] = useState(true);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [motivo, setMotivo] = useState("");

  // Single date mode
  const [singleDates, setSingleDates] = useState<Date[]>([]);

  const handleAddBatch = () => {
    let dates: Date[] = [];

    if (startDate && endDate) {
      // Range mode
      dates = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });
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
      onSuccess: () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setSingleDates([]);
        setMotivo("");
      },
    });
  };

  const toggleSingleDate = (date: Date) => {
    setSingleDates(prev => {
      const dateStr = format(date, "yyyy-MM-dd");
      const exists = prev.find(d => format(d, "yyyy-MM-dd") === dateStr);
      if (exists) return prev.filter(d => format(d, "yyyy-MM-dd") !== dateStr);
      return [...prev, date];
    });
  };

  const futureItems = items?.filter(i => new Date(i.data + "T23:59:59") >= new Date()) || [];
  const pastItems = items?.filter(i => new Date(i.data + "T23:59:59") < new Date()) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarOff className="h-5 w-5 text-destructive" />
          Indisponibilidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Adicione datas ou períodos em que você não estará disponível. Selecione múltiplas datas no calendário ou use o intervalo de datas.
        </p>

        {/* Batch creation form */}
        <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            Adicionar indisponibilidades
          </div>

          {/* Calendar for multiple date selection */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Clique para selecionar datas individuais ou use o intervalo abaixo
            </Label>
            <Calendar
              mode="multiple"
              selected={singleDates}
              onSelect={(dates) => setSingleDates(dates || [])}
              locale={ptBR}
              className="rounded-md border pointer-events-auto mx-auto"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
            {singleDates.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {singleDates.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                    {format(d, "dd/MM")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleSingleDate(d)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Range shortcut */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ou intervalo - Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-8 text-xs", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-8 text-xs", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Day/time options */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={diaInteiro} onCheckedChange={setDiaInteiro} />
              <Label className="text-xs">Dia inteiro</Label>
            </div>
            {!diaInteiro && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-24 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-24 h-7 text-xs"
                />
              </div>
            )}
          </div>

          <Input
            placeholder="Motivo (opcional) - Ex: Férias, Consulta médica..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="h-8 text-sm"
          />

          <Button
            onClick={handleAddBatch}
            disabled={addBatch.isPending || (singleDates.length === 0 && (!startDate || !endDate))}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {addBatch.isPending
              ? "Adicionando..."
              : `Adicionar ${singleDates.length > 0
                  ? `${singleDates.length} data(s)`
                  : startDate && endDate
                    ? "período"
                    : "indisponibilidade"
                }`}
          </Button>
        </div>

        {/* List of existing unavailabilities */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Cadastradas ({items?.length || 0})
            </h4>
            {(items?.length || 0) > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs h-7">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Limpar todas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover todas as indisponibilidades?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearAll.mutate()}>
                      Remover todas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : !items?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma indisponibilidade cadastrada
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-1.5">
                {futureItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {format(new Date(item.data + "T12:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.dia_inteiro ? (
                          <Badge variant="secondary" className="text-[10px]">Dia inteiro</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {item.hora_inicio?.slice(0, 5)} - {item.hora_fim?.slice(0, 5)}
                          </span>
                        )}
                        {item.motivo && (
                          <span className="text-xs text-muted-foreground">• {item.motivo}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => remove.mutate(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {pastItems.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground pt-2">Passadas</p>
                    {pastItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20 opacity-60"
                      >
                        <span className="text-xs">
                          {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                          {item.motivo && ` • ${item.motivo}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => remove.mutate(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
