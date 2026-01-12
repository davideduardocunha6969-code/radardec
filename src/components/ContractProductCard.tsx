import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trophy, DollarSign, TrendingUp, Users } from "lucide-react";

interface ContractData {
  responsavel: string;
  produto: string;
  resultado: string;
  honorariosExito: number;
  honorariosIniciais: number;
  valorContrato: number;
}

interface ContractProductCardProps {
  produto: string;
  contracts: ContractData[];
}

export const ContractProductCard = ({ produto, contracts }: ContractProductCardProps) => {
  const stats = useMemo(() => {
    const totalContratos = contracts.length;
    const somaHonorariosExito = contracts.reduce((sum, c) => sum + (c.honorariosExito || 0), 0);
    const somaHonorariosIniciais = contracts.reduce((sum, c) => sum + (c.honorariosIniciais || 0), 0);
    
    // Média de valor entre os contratos (Coluna I = valorContrato)
    const valoresContratos = contracts.map(c => c.valorContrato || 0).filter(v => v > 0);
    const mediaValor = valoresContratos.length > 0 
      ? valoresContratos.reduce((sum, v) => sum + v, 0) / valoresContratos.length 
      : 0;

    // Ranking por honorários de êxito (Coluna L)
    const responsavelMap = new Map<string, number>();
    contracts.forEach(c => {
      if (c.responsavel) {
        const current = responsavelMap.get(c.responsavel) || 0;
        responsavelMap.set(c.responsavel, current + (c.honorariosExito || 0));
      }
    });

    const ranking = Array.from(responsavelMap.entries())
      .map(([responsavel, valor]) => ({ responsavel, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3);

    return {
      totalContratos,
      somaHonorariosExito,
      somaHonorariosIniciais,
      mediaValor,
      ranking,
    };
  }, [contracts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold truncate" title={produto}>
            {produto}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Total Contratos</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalContratos}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Média Valor</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(stats.mediaValor)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <span>Honorários Êxito</span>
            </div>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(stats.somaHonorariosExito)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-blue-500" />
              <span>Honorários Iniciais</span>
            </div>
            <p className="text-sm font-semibold text-blue-600">
              {formatCurrency(stats.somaHonorariosIniciais)}
            </p>
          </div>
        </div>

        {/* Ranking de Closers */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Top Closers (Honorários Êxito)</span>
          </div>
          
          {stats.ranking.length > 0 ? (
            <div className="space-y-2">
              {stats.ranking.map((item, index) => {
                const maxValor = stats.ranking[0]?.valor || 1;
                const barWidth = maxValor > 0 ? (item.valor / maxValor) * 100 : 0;
                
                return (
                  <div key={item.responsavel} className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0 w-6">{getMedalEmoji(index)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium truncate" title={item.responsavel}>
                          {item.responsavel}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatCurrency(item.valor)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum responsável encontrado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
