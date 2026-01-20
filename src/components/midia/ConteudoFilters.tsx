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
  Status,
  SETOR_LABELS,
  FORMATO_LABELS,
  STATUS_LABELS,
} from "@/hooks/useConteudosMidia";

interface ConteudoFiltersProps {
  setorFilter: Setor | "all";
  formatoFilter: Formato | "all";
  statusFilter: Status | "all";
  onSetorChange: (value: Setor | "all") => void;
  onFormatoChange: (value: Formato | "all") => void;
  onStatusChange: (value: Status | "all") => void;
  onClearFilters: () => void;
}

export function ConteudoFilters({
  setorFilter,
  formatoFilter,
  statusFilter,
  onSetorChange,
  onFormatoChange,
  onStatusChange,
  onClearFilters,
}: ConteudoFiltersProps) {
  const hasFilters =
    setorFilter !== "all" || formatoFilter !== "all" || statusFilter !== "all";

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

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
          className="h-9"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
