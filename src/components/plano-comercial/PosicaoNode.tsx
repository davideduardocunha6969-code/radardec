import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, Users, Briefcase, Layers, Pencil, Trash2, User, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const typeIcons: Record<string, React.ElementType> = {
  setor: Building2,
  funil: Layers,
  posicao: Briefcase,
  grupo: Users,
};

const setorColors: Record<string, string> = {
  previdenciario: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  trabalhista: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

const statusBorderMap: Record<string, string> = {
  red: 'border-red-500 bg-red-500/10',
  yellow: 'border-yellow-500 bg-yellow-500/10',
  green: 'border-green-500 bg-green-500/10',
};

function PosicaoNode({ data }: NodeProps) {
  const d = data as any;
  const Icon = typeIcons[d.node_type] || Briefcase;
  const statusClass = d.statusColor ? statusBorderMap[d.statusColor] || '' : '';

  return (
    <div className={`border rounded-lg shadow-lg min-w-[220px] max-w-[280px] ${statusClass || 'bg-card border-border'}`}>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

      <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground capitalize">{d.node_type}</span>
        <div className="ml-auto flex gap-1">
          {d.node_type === 'funil' && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => d.onOpenChecklist?.(d.nodeId)}>
              <ClipboardCheck className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => d.onEdit?.(d.nodeId)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => d.onDelete?.(d.nodeId)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        <p className="text-sm font-semibold text-foreground leading-tight">{d.label}</p>

        {(d.setor || d.funil) && (
          <div className="flex flex-wrap gap-1">
            {d.setor && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${setorColors[d.setor] || ''}`}>
                {d.setor === 'previdenciario' ? 'Previdenciário' : 'Trabalhista'}
              </Badge>
            )}
            {d.funil && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {d.funil}
              </Badge>
            )}
          </div>
        )}

        {d.node_type === 'funil' && d.checklistTotal != null && (
          <button
            onClick={() => d.onOpenChecklist?.(d.nodeId)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ClipboardCheck className="h-3 w-3" />
            Requisitos: {d.checklistDone}/{d.checklistTotal}
          </button>
        )}

        {d.pessoa_nome ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{d.pessoa_nome}</span>
          </div>
        ) : d.precisa_contratar ? (
          <Badge variant="destructive" className="text-[10px]">Precisa Contratar</Badge>
        ) : null}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  );
}

export default memo(PosicaoNode);
