import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Setor,
  Formato,
  SETOR_LABELS,
  FORMATO_LABELS,
} from "@/hooks/useConteudosMidia";
import { SituacaoIdeia, SITUACAO_LABELS } from "@/hooks/useIdeiasConteudo";

interface IdeiaFiltersProps {
  setorFilter: Setor | "all";
  formatoFilter: Formato | "all";
  situacaoFilter: SituacaoIdeia | "all";
  onSetorChange: (value: Setor | "all") => void;
  onFormatoChange: (value: Formato | "all") => void;
  onSituacaoChange: (value: SituacaoIdeia | "all") => void;
  onClearFilters: () => void;
}

export function IdeiaFilters({
  setorFilter,
  formatoFilter,
  situacaoFilter,
  onSetorChange,
  onFormatoChange,
  onSituacaoChange,
  onClearFilters,
}: IdeiaFiltersProps) {
  const hasFilters =
    setorFilter !== "all" || formatoFilter !== "all" || situacaoFilter !== "all";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={setorFilter} onValueChange={onSetorChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Setores</SelectItem>
          {Object.entries(SETOR_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={formatoFilter} onValueChange={onFormatoChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Formatos</SelectItem>
          {Object.entries(FORMATO_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={situacaoFilter} onValueChange={onSituacaoChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Situação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Situações</SelectItem>
          {Object.entries(SITUACAO_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
