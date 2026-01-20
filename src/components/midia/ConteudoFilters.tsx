import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, CalendarDays } from "lucide-react";
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
  semanaFilter: number | "all";
  onSetorChange: (value: Setor | "all") => void;
  onFormatoChange: (value: Formato | "all") => void;
  onStatusChange: (value: Status | "all") => void;
  onSemanaChange: (value: number | "all") => void;
  onClearFilters: () => void;
}

export function ConteudoFilters({
  setorFilter,
  formatoFilter,
  statusFilter,
  semanaFilter,
  onSetorChange,
  onFormatoChange,
  onStatusChange,
  onSemanaChange,
  onClearFilters,
}: ConteudoFiltersProps) {
  const hasFilters =
    setorFilter !== "all" || formatoFilter !== "all" || statusFilter !== "all" || semanaFilter !== "all";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select 
        value={semanaFilter === "all" ? "all" : semanaFilter.toString()} 
        onValueChange={(v) => onSemanaChange(v === "all" ? "all" : parseInt(v))}
      >
        <SelectTrigger className="w-[150px]">
          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Semana" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="all">Todas as Semanas</SelectItem>
          {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
            <SelectItem key={week} value={week.toString()}>
              Semana {week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
