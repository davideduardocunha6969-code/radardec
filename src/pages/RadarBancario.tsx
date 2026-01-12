import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  FileText,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Trophy,
  Gavel,
  FolderCheck,
  Scale,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Archive,
  Briefcase,
  ClipboardList,
  Calculator,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useBancarioData } from "@/hooks/useBancarioData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from "recharts";
import { getWeek } from "date-fns";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const RadarBancario = () => {
  const { iniciaisData, saneamentoData, transitoData, weeks, isLoading, error } = useBancarioData();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [iniciaisWeekFilter, setIniciaisWeekFilter] = useState<number | null>(null);
  const [iniciaisResponsavelFilter, setIniciaisResponsavelFilter] = useState<string | null>(null);
  const [iniciaisEstadoFilter, setIniciaisEstadoFilter] = useState<string | null>(null);

  const handleSectionToggle = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Lista de responsáveis e estados únicos para os filtros
  const responsaveisUnicos = useMemo(() => {
    const responsaveis = new Set<string>();
    iniciaisData.forEach(r => {
      if (r.responsavel) responsaveis.add(r.responsavel);
    });
    return Array.from(responsaveis).sort();
  }, [iniciaisData]);

  const estadosUnicos = useMemo(() => {
    const estados = new Set<string>();
    iniciaisData.forEach(r => {
      if (r.estado) estados.add(r.estado);
    });
    return Array.from(estados).sort();
  }, [iniciaisData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ===================== INICIAIS - MÉTRICAS =====================
  const iniciaisMetricas = useMemo(() => {
    let dadosFiltrados = iniciaisData;
    
    if (iniciaisWeekFilter) {
      dadosFiltrados = dadosFiltrados.filter(r => r.semana === iniciaisWeekFilter);
    }
    if (iniciaisResponsavelFilter) {
      dadosFiltrados = dadosFiltrados.filter(r => r.responsavel === iniciaisResponsavelFilter);
    }
    if (iniciaisEstadoFilter) {
      dadosFiltrados = dadosFiltrados.filter(r => r.estado === iniciaisEstadoFilter);
    }

    const total = dadosFiltrados.length;
    
    // Por responsável
    const porResponsavel: Record<string, number> = {};
    dadosFiltrados.forEach(r => {
      const resp = r.responsavel || 'Não informado';
      porResponsavel[resp] = (porResponsavel[resp] || 0) + 1;
    });
    const rankingResponsaveis = Object.entries(porResponsavel)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    // Por tipo de ação
    const porTipoAcao: Record<string, number> = {};
    dadosFiltrados.forEach(r => {
      const tipo = r.tipoAcao || 'Não informado';
      porTipoAcao[tipo] = (porTipoAcao[tipo] || 0) + 1;
    });
    const rankingTipoAcao = Object.entries(porTipoAcao)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    // Por estado
    const porEstado: Record<string, number> = {};
    dadosFiltrados.forEach(r => {
      const estado = r.estado || 'Não informado';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });
    const rankingEstados = Object.entries(porEstado)
      .map(([estado, count]) => ({ estado, count }))
      .sort((a, b) => b.count - a.count);

    // Por semana (evolução)
    const porSemana: Record<number, number> = {};
    iniciaisData.forEach(r => {
      if (r.semana > 0) {
        porSemana[r.semana] = (porSemana[r.semana] || 0) + 1;
      }
    });
    const evolucaoSemanal = Object.entries(porSemana)
      .map(([semana, count]) => ({ semana: `S${semana}`, weekNumber: parseInt(semana), count }))
      .sort((a, b) => a.weekNumber - b.weekNumber);

    return { total, rankingResponsaveis, rankingTipoAcao, rankingEstados, evolucaoSemanal };
  }, [iniciaisData, iniciaisWeekFilter, iniciaisResponsavelFilter, iniciaisEstadoFilter]);

  // ===================== INICIAIS - GRÁFICO ACUMULADO VS META =====================
  const metaAnualIniciais = 10000;
  const semanaAtual = getWeek(new Date()) - 1; // Ajuste 0-indexed

  const evolucaoAcumuladaIniciais = useMemo(() => {
    // Calcula os protocolos acumulados por semana
    const porSemana: Record<number, number> = {};
    iniciaisData.forEach(r => {
      if (r.semana > 0) {
        porSemana[r.semana] = (porSemana[r.semana] || 0) + 1;
      }
    });

    // Gera dados para todas as 52 semanas
    const dados = [];
    let acumulado = 0;
    
    for (let semana = 1; semana <= 52; semana++) {
      const protocolosSemana = porSemana[semana] || 0;
      acumulado += protocolosSemana;
      
      const metaEsperada = Math.round((metaAnualIniciais / 52) * semana);
      
      dados.push({
        semana,
        acumulado: semana <= semanaAtual ? acumulado : null,
        metaSustentavel: metaEsperada,
      });
    }

    return dados;
  }, [iniciaisData, semanaAtual]);

  // Métricas do gráfico acumulado
  const metricasAcumuladoIniciais = useMemo(() => {
    const totalAcumulado = iniciaisData.length;
    const metaEsperadaSemana = Math.round((metaAnualIniciais / 52) * semanaAtual);
    const diferenca = totalAcumulado - metaEsperadaSemana;
    const percentualAtingimento = ((totalAcumulado / metaAnualIniciais) * 100).toFixed(1);

    return {
      semanaAtual,
      totalAcumulado,
      metaEsperadaSemana,
      diferenca,
      percentualAtingimento
    };
  }, [iniciaisData, semanaAtual]);

  // ===================== SANEAMENTO - MÉTRICAS =====================
  const saneamentoMetricas = useMemo(() => {
    const total = saneamentoData.length;
    const saneadas = saneamentoData.filter(r => 
      r.status?.toLowerCase().trim() === 'saneado'
    ).length;
    const pendentes = total - saneadas;
    const taxaSaneamento = total > 0 ? ((saneadas / total) * 100).toFixed(1) : '0';

    // Por resultado
    const porResultado: Record<string, number> = {};
    saneamentoData.filter(r => r.status?.toLowerCase().trim() === 'saneado').forEach(r => {
      const resultado = r.resultado || 'Não informado';
      porResultado[resultado] = (porResultado[resultado] || 0) + 1;
    });
    const distribuicaoResultados = Object.entries(porResultado)
      .map(([resultado, count]) => ({ resultado, count }))
      .sort((a, b) => b.count - a.count);

    // Por revisor
    const porRevisor: Record<string, number> = {};
    saneamentoData.filter(r => r.status?.toLowerCase().trim() === 'saneado').forEach(r => {
      const revisor = r.revisor || 'Não informado';
      porRevisor[revisor] = (porRevisor[revisor] || 0) + 1;
    });
    const rankingRevisores = Object.entries(porRevisor)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    return { total, saneadas, pendentes, taxaSaneamento, distribuicaoResultados, rankingRevisores };
  }, [saneamentoData]);

  // ===================== TRÂNSITO EM JULGADO - MÉTRICAS =====================
  const transitoMetricas = useMemo(() => {
    const total = transitoData.length;
    
    // Valores totais
    const totalLiquidacao = transitoData.reduce((sum, r) => sum + (r.valorLiquidacao || 0), 0);
    const totalSucumbencia = transitoData.reduce((sum, r) => sum + (r.valorSucumbencia || 0), 0);
    const totalHonorariosExito = transitoData.reduce((sum, r) => sum + (r.valorHonorariosExito || 0), 0);
    const totalHonorarios = transitoData.reduce((sum, r) => sum + (r.valorTotalHonorarios || 0), 0);

    // Por grau de trânsito
    const porGrau: Record<string, number> = {};
    transitoData.forEach(r => {
      const grau = r.grauTransito || 'Não informado';
      porGrau[grau] = (porGrau[grau] || 0) + 1;
    });
    const distribuicaoGrau = Object.entries(porGrau)
      .map(([grau, count]) => ({ grau, count }))
      .sort((a, b) => b.count - a.count);

    // Por resultado final
    const porResultadoFinal: Record<string, number> = {};
    transitoData.forEach(r => {
      const resultado = r.resultadoFinal || 'Não informado';
      porResultadoFinal[resultado] = (porResultadoFinal[resultado] || 0) + 1;
    });
    const distribuicaoResultadoFinal = Object.entries(porResultadoFinal)
      .map(([resultado, count]) => ({ resultado, count }))
      .sort((a, b) => b.count - a.count);

    // Por tipo de ação
    const porTipoAcao: Record<string, { count: number; valorTotal: number }> = {};
    transitoData.forEach(r => {
      const tipo = r.tipoAcao || 'Não informado';
      if (!porTipoAcao[tipo]) {
        porTipoAcao[tipo] = { count: 0, valorTotal: 0 };
      }
      porTipoAcao[tipo].count += 1;
      porTipoAcao[tipo].valorTotal += r.valorTotalHonorarios || 0;
    });
    const rankingTipoAcao = Object.entries(porTipoAcao)
      .map(([tipo, dados]) => ({ tipo, ...dados }))
      .sort((a, b) => b.valorTotal - a.valorTotal);

    // Por estado
    const porEstado: Record<string, { count: number; valorTotal: number }> = {};
    transitoData.forEach(r => {
      const estado = r.estado || 'Não informado';
      if (!porEstado[estado]) {
        porEstado[estado] = { count: 0, valorTotal: 0 };
      }
      porEstado[estado].count += 1;
      porEstado[estado].valorTotal += r.valorTotalHonorarios || 0;
    });
    const rankingEstados = Object.entries(porEstado)
      .map(([estado, dados]) => ({ estado, ...dados }))
      .sort((a, b) => b.valorTotal - a.valorTotal);

    // Por câmara
    const porCamara: Record<string, { count: number; vitorias: number }> = {};
    transitoData.forEach(r => {
      const camara = r.camara || 'Não informado';
      if (!porCamara[camara]) {
        porCamara[camara] = { count: 0, vitorias: 0 };
      }
      porCamara[camara].count += 1;
      // Considera vitória se tem valor de honorários
      if ((r.valorTotalHonorarios || 0) > 0) {
        porCamara[camara].vitorias += 1;
      }
    });
    const rankingCamaras = Object.entries(porCamara)
      .map(([camara, dados]) => ({ 
        camara, 
        ...dados,
        taxaVitoria: dados.count > 0 ? ((dados.vitorias / dados.count) * 100).toFixed(1) : '0'
      }))
      .filter(c => c.camara !== 'Não informado' && c.count >= 3)
      .sort((a, b) => parseFloat(b.taxaVitoria) - parseFloat(a.taxaVitoria));

    // Processos com pagamento vs pendentes
    const comPagamento = transitoData.filter(r => r.dataPagamento?.trim()).length;
    const semPagamento = total - comPagamento;

    return { 
      total, 
      totalLiquidacao, 
      totalSucumbencia, 
      totalHonorariosExito, 
      totalHonorarios,
      distribuicaoGrau,
      distribuicaoResultadoFinal,
      rankingTipoAcao,
      rankingEstados,
      rankingCamaras,
      comPagamento,
      semPagamento
    };
  }, [transitoData]);

  const chartConfig = {
    count: { label: "Quantidade", color: "hsl(var(--primary))" },
    valor: { label: "Valor", color: "hsl(var(--success))" },
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(142, 71%, 45%)', 'hsl(280, 65%, 60%)'];

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Radar Bancário
            </h1>
            <p className="text-muted-foreground mt-1">
              Dashboard de métricas do setor bancário
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

      {/* ===================== SEÇÃO: RADAR INICIAIS ===================== */}
      <Collapsible 
        open={openSection === 'iniciais'} 
        onOpenChange={() => handleSectionToggle('iniciais')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Iniciais</h2>
              <span className="text-sm text-muted-foreground">
                ({iniciaisData.length} petições protocoladas)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'iniciais' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Filtros */}
          <div className="flex gap-4 items-stretch w-full">
            <div className="flex-1">
              <WeekFilter
                weeks={weeks}
                selectedWeek={iniciaisWeekFilter}
                onWeekChange={setIniciaisWeekFilter}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col gap-2 w-[180px]">
              <Select
                value={iniciaisResponsavelFilter || "all"}
                onValueChange={(value) => setIniciaisResponsavelFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {responsaveisUnicos.map(resp => (
                    <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={iniciaisEstadoFilter || "all"}
                onValueChange={(value) => setIniciaisEstadoFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {estadosUnicos.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Protocoladas
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : iniciaisMetricas.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {iniciaisWeekFilter ? `Semana ${iniciaisWeekFilter}` : 'Todas as semanas'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estados Atendidos
                </CardTitle>
                <MapPin className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : iniciaisMetricas.rankingEstados.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  UFs com processos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução Acumulada vs Meta */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Evolução Acumulada vs Meta</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Comparativo entre protocolos acumulados e a meta de {metaAnualIniciais.toLocaleString('pt-BR')} ajuizamentos no ano
              </p>
            </CardHeader>
            <CardContent>
              {/* Métricas do gráfico */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Semana atual: </span>
                  <span className="font-semibold">{metricasAcumuladoIniciais.semanaAtual}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total acumulado: </span>
                  <span className="font-semibold text-blue-600">{metricasAcumuladoIniciais.totalAcumulado.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Meta esperada (S{metricasAcumuladoIniciais.semanaAtual}): </span>
                  <span className="font-semibold">{metricasAcumuladoIniciais.metaEsperadaSemana.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Diferença: </span>
                  <span className={`font-semibold ${metricasAcumuladoIniciais.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metricasAcumuladoIniciais.diferenca >= 0 ? '+' : ''}{metricasAcumuladoIniciais.diferenca.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Atingimento: </span>
                  <span className="font-semibold text-primary">{metricasAcumuladoIniciais.percentualAtingimento}%</span>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-6 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-600 rounded" />
                  <span className="text-muted-foreground">Protocolos Acumulados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500 rounded border-dashed" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: 'hsl(142, 71%, 45%)' }} />
                  <span className="text-muted-foreground">Meta Sustentável ({metaAnualIniciais.toLocaleString('pt-BR')}/ano)</span>
                </div>
              </div>

              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoAcumuladaIniciais} margin={{ top: 30, right: 20, left: 20, bottom: 10 }}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => value.toLocaleString('pt-BR')}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold mb-2">Semana {label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name === 'acumulado' ? 'Acumulado' : 'Meta'}: {entry.value?.toLocaleString('pt-BR') || '-'}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      x={semanaAtual} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="4 4"
                      label={{ 
                        value: 'Hoje', 
                        position: 'top', 
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 11
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="metaSustentavel" 
                      stroke="hsl(142, 71%, 45%)" 
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      name="metaSustentavel"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="acumulado" 
                      stroke="hsl(239, 84%, 67%)" 
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                      name="acumulado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Evolução Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Evolução Semanal de Protocolos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={iniciaisMetricas.evolucaoSemanal} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(239, 84%, 67%)"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={10}
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Rankings */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Ranking por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking de Responsáveis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {iniciaisMetricas.rankingResponsaveis.slice(0, 10).map((item, index) => {
                    const maxCount = iniciaisMetricas.rankingResponsaveis[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.nome} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[150px]">{item.nome}</span>
                          </span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ranking por Tipo de Ação */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg">Tipos de Ação</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {iniciaisMetricas.rankingTipoAcao.slice(0, 10).map((item, index) => {
                    const maxCount = iniciaisMetricas.rankingTipoAcao[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    
                    return (
                      <div key={item.tipo} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[180px]">{item.tipo}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ranking por Estado */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Distribuição por Estado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {iniciaisMetricas.rankingEstados.slice(0, 10).map((item, index) => {
                    const maxCount = iniciaisMetricas.rankingEstados[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    
                    return (
                      <div key={item.estado} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.estado}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ===================== SEÇÃO: RADAR SANEAMENTO ===================== */}
      <Collapsible 
        open={openSection === 'saneamento'} 
        onOpenChange={() => handleSectionToggle('saneamento')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FolderCheck className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Saneamento</h2>
              <span className="text-sm text-muted-foreground">
                ({saneamentoMetricas.saneadas}/{saneamentoMetricas.total} pastas saneadas)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'saneamento' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Cards de Métricas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pastas
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : saneamentoMetricas.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pastas para revisão
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pastas Saneadas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {isLoading ? '--' : saneamentoMetricas.saneadas}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revisões concluídas
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pastas Pendentes
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {isLoading ? '--' : saneamentoMetricas.pendentes}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando revisão
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Saneamento
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {isLoading ? '--%' : `${saneamentoMetricas.taxaSaneamento}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Progresso total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição e Rankings */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Distribuição por Resultado */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Distribuição por Resultado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {saneamentoMetricas.distribuicaoResultados.map((item, index) => {
                    const total = saneamentoMetricas.saneadas || 1;
                    const percentage = ((item.count / total) * 100).toFixed(1);
                    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                    const icons: Record<string, React.ReactNode> = {
                      'Arquivado': <Archive className="h-4 w-4" />,
                      'Cível': <Scale className="h-4 w-4" />,
                      'Cumprimento de sentença': <Briefcase className="h-4 w-4" />,
                    };
                    
                    return (
                      <div key={item.resultado} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium">
                            {icons[item.resultado] || <FileText className="h-4 w-4" />}
                            {item.resultado}
                          </span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {saneamentoMetricas.distribuicaoResultados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma pasta saneada ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ranking de Revisores */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking de Revisores</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {saneamentoMetricas.rankingRevisores.slice(0, 10).map((item, index) => {
                    const maxCount = saneamentoMetricas.rankingRevisores[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.nome} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[150px]">{item.nome}</span>
                          </span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {saneamentoMetricas.rankingRevisores.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum revisor registrado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Recolher seção
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ===================== SEÇÃO: RADAR TRÂNSITO EM JULGADO ===================== */}
      <Collapsible 
        open={openSection === 'transito'} 
        onOpenChange={() => handleSectionToggle('transito')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Trânsito em Julgado</h2>
              <span className="text-sm text-muted-foreground">
                ({transitoMetricas.total} processos • {formatCurrency(transitoMetricas.totalHonorarios)} em honorários)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'transito' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Cards de Valores */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-emerald-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Processos
                </CardTitle>
                <FileText className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? '--' : transitoMetricas.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Transitados em julgado
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Honorários
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {isLoading ? '--' : formatCurrency(transitoMetricas.totalHonorarios)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Êxito + Sucumbência
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Honorários de Êxito
                </CardTitle>
                <Calculator className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {isLoading ? '--' : formatCurrency(transitoMetricas.totalHonorariosExito)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor estimado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sucumbência
                </CardTitle>
                <Calculator className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {isLoading ? '--' : formatCurrency(transitoMetricas.totalSucumbencia)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor estimado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Status de Pagamento */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Processos Pagos
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {isLoading ? '--' : transitoMetricas.comPagamento}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Com data de pagamento registrada
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aguardando Pagamento
                </CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">
                  {isLoading ? '--' : transitoMetricas.semPagamento}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pendentes de recebimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Por Grau de Trânsito */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-lg">Distribuição por Grau</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.distribuicaoGrau.map((item, index) => {
                    const total = transitoMetricas.total || 1;
                    const percentage = ((item.count / total) * 100).toFixed(1);
                    const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'];
                    
                    return (
                      <div key={item.grau} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.grau}</span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Por Resultado Final */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Distribuição por Resultado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.distribuicaoResultadoFinal.slice(0, 8).map((item, index) => {
                    const total = transitoMetricas.total || 1;
                    const percentage = ((item.count / total) * 100).toFixed(1);
                    
                    return (
                      <div key={item.resultado} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[180px]">{item.resultado}</span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rankings de Valores */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Ranking por Tipo de Ação (Valor) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Tipos de Ação (por Valor)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.rankingTipoAcao.slice(0, 8).map((item, index) => {
                    const maxValor = transitoMetricas.rankingTipoAcao[0]?.valorTotal || 1;
                    const percentage = (item.valorTotal / maxValor) * 100;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.tipo} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[120px]">{item.tipo}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatCurrency(item.valorTotal)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ranking por Estado (Valor) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg">Estados (por Valor)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.rankingEstados.slice(0, 8).map((item, index) => {
                    const maxValor = transitoMetricas.rankingEstados[0]?.valorTotal || 1;
                    const percentage = (item.valorTotal / maxValor) * 100;
                    
                    return (
                      <div key={item.estado} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.estado}</span>
                          <span className="text-muted-foreground text-xs">
                            {item.count} • {formatCurrency(item.valorTotal)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ranking por Câmara (Taxa de Vitória) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg">Câmaras (Taxa de Sucesso)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.rankingCamaras.slice(0, 8).map((item, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.camara} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[120px]">{item.camara}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {item.taxaVitoria}% ({item.vitorias}/{item.count})
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${item.taxaVitoria}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {transitoMetricas.rankingCamaras.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Dados insuficientes para ranking
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOpenSection(null)}
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

export default RadarBancario;
