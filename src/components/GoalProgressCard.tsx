import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface GoalProgressCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  meta: number;
  alcancado: number;
  semanaAtual: number;
  totalSemanas?: number;
}

export const GoalProgressCard = ({
  title,
  icon: Icon,
  iconColor,
  meta,
  alcancado,
  semanaAtual,
  totalSemanas = 53,
}: GoalProgressCardProps) => {
  const stats = useMemo(() => {
    // Percentual alcançado
    const percentAlcancado = meta > 0 ? (alcancado / meta) * 100 : 0;
    
    // Esperado até agora (proporcional às semanas)
    const esperadoAteAgora = Math.round((meta / totalSemanas) * semanaAtual);
    const percentEsperado = meta > 0 ? (esperadoAteAgora / meta) * 100 : 0;
    
    // Diferença (acima ou abaixo do esperado)
    const diferencaAbsoluta = alcancado - esperadoAteAgora;
    const diferencaPercentual = percentAlcancado - percentEsperado;
    
    // Status (positivo = verde, negativo = vermelho)
    const isPositivo = diferencaAbsoluta >= 0;
    
    return {
      percentAlcancado,
      esperadoAteAgora,
      percentEsperado,
      diferencaAbsoluta,
      diferencaPercentual,
      isPositivo,
    };
  }, [meta, alcancado, semanaAtual, totalSemanas]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
          {/* Coluna 1: Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progresso</span>
              <span className="font-semibold text-foreground">{alcancado} / {meta}</span>
            </div>
            <Progress 
              value={stats.percentAlcancado} 
              className="h-3 bg-amber-200"
            />
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${stats.isPositivo ? 'text-emerald-500' : 'text-amber-500'}`}>
                {stats.percentAlcancado.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">da meta alcançada</p>
          </div>

          {/* Coluna 2: Semana Atual */}
          <div className="text-center px-4 border-l border-border">
            <p className="text-xs text-muted-foreground mb-1">Semana</p>
            <p className="text-lg font-bold text-foreground">{semanaAtual} de {totalSemanas}</p>
          </div>

          {/* Coluna 3: Esperado vs Alcançado */}
          <div className="space-y-3 border-l border-border pl-4">
            <div>
              <p className="text-xs text-muted-foreground">Esperado até agora</p>
              <p className="text-xl font-bold text-foreground">
                {stats.esperadoAteAgora}
              </p>
              <p className="text-xs text-muted-foreground">
                ({stats.percentEsperado.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total alcançado</p>
              <p className={`text-xl font-bold ${stats.isPositivo ? 'text-emerald-500' : 'text-amber-500'}`}>
                {alcancado}
              </p>
              <p className="text-xs text-muted-foreground">
                ({stats.percentAlcancado.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Coluna 4: Diferença */}
          <div className={`text-center px-4 py-3 rounded-lg border-l-4 ${
            stats.isPositivo 
              ? 'bg-emerald-500/10 border-emerald-500' 
              : 'bg-red-500/10 border-red-500'
          }`}>
            <p className={`text-2xl font-bold ${stats.isPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.isPositivo ? '+' : ''}{stats.diferencaAbsoluta}
            </p>
            <p className={`text-xs ${stats.isPositivo ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.isPositivo ? 'acima do esperado' : 'abaixo do esperado'}
            </p>
            <p className={`text-sm font-medium mt-1 ${stats.isPositivo ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.isPositivo ? '+' : ''}{stats.diferencaPercentual.toFixed(1)} p.p.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
