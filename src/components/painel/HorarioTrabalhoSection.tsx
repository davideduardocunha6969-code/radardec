import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useHorarioTrabalho, DIAS_SEMANA, type HorarioTrabalho } from "@/hooks/useUserSchedule";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface DiaConfig {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

const FULL_WEEK: DiaConfig[] = Array.from({ length: 7 }, (_, i) => ({
  dia_semana: i,
  hora_inicio: "08:00",
  hora_fim: "18:00",
  ativo: i >= 1 && i <= 5,
}));

export function HorarioTrabalhoSection() {
  const { data: savedSchedule, isLoading, upsert } = useHorarioTrabalho();
  const [schedule, setSchedule] = useState<DiaConfig[]>(FULL_WEEK);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (savedSchedule && savedSchedule.length > 0) {
      setSchedule(prev =>
        prev.map(day => {
          const saved = savedSchedule.find(s => s.dia_semana === day.dia_semana);
          if (saved) return { dia_semana: saved.dia_semana, hora_inicio: saved.hora_inicio?.slice(0, 5) || "08:00", hora_fim: saved.hora_fim?.slice(0, 5) || "18:00", ativo: saved.ativo };
          return day;
        })
      );
    }
  }, [savedSchedule]);

  const updateDay = (dia: number, field: keyof DiaConfig, value: any) => {
    setSchedule(prev => prev.map(d => (d.dia_semana === dia ? { ...d, [field]: value } : d)));
  };

  const activeDays = schedule.filter(d => d.ativo).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Horário de Trabalho</span>
          <span className="text-xs text-muted-foreground">({activeDays} dias ativos)</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-2">
        {schedule.map((day) => (
          <div key={day.dia_semana} className="flex items-center gap-2 py-1">
            <Switch checked={day.ativo} onCheckedChange={(v) => updateDay(day.dia_semana, "ativo", v)} className="scale-90" />
            <span className="text-xs font-medium w-16">{DIAS_SEMANA[day.dia_semana]}</span>
            {day.ativo ? (
              <div className="flex items-center gap-1">
                <Input type="time" value={day.hora_inicio} onChange={(e) => updateDay(day.dia_semana, "hora_inicio", e.target.value)} className="w-24 h-7 text-xs" />
                <span className="text-muted-foreground text-[10px]">–</span>
                <Input type="time" value={day.hora_fim} onChange={(e) => updateDay(day.dia_semana, "hora_fim", e.target.value)} className="w-24 h-7 text-xs" />
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground italic">Folga</span>
            )}
          </div>
        ))}
        <Button onClick={() => upsert.mutate(schedule)} disabled={upsert.isPending} size="sm" className="w-full h-7 text-xs">
          {upsert.isPending ? "Salvando..." : "Salvar Horários"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
