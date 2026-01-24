import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormatoOrigem, FormatoSaida } from "@/hooks/useFormatosModelador";
import { getFormatoIcon, getFormatoColors } from "@/utils/formatoIcons";
import { cn } from "@/lib/utils";

interface SortableFormatoItemProps {
  formato: FormatoOrigem | FormatoSaida;
  tipo: "origem" | "saida";
  onEdit: (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida") => void;
  onDelete: (formato: FormatoOrigem | FormatoSaida, tipo: "origem" | "saida") => void;
}

export function SortableFormatoItem({
  formato,
  tipo,
  onEdit,
  onDelete,
}: SortableFormatoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: formato.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getFormatoIcon(formato.icone);
  const colors = getFormatoColors(formato.cor);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-card transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/20 opacity-90"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className={cn("p-2 rounded", colors.bgColor, colors.textColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{formato.nome}</p>
          <p className="text-xs text-muted-foreground">{formato.descricao}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(formato, tipo)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(formato, tipo)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
