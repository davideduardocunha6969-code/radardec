import { useMemo } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { type PlanoNode } from '@/hooks/usePlanoComercial';

interface PlanoStatsCardsProps {
  nodes: PlanoNode[];
}

function groupByCargo(nodes: PlanoNode[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const n of nodes) {
    const cargo = n.label || 'Sem cargo';
    map[cargo] = (map[cargo] || 0) + 1;
  }
  return map;
}

export default function PlanoStatsCards({ nodes }: PlanoStatsCardsProps) {
  const stats = useMemo(() => {
    const posicoes = nodes.filter(n => n.node_type === 'posicao');
    const ocupadas = posicoes.filter(n => n.pessoa_nome && !n.precisa_contratar);
    const pendentes = posicoes.filter(n => !n.pessoa_nome || n.precisa_contratar);
    return {
      total: posicoes.length,
      ocupadas,
      pendentes,
      ocupadasPorCargo: groupByCargo(ocupadas),
      pendentesPorCargo: groupByCargo(pendentes),
    };
  }, [nodes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de Posições</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Ocupadas */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-success/10 p-2.5">
            <UserCheck className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Posições Ocupadas</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.ocupadas.length}</p>
          </div>
        </div>
        {Object.keys(stats.ocupadasPorCargo).length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            {Object.entries(stats.ocupadasPorCargo)
              .sort(([, a], [, b]) => b - a)
              .map(([cargo, count]) => (
                <div key={cargo} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{cargo}</span>
                  <span className="font-medium text-card-foreground shrink-0">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pendentes */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-destructive/10 p-2.5">
            <UserX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Posições Pendentes</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.pendentes.length}</p>
          </div>
        </div>
        {Object.keys(stats.pendentesPorCargo).length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            {Object.entries(stats.pendentesPorCargo)
              .sort(([, a], [, b]) => b - a)
              .map(([cargo, count]) => (
                <div key={cargo} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{cargo}</span>
                  <span className="font-medium text-card-foreground shrink-0">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
