import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingDown,
} from "lucide-react";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays, calculateDelayBusinessDays } from "@/utils/businessDays";

interface TaskDashboardProps {
  tasks: TaskData[];
  holidays: Date[];
  startDate?: Date;
  endDate?: Date;
  selectedColaboradores: string[];
}

const CHART_COLORS = [
  "hsl(220, 65%, 50%)",
  "hsl(38, 70%, 50%)",
  "hsl(160, 50%, 45%)",
  "hsl(280, 55%, 50%)",
  "hsl(0, 65%, 50%)",
  "hsl(180, 55%, 45%)",
  "hsl(45, 85%, 50%)",
  "hsl(320, 55%, 50%)",
];

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
      // Filtra por colaborador
      if (selectedColaboradores.length > 0 && !selectedColaboradores.includes(task.colaborador)) {
        return false;
      }
      
      // Filtra por data
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

  // Dados para gráfico de tarefas por data (todos os colaboradores)
  const tasksByDateAll = useMemo(() => {
    const dateMap: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      if (task.dataDistribuicao) {
        const dateKey = format(task.dataDistribuicao, "yyyy-MM-dd");
        dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
      }
    });
    
    return Object.entries(dateMap)
      .map(([date, count]) => ({
        date,
        dateFormatted: format(new Date(date), "dd/MM", { locale: ptBR }),
        tarefas: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTasks]);

  // Dados para gráfico de tarefas por data POR colaborador
  const tasksByDatePerColaborador = useMemo(() => {
    const colaboradores = [...new Set(filteredTasks.map(t => t.colaborador))];
    const dateMap: Record<string, Record<string, number>> = {};
    
    filteredTasks.forEach(task => {
      if (task.dataDistribuicao) {
        const dateKey = format(task.dataDistribuicao, "yyyy-MM-dd");
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = {};
        }
        dateMap[dateKey][task.colaborador] = (dateMap[dateKey][task.colaborador] || 0) + 1;
      }
    });
    
    const data = Object.entries(dateMap)
      .map(([date, counts]) => ({
        date,
        dateFormatted: format(new Date(date), "dd/MM", { locale: ptBR }),
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return { data, colaboradores };
  }, [filteredTasks]);

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

      {/* Tarefas por Colaborador */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Tarefas por Colaborador"
          subtitle="Total de tarefas distribuídas"
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {tasksByColaborador.map((col, index) => (
              <div
                key={col.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="font-medium">{col.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{col.total}</span>
                  </span>
                  <span className={col.pendentes > 0 ? "text-warning" : "text-success"}>
                    Pendentes: <span className="font-semibold">{col.pendentes}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Gráfico Geral por Data */}
        <ChartCard
          title="Tarefas por Data (Geral)"
          subtitle="Total de tarefas distribuídas por dia"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tasksByDateAll}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="dateFormatted"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tarefas"
                  name="Tarefas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Gráficos Individuais por Colaborador */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Tarefas por Colaborador (Individual)</h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {tasksByDatePerColaborador.colaboradores.map((colaborador, index) => {
            const colaboradorData = tasksByDatePerColaborador.data.map(d => ({
              date: d.date,
              dateFormatted: d.dateFormatted,
              tarefas: (d as Record<string, number | string>)[colaborador] || 0,
            }));
            
            const colaboradorStats = tasksByColaborador.find(c => c.name === colaborador);
            
            return (
              <ChartCard
                key={colaborador}
                title={colaborador}
                subtitle={`Total: ${colaboradorStats?.total || 0} | Pendentes: ${colaboradorStats?.pendentes || 0}`}
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={colaboradorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="dateFormatted"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tarefas"
                        name="Tarefas"
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
