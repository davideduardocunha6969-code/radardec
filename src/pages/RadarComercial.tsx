import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RadarComercial = () => {
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
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span>Em desenvolvimento</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Propostas Enviadas
            </CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Em desenvolvimento</span>
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
            <div className="text-2xl font-bold text-foreground">--%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Em desenvolvimento</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Projetada
            </CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ --</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Em desenvolvimento</span>
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
                <p className="text-xs mt-1">Conecte sua fonte de dados comerciais</p>
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

      {/* Próximas atividades */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Próximas Atividades Comerciais</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma atividade agendada</p>
              <p className="text-xs mt-1">As atividades comerciais aparecerão aqui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadarComercial;
