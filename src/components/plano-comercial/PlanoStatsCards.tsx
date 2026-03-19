import { useMemo, useState } from 'react';
import { Users, UserCheck, UserX, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

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

  const toggle = () => setExpanded(prev => !prev);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Total */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total de Posições</p>
            <p className="text-xl font-bold text-card-foreground">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Ocupadas */}
      <div
        className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm cursor-pointer transition-all"
        onClick={() => toggle('ocupadas')}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-success/10 p-2">
            <UserCheck className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Posições Ocupadas</p>
            <p className="text-xl font-bold text-card-foreground">{stats.ocupadas.length}</p>
          </div>
          {Object.keys(stats.ocupadasPorCargo).length > 0 && (
            expandedCard === 'ocupadas'
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {expandedCard === 'ocupadas' && Object.keys(stats.ocupadasPorCargo).length > 0 && (
          <div className="border-t border-border mt-2 pt-2 space-y-1">
            {Object.entries(stats.ocupadasPorCargo)
              .sort(([, a], [, b]) => b - a)
              .map(([cargo, count]) => (
                <div key={cargo} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{cargo}</span>
                  <span className="font-medium text-card-foreground shrink-0">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pendentes */}
      <div
        className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm cursor-pointer transition-all"
        onClick={() => toggle('pendentes')}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <UserX className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Posições Pendentes</p>
            <p className="text-xl font-bold text-card-foreground">{stats.pendentes.length}</p>
          </div>
          {Object.keys(stats.pendentesPorCargo).length > 0 && (
            expandedCard === 'pendentes'
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {expandedCard === 'pendentes' && Object.keys(stats.pendentesPorCargo).length > 0 && (
          <div className="border-t border-border mt-2 pt-2 space-y-1">
            {Object.entries(stats.pendentesPorCargo)
              .sort(([, a], [, b]) => b - a)
              .map(([cargo, count]) => (
                <div key={cargo} className="flex items-center justify-between text-xs">
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
