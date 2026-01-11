import { useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, LabelList } from "recharts";
import MetricCard from "./MetricCard";
import { TaskData, ConformityError } from "@/hooks/useSheetData";
import { calculateBusinessDays } from "@/utils/businessDays";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingTasksDialog } from "./PendingTasksDialog";
import { ConformityErrorsDialog } from "./ConformityErrorsDialog";
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
type ChartPeriod = "all" | "7d" | "30d" | "90d" | "custom";

interface TaskDashboardProps {
  tasks: TaskData[];
  conformityErrors: ConformityError[];
  holidays: Date[];
  startDate?: Date;
  endDate?: Date;
  selectedControllers: string[];
}

export function TaskDashboard({
  tasks,
  conformityErrors,
  holidays,
  startDate,
  endDate,
  selectedControllers,
}: TaskDashboardProps) {
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>("daily");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("all");
  const [customChartStart, setCustomChartStart] = useState<Date>();
  const [customChartEnd, setCustomChartEnd] = useState<Date>();

  // States para o segundo gráfico (por controller)
  const [chart2ViewMode, setChart2ViewMode] = useState<ChartViewMode>("daily");
  const [chart2Period, setChart2Period] = useState<ChartPeriod>("all");
  const [customChart2Start, setCustomChart2Start] = useState<Date>();
  const [customChart2End, setCustomChart2End] = useState<Date>();
  const [visibleControllers, setVisibleControllers] = useState<string[]>([]);

  // States para o gráfico de setores
  const [sectorPeriod, setSectorPeriod] = useState<ChartPeriod>("all");
  const [customSectorStart, setCustomSectorStart] = useState<Date>();
  const [customSectorEnd, setCustomSectorEnd] = useState<Date>();

  // Filtra tarefas por período e controllers
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedControllers.length > 0 && !selectedControllers.includes(task.controller)) {
        return false;
      }
      
      if (task.dataDistribuicao) {
        if (startDate && task.dataDistribuicao < startDate) return false;
        if (endDate && task.dataDistribuicao > endDate) return false;
      }
      
      return true;
    });
  }, [tasks, startDate, endDate, selectedControllers]);

  // Filtra erros de conformidade por período e destinatário
  const filteredConformityErrors = useMemo(() => {
    return conformityErrors.filter(error => {
      if (selectedControllers.length > 0 && !selectedControllers.includes(error.recipient)) {
        return false;
      }
      
      if (error.date) {
        if (startDate && error.date < startDate) return false;
        if (endDate && error.date > endDate) return false;
      }
      
      return true;
    });
  }, [conformityErrors, startDate, endDate, selectedControllers]);

  // Erros de conformidade por destinatário
  const conformityErrorsByRecipient = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredConformityErrors.forEach(error => {
      const recipient = error.recipient || 'Não identificado';
      counts[recipient] = (counts[recipient] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredConformityErrors]);

  // Tarefas pendentes (sem data de cumprimento)
  const pendingTasks = useMemo(() => {
    return filteredTasks.filter(task => !task.dataCumprimento);
  }, [filteredTasks]);

  // Total de tarefas por controller
  const tasksByController = useMemo(() => {
    const counts: Record<string, { total: number; pendentes: number }> = {};
    
    filteredTasks.forEach(task => {
      if (!counts[task.controller]) {
        counts[task.controller] = { total: 0, pendentes: 0 };
      }
      counts[task.controller].total++;
      if (!task.dataCumprimento) {
        counts[task.controller].pendentes++;
      }
    });
    
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTasks]);

  // Média de dias úteis para cumprimento
  // Regra: mesmo dia = 0 dias, dia seguinte útil = 1 dia
  // A contagem só inicia no dia seguinte ao envio
  const avgCompletionDays = useMemo(() => {
    const completedTasks = filteredTasks.filter(
      task => task.dataDistribuicao && task.dataCumprimento
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((acc, task) => {
      const businessDays = calculateBusinessDays(
        task.dataDistribuicao!,
        task.dataCumprimento!,
        holidays
      );
      // Subtrai 1 porque não conta o dia de distribuição
      // Se cumprido no mesmo dia = 0, se no dia seguinte = 1, etc.
      const adjustedDays = Math.max(0, businessDays - 1);
      return acc + adjustedDays;
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

  // Filtra tarefas para o segundo gráfico (por controller) baseado no período selecionado
  const chart2FilteredTasks = useMemo(() => {
    const today = new Date();
    
    return filteredTasks.filter(task => {
      if (!task.dataDistribuicao) return false;
      
      switch (chart2Period) {
        case "30d":
          return task.dataDistribuicao >= subDays(today, 30);
        case "90d":
          return task.dataDistribuicao >= subDays(today, 90);
        case "custom":
          if (customChart2Start && task.dataDistribuicao < customChart2Start) return false;
          if (customChart2End && task.dataDistribuicao > customChart2End) return false;
          return true;
        default:
          return true;
      }
    });
  }, [filteredTasks, chart2Period, customChart2Start, customChart2End]);

  // Tarefas por data e por controller (para segundo gráfico de linha)
  const tasksByDateAndController = useMemo(() => {
    const controllersList = [...new Set(chart2FilteredTasks.map(t => t.controller))];
    const counts: Record<string, Record<string, number>> = {};
    
    chart2FilteredTasks.forEach(task => {
      if (task.dataDistribuicao) {
        let dateKey: string;
        
        switch (chart2ViewMode) {
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
        
        if (!counts[dateKey]) {
          counts[dateKey] = {};
          controllersList.forEach(c => counts[dateKey][c] = 0);
        }
        counts[dateKey][task.controller] = (counts[dateKey][task.controller] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([date, controllers]) => {
        const dateObj = new Date(date + "T12:00:00");
        let dateLabel: string;
        let fullDate: string;
        
        switch (chart2ViewMode) {
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
        
        return { date, dateLabel, fullDate, ...controllers };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [chart2FilteredTasks, chart2ViewMode]);

  // Lista de controllers para o gráfico
  const controllersList = useMemo(() => {
    return [...new Set(chart2FilteredTasks.map(t => t.controller))].sort();
  }, [chart2FilteredTasks]);

  // Controllers visíveis no gráfico (se vazio, mostra todos)
  const activeControllers = useMemo(() => {
    if (visibleControllers.length === 0) return controllersList;
    return visibleControllers.filter(c => controllersList.includes(c));
  }, [visibleControllers, controllersList]);

  const toggleController = (controller: string) => {
    setVisibleControllers(prev => {
      if (prev.length === 0) {
        // Se estava mostrando todos, agora mostra só os outros (exclui o clicado)
        return controllersList.filter(c => c !== controller);
      }
      if (prev.includes(controller)) {
        const newList = prev.filter(c => c !== controller);
        // Se ficou vazio, volta a mostrar todos
        return newList.length === 0 ? [] : newList;
      }
      return [...prev, controller];
    });
  };

  const showAllControllers = () => {
    setVisibleControllers([]);
  };

  // Cores para cada controller
  const controllerColors = useMemo(() => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--warning))",
      "hsl(142, 76%, 36%)", // verde
      "hsl(280, 65%, 60%)", // roxo
      "hsl(200, 80%, 50%)", // azul claro
      "hsl(350, 80%, 55%)", // vermelho
    ];
    const colorMap: Record<string, string> = {};
    controllersList.forEach((controller, idx) => {
      colorMap[controller] = colors[idx % colors.length];
    });
    return colorMap;
  }, [controllersList]);

  const controllers = [...new Set(tasks.map(t => t.controller))];

  // Filtra tarefas para o gráfico de setores baseado no período selecionado
  const sectorFilteredTasks = useMemo(() => {
    const today = new Date();
    
    return filteredTasks.filter(task => {
      if (!task.dataDistribuicao) return false;
      
      switch (sectorPeriod) {
        case "7d":
          return task.dataDistribuicao >= subDays(today, 7);
        case "30d":
          return task.dataDistribuicao >= subDays(today, 30);
        case "90d":
          return task.dataDistribuicao >= subDays(today, 90);
        case "custom":
          if (customSectorStart && task.dataDistribuicao < customSectorStart) return false;
          if (customSectorEnd && task.dataDistribuicao > customSectorEnd) return false;
          return true;
        default:
          return true;
      }
    });
  }, [filteredTasks, sectorPeriod, customSectorStart, customSectorEnd]);

  // Tarefas por setor com percentual
  const tasksBySector = useMemo(() => {
    const counts: Record<string, number> = {};
    
    sectorFilteredTasks.forEach(task => {
      const setor = task.setor || 'Não classificado';
      counts[setor] = (counts[setor] || 0) + 1;
    });
    
    const totalTasks = sectorFilteredTasks.length;
    
    return Object.entries(counts)
      .map(([name, total]) => ({ 
        name, 
        total,
        percent: totalTasks > 0 ? ((total / totalTasks) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => b.total - a.total);
  }, [sectorFilteredTasks]);

  // Cores para setores
  const sectorColors = useMemo(() => {
    const colors = [
      "hsl(220, 70%, 50%)",   // azul
      "hsl(160, 60%, 45%)",   // verde água
      "hsl(280, 65%, 55%)",   // roxo
      "hsl(35, 90%, 55%)",    // laranja
      "hsl(340, 75%, 55%)",   // rosa
      "hsl(180, 60%, 45%)",   // ciano
      "hsl(60, 70%, 45%)",    // amarelo
      "hsl(200, 70%, 50%)",   // azul claro
    ];
    const colorMap: Record<string, string> = {};
    tasksBySector.forEach((item, idx) => {
      colorMap[item.name] = colors[idx % colors.length];
    });
    return colorMap;
  }, [tasksBySector]);

  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [conformityDialogOpen, setConformityDialogOpen] = useState(false);

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
          title="Controllers"
          value={controllers.length}
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
        <MetricCard
          title="Erros de Conformidade"
          value={filteredConformityErrors.length}
          subtitle="Clique para ver detalhes"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          variant={filteredConformityErrors.length > 0 ? "warning" : "default"}
          className="animate-slide-up stagger-5"
          onClick={() => setConformityDialogOpen(true)}
        />
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico: Tarefas por Controller */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tarefas por Controller</CardTitle>
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
              <BarChart data={tasksByController} layout="horizontal">
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

        {/* Gráfico: Tarefas Pendentes por Controller */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tarefas Pendentes por Controller</CardTitle>
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
              <BarChart data={tasksByController} layout="horizontal">
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

        {/* Gráfico: Erros de Conformidade por Destinatário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erros de Conformidade por Destinatário</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: {
                  label: "Erros",
                  color: "hsl(var(--destructive))",
                },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={conformityErrorsByRecipient} layout="horizontal">
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

      {/* Gráfico de Linha: Tarefas por Controller */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Tarefas por Controller ao Longo do Tempo</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de visualização */}
              <ToggleGroup
                type="single"
                value={chart2ViewMode}
                onValueChange={(value) => value && setChart2ViewMode(value as ChartViewMode)}
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
                value={chart2Period}
                onValueChange={(value) => value && setChart2Period(value as ChartPeriod)}
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
          {chart2Period === "custom" && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customChart2Start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customChart2Start
                      ? format(customChart2Start, "dd/MM/yyyy", { locale: ptBR })
                      : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customChart2Start}
                    onSelect={setCustomChart2Start}
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
                      !customChart2End && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customChart2End
                      ? format(customChart2End, "dd/MM/yyyy", { locale: ptBR })
                      : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customChart2End}
                    onSelect={setCustomChart2End}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(customChart2Start || customChart2End) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomChart2Start(undefined);
                    setCustomChart2End(undefined);
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          )}

          {/* Seletor de controllers visíveis */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground mr-2">Mostrar:</span>
            {controllersList.map((controller) => {
              const isActive = activeControllers.includes(controller);
              return (
                <Button
                  key={controller}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleController(controller)}
                  className="gap-2"
                  style={{
                    backgroundColor: isActive ? controllerColors[controller] : undefined,
                    borderColor: controllerColors[controller],
                    color: isActive ? "white" : controllerColors[controller],
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? "white" : controllerColors[controller] }}
                  />
                  {controller}
                </Button>
              );
            })}
            {visibleControllers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={showAllControllers}
              >
                Mostrar todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              controllersList.map(controller => [
                controller,
                { label: controller, color: controllerColors[controller] }
              ])
            )}
            className="h-[400px] w-full"
          >
            <LineChart data={tasksByDateAndController}>
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="font-medium mb-2">{data.fullDate}</div>
                        <div className="space-y-1">
                          {payload.map((entry: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.stroke }}
                              />
                              <span>{entry.name}:</span>
                              <span className="font-medium">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {activeControllers.map((controller) => (
                <Line
                  key={controller}
                  type="monotone"
                  dataKey={controller}
                  name={controller}
                  stroke={controllerColors[controller]}
                  strokeWidth={2}
                  dot={{ fill: controllerColors[controller], strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Colunas: Tarefas por Setor */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Tarefas por Setor</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de período */}
              <ToggleGroup
                type="single"
                value={sectorPeriod}
                onValueChange={(value) => value && setSectorPeriod(value as ChartPeriod)}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem value="all" size="sm" className="text-xs px-3">
                  Tudo
                </ToggleGroupItem>
                <ToggleGroupItem value="7d" size="sm" className="text-xs px-3">
                  7 dias
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
          {sectorPeriod === "custom" && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customSectorStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customSectorStart
                      ? format(customSectorStart, "dd/MM/yyyy", { locale: ptBR })
                      : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customSectorStart}
                    onSelect={setCustomSectorStart}
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
                      !customSectorEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customSectorEnd
                      ? format(customSectorEnd, "dd/MM/yyyy", { locale: ptBR })
                      : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customSectorEnd}
                    onSelect={setCustomSectorEnd}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(customSectorStart || customSectorEnd) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomSectorStart(undefined);
                    setCustomSectorEnd(undefined);
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
              total: {
                label: "Total de Tarefas",
                color: "hsl(220, 70%, 50%)",
              },
            }}
            className="h-[350px] w-full"
          >
            <BarChart data={tasksBySector} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.total} {data.total === 1 ? "tarefa" : "tarefas"}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="total"
                radius={[4, 4, 0, 0]}
                fill="hsl(220, 70%, 50%)"
              >
                <LabelList 
                  dataKey="percent" 
                  position="center" 
                  fill="white"
                  fontSize={12}
                  fontWeight="bold"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <PendingTasksDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        tasks={pendingTasks}
        holidays={holidays}
      />

      <ConformityErrorsDialog
        open={conformityDialogOpen}
        onOpenChange={setConformityDialogOpen}
        errors={filteredConformityErrors}
      />
    </div>
  );
}
