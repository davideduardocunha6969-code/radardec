import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useCommercialData } from "@/hooks/useCommercialData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  YAxis,
  PieChart as RechartsPieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const RadarComercial = () => {
  const { data, weeks, isLoading, error } = useCommercialData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [selectedResultado, setSelectedResultado] = useState<string | null>(null);
  const [radarAtendimentosOpen, setRadarAtendimentosOpen] = useState(true);
  const [radarConversaoOpen, setRadarConversaoOpen] = useState(true);

  // Extrai opções únicas para os filtros
  const filterOptions = useMemo(() => {
    const setores = [...new Set(data.map(r => r.setor).filter(Boolean))].sort();
    const responsaveis = [...new Set(data.map(r => r.responsavel).filter(Boolean))].sort();
    const resultados = [...new Set(data.map(r => r.resultado).filter(Boolean))].sort();
    return { setores, responsaveis, resultados };
  }, [data]);

  // Filtra os dados pelos filtros selecionados
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (selectedWeek && record.semana !== selectedWeek) return false;
      if (selectedSetor && record.setor !== selectedSetor) return false;
      if (selectedResponsavel && record.responsavel !== selectedResponsavel) return false;
      if (selectedResultado && record.resultado !== selectedResultado) return false;
      return true;
    });
  }, [data, selectedWeek, selectedSetor, selectedResponsavel, selectedResultado]);

  // Calcula métricas baseadas nos dados filtrados
  const metrics = useMemo(() => {
    const contratosFechados = filteredData.filter(
      r => r.resultado.toLowerCase().includes('contrato fechado')
    );
    
    const totalAtendimentos = filteredData.length;
    const novosClientes = contratosFechados.length;
    const taxaConversao = totalAtendimentos > 0 
      ? ((novosClientes / totalAtendimentos) * 100).toFixed(1) 
      : '0';
    
    const honorariosExitoTotal = filteredData.reduce(
      (sum, r) => sum + r.honorariosExito, 0
    );
    const honorariosIniciaisTotal = filteredData.reduce(
      (sum, r) => sum + r.honorariosIniciais, 0
    );

    return {
      totalAtendimentos,
      novosClientes,
      taxaConversao,
      honorariosExitoTotal,
      honorariosIniciaisTotal,
    };
  }, [filteredData]);

  // Dados para o gráfico de atendimentos por semana (todas as 53 semanas)
  const weeklyChartData = useMemo(() => {
    const weekCounts: Record<number, number> = {};
    
    // Inicializa todas as 53 semanas com 0
    for (let i = 1; i <= 53; i++) {
      weekCounts[i] = 0;
    }
    
    // Contabiliza os atendimentos por semana
    data.forEach(record => {
      if (record.semana > 0 && record.semana <= 53) {
        weekCounts[record.semana] = (weekCounts[record.semana] || 0) + 1;
      }
    });
    
    return Array.from({ length: 53 }, (_, i) => ({
      semana: `${i + 1}`,
      weekNumber: i + 1,
      atendimentos: weekCounts[i + 1] || 0,
    }));
  }, [data]);

  // Dados para o gráfico de atendimentos por responsável
  const responsavelChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.responsavel) {
        counts[record.responsavel] = (counts[record.responsavel] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([responsavel, total]) => ({
        responsavel,
        atendimentos: total,
      }))
      .sort((a, b) => b.atendimentos - a.atendimentos);
  }, [filteredData]);

  // Dados para o gráfico de pizza - Modalidade de Atendimento
  const modalidadeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.modalidade) {
        counts[record.modalidade] = (counts[record.modalidade] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Dados para o gráfico de pizza - Possui Direito
  const possuiDireitoChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.possuiDireito) {
        const label = record.possuiDireito === 'SIM' ? 'Possui Direito' : 
                      record.possuiDireito === 'NÃO' ? 'Não Possui Direito' : record.possuiDireito;
        counts[label] = (counts[label] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Dados para o gráfico de resultado dos atendimentos qualificados (clientes com direito)
  const resultadoQualificadosChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Filtra apenas clientes que possuem direito
    filteredData
      .filter(record => record.possuiDireito === 'SIM')
      .forEach(record => {
        if (record.resultado) {
          counts[record.resultado] = (counts[record.resultado] || 0) + 1;
        }
      });
    
    return Object.entries(counts)
      .map(([resultado, total]) => ({
        resultado,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de atendimentos por setor
  const setorChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.setor) {
        counts[record.setor] = (counts[record.setor] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([setor, total]) => ({
        setor,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de resultado de TODOS os atendimentos
  const resultadoTodosChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.resultado) {
        counts[record.resultado] = (counts[record.resultado] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([resultado, count]) => ({
        resultado,
        total: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Dados para o gráfico de origem do cliente
  const origemClienteChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredData.forEach(record => {
      if (record.origemCliente) {
        counts[record.origemCliente] = (counts[record.origemCliente] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts)
      .map(([origem, count]) => ({
        origem,
        total: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);
  const noShowWeeklyChartData = useMemo(() => {
    const weekStats: Record<number, { total: number; noShow: number }> = {};
    
    // Inicializa todas as 53 semanas
    for (let i = 1; i <= 53; i++) {
      weekStats[i] = { total: 0, noShow: 0 };
    }
    
    // Contabiliza atendimentos e no-shows por semana
    data.forEach(record => {
      if (record.semana > 0 && record.semana <= 53) {
        weekStats[record.semana].total += 1;
        if (record.resultado?.toLowerCase().includes('no-show') || 
            record.resultado?.toLowerCase().includes('no show') ||
            record.resultado?.toLowerCase().includes('noshow')) {
          weekStats[record.semana].noShow += 1;
        }
      }
    });
    
    return Array.from({ length: 53 }, (_, i) => {
      const weekNum = i + 1;
      const stats = weekStats[weekNum];
      const percentage = stats.total > 0 
        ? parseFloat(((stats.noShow / stats.total) * 100).toFixed(1))
        : 0;
      return {
        semana: weekNum,
        percentual: percentage,
        noShows: stats.noShow,
        total: stats.total,
      };
    });
  }, [data]);

  // Dados para o gráfico de tempo médio de atendimento por setor
  const tempoMedioSetorChartData = useMemo(() => {
    const setorStats: Record<string, { totalDias: number; count: number }> = {};
    
    filteredData.forEach(record => {
      if (record.setor && record.dataAtendimento && record.dataFechamento) {
        // Parse das datas
        const dataAtendimento = new Date(record.dataAtendimento);
        const dataFechamento = new Date(record.dataFechamento);
        
        // Verifica se as datas são válidas
        if (!isNaN(dataAtendimento.getTime()) && !isNaN(dataFechamento.getTime())) {
          const diffTime = dataFechamento.getTime() - dataAtendimento.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Apenas considera diferenças positivas ou zero
          if (diffDays >= 0) {
            if (!setorStats[record.setor]) {
              setorStats[record.setor] = { totalDias: 0, count: 0 };
            }
            setorStats[record.setor].totalDias += diffDays;
            setorStats[record.setor].count += 1;
          }
        }
      }
    });
    
    return Object.entries(setorStats)
      .map(([setor, stats]) => ({
        setor,
        mediaDias: stats.count > 0 ? parseFloat((stats.totalDias / stats.count).toFixed(1)) : 0,
        totalAtendimentos: stats.count,
      }))
      .sort((a, b) => b.mediaDias - a.mediaDias);
  }, [filteredData]);

  const PIE_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
  ];

  const chartConfig = {
    atendimentos: {
      label: "Atendimentos",
      color: "hsl(var(--primary))",
    },
  };

  // Componente customizado para o eixo X com texto rotacionado
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          fill="currentColor"
          fontSize={10}
          transform="rotate(-45)"
          className="fill-muted-foreground"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header da página */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Radar Comercial
            </h1>
            <p className="text-muted-foreground mt-1">
              Dashboard de métricas comerciais e captação de clientes
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          )}
        </div>
      </div>


      {/* Cards de métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : metrics.totalAtendimentos}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>
                {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Fechados
            </CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : metrics.novosClientes}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span>
                {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--%' : `${metrics.taxaConversao}%`}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Contratos / Atendimentos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Radar Atendimentos */}
      <Collapsible 
        open={radarAtendimentosOpen} 
        onOpenChange={setRadarAtendimentosOpen}
        className="mb-8"
      >
        <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors mb-4">
          {radarAtendimentosOpen ? (
            <ChevronDown className="h-5 w-5 text-primary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold text-foreground">Radar Atendimentos</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8">
          {/* Filtros */}
          <div className="space-y-4">
            {/* Filtro de Semanas */}
            <WeekFilter
              weeks={weeks}
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
              isLoading={isLoading}
            />

            {/* Filtros adicionais */}
            <div className="flex flex-wrap gap-4">
              {/* Filtro por Setor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Setor</label>
                <Select
                  value={selectedSetor || "all"}
                  onValueChange={(value) => setSelectedSetor(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {filterOptions.setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Responsável */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                <Select
                  value={selectedResponsavel || "all"}
                  onValueChange={(value) => setSelectedResponsavel(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions.responsaveis.map((responsavel) => (
                      <SelectItem key={responsavel} value={responsavel}>
                        {responsavel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Resultado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Resultado</label>
                <Select
                  value={selectedResultado || "all"}
                  onValueChange={(value) => setSelectedResultado(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os resultados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os resultados</SelectItem>
                    {filterOptions.resultados.map((resultado) => (
                      <SelectItem key={resultado} value={resultado}>
                        {resultado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Gráfico de Atendimentos por Semana */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Atendimentos por Semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <XAxis 
                  dataKey="semana" 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="atendimentos" 
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                >
                  <LabelList 
                    dataKey="atendimentos" 
                    position="top" 
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(value: number) => value > 0 ? value : ''}
                  />
                  {weeklyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      className={
                        selectedWeek === entry.weekNumber 
                          ? "fill-accent" 
                          : "fill-primary"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
          </Card>

          {/* Gráfico de Atendimentos por Responsável */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Atendimentos por Responsável</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {responsavelChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={responsavelChartData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="responsavel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="atendimentos" 
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  >
                    <LabelList 
                      dataKey="atendimentos" 
                      position="top" 
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
        {/* Modalidade de Atendimento - Barras Horizontais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Modalidade de Atendimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {modalidadeChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={modalidadeChartData} 
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
                  >
                    <XAxis 
                      type="number"
                      hide
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      className="fill-primary"
                    >
                      <LabelList 
                        dataKey="percentage" 
                        position="right" 
                        className="fill-foreground"
                        fontSize={11}
                        formatter={(value: string) => `${value}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Possui Direito */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Clientes com Direito</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {possuiDireitoChartData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={possuiDireitoChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percentage }) => `${percentage}%`}
                      labelLine={false}
                    >
                      {possuiDireitoChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} clientes`, name]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Legenda */}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {possuiDireitoChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>

          {/* Gráficos de Resultado dos Atendimentos Qualificados e Atendimentos por Setor */}
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Resultado dos Atendimentos Qualificados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {resultadoQualificadosChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={resultadoQualificadosChartData} 
                    margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                  >
                    <XAxis 
                      dataKey="resultado"
                      tick={<CustomXAxisTick />}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} clientes`, 'Total']}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    >
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Atendimentos por Setor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {setorChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={setorChartData} 
                    margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                  >
                    <XAxis 
                      dataKey="setor"
                      tick={<CustomXAxisTick />}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      className="fill-accent"
                    >
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>

          {/* Gráfico de Resultado de Todos os Atendimentos */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resultado de Todos os Atendimentos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {resultadoTodosChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={resultadoTodosChartData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="resultado"
                    tick={<CustomXAxisTick />}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[4, 4, 0, 0]}
                  >
                    {resultadoTodosChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.resultado.toLowerCase().includes('contrato fechado') 
                          ? 'hsl(var(--success))' 
                          : 'hsl(var(--primary))'
                        }
                      />
                    ))}
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      className="fill-foreground"
                      fontSize={12}
                    />
                    <LabelList 
                      dataKey="percentage" 
                      position="center" 
                      formatter={(value: string) => `${value}%`}
                      className="fill-white"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
          </Card>

          {/* Gráfico de Linha - Percentual de No-Show por Semana */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Percentual de No-Show por Semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={noShowWeeklyChartData} 
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <XAxis 
                  dataKey="semana"
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval={3}
                />
                <YAxis 
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.noShows}/${props.payload.total})`,
                    'No-Show'
                  ]}
                  labelFormatter={(label) => `Semana ${label}`}
                />
                <Line 
                  type="monotone"
                  dataKey="percentual"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
          </Card>

          {/* Cards de Tempo Médio para Fechamento por Setor */}
          <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Tempo Médio para Fechamento por Setor
        </h2>
        {tempoMedioSetorChartData.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tempoMedioSetorChartData.map((item) => (
              <Card key={item.setor} className="bg-card">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1 truncate" title={item.setor}>
                    {item.setor}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {item.mediaDias} <span className="text-sm font-normal text-muted-foreground">dias</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.totalAtendimentos} atendimento{item.totalAtendimentos !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
          </div>
        )}
          </div>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setRadarAtendimentosOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Radar de Conversão */}
      <Collapsible 
        open={radarConversaoOpen} 
        onOpenChange={setRadarConversaoOpen}
        className="mb-8"
      >
        <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors mb-4">
          {radarConversaoOpen ? (
            <ChevronDown className="h-5 w-5 text-primary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold text-foreground">Radar de Conversão</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-8">
          {/* Filtro de Semanas */}
          <WeekFilter
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            isLoading={isLoading}
          />

          {/* Cards de métricas de conversão */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Atendimentos Qualificados</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : filteredData.filter(r => r.possuiDireito === 'SIM').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clientes com direito
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Contratos Fechados</p>
                <p className="text-2xl font-bold text-success">
                  {isLoading ? '--' : filteredData.filter(r => r.resultado?.toLowerCase().includes('contrato fechado')).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de fechamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão Geral</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--%' : `${metrics.taxaConversao}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contratos / Atendimentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão Qualificados</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '--%' : (() => {
                    const qualificados = filteredData.filter(r => r.possuiDireito === 'SIM').length;
                    const fechados = filteredData.filter(r => r.possuiDireito === 'SIM' && r.resultado?.toLowerCase().includes('contrato fechado')).length;
                    return qualificados > 0 ? `${((fechados / qualificados) * 100).toFixed(1)}%` : '0%';
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas clientes com direito
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Funil de Conversão */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Funil de Conversão</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const totalAtendimentos = filteredData.length;
                  const qualificados = filteredData.filter(r => r.possuiDireito === 'SIM').length;
                  const contratosFechados = filteredData.filter(r => r.resultado?.toLowerCase().includes('contrato fechado')).length;
                  
                  const funnelData = [
                    { label: 'Total de Atendimentos', value: totalAtendimentos, percentage: 100 },
                    { label: 'Atendimentos Qualificados', value: qualificados, percentage: totalAtendimentos > 0 ? (qualificados / totalAtendimentos) * 100 : 0 },
                    { label: 'Contratos Fechados', value: contratosFechados, percentage: totalAtendimentos > 0 ? (contratosFechados / totalAtendimentos) * 100 : 0 },
                  ];

                  return funnelData.map((item, index) => (
                    <div key={item.label} className="relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.value} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-8 bg-muted/30 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full rounded-lg transition-all ${
                            index === 0 ? 'bg-primary' : 
                            index === 1 ? 'bg-accent' : 
                            'bg-success'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Origem do Cliente */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Ranking de Origem do Cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {origemClienteChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={origemClienteChartData} 
                      margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
                    >
                      <XAxis 
                        dataKey="origem"
                        tick={<CustomXAxisTick />}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        height={80}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} clientes (${props.payload.percentage}%)`,
                          'Total'
                        ]}
                      />
                      <Bar 
                        dataKey="total" 
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      >
                        <LabelList 
                          dataKey="total" 
                          position="top" 
                          className="fill-foreground"
                          fontSize={12}
                        />
                        <LabelList 
                          dataKey="percentage" 
                          position="center" 
                          formatter={(value: string) => `${value}%`}
                          className="fill-white"
                          fontSize={11}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão para recolher seção */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setRadarConversaoOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RadarComercial;
