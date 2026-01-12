import { useMemo, useState } from "react";
import { 
  Loader2, 
  AlertTriangle, 
  FileText, 
  Users, 
  FolderCheck, 
  TrendingUp, 
  Clock,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Trophy,
  ClipboardList,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Star,
  Shield,
  FileCheck
} from "lucide-react";
import { usePrevidenciarioData } from "@/hooks/usePrevidenciarioData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  LabelList,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  value: { label: "Quantidade", color: "hsl(var(--primary))" },
  pendentes: { label: "Pendentes", color: "hsl(var(--primary))" },
};

const RadarPrevidenciario = () => {
  const { data, isLoading, error } = usePrevidenciarioData();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [peticoesWeekFilter, setPeticoesWeekFilter] = useState<string | null>(null);
  const [tarefasWeekFilter, setTarefasWeekFilter] = useState<string | null>(null);
  const [aposentadoriasWeekFilter, setAposentadoriasWeekFilter] = useState<string | null>(null);

  // Handler para abrir/fechar seções (comportamento accordion)
  const handleSectionToggle = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Extrai semanas únicas para os filtros
  const weekOptions = useMemo(() => {
    const peticoesWeeks = [...new Set(data?.peticoesIniciais?.map(r => r.semana).filter(Boolean))].sort();
    const tarefasWeeks = [...new Set(data?.tarefas?.map(r => r.semana).filter(Boolean))].sort();
    const aposentadoriasWeeks = [...new Set(data?.aposentadorias?.map(r => r.semana).filter(Boolean))].sort();
    return { peticoesWeeks, tarefasWeeks, aposentadoriasWeeks };
  }, [data]);

  // Custom XAxis tick para textos longos
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const text = payload.value || '';
    const maxLength = 12;
    const displayText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
          transform="rotate(-45)"
        >
          {displayText}
        </text>
      </g>
    );
  };

  // Process data for charts
  const peticoesPorBeneficioData = useMemo(() => {
    if (!data?.stats?.peticoesPorBeneficio) return [];
    return Object.entries(data.stats.peticoesPorBeneficio)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  // Ranking por soma de honorários de êxito
  const rankingHonorariosData = useMemo(() => {
    if (!data?.peticoesIniciais) return [];
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const byBeneficio = filtered.reduce((acc, p) => {
      if (p.tipoBeneficio) {
        if (!acc[p.tipoBeneficio]) {
          acc[p.tipoBeneficio] = { total: 0, count: 0 };
        }
        acc[p.tipoBeneficio].total += p.expectativaHonorarios || 0;
        acc[p.tipoBeneficio].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(byBeneficio)
      .map(([name, { total, count }]) => ({ name, total, count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data, peticoesWeekFilter]);

  // Ranking por quantidade de petições por tipo
  const rankingTipoPeticoesData = useMemo(() => {
    if (!data?.peticoesIniciais) return [];
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const byTipo = filtered.reduce((acc, p) => {
      if (p.tipoBeneficio) {
        acc[p.tipoBeneficio] = (acc[p.tipoBeneficio] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, peticoesWeekFilter]);

  const peticoesPorResponsavelData = useMemo(() => {
    if (!data?.peticoesIniciais) return [];
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const byResponsavel = filtered.reduce((acc, p) => {
      if (p.responsavel) {
        acc[p.responsavel] = (acc[p.responsavel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byResponsavel)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, peticoesWeekFilter]);

  // Campos booleanos (EPI, GPS, Autônomo, Rural < 12) - Categorias mutuamente exclusivas
  const camposBooleanos = useMemo(() => {
    if (!data?.peticoesIniciais) return null;
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const total = filtered.length;
    if (total === 0) return null;

    const isSim = (value: string) => value?.toLowerCase().trim() === 'sim';
    const isNao = (value: string) => value?.toLowerCase().trim() === 'não' || value?.toLowerCase().trim() === 'nao';

    // Casos onde TODOS são "não" (processos "bons")
    const todosNao = filtered.filter(p => 
      isNao(p.epiEficaz) && isNao(p.gps) && isNao(p.autonomo) && isNao(p.ruralMenor12)
    ).length;

    // Casos com pelo menos um tema especial
    const comTemasEspeciais = total - todosNao;

    // Contagem de cada tema (para mostrar distribuição dentro dos processos com temas)
    const epiSim = filtered.filter(p => isSim(p.epiEficaz)).length;
    const gpsSim = filtered.filter(p => isSim(p.gps)).length;
    const autonomoSim = filtered.filter(p => isSim(p.autonomo)).length;
    const ruralSim = filtered.filter(p => isSim(p.ruralMenor12)).length;

    // Total de ocorrências de temas (um processo pode ter múltiplos temas)
    const totalTemasOcorrencias = epiSim + gpsSim + autonomoSim + ruralSim;

    return {
      total,
      // Percentuais que somam 100% (processos bons vs processos com temas)
      todosNao: { count: todosNao, percent: Math.round((todosNao / total) * 100) },
      comTemas: { count: comTemasEspeciais, percent: Math.round((comTemasEspeciais / total) * 100) },
      // Distribuição dos temas dentro do total de processos (contagem absoluta + % sobre total)
      epi: { sim: epiSim, percentTotal: Math.round((epiSim / total) * 100), percentTemas: totalTemasOcorrencias > 0 ? Math.round((epiSim / totalTemasOcorrencias) * 100) : 0 },
      gps: { sim: gpsSim, percentTotal: Math.round((gpsSim / total) * 100), percentTemas: totalTemasOcorrencias > 0 ? Math.round((gpsSim / totalTemasOcorrencias) * 100) : 0 },
      autonomo: { sim: autonomoSim, percentTotal: Math.round((autonomoSim / total) * 100), percentTemas: totalTemasOcorrencias > 0 ? Math.round((autonomoSim / totalTemasOcorrencias) * 100) : 0 },
      rural: { sim: ruralSim, percentTotal: Math.round((ruralSim / total) * 100), percentTemas: totalTemasOcorrencias > 0 ? Math.round((ruralSim / totalTemasOcorrencias) * 100) : 0 },
      totalTemasOcorrencias,
    };
  }, [data, peticoesWeekFilter]);

  // Petições por situação (filtrado)
  const peticoesPorSituacaoData = useMemo(() => {
    if (!data?.peticoesIniciais) return [];
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const bySituacao = filtered.reduce((acc, p) => {
      if (p.situacao) {
        acc[p.situacao] = (acc[p.situacao] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = filtered.length;
    return Object.entries(bySituacao)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, peticoesWeekFilter]);

  // Nota média das petições corrigidas
  const notaMediaCorrecao = useMemo(() => {
    if (!data?.peticoesIniciais) return null;
    
    const filtered = peticoesWeekFilter 
      ? data.peticoesIniciais.filter(p => p.semana === peticoesWeekFilter)
      : data.peticoesIniciais;
    
    const comNota = filtered.filter(p => {
      const nota = parseFloat(p.notaCorrecao);
      return !isNaN(nota) && nota > 0;
    });

    if (comNota.length === 0) return null;

    const somaNotas = comNota.reduce((acc, p) => acc + parseFloat(p.notaCorrecao), 0);
    const media = somaNotas / comNota.length;

    return {
      media: media.toFixed(2),
      total: comNota.length,
    };
  }, [data, peticoesWeekFilter]);

  const tarefasPorTipoData = useMemo(() => {
    if (!data?.tarefas) return [];
    
    const filtered = tarefasWeekFilter 
      ? data.tarefas.filter(t => t.semana === tarefasWeekFilter)
      : data.tarefas;
    
    const byTipo = filtered.reduce((acc, t) => {
      if (t.tipoTarefa) {
        acc[t.tipoTarefa] = (acc[t.tipoTarefa] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, tarefasWeekFilter]);

  const tarefasPorResponsavelData = useMemo(() => {
    if (!data?.tarefas) return [];
    
    const filtered = tarefasWeekFilter 
      ? data.tarefas.filter(t => t.semana === tarefasWeekFilter)
      : data.tarefas;
    
    const byResponsavel = filtered.reduce((acc, t) => {
      if (t.responsavel) {
        acc[t.responsavel] = (acc[t.responsavel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byResponsavel)
      .map(([name, value], index) => ({ 
        name, 
        value,
        posicao: index + 1
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, tarefasWeekFilter]);

  const aposentadoriasPorTipoData = useMemo(() => {
    if (!data?.aposentadorias) return [];
    
    const filtered = aposentadoriasWeekFilter 
      ? data.aposentadorias.filter(a => a.semana === aposentadoriasWeekFilter)
      : data.aposentadorias;
    
    const byTipo = filtered.reduce((acc, a) => {
      if (a.tipoAcao) {
        acc[a.tipoAcao] = (acc[a.tipoAcao] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, aposentadoriasWeekFilter]);

  const aposentadoriasPorSituacaoData = useMemo(() => {
    if (!data?.aposentadorias) return [];
    
    const filtered = aposentadoriasWeekFilter 
      ? data.aposentadorias.filter(a => a.semana === aposentadoriasWeekFilter)
      : data.aposentadorias;
    
    const bySituacao = filtered.reduce((acc, a) => {
      if (a.situacao) {
        acc[a.situacao] = (acc[a.situacao] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bySituacao)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, aposentadoriasWeekFilter]);

  const aposentadoriasPorResponsavelData = useMemo(() => {
    if (!data?.aposentadorias) return [];
    
    const filtered = aposentadoriasWeekFilter 
      ? data.aposentadorias.filter(a => a.semana === aposentadoriasWeekFilter)
      : data.aposentadorias;
    
    const byResponsavel = filtered.reduce((acc, a) => {
      if (a.responsavel) {
        acc[a.responsavel] = (acc[a.responsavel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byResponsavel)
      .map(([name, value], index) => ({ 
        name, 
        value,
        posicao: index + 1
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, aposentadoriasWeekFilter]);

  const evolucaoData = useMemo(() => {
    if (!data?.evolucaoIncapacidade) return [];
    return data.evolucaoIncapacidade.map(item => ({
      semana: item.semana,
      pendentes: item.quantidadePendentes,
    }));
  }, [data]);

  const pastasPorSituacaoData = useMemo(() => {
    if (!data?.stats?.pastasPorSituacao) return [];
    return Object.entries(data.stats.pastasPorSituacao)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const pastasPorResponsavelData = useMemo(() => {
    if (!data?.pastasCorrecao) return [];
    
    const byResponsavel = data.pastasCorrecao.reduce((acc, p) => {
      if (p.responsavel) {
        acc[p.responsavel] = (acc[p.responsavel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byResponsavel)
      .map(([name, value], index) => ({ 
        name, 
        value,
        posicao: index + 1
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados previdenciários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-12 w-12" />
          <p>Erro ao carregar dados: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">
          Radar Previdenciário
        </h1>
        <p className="text-muted-foreground mt-2">
          Acompanhamento de métricas e metas do setor previdenciário
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Petições
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalPeticoes || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tarefas
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalTarefas || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aposentadorias Analisadas
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalAposentadorias || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pastas para Correção
            </CardTitle>
            <FolderCheck className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalPastasCorrecao || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total das Causas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.stats?.valorTotalCausas || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expectativa de Honorários
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data?.stats?.valorTotalHonorarios || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 1: Radar Petições Iniciais (GID 1358203598) */}
      <Collapsible 
        open={openSection === 'peticoes'} 
        onOpenChange={() => handleSectionToggle('peticoes')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Petições Iniciais</h2>
              <span className="text-sm text-muted-foreground">({data?.stats?.totalPeticoes || 0} petições)</span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'peticoes' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Filtro de Semana */}
          <div className="flex items-center gap-4">
            <Select
              value={peticoesWeekFilter || "all"}
              onValueChange={(value) => setPeticoesWeekFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as semanas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as semanas</SelectItem>
                {weekOptions.peticoesWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    Semana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {peticoesWeekFilter && (
              <button
                onClick={() => setPeticoesWeekFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar filtro
              </button>
            )}
          </div>

          {/* Primeira linha: Rankings por Honorários e por Tipo */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking por Soma de Honorários de Êxito */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Ranking por Honorários de Êxito</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Ordenado pela soma de expectativa de honorários</p>
              </CardHeader>
              <CardContent>
                {rankingHonorariosData.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {rankingHonorariosData.map((item, index) => {
                      const maxValue = rankingHonorariosData[0]?.total || 1;
                      const barWidth = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
                      const posicao = index + 1;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-28 text-xs font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-green-600 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            ({item.count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking por Tipo de Petição (Quantidade) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Ranking por Tipo de Petição</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Ordenado pela quantidade de petições</p>
              </CardHeader>
              <CardContent>
                {rankingTipoPeticoesData.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {rankingTipoPeticoesData.map((item, index) => {
                      const maxValue = rankingTipoPeticoesData[0]?.value || 1;
                      const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      const posicao = index + 1;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-28 text-xs font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-primary rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {item.value} petições
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha: Ranking por Responsável e Campos Booleanos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking de Petições por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking por Responsável</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Ordenado pela quantidade de petições</p>
              </CardHeader>
              <CardContent>
                {peticoesPorResponsavelData.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {peticoesPorResponsavelData.map((item, index) => {
                      const maxValue = peticoesPorResponsavelData[0]?.value || 1;
                      const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      const posicao = index + 1;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-24 text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-yellow-500 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campos Especiais (EPI, GPS, Autônomo, Rural) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Análise de Temas Especiais</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Distribuição de processos por complexidade</p>
              </CardHeader>
              <CardContent>
                {camposBooleanos ? (
                  <div className="space-y-5">
                    {/* Resumo Principal - Soma = 100% */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Classificação dos Processos (100%)</p>
                      
                      {/* Processos "Bons" - Todos NÃO */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Processos Simples</span>
                            <span className="text-xs text-muted-foreground">(sem temas especiais)</span>
                          </span>
                          <span className="font-bold text-green-600">{camposBooleanos.todosNao.count} ({camposBooleanos.todosNao.percent}%)</span>
                        </div>
                        <Progress value={camposBooleanos.todosNao.percent} className="h-3 [&>div]:bg-green-500" />
                      </div>

                      {/* Processos com Temas Especiais */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Processos Complexos</span>
                            <span className="text-xs text-muted-foreground">(com temas especiais)</span>
                          </span>
                          <span className="font-bold text-amber-600">{camposBooleanos.comTemas.count} ({camposBooleanos.comTemas.percent}%)</span>
                        </div>
                        <Progress value={camposBooleanos.comTemas.percent} className="h-3 [&>div]:bg-amber-500" />
                      </div>
                    </div>

                    {/* Detalhamento dos Temas Especiais */}
                    {camposBooleanos.comTemas.count > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Detalhamento dos Temas Especiais</p>
                        <p className="text-xs text-muted-foreground">Um processo pode discutir múltiplos temas</p>
                        
                        {/* EPI Eficaz */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              EPI Eficaz
                            </span>
                            <span className="font-medium">{camposBooleanos.epi.sim} casos ({camposBooleanos.epi.percentTotal}% do total)</span>
                          </div>
                          <Progress value={camposBooleanos.epi.percentTotal} className="h-2 [&>div]:bg-blue-500" />
                        </div>

                        {/* Emissão de GPS */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              Emissão de GPS
                            </span>
                            <span className="font-medium">{camposBooleanos.gps.sim} casos ({camposBooleanos.gps.percentTotal}% do total)</span>
                          </div>
                          <Progress value={camposBooleanos.gps.percentTotal} className="h-2 [&>div]:bg-purple-500" />
                        </div>

                        {/* Período Especial Autônomo */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              Período Especial Autônomo
                            </span>
                            <span className="font-medium">{camposBooleanos.autonomo.sim} casos ({camposBooleanos.autonomo.percentTotal}% do total)</span>
                          </div>
                          <Progress value={camposBooleanos.autonomo.percentTotal} className="h-2 [&>div]:bg-orange-500" />
                        </div>

                        {/* Período Rural < 12 anos */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500" />
                              Período Rural &lt; 12 anos
                            </span>
                            <span className="font-medium">{camposBooleanos.rural.sim} casos ({camposBooleanos.rural.percentTotal}% do total)</span>
                          </div>
                          <Progress value={camposBooleanos.rural.percentTotal} className="h-2 [&>div]:bg-rose-500" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha: Situação das Petições e Nota Média */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Situação das Petições */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-chart-2" />
                  <CardTitle className="text-lg">Situação das Petições</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {peticoesPorSituacaoData.length > 0 ? (
                  <div className="space-y-3">
                    {peticoesPorSituacaoData.map((item, index) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate" title={item.name}>{item.name}</span>
                          <span className="font-medium">{item.value} ({item.percent}%)</span>
                        </div>
                        <div className="relative h-3 bg-muted/30 rounded overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                            style={{ 
                              width: `${item.percent}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nota Média das Correções */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Nota Média das Correções</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Média das notas de revisão das petições corrigidas</p>
              </CardHeader>
              <CardContent>
                {notaMediaCorrecao ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative">
                      <div className="text-6xl font-bold text-primary">
                        {notaMediaCorrecao.media}
                      </div>
                      <div className="absolute -top-2 -right-6">
                        <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-4">
                      Baseado em <span className="font-semibold text-foreground">{notaMediaCorrecao.total}</span> petições corrigidas
                    </p>
                    <div className="flex items-center gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`h-6 w-6 ${
                            star <= Math.round(parseFloat(notaMediaCorrecao.media))
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhuma petição corrigida com nota</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção 2: Radar Evolução Incapacidade (GID 306675231) */}
      <Collapsible 
        open={openSection === 'evolucao'} 
        onOpenChange={() => handleSectionToggle('evolucao')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg border border-orange-500/30 hover:border-orange-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Evolução Incapacidade</h2>
              <span className="text-sm text-muted-foreground">(Casos pendentes de ajuizamento)</span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'evolucao' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Evolução Semanal de Casos Pendentes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {evolucaoData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucaoData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="semana" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} casos`, 'Pendentes']}
                        labelFormatter={(label) => `Semana ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="pendentes"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado de evolução disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção 3: Radar Tarefas (GID 1379612642) */}
      <Collapsible 
        open={openSection === 'tarefas'} 
        onOpenChange={() => handleSectionToggle('tarefas')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Tarefas</h2>
              <span className="text-sm text-muted-foreground">({data?.stats?.totalTarefas || 0} tarefas)</span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'tarefas' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Filtro de Semana */}
          <div className="flex items-center gap-4">
            <Select
              value={tarefasWeekFilter || "all"}
              onValueChange={(value) => setTarefasWeekFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as semanas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as semanas</SelectItem>
                {weekOptions.tarefasWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    Semana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tarefasWeekFilter && (
              <button
                onClick={() => setTarefasWeekFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Tarefas por Tipo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Por Tipo de Tarefa</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tarefasPorTipoData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tarefasPorTipoData} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value: number) => [`${value} tarefas`, 'Total']} />
                        <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={11} />
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

            {/* Ranking de Tarefas por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking por Responsável</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tarefasPorResponsavelData.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {tarefasPorResponsavelData.map((item, index) => {
                      const maxValue = tarefasPorResponsavelData[0]?.value || 1;
                      const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      const posicao = index + 1;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-24 text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-green-600 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção 4: Radar Aposentadorias (GID 0) */}
      <Collapsible 
        open={openSection === 'aposentadorias'} 
        onOpenChange={() => handleSectionToggle('aposentadorias')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Aposentadorias</h2>
              <span className="text-sm text-muted-foreground">({data?.stats?.totalAposentadorias || 0} análises)</span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'aposentadorias' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Filtro de Semana */}
          <div className="flex items-center gap-4">
            <Select
              value={aposentadoriasWeekFilter || "all"}
              onValueChange={(value) => setAposentadoriasWeekFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as semanas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as semanas</SelectItem>
                {weekOptions.aposentadoriasWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    Semana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {aposentadoriasWeekFilter && (
              <button
                onClick={() => setAposentadoriasWeekFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Aposentadorias por Tipo de Ação */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Por Tipo de Ação</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {aposentadoriasPorTipoData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={aposentadoriasPorTipoData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {aposentadoriasPorTipoData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aposentadorias por Situação */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Por Situação</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {aposentadoriasPorSituacaoData.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {aposentadoriasPorSituacaoData.map((item, index) => (
                      <div
                        key={item.name}
                        className="p-4 rounded-lg border border-border/50"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                      >
                        <div className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                          {item.value}
                        </div>
                        <div className="text-sm text-muted-foreground truncate" title={item.name}>{item.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Aposentadorias por Responsável */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Ranking por Responsável</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {aposentadoriasPorResponsavelData.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {aposentadoriasPorResponsavelData.slice(0, 9).map((item, index) => {
                    const posicao = index + 1;
                    
                    return (
                      <div key={item.name} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          {posicao === 1 ? (
                            <span className="text-2xl">🥇</span>
                          ) : posicao === 2 ? (
                            <span className="text-2xl">🥈</span>
                          ) : posicao === 3 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-lg font-bold text-purple-500">
                            {item.value} análises
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção 5: Radar Pastas para Correção (GID 731526977) */}
      <Collapsible 
        open={openSection === 'pastas'} 
        onOpenChange={() => handleSectionToggle('pastas')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FolderCheck className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Radar Pastas para Correção</h2>
              <span className="text-sm text-muted-foreground">({data?.stats?.totalPastasCorrecao || 0} pastas)</span>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'pastas' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pastas por Situação */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Por Situação</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {pastasPorSituacaoData.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {pastasPorSituacaoData.map((item, index) => (
                      <div
                        key={item.name}
                        className="p-4 rounded-lg border border-border/50"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                      >
                        <div className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                          {item.value}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking de Pastas por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Ranking por Responsável</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {pastasPorResponsavelData.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {pastasPorResponsavelData.map((item, index) => {
                      const maxValue = pastasPorResponsavelData[0]?.value || 1;
                      const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      const posicao = index + 1;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {posicao === 1 ? (
                              <span className="text-2xl">🥇</span>
                            ) : posicao === 2 ? (
                              <span className="text-2xl">🥈</span>
                            ) : posicao === 3 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-24 text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-amber-500 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RadarPrevidenciario;
