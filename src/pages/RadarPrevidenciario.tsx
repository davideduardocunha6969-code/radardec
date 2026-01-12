import { useMemo } from "react";
import { Loader2, AlertTriangle, FileText, Users, FolderCheck, TrendingUp, Clock } from "lucide-react";
import { usePrevidenciarioData } from "@/hooks/usePrevidenciarioData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const RadarPrevidenciario = () => {
  const { data, isLoading, error } = usePrevidenciarioData();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    peticoes: true,
    tarefas: true,
    aposentadorias: true,
    pastas: true,
    evolucao: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Process data for charts
  const peticoesPorBeneficioData = useMemo(() => {
    if (!data?.stats?.peticoesPorBeneficio) return [];
    return Object.entries(data.stats.peticoesPorBeneficio)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const peticoesPorResponsavelData = useMemo(() => {
    if (!data?.stats?.peticoesPorResponsavel) return [];
    return Object.entries(data.stats.peticoesPorResponsavel)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const tarefasPorTipoData = useMemo(() => {
    if (!data?.stats?.tarefasPorTipo) return [];
    return Object.entries(data.stats.tarefasPorTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const aposentadoriasPorTipoData = useMemo(() => {
    if (!data?.stats?.aposentadoriasPorTipo) return [];
    return Object.entries(data.stats.aposentadoriasPorTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

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
            <Users className="h-4 w-4 text-chart-2" />
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

      {/* Seção: Evolução Incapacidade */}
      <Collapsible
        open={openSections.evolucao}
        onOpenChange={() => toggleSection('evolucao')}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.evolucao ? 'rotate-0' : '-rotate-90'}`} />
          <h2 className="text-lg font-semibold">Evolução de Casos por Incapacidade Pendentes</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              {evolucaoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolucaoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pendentes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Casos Pendentes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum dado de evolução disponível</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Petições Iniciais */}
      <Collapsible
        open={openSections.peticoes}
        onOpenChange={() => toggleSection('peticoes')}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.peticoes ? 'rotate-0' : '-rotate-90'}`} />
          <h2 className="text-lg font-semibold">Petições Iniciais</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Por Tipo de Benefício</CardTitle>
              </CardHeader>
              <CardContent>
                {peticoesPorBeneficioData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peticoesPorBeneficioData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Por Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                {peticoesPorResponsavelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peticoesPorResponsavelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Petições" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Tarefas */}
      <Collapsible
        open={openSections.tarefas}
        onOpenChange={() => toggleSection('tarefas')}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.tarefas ? 'rotate-0' : '-rotate-90'}`} />
          <h2 className="text-lg font-semibold">Tarefas Realizadas</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Por Tipo de Tarefa</CardTitle>
            </CardHeader>
            <CardContent>
              {tarefasPorTipoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tarefasPorTipoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={150} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Aposentadorias */}
      <Collapsible
        open={openSections.aposentadorias}
        onOpenChange={() => toggleSection('aposentadorias')}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.aposentadorias ? 'rotate-0' : '-rotate-90'}`} />
          <h2 className="text-lg font-semibold">Análise de Aposentadorias</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Por Tipo de Ação</CardTitle>
            </CardHeader>
            <CardContent>
              {aposentadoriasPorTipoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={aposentadoriasPorTipoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
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
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção: Pastas para Correção */}
      <Collapsible
        open={openSections.pastas}
        onOpenChange={() => toggleSection('pastas')}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.pastas ? 'rotate-0' : '-rotate-90'}`} />
          <h2 className="text-lg font-semibold">Pastas para Correção</h2>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Por Situação</CardTitle>
            </CardHeader>
            <CardContent>
              {pastasPorSituacaoData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RadarPrevidenciario;
