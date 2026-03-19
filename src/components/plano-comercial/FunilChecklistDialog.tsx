import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/usePlanoComercial';

interface FunilChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeLabel: string;
  items: ChecklistItem[];
  onAdd: (nodeId: string, texto: string) => Promise<ChecklistItem | null>;
  onToggle: (id: string, concluido: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function FunilChecklistDialog({
  open, onOpenChange, nodeId, nodeLabel, items, onAdd, onToggle, onDelete,
}: FunilChecklistDialogProps) {
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    await onAdd(nodeId, newText.trim());
    setNewText('');
    setAdding(false);
  };

  const done = items.filter(i => i.concluido).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Requisitos — {nodeLabel}</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          {done}/{items.length} requisitos cumpridos. O funil ficará verde quando todos estiverem concluídos e todas as posições ocupadas.
        </p>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum requisito cadastrado. Adicione abaixo.
            </p>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 group">
              <Checkbox
                checked={item.concluido}
                onCheckedChange={(checked) => onToggle(item.id, !!checked)}
              />
              <span className={`text-sm flex-1 ${item.concluido ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.texto}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Novo requisito..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
