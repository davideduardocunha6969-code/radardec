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
  Calendar,
  ListChecks,
  Target
} from "lucide-react";
import { GoalProgressCard } from "@/components/GoalProgressCard";
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

  // ===================== SANEAMENTO - GRÁFICO ACUMULADO VS META =====================
  const evolucaoAcumuladaSaneamento = useMemo(() => {
    const metaTotalSaneamento = saneamentoData.length; // Meta é sanear todas as pastas
    
    if (metaTotalSaneamento === 0) return { dados: [], metricas: null };

    // Para simular evolução semanal, assumimos distribuição uniforme baseada no status atual
    // Como não temos semana específica no saneamento, calculamos progresso total vs meta
    const saneadas = saneamentoData.filter(r => 
      r.status?.toLowerCase().trim() === 'saneado'
    ).length;

    const dados = [];
    const metaPorSemana = metaTotalSaneamento / 52;
    
    // Calcula progresso sustentável esperado para cada semana
    for (let semana = 1; semana <= 52; semana++) {
      const metaEsperada = Math.round(metaPorSemana * semana);
      
      // Progresso acumulado até a semana atual (distribuído proporcionalmente)
      const progressoEstimado = semana <= semanaAtual 
        ? Math.round((saneadas / semanaAtual) * semana)
        : null;
      
      dados.push({
        semana,
        acumulado: semana <= semanaAtual ? (semana === semanaAtual ? saneadas : progressoEstimado) : null,
        metaSustentavel: metaEsperada,
      });
    }

    // Ajusta o último ponto da semana atual para o valor real
    const indexSemanaAtual = dados.findIndex(d => d.semana === semanaAtual);
    if (indexSemanaAtual !== -1) {
      dados[indexSemanaAtual].acumulado = saneadas;
    }

    const metaEsperadaSemana = Math.round(metaPorSemana * semanaAtual);
    const diferenca = saneadas - metaEsperadaSemana;
    const percentualAtingimento = ((saneadas / metaTotalSaneamento) * 100).toFixed(1);

    return {
      dados,
      metricas: {
        semanaAtual,
        totalSaneado: saneadas,
        metaTotal: metaTotalSaneamento,
        metaEsperadaSemana,
        diferenca,
        percentualAtingimento
      }
    };
  }, [saneamentoData, semanaAtual]);

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

    // Por situação atual
    const porSituacao: Record<string, number> = {};
    transitoData.forEach(r => {
      const situacao = r.situacaoAtual || 'Não informado';
      porSituacao[situacao] = (porSituacao[situacao] || 0) + 1;
    });
    const distribuicaoSituacao = Object.entries(porSituacao)
      .map(([situacao, count]) => ({ situacao, count }))
      .sort((a, b) => b.count - a.count);

    // Por réu (banco) - ranking por valor de honorários
    const porReuValor: Record<string, { count: number; valorTotal: number }> = {};
    transitoData.forEach(r => {
      const reu = r.reu || 'Não informado';
      if (!porReuValor[reu]) {
        porReuValor[reu] = { count: 0, valorTotal: 0 };
      }
      porReuValor[reu].count += 1;
      porReuValor[reu].valorTotal += r.valorTotalHonorarios || 0;
    });
    const rankingReusPorValor = Object.entries(porReuValor)
      .map(([reu, dados]) => ({ reu, ...dados }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
    
    const rankingReusPorQuantidade = Object.entries(porReuValor)
      .map(([reu, dados]) => ({ reu, ...dados }))
      .sort((a, b) => b.count - a.count);

    // Processos com pagamento vs pendentes (vitórias)
    const vitorias = transitoData.filter(r => r.resultadoFinal?.toLowerCase().includes('vitória') || r.resultadoFinal?.toLowerCase().includes('vitoria'));
    const comPagamento = vitorias.filter(r => r.dataPagamento?.trim()).length;
    const semPagamento = vitorias.filter(r => !r.dataPagamento?.trim()).length;

    return { 
      total, 
      totalLiquidacao, 
      totalSucumbencia, 
      totalHonorariosExito, 
      totalHonorarios,
      distribuicaoGrau,
      distribuicaoResultadoFinal,
      distribuicaoSituacao,
      rankingTipoAcao,
      rankingEstados,
      rankingCamaras,
      rankingReusPorValor,
      rankingReusPorQuantidade,
      comPagamento,
      semPagamento
    };
  }, [transitoData]);

  // ===================== TRÂNSITO - GRÁFICO ACUMULADO VS META =====================
  const metaAnualTransito = 1700; // Meta: 1700 acordos + cumprimentos de sentença

  const evolucaoAcumuladaTransito = useMemo(() => {
    // Conta acordos realizados (dataAcordo preenchido com data) e cumprimentos ajuizados (statusCumprimentoSentenca = "ajuizado")
    const acordosRealizados = transitoData.filter(r => {
      const dataAcordo = r.dataAcordo?.trim();
      // Verifica se parece com uma data (contém números)
      return dataAcordo && /\d/.test(dataAcordo);
    });

    const cumprimentosAjuizados = transitoData.filter(r => 
      r.statusCumprimentoSentenca?.toLowerCase().trim() === 'ajuizado'
    );

    console.log('Debug Trânsito - Acordos realizados:', acordosRealizados.length, acordosRealizados.map(r => ({ autor: r.autor, dataAcordo: r.dataAcordo })));
    console.log('Debug Trânsito - Cumprimentos ajuizados:', cumprimentosAjuizados.length, cumprimentosAjuizados.map(r => ({ autor: r.autor, status: r.statusCumprimentoSentenca })));
    console.log('Debug Trânsito - Todos status:', transitoData.map(r => r.statusCumprimentoSentenca));

    const totalAcordosCumprimentos = acordosRealizados.length + cumprimentosAjuizados.length;

    // Gera dados para todas as 52 semanas
    const dados = [];
    
    for (let semana = 1; semana <= 52; semana++) {
      const metaEsperada = Math.round((metaAnualTransito / 52) * semana);
      
      dados.push({
        semana,
        acumulado: semana <= semanaAtual ? totalAcordosCumprimentos : null,
        metaSustentavel: metaEsperada,
      });
    }

    const metaEsperadaSemana = Math.round((metaAnualTransito / 52) * semanaAtual);
    const diferenca = totalAcordosCumprimentos - metaEsperadaSemana;
    const percentualAtingimento = ((totalAcordosCumprimentos / metaAnualTransito) * 100).toFixed(1);

    return {
      dados,
      metricas: {
        semanaAtual,
        totalAcordosCumprimentos,
        acordosRealizados: acordosRealizados.length,
        cumprimentosAjuizados: cumprimentosAjuizados.length,
        metaEsperadaSemana,
        diferenca,
        percentualAtingimento
      }
    };
  }, [transitoData, semanaAtual]);

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

          {/* Gráfico Evolução Acumulada vs Meta */}
          {evolucaoAcumuladaSaneamento.metricas && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Evolução Acumulada vs Meta</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comparativo entre pastas saneadas e a meta de {evolucaoAcumuladaSaneamento.metricas.metaTotal.toLocaleString('pt-BR')} pastas no ano
                </p>
                <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3 text-sm">
                  <div>
                    Semana atual: <span className="font-semibold text-foreground">{evolucaoAcumuladaSaneamento.metricas.semanaAtual}</span>
                  </div>
                  <div>
                    Total saneado: <span className="font-semibold text-foreground">{evolucaoAcumuladaSaneamento.metricas.totalSaneado.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    Meta esperada (S{evolucaoAcumuladaSaneamento.metricas.semanaAtual}): <span className="font-semibold text-foreground">{evolucaoAcumuladaSaneamento.metricas.metaEsperadaSemana.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    Diferença: <span className={`font-semibold ${evolucaoAcumuladaSaneamento.metricas.diferenca >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {evolucaoAcumuladaSaneamento.metricas.diferenca >= 0 ? '+' : ''}{evolucaoAcumuladaSaneamento.metricas.diferenca.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    Atingimento: <span className="font-semibold text-foreground">{evolucaoAcumuladaSaneamento.metricas.percentualAtingimento}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[hsl(239,84%,67%)]" />
                    <span>Pastas Saneadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[hsl(142,71%,45%)] border-dashed" style={{ borderTopWidth: 2, borderStyle: 'dashed' }} />
                    <span>Meta Sustentável ({evolucaoAcumuladaSaneamento.metricas.metaTotal.toLocaleString('pt-BR')}/ano)</span>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucaoAcumuladaSaneamento.dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => value % 4 === 1 ? value : ''}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => value.toLocaleString('pt-BR')}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium mb-1">Semana {label}</p>
                                {payload.map((entry, index) => (
                                  <p key={index} className="text-sm" style={{ color: entry.color }}>
                                    {entry.name === 'acumulado' ? 'Saneado' : 'Meta'}: {entry.value?.toLocaleString('pt-BR') || '-'}
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
          )}

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
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Média:</span>
                  <span className="text-sm font-semibold text-green-500/80">
                    {isLoading ? '--' : formatCurrency(transitoMetricas.total > 0 ? transitoMetricas.totalHonorarios / transitoMetricas.total : 0)}
                  </span>
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
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Média:</span>
                  <span className="text-sm font-semibold text-blue-500/80">
                    {isLoading ? '--' : formatCurrency(transitoMetricas.total > 0 ? transitoMetricas.totalHonorariosExito / transitoMetricas.total : 0)}
                  </span>
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
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Média:</span>
                  <span className="text-sm font-semibold text-purple-500/80">
                    {isLoading ? '--' : formatCurrency(transitoMetricas.total > 0 ? transitoMetricas.totalSucumbencia / transitoMetricas.total : 0)}
                  </span>
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
                  <CardTitle className="text-lg">Local de Trânsito em Julgado</CardTitle>
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
                  <CardTitle className="text-lg">Resultado da Ação</CardTitle>
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

          {/* Situação dos Processos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-lg">Situação dos Processos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {transitoMetricas.distribuicaoSituacao.map((item, index) => {
                  const total = transitoMetricas.total || 1;
                  const percentage = ((item.count / total) * 100).toFixed(1);
                  const colors = [
                    'bg-violet-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500',
                    'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
                    'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-pink-500'
                  ];
                  
                  return (
                    <div key={item.situacao} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        <span className="font-medium text-sm truncate" title={item.situacao}>
                          {item.situacao}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{item.count}</span>
                        <span className="text-sm text-muted-foreground">({percentage}%)</span>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
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

          {/* Rankings de Réus (Bancos) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking por Valor de Honorários */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Ranking de Réus (por Honorários)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.rankingReusPorValor.slice(0, 10).map((item, index) => {
                    const maxValor = transitoMetricas.rankingReusPorValor[0]?.valorTotal || 1;
                    const percentage = (item.valorTotal / maxValor) * 100;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.reu} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[200px]" title={item.reu}>{item.reu}</span>
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

            {/* Ranking por Quantidade de Casos */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Ranking de Réus (por Casos)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitoMetricas.rankingReusPorQuantidade.slice(0, 10).map((item, index) => {
                    const maxCount = transitoMetricas.rankingReusPorQuantidade[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    
                    return (
                      <div key={item.reu} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {medal && <span>{medal}</span>}
                            <span className="font-medium truncate max-w-[200px]" title={item.reu}>{item.reu}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {item.count} casos
                          </span>
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

          {/* Gráfico: Evolução Acumulada vs Meta - Acordos e Cumprimentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Evolução Acumulada vs Meta</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Comparativo entre acordos realizados + cumprimentos ajuizados e a meta de 1.700 no ano
              </p>
            </CardHeader>
            <CardContent>
              {/* Indicadores */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Semana atual:</span>
                  <span className="font-bold text-primary">{evolucaoAcumuladaTransito.metricas?.semanaAtual}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total acumulado:</span>
                  <span className="font-bold text-blue-500">
                    {evolucaoAcumuladaTransito.metricas?.totalAcordosCumprimentos.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({evolucaoAcumuladaTransito.metricas?.acordosRealizados} acordos + {evolucaoAcumuladaTransito.metricas?.cumprimentosAjuizados} cumprimentos)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Meta esperada (S{evolucaoAcumuladaTransito.metricas?.semanaAtual}):</span>
                  <span className="font-bold">
                    {evolucaoAcumuladaTransito.metricas?.metaEsperadaSemana.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Diferença:</span>
                  <span className={`font-bold ${(evolucaoAcumuladaTransito.metricas?.diferenca || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(evolucaoAcumuladaTransito.metricas?.diferenca || 0) >= 0 ? '+' : ''}
                    {evolucaoAcumuladaTransito.metricas?.diferenca.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Atingimento:</span>
                  <span className={`font-bold ${parseFloat(evolucaoAcumuladaTransito.metricas?.percentualAtingimento || '0') >= 100 ? 'text-green-500' : 'text-amber-500'}`}>
                    {evolucaoAcumuladaTransito.metricas?.percentualAtingimento}%
                  </span>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500 rounded" />
                  <span className="text-muted-foreground">Acordos + Cumprimentos Acumulados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500 rounded" style={{ borderStyle: 'dashed' }} />
                  <span className="text-muted-foreground">Meta Sustentável (1.700/ano)</span>
                </div>
              </div>

              {/* Gráfico */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoAcumuladaTransito.dados}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value % 4 === 1 ? value.toString() : ''}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      domain={[0, metaAnualTransito]}
                      tickFormatter={(value) => value.toLocaleString('pt-BR')}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value?.toLocaleString('pt-BR') || '-',
                        name === 'acumulado' ? 'Acumulado' : 'Meta'
                      ]}
                      labelFormatter={(label) => `Semana ${label}`}
                    />
                    <ReferenceLine 
                      x={semanaAtual} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="3 3"
                      label={{ value: 'Hoje', position: 'top', fontSize: 10 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="metaSustentavel" 
                      stroke="hsl(142, 71%, 45%)" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      name="Meta Sustentável"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="acumulado" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={3}
                      dot={false}
                      name="Acumulado"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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

      {/* ===================== SEÇÃO: RADAR METAS BANCÁRIO ===================== */}
      <Collapsible 
        open={openSection === 'metas'} 
        onOpenChange={() => handleSectionToggle('metas')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Metas Bancário</h2>
              <span className="text-sm text-muted-foreground">
                (Acompanhamento de metas anuais)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'metas' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Card Meta Geral Ponderada */}
          {(() => {
            // Cálculos das metas individuais
            const protocolosMeta = metaAnualIniciais;
            const protocolosAlcancado = iniciaisData.length;
            const protocolosPercent = protocolosMeta > 0 ? (protocolosAlcancado / protocolosMeta) * 100 : 0;
            const protocolosEsperado = (protocolosMeta / 52) * semanaAtual;
            const protocolosEsperadoPercent = protocolosMeta > 0 ? (protocolosEsperado / protocolosMeta) * 100 : 0;
            const protocolosDiffPP = protocolosPercent - protocolosEsperadoPercent;

            const saneamentoMeta = saneamentoData.length;
            const saneamentoAlcancado = saneamentoMetricas.saneadas;
            const saneamentoPercent = saneamentoMeta > 0 ? (saneamentoAlcancado / saneamentoMeta) * 100 : 0;
            const saneamentoEsperado = (saneamentoMeta / 52) * semanaAtual;
            const saneamentoEsperadoPercent = saneamentoMeta > 0 ? (saneamentoEsperado / saneamentoMeta) * 100 : 0;
            const saneamentoDiffPP = saneamentoPercent - saneamentoEsperadoPercent;

            const transitoMeta = metaAnualTransito;
            const transitoAlcancado = evolucaoAcumuladaTransito.metricas?.totalAcordosCumprimentos || 0;
            const transitoPercent = transitoMeta > 0 ? (transitoAlcancado / transitoMeta) * 100 : 0;
            const transitoEsperado = (transitoMeta / 52) * semanaAtual;
            const transitoEsperadoPercent = transitoMeta > 0 ? (transitoEsperado / transitoMeta) * 100 : 0;
            const transitoDiffPP = transitoPercent - transitoEsperadoPercent;

            // Pesos
            const pesoProtocolos = 0.45;
            const pesoSaneamento = 0.10;
            const pesoTransito = 0.45;

            // Progresso ponderado
            const progressoPonderado = (protocolosPercent * pesoProtocolos) + (saneamentoPercent * pesoSaneamento) + (transitoPercent * pesoTransito);
            const esperadoPonderado = (protocolosEsperadoPercent * pesoProtocolos) + (saneamentoEsperadoPercent * pesoSaneamento) + (transitoEsperadoPercent * pesoTransito);
            const diffPonderado = progressoPonderado - esperadoPonderado;
            const isPositivo = diffPonderado >= 0;

            return (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-lg font-semibold">Meta Geral do Bancário</CardTitle>
                      <p className="text-sm text-muted-foreground">Progresso ponderado de todas as metas</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    {/* Coluna Esquerda: Percentual Geral */}
                    <div className={`rounded-lg p-6 text-center ${isPositivo ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <p className={`text-5xl font-bold ${isPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
                        {progressoPonderado.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">da meta geral atingida</p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Esperado: </span>
                          <span className="font-medium">{esperadoPonderado.toFixed(1)}%</span>
                          <span className={`ml-2 font-medium ${isPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
                            ({isPositivo ? '+' : ''}{diffPonderado.toFixed(1)} p.p.)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Coluna Direita: Detalhamento por Meta */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Detalhamento por Meta</p>
                      
                      {/* Protocolos */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">Protocolos</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded-full">Peso: 45%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500" 
                              style={{ width: `${Math.min(protocolosPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap">
                          <span className="text-muted-foreground">{protocolosAlcancado}/{protocolosMeta}</span>
                          <span className="ml-2 font-medium">{protocolosPercent.toFixed(1)}%</span>
                          <span className={`ml-2 ${protocolosDiffPP >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {protocolosDiffPP >= 0 ? '→' : '→'} {protocolosDiffPP.toFixed(1)} p.p.
                          </span>
                        </div>
                      </div>

                      {/* Saneamento */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">Saneamento de Pastas</span>
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full">Peso: 10%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-500" 
                              style={{ width: `${Math.min(saneamentoPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap">
                          <span className="text-muted-foreground">{saneamentoAlcancado}/{saneamentoMeta}</span>
                          <span className="ml-2 font-medium">{saneamentoPercent.toFixed(1)}%</span>
                          <span className={`ml-2 ${saneamentoDiffPP >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {saneamentoDiffPP >= 0 ? '→' : '→'} {saneamentoDiffPP.toFixed(1)} p.p.
                          </span>
                        </div>
                      </div>

                      {/* Execuções e Acordos */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">Execuções e Acordos</span>
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded-full">Peso: 45%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 transition-all duration-500" 
                              style={{ width: `${Math.min(transitoPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap">
                          <span className="text-muted-foreground">{transitoAlcancado}/{transitoMeta}</span>
                          <span className="ml-2 font-medium">{transitoPercent.toFixed(1)}%</span>
                          <span className={`ml-2 ${transitoDiffPP >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {transitoDiffPP >= 0 ? '→' : '→'} {transitoDiffPP.toFixed(1)} p.p.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso Geral Ponderado */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso Geral Ponderado</span>
                      <span className="text-sm text-muted-foreground">Semana {semanaAtual} de 52</span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      {/* Marcador de meta esperada */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                        style={{ left: `${Math.min(esperadoPonderado, 100)}%` }}
                      />
                      {/* Barra de progresso */}
                      <div 
                        className={`h-full transition-all duration-500 ${isPositivo ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(progressoPonderado, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>Meta: 100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Cards de Metas Individuais */}
          <div className="grid gap-6">
            {/* Meta Protocolos - Peso 45% */}
            <GoalProgressCard
              title="Meta Protocolos (Peso 45%)"
              icon={FileText}
              iconColor="text-blue-500"
              meta={metaAnualIniciais}
              alcancado={iniciaisData.length}
              semanaAtual={semanaAtual}
              totalSemanas={52}
            />

            {/* Meta Saneamento - Peso 10% */}
            <GoalProgressCard
              title="Meta Saneamento (Peso 10%)"
              icon={FolderCheck}
              iconColor="text-emerald-500"
              meta={saneamentoData.length}
              alcancado={saneamentoMetricas.saneadas}
              semanaAtual={semanaAtual}
              totalSemanas={52}
            />

            {/* Meta Execuções e Acordos - Peso 45% */}
            <GoalProgressCard
              title="Meta Execuções e Acordos (Peso 45%)"
              icon={Scale}
              iconColor="text-purple-500"
              meta={metaAnualTransito}
              alcancado={evolucaoAcumuladaTransito.metricas?.totalAcordosCumprimentos || 0}
              semanaAtual={semanaAtual}
              totalSemanas={52}
            />
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
