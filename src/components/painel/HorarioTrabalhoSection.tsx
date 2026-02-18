import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useHorarioTrabalho, DIAS_SEMANA, type HorarioTrabalho } from "@/hooks/useUserSchedule";

interface DiaConfig {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

const DEFAULT_SCHEDULE: DiaConfig[] = [1, 2, 3, 4, 5].map(d => ({
  dia_semana: d,
  hora_inicio: "08:00",
  hora_fim: "18:00",
  ativo: true,
}));

// Add weekends as inactive
const FULL_WEEK: DiaConfig[] = [
  { dia_semana: 0, hora_inicio: "08:00", hora_fim: "18:00", ativo: false },
  ...DEFAULT_SCHEDULE,
  { dia_semana: 6, hora_inicio: "08:00", hora_fim: "18:00", ativo: false },
];

export function HorarioTrabalhoSection() {
  const { data: savedSchedule, isLoading, upsert } = useHorarioTrabalho();
  const [schedule, setSchedule] = useState<DiaConfig[]>(FULL_WEEK);

  useEffect(() => {
    if (savedSchedule && savedSchedule.length > 0) {
      setSchedule(prev =>
        prev.map(day => {
          const saved = savedSchedule.find(s => s.dia_semana === day.dia_semana);
          if (saved) {
            return {
              dia_semana: saved.dia_semana,
              hora_inicio: saved.hora_inicio?.slice(0, 5) || "08:00",
              hora_fim: saved.hora_fim?.slice(0, 5) || "18:00",
              ativo: saved.ativo,
            };
          }
          return day;
        })
      );
    }
  }, [savedSchedule]);

  const updateDay = (dia: number, field: keyof DiaConfig, value: any) => {
    setSchedule(prev =>
      prev.map(d => (d.dia_semana === dia ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = () => {
    upsert.mutate(schedule);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          Horário de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Configure seus horários de expediente para cada dia da semana.
        </p>
        <div className="space-y-2">
          {schedule.map((day) => (
            <div
              key={day.dia_semana}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <Switch
                checked={day.ativo}
                onCheckedChange={(v) => updateDay(day.dia_semana, "ativo", v)}
              />
              <span className="text-sm font-medium w-20">
                {DIAS_SEMANA[day.dia_semana]}
              </span>
              {day.ativo ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={day.hora_inicio}
                    onChange={(e) => updateDay(day.dia_semana, "hora_inicio", e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-xs">até</span>
                  <Input
                    type="time"
                    value={day.hora_fim}
                    onChange={(e) => updateDay(day.dia_semana, "hora_fim", e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Folga</span>
              )}
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
          {upsert.isPending ? "Salvando..." : "Salvar Horários"}
        </Button>
      </CardContent>
    </Card>
  );
}
