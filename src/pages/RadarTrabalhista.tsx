import { useState, useMemo } from "react";
import { 
  Briefcase, 
  FileText, 
  Trophy, 
  Users, 
  DollarSign, 
  Shield, 
  CheckCircle2,
  XCircle,
  BarChart3,
  Filter,
  Calendar,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { useTrabalhistaData } from "@/hooks/useTrabalhistaData";

const RadarTrabalhista = () => {
  const { data, isLoading, error } = useTrabalhistaData();
  
  // Filters - default to current year and "Nicho" type
  const currentYear = new Date().getFullYear().toString();
  const [anoFilter, setAnoFilter] = useState<string>(currentYear);
  const [responsavelFilter, setResponsavelFilter] = useState<string>("all");
  const [semanaFilter, setSemanaFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("NICHO");
  
  // Section states
  const [iniciaisOpen, setIniciaisOpen] = useState(true);

  // Extract unique filter values
  const filterOptions = useMemo(() => {
    if (!data?.iniciais) return { anos: [], responsaveis: [], semanas: [], tipos: [] };
    
    const anosSet = new Set<string>();
    const responsaveisSet = new Set<string>();
    const semanasSet = new Set<string>();
    const tiposSet = new Set<string>();
    
    data.iniciais.forEach(i => {
      if (i.ano) anosSet.add(i.ano);
      if (i.responsavel) responsaveisSet.add(i.responsavel);
      if (i.semana) semanasSet.add(i.semana);
      if (i.tipoInicial) tiposSet.add(i.tipoInicial);
    });
    
    return {
      anos: Array.from(anosSet).sort(),
      responsaveis: Array.from(responsaveisSet).sort(),
      semanas: Array.from(semanasSet).sort((a, b) => parseInt(a) - parseInt(b)),
      tipos: Array.from(tiposSet).sort(),
    };
  }, [data?.iniciais]);

  // Filtered data
  const filteredIniciais = useMemo(() => {
    if (!data?.iniciais) return [];
    
    return data.iniciais.filter(i => {
      // Filter by year
      if (anoFilter !== "all" && i.ano !== anoFilter) return false;
      
      // Filter by responsavel
      if (responsavelFilter !== "all" && i.responsavel !== responsavelFilter) return false;
      
      // Filter by semana
      if (semanaFilter !== "all" && i.semana !== semanaFilter) return false;
      
      // Filter by tipo
      if (tipoFilter !== "all" && i.tipoInicial !== tipoFilter) return false;
      
      return true;
    });
  }, [data?.iniciais, anoFilter, responsavelFilter, semanaFilter, tipoFilter]);

  // Ranking por responsável
  const rankingResponsaveis = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIniciais.forEach(i => {
      if (i.responsavel) {
        counts[i.responsavel] = (counts[i.responsavel] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([nome, quantidade]) => ({ nome, quantidade, percentual: (quantidade / filteredIniciais.length) * 100 }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredIniciais]);

  // Dados por semana para gráfico
  const dadosPorSemana = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIniciais.forEach(i => {
      if (i.semana) {
        counts[i.semana] = (counts[i.semana] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([semana, total]) => ({ semana: `S${semana}`, total }))
      .sort((a, b) => parseInt(a.semana.slice(1)) - parseInt(b.semana.slice(1)));
  }, [filteredIniciais]);

  // Top 10 profissões
  const topProfissoes = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIniciais.forEach(i => {
      if (i.profissao) {
        counts[i.profissao] = (counts[i.profissao] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([profissao, quantidade]) => ({ profissao, quantidade, percentual: (quantidade / filteredIniciais.length) * 100 }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [filteredIniciais]);

  // Valores de ações de nicho
  const valoresNicho = useMemo(() => {
    let valorTotal = 0;
    let honorariosTotal = 0;
    let count = 0;
    
    filteredIniciais.forEach(i => {
      if (i.tipoInicial.toLowerCase().includes('nicho')) {
        valorTotal += i.valorCausa;
        honorariosTotal += i.expectativaHonorarios;
        count++;
      }
    });
    
    return { valorTotal, honorariosTotal, count, percentual: (count / filteredIniciais.length) * 100 };
  }, [filteredIniciais]);

  // Análise de temas
  const analiseTemasData = useMemo(() => {
    let horasExtras = 0;
    let vinculoEmprego = 0;
    let acidenteTrabalho = 0;
    let insalubridade = 0;
    let nenhumTema = 0;
    
    filteredIniciais.forEach(i => {
      const temHorasExtras = i.horasExtras === 'sim';
      const temVinculo = i.vinculoEmprego === 'sim';
      const temAcidente = i.acidenteTrabalho === 'sim';
      const temInsalubridade = i.insalubridadePericulosidade === 'sim';
      
      if (temHorasExtras) horasExtras++;
      if (temVinculo) vinculoEmprego++;
      if (temAcidente) acidenteTrabalho++;
      if (temInsalubridade) insalubridade++;
      
      if (!temHorasExtras && !temVinculo && !temAcidente && !temInsalubridade) {
        nenhumTema++;
      }
    });
    
    const total = filteredIniciais.length;
    const comTemas = total - nenhumTema;
    
    return {
      total,
      nenhumTema: { count: nenhumTema, percentual: total > 0 ? (nenhumTema / total) * 100 : 0 },
      comTemas: { count: comTemas, percentual: total > 0 ? (comTemas / total) * 100 : 0 },
      horasExtras: { count: horasExtras, percentual: total > 0 ? (horasExtras / total) * 100 : 0 },
      vinculoEmprego: { count: vinculoEmprego, percentual: total > 0 ? (vinculoEmprego / total) * 100 : 0 },
      acidenteTrabalho: { count: acidenteTrabalho, percentual: total > 0 ? (acidenteTrabalho / total) * 100 : 0 },
      insalubridade: { count: insalubridade, percentual: total > 0 ? (insalubridade / total) * 100 : 0 },
    };
  }, [filteredIniciais]);

  // Situação das ações
  const situacaoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIniciais.forEach(i => {
      if (i.situacao) {
        counts[i.situacao] = (counts[i.situacao] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([situacao, quantidade]) => ({ 
        situacao, 
        quantidade, 
        percentual: (quantidade / filteredIniciais.length) * 100 
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredIniciais]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(239, 84%, 67%)",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Radar Trabalhista</h1>
            <p className="text-muted-foreground">Acompanhamento de processos trabalhistas</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Radar Trabalhista</h1>
            <p className="text-muted-foreground">Acompanhamento de processos trabalhistas</p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Briefcase className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Radar Trabalhista</h1>
          <p className="text-muted-foreground">Acompanhamento de processos trabalhistas</p>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ano
              </label>
              <Select value={anoFilter} onValueChange={setAnoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {filterOptions.anos.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsável
              </label>
              <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterOptions.responsaveis.map(resp => (
                    <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Semana
              </label>
              <Select value={semanaFilter} onValueChange={setSemanaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filterOptions.semanas.map(semana => (
                    <SelectItem key={semana} value={semana}>Semana {semana}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tipo de Inicial
              </label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {filterOptions.tipos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Iniciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredIniciais.length}</div>
            <p className="text-xs text-muted-foreground">petições registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Responsáveis Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingResponsaveis.length}</div>
            <p className="text-xs text-muted-foreground">colaboradores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações de Nicho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valoresNicho.count}</div>
            <p className="text-xs text-muted-foreground">{valoresNicho.percentual.toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Semanas com Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dadosPorSemana.length}</div>
            <p className="text-xs text-muted-foreground">semanas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Iniciais */}
      <Collapsible open={iniciaisOpen} onOpenChange={setIniciaisOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/5 rounded-lg border border-amber-500/20 hover:from-amber-500/15 hover:to-amber-600/10 transition-all">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-amber-600" />
            <div className="text-left">
              <h2 className="text-xl font-semibold text-foreground">Radar Petições Iniciais</h2>
              <p className="text-sm text-muted-foreground">Análise das petições iniciais trabalhistas</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {iniciaisOpen ? "▼" : "▶"}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Gráfico de Iniciais por Semana - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Iniciais por Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorSemana}>
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="total" position="top" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Segunda linha: Ranking, Top 10 Profissões, Análise de Temas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Ranking de Responsáveis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rankingResponsaveis.slice(0, 10).map((item, index) => (
                  <div key={item.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {getMedalIcon(index) && <span className="text-lg">{getMedalIcon(index)}</span>}
                        <span className={index < 3 ? "font-semibold" : ""}>{item.nome}</span>
                      </span>
                      <span className="font-medium">{item.quantidade} ({item.percentual.toFixed(1)}%)</span>
                    </div>
                    <Progress 
                      value={(item.quantidade / (rankingResponsaveis[0]?.quantidade || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top 10 Profissões */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Top 10 Profissões
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProfissoes.map((item, index) => (
                  <div key={item.profissao} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{item.profissao}</span>
                      <span className="font-medium whitespace-nowrap">{item.quantidade} ({item.percentual.toFixed(1)}%)</span>
                    </div>
                    <Progress 
                      value={(item.quantidade / (topProfissoes[0]?.quantidade || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Análise de Temas Discutidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Análise de Temas Discutidos
                </CardTitle>
                <p className="text-sm text-muted-foreground">Distribuição de processos por complexidade</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Classificação dos Processos (100%)</h4>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Ações Simples (sem temas especiais)
                      </span>
                      <span className="font-medium">{analiseTemasData.nenhumTema.count} ({analiseTemasData.nenhumTema.percentual.toFixed(1)}%)</span>
                    </div>
                    <Progress value={analiseTemasData.nenhumTema.percentual} className="h-2 bg-muted [&>div]:bg-green-500" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-amber-500" />
                        Ações Complexas (com temas especiais)
                      </span>
                      <span className="font-medium">{analiseTemasData.comTemas.count} ({analiseTemasData.comTemas.percentual.toFixed(1)}%)</span>
                    </div>
                    <Progress value={analiseTemasData.comTemas.percentual} className="h-2 bg-muted [&>div]:bg-amber-500" />
                  </div>
                </div>

                {analiseTemasData.comTemas.count > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Detalhamento dos Temas (% do total)</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Horas Extras</span>
                        <span className="font-medium">{analiseTemasData.horasExtras.count} ({analiseTemasData.horasExtras.percentual.toFixed(1)}%)</span>
                      </div>
                      <Progress value={analiseTemasData.horasExtras.percentual} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Reconhecimento de Vínculo</span>
                        <span className="font-medium">{analiseTemasData.vinculoEmprego.count} ({analiseTemasData.vinculoEmprego.percentual.toFixed(1)}%)</span>
                      </div>
                      <Progress value={analiseTemasData.vinculoEmprego.percentual} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Acidente de Trabalho</span>
                        <span className="font-medium">{analiseTemasData.acidenteTrabalho.count} ({analiseTemasData.acidenteTrabalho.percentual.toFixed(1)}%)</span>
                      </div>
                      <Progress value={analiseTemasData.acidenteTrabalho.percentual} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Insalubridade/Periculosidade</span>
                        <span className="font-medium">{analiseTemasData.insalubridade.count} ({analiseTemasData.insalubridade.percentual.toFixed(1)}%)</span>
                      </div>
                      <Progress value={analiseTemasData.insalubridade.percentual} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha: Situação e Honorários */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Situação das Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Situação das Petições
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {situacaoData.map((item, index) => {
                  const colors = [
                    "bg-green-500",
                    "bg-blue-500",
                    "bg-amber-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-cyan-500",
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={item.situacao} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1 mr-2">{item.situacao}</span>
                        <span className="font-medium whitespace-nowrap">{item.quantidade} ({item.percentual.toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={item.percentual} 
                        className={`h-2 bg-muted [&>div]:${colorClass}`}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Valores Ações de Nicho */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Ações de Nicho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantidade:</span>
                    <span className="font-bold">{valoresNicho.count} ({valoresNicho.percentual.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Total da Causa:</span>
                    <span className="font-bold text-lg">{formatCurrency(valoresNicho.valorTotal)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expectativa Honorários:</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(valoresNicho.honorariosTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RadarTrabalhista;
