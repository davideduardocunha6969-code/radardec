import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Trophy,
  Briefcase,
  FileText,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useCommercialData } from "@/hooks/useCommercialData";
import { GoalProgressCard } from "@/components/GoalProgressCard";
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
  LabelList,
  LineChart,
  Line,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const RadarBancario = () => {
  const { data, weeks, bancarioAgendamentosData, isLoading, error } = useCommercialData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const handleSectionToggle = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Calcula semana atual do ano
  const semanaAtualDoAno = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);

  // Filtra dados do setor bancário
  const dadosBancarios = useMemo(() => {
    return data.filter(r => {
      const setor = r.setor?.toLowerCase().trim() || '';
      return setor.includes('bancário') || setor.includes('bancario');
    });
  }, [data]);

  // Filtra por semana se selecionada
  const dadosFiltrados = useMemo(() => {
    if (!selectedWeek) return dadosBancarios;
    return dadosBancarios.filter(r => r.semana === selectedWeek);
  }, [dadosBancarios, selectedWeek]);

  // Métricas gerais
  const metricas = useMemo(() => {
    const totalAtendimentos = dadosFiltrados.length;
    const contratosFechados = dadosFiltrados.filter(r => 
      r.resultado?.toLowerCase().includes('contrato fechado')
    ).length;
    const emNegociacao = dadosFiltrados.filter(r => 
      r.resultado?.toLowerCase().includes('negociação') || 
      r.resultado?.toLowerCase().includes('negociacao')
    ).length;
    const aguardaDoc = dadosFiltrados.filter(r => 
      r.resultado?.toLowerCase().includes('aguarda documentação') || 
      r.resultado?.toLowerCase().includes('aguarda documentacao')
    ).length;
    const taxaConversao = totalAtendimentos > 0 
      ? ((contratosFechados / totalAtendimentos) * 100).toFixed(1) 
      : '0';

    return { totalAtendimentos, contratosFechados, emNegociacao, aguardaDoc, taxaConversao };
  }, [dadosFiltrados]);

  // Meta de contratos bancários (3000)
  const metaContratos = useMemo(() => {
    const contratosBancarios = dadosBancarios.filter(r => 
      r.resultado?.toLowerCase().includes('contrato fechado')
    ).length;
    return { meta: 3000, alcancado: contratosBancarios };
  }, [dadosBancarios]);

  // Meta de agendamentos bancários (50)
  const metaAgendamentos = useMemo(() => {
    const clientesAgendados = bancarioAgendamentosData.filter(r => {
      const colunaA = r.colA?.trim() || '';
      const colunaE = r.colE?.toLowerCase().trim() || '';
      return colunaA !== '' && colunaE === 'agendado';
    }).length;
    return { meta: 50, alcancado: clientesAgendados };
  }, [bancarioAgendamentosData]);

  // Atendimentos por semana
  const atendimentosPorSemana = useMemo(() => {
    const semanas: Record<number, number> = {};
    dadosBancarios.forEach(r => {
      const semana = r.semana || 0;
      if (semana > 0 && semana <= 53) {
        semanas[semana] = (semanas[semana] || 0) + 1;
      }
    });
    return Array.from({ length: 53 }, (_, i) => ({
      semana: `S${i + 1}`,
      weekNumber: i + 1,
      atendimentos: semanas[i + 1] || 0,
    }));
  }, [dadosBancarios]);

  // Contratos por semana
  const contratosPorSemana = useMemo(() => {
    const semanas: Record<number, number> = {};
    dadosBancarios
      .filter(r => r.resultado?.toLowerCase().includes('contrato fechado'))
      .forEach(r => {
        const semana = r.semana || 0;
        if (semana > 0 && semana <= 53) {
          semanas[semana] = (semanas[semana] || 0) + 1;
        }
      });
    return Array.from({ length: 53 }, (_, i) => ({
      semana: `S${i + 1}`,
      weekNumber: i + 1,
      contratos: semanas[i + 1] || 0,
    }));
  }, [dadosBancarios]);

  // Ranking por responsável
  const rankingResponsaveis = useMemo(() => {
    const contagem: Record<string, { contratos: number; atendimentos: number }> = {};
    dadosFiltrados.forEach(r => {
      const responsavel = r.responsavel || 'Sem responsável';
      if (!contagem[responsavel]) {
        contagem[responsavel] = { contratos: 0, atendimentos: 0 };
      }
      contagem[responsavel].atendimentos += 1;
      if (r.resultado?.toLowerCase().includes('contrato fechado')) {
        contagem[responsavel].contratos += 1;
      }
    });
    return Object.entries(contagem)
      .map(([responsavel, dados]) => ({
        responsavel,
        ...dados,
        conversao: dados.atendimentos > 0 
          ? ((dados.contratos / dados.atendimentos) * 100).toFixed(1) 
          : '0',
      }))
      .sort((a, b) => b.contratos - a.contratos);
  }, [dadosFiltrados]);

  // Resultados por tipo
  const resultadosPorTipo = useMemo(() => {
    const contagem: Record<string, number> = {};
    dadosFiltrados.forEach(r => {
      const resultado = r.resultado || 'Sem resultado';
      contagem[resultado] = (contagem[resultado] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([resultado, count]) => ({ resultado, count }))
      .sort((a, b) => b.count - a.count);
  }, [dadosFiltrados]);

  const chartConfig = {
    atendimentos: { label: "Atendimentos", color: "hsl(var(--primary))" },
    contratos: { label: "Contratos", color: "hsl(var(--success))" },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

      {/* Cards de métricas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : metricas.totalAtendimentos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Fechados
            </CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {isLoading ? '--' : metricas.contratosFechados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Negociação
            </CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {isLoading ? '--' : metricas.emNegociacao}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedWeek ? `Semana ${selectedWeek}` : 'Todas as semanas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {isLoading ? '--%' : `${metricas.taxaConversao}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contratos / Atendimentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Metas Bancárias */}
      <Collapsible 
        open={openSection === 'metas'} 
        onOpenChange={() => handleSectionToggle('metas')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Metas Bancárias</h2>
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
          <div className="grid gap-6 md:grid-cols-2">
            <GoalProgressCard
              title="Contratos Bancários"
              icon={FileText}
              iconColor="text-emerald-500"
              meta={metaContratos.meta}
              alcancado={metaContratos.alcancado}
              semanaAtual={semanaAtualDoAno}
              totalSemanas={53}
            />
            <GoalProgressCard
              title="Agendamentos Bancários"
              icon={Calendar}
              iconColor="text-teal-500"
              meta={metaAgendamentos.meta}
              alcancado={metaAgendamentos.alcancado}
              semanaAtual={semanaAtualDoAno}
              totalSemanas={53}
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

      {/* Seção: Evolução Semanal */}
      <Collapsible 
        open={openSection === 'evolucao'} 
        onOpenChange={() => handleSectionToggle('evolucao')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">Evolução Semanal</h2>
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
                  <BarChart data={atendimentosPorSemana} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
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
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Contratos por Semana */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <CardTitle className="text-lg">Contratos Fechados por Semana</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={contratosPorSemana} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone"
                      dataKey="contratos" 
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    >
                      <LabelList 
                        dataKey="contratos" 
                        position="top" 
                        className="fill-foreground"
                        fontSize={10}
                        formatter={(value: number) => value > 0 ? value : ''}
                      />
                    </Line>
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

      {/* Seção: Rankings */}
      <Collapsible 
        open={openSection === 'rankings'} 
        onOpenChange={() => handleSectionToggle('rankings')}
        className="mb-8"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Rankings</h2>
            </div>
            <div className="flex items-center gap-4">
              {openSection === 'rankings' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Filtro de semana */}
          <WeekFilter
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            isLoading={isLoading}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ranking de Contratos por Responsável */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Ranking de Contratos Fechados</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Contratos fechados por responsável</p>
              </CardHeader>
              <CardContent>
                {rankingResponsaveis.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {rankingResponsaveis.slice(0, 10).map((item, index) => {
                      const maxContratos = rankingResponsaveis[0]?.contratos || 1;
                      const barWidth = (item.contratos / maxContratos) * 100;
                      return (
                        <div key={item.responsavel} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 text-center">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                          </div>
                          <div className="flex-shrink-0 w-28 text-sm font-medium truncate" title={item.responsavel}>
                            {item.responsavel}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-amber-500 rounded transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {item.contratos} contratos
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultados por Tipo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Resultados por Tipo</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Distribuição dos resultados</p>
              </CardHeader>
              <CardContent>
                {resultadosPorTipo.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {resultadosPorTipo.map((item) => {
                      const maxCount = resultadosPorTipo[0]?.count || 1;
                      const barWidth = (item.count / maxCount) * 100;
                      const isContratoFechado = item.resultado.toLowerCase().includes('contrato fechado');
                      return (
                        <div key={item.resultado} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-40 text-sm font-medium truncate" title={item.resultado}>
                            {item.resultado}
                          </div>
                          <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
                                isContratoFechado ? 'bg-success' : 'bg-blue-500'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-semibold ${barWidth > 40 ? 'text-white' : 'text-foreground'}`}>
                                {item.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
