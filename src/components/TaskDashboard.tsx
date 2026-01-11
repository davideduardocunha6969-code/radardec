import { useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import MetricCard from "./MetricCard";
import { TaskData } from "@/hooks/useSheetData";
import { calculateBusinessDays } from "@/utils/businessDays";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingTasksDialog } from "./PendingTasksDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ChartViewMode = "daily" | "weekly" | "monthly";
type ChartPeriod = "all" | "30d" | "90d" | "custom";

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
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>("daily");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("all");
  const [customChartStart, setCustomChartStart] = useState<Date>();
  const [customChartEnd, setCustomChartEnd] = useState<Date>();

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

  // Filtra tarefas para o gráfico de linha baseado no período selecionado
  const chartFilteredTasks = useMemo(() => {
    const today = new Date();
    
    return filteredTasks.filter(task => {
      if (!task.dataDistribuicao) return false;
      
      switch (chartPeriod) {
        case "30d":
          return task.dataDistribuicao >= subDays(today, 30);
        case "90d":
          return task.dataDistribuicao >= subDays(today, 90);
        case "custom":
          if (customChartStart && task.dataDistribuicao < customChartStart) return false;
          if (customChartEnd && task.dataDistribuicao > customChartEnd) return false;
          return true;
        default:
          return true;
      }
    });
  }, [filteredTasks, chartPeriod, customChartStart, customChartEnd]);

  // Tarefas por data de distribuição (para gráfico de linha)
  const tasksByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    
    chartFilteredTasks.forEach(task => {
      if (task.dataDistribuicao) {
        let dateKey: string;
        
        switch (chartViewMode) {
          case "weekly":
            const weekStart = startOfWeek(task.dataDistribuicao, { locale: ptBR });
            dateKey = format(weekStart, "yyyy-MM-dd");
            break;
          case "monthly":
            const monthStart = startOfMonth(task.dataDistribuicao);
            dateKey = format(monthStart, "yyyy-MM-dd");
            break;
          default:
            dateKey = format(task.dataDistribuicao, "yyyy-MM-dd");
        }
        
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([date, quantidade]) => {
        const dateObj = new Date(date + "T12:00:00");
        let dateLabel: string;
        let fullDate: string;
        
        switch (chartViewMode) {
          case "weekly":
            dateLabel = `Sem ${format(dateObj, "dd/MM", { locale: ptBR })}`;
            fullDate = `Semana de ${format(dateObj, "dd/MM/yyyy", { locale: ptBR })}`;
            break;
          case "monthly":
            dateLabel = format(dateObj, "MMM/yy", { locale: ptBR });
            fullDate = format(dateObj, "MMMM 'de' yyyy", { locale: ptBR });
            break;
          default:
            dateLabel = format(dateObj, "dd/MM", { locale: ptBR });
            fullDate = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
        }
        
        return { date, dateLabel, fullDate, quantidade };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [chartFilteredTasks, chartViewMode]);

  const colaboradores = [...new Set(tasks.map(t => t.colaborador))];

  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);

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
          subtitle="Clique para ver detalhes"
          icon={<Clock className="h-5 w-5 text-warning" />}
          variant={pendingTasks.length > 0 ? "warning" : "default"}
          className="animate-slide-up stagger-1"
          onClick={() => setPendingDialogOpen(true)}
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
          subtitle="Dias úteis (tarefas concluídas)"
          icon={<Clock className="h-5 w-5 text-primary" />}
          className="animate-slide-up stagger-4"
        />
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid gap-4 md:grid-cols-2">
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

        {/* Gráfico: Tarefas Pendentes por Colaborador */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tarefas Pendentes por Colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pendentes: {
                  label: "Pendentes",
                  color: "hsl(var(--warning))",
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
                  dataKey="pendentes"
                  fill="var(--color-pendentes)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha: Distribuição de Tarefas por Data */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Distribuição de Tarefas por Data</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de visualização */}
              <ToggleGroup
                type="single"
                value={chartViewMode}
                onValueChange={(value) => value && setChartViewMode(value as ChartViewMode)}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem value="daily" size="sm" className="text-xs px-3">
                  Diário
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" size="sm" className="text-xs px-3">
                  Semanal
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" size="sm" className="text-xs px-3">
                  Mensal
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Seletor de período */}
              <ToggleGroup
                type="single"
                value={chartPeriod}
                onValueChange={(value) => value && setChartPeriod(value as ChartPeriod)}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem value="all" size="sm" className="text-xs px-3">
                  Tudo
                </ToggleGroupItem>
                <ToggleGroupItem value="30d" size="sm" className="text-xs px-3">
                  30 dias
                </ToggleGroupItem>
                <ToggleGroupItem value="90d" size="sm" className="text-xs px-3">
                  90 dias
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" size="sm" className="text-xs px-3">
                  Período
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Seletores de data customizada */}
          {chartPeriod === "custom" && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customChartStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customChartStart
                      ? format(customChartStart, "dd/MM/yyyy", { locale: ptBR })
                      : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customChartStart}
                    onSelect={setCustomChartStart}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">até</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customChartEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customChartEnd
                      ? format(customChartEnd, "dd/MM/yyyy", { locale: ptBR })
                      : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customChartEnd}
                    onSelect={setCustomChartEnd}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(customChartStart || customChartEnd) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomChartStart(undefined);
                    setCustomChartEnd(undefined);
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              quantidade: {
                label: "Tarefas Distribuídas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[350px] w-full"
          >
            <LineChart data={tasksByDate}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.fullDate}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.quantidade} {data.quantidade === 1 ? "tarefa" : "tarefas"}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="quantidade"
                stroke="var(--color-quantidade)"
                strokeWidth={2}
                dot={{ fill: "var(--color-quantidade)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <PendingTasksDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        tasks={pendingTasks}
        holidays={holidays}
      />
    </div>
  );
}
