import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GestaoGeral = () => {
  return (
    <div className="flex-1 p-8">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">
          Gestão Geral
        </h1>
        <p className="text-muted-foreground mt-2">
          Painel de controle do escritório David Eduardo Cunha Advogados
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processos Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Acesse Radar Controladoria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Controllers
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Equipe de controladoria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Acerto
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conformidade e prazo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendências e erros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de acesso rápido */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Radar Controladoria</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Dashboard de métricas e KPIs
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acompanhe tarefas, erros de conformidade, erros de prazo e performance dos controllers em tempo real.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">Agenda</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Em breve
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calendário de prazos, audiências e compromissos do escritório.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">Clientes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Em breve
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gestão de clientes e relacionamento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoGeral;
