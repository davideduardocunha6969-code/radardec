import { useMemo } from "react";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import MetricCard from "./MetricCard";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays, calculateDelayBusinessDays } from "@/utils/businessDays";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskDashboardProps {
  tasks: TaskData[];
  holidays: Date[];
  startDate?: Date;
  endDate?: Date;
  selectedColaboradores: string[];
}

export function TaskDashboard({
  tasks,
  holidays,
  startDate,
  endDate,
  selectedColaboradores,
}: TaskDashboardProps) {
  // Filtra tarefas por período e colaboradores
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedColaboradores.length > 0 && !selectedColaboradores.includes(task.colaborador)) {
        return false;
      }
      
      if (task.dataDistribuicao) {
        if (startDate && task.dataDistribuicao < startDate) return false;
        if (endDate && task.dataDistribuicao > endDate) return false;
      }
      
      return true;
    });
  }, [tasks, startDate, endDate, selectedColaboradores]);

  // Tarefas pendentes (sem data de cumprimento)
  const pendingTasks = useMemo(() => {
    return filteredTasks.filter(task => !task.dataCumprimento);
  }, [filteredTasks]);

  // Total de tarefas por colaborador
  const tasksByColaborador = useMemo(() => {
    const counts: Record<string, { total: number; pendentes: number }> = {};
    
    filteredTasks.forEach(task => {
      if (!counts[task.colaborador]) {
        counts[task.colaborador] = { total: 0, pendentes: 0 };
      }
      counts[task.colaborador].total++;
      if (!task.dataCumprimento) {
        counts[task.colaborador].pendentes++;
      }
    });
    
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTasks]);

  // Média de dias úteis para cumprimento
  const avgCompletionDays = useMemo(() => {
    const completedTasks = filteredTasks.filter(
      task => task.dataDistribuicao && task.dataCumprimento
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((acc, task) => {
      const days = calculateBusinessDays(
        task.dataDistribuicao!,
        task.dataCumprimento!,
        holidays
      );
      return acc + days;
    }, 0);
    
    return totalDays / completedTasks.length;
  }, [filteredTasks, holidays]);

  // Média de atraso das tarefas pendentes
  const avgDelayDays = useMemo(() => {
    const delayedTasks = pendingTasks.filter(task => task.dataDistribuicao);
    
    if (delayedTasks.length === 0) return 0;
    
    const totalDelay = delayedTasks.reduce((acc, task) => {
      const delay = calculateDelayBusinessDays(task.dataDistribuicao!, holidays);
      return acc + delay;
    }, 0);
    
    return totalDelay / delayedTasks.length;
  }, [pendingTasks, holidays]);

  const colaboradores = [...new Set(tasks.map(t => t.colaborador))];

  return (
    <div className="space-y-8">
      {/* Métricas Gerais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total de Tarefas"
          value={filteredTasks.length}
          subtitle="Acumulado no período"
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          className="animate-slide-up"
        />
        <MetricCard
          title="Tarefas Pendentes"
          value={pendingTasks.length}
          subtitle="Aguardando cumprimento"
          icon={<Clock className="h-5 w-5 text-warning" />}
          variant={pendingTasks.length > 0 ? "warning" : "default"}
          className="animate-slide-up stagger-1"
        />
        <MetricCard
          title="Tarefas Concluídas"
          value={filteredTasks.length - pendingTasks.length}
          subtitle="Finalizadas"
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          variant="success"
          className="animate-slide-up stagger-2"
        />
        <MetricCard
          title="Colaboradores"
          value={colaboradores.length}
          subtitle="Ativos no sistema"
          icon={<Users className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-3"
        />
        <MetricCard
          title="Média Cumprimento"
          value={`${avgCompletionDays.toFixed(1)} dias`}
          subtitle="Dias úteis"
          icon={<Clock className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-4"
        />
        <MetricCard
          title="Média de Atraso"
          value={`${avgDelayDays.toFixed(1)} dias`}
          subtitle="Tarefas pendentes"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          variant={avgDelayDays > 5 ? "warning" : "default"}
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Gráfico: Tarefas por Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarefas por Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: {
                label: "Total de Tarefas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart data={tasksByColaborador} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
