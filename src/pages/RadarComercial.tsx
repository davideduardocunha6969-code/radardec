import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekFilter } from "@/components/WeekFilter";
import { useCommercialData } from "@/hooks/useCommercialData";

const RadarComercial = () => {
  const { data, weeks, isLoading, error } = useCommercialData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Filtra os dados pela semana selecionada
  const filteredData = useMemo(() => {
    if (!selectedWeek) return data;
    return data.filter(record => record.semana === selectedWeek);
  }, [data, selectedWeek]);

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

      {/* Filtro de Semanas */}
      <WeekFilter
        weeks={weeks}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        isLoading={isLoading}
      />

      {/* Cards de métricas */}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Honorários de Êxito
            </CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? 'R$ --' : formatCurrency(metrics.honorariosExitoTotal)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Receita projetada</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área de gráficos placeholder */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Captação por Período</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gráfico em desenvolvimento</p>
                <p className="text-xs mt-1">
                  {filteredData.length} registros 
                  {selectedWeek ? ` na semana ${selectedWeek}` : ' no total'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Origem dos Leads</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gráfico em desenvolvimento</p>
                <p className="text-xs mt-1">Conecte sua fonte de dados comerciais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Honorários Iniciais */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Honorários Iniciais</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? 'R$ --' : formatCurrency(metrics.honorariosIniciaisTotal)}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Honorários de Êxito Estimados</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? 'R$ --' : formatCurrency(metrics.honorariosExitoTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadarComercial;
