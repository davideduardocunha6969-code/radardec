import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CardFilterSelectsProps {
  cardKey: string;
  setores: string[];
  produtosBySetor: Record<string, string[]>;
  allProdutos: string[];
  cardFilters: Record<string, { setor: string | null; produto: string | null }>;
  onFilterChange: (cardKey: string, field: 'setor' | 'produto', value: string | null) => void;
}

export function CardFilterSelects({
  cardKey,
  setores,
  produtosBySetor,
  allProdutos,
  cardFilters,
  onFilterChange,
}: CardFilterSelectsProps) {
  const currentFilter = cardFilters[cardKey] || { setor: null, produto: null };

  const availableProdutos = useMemo(() => {
    if (!currentFilter.setor) return allProdutos;
    return produtosBySetor[currentFilter.setor] || [];
  }, [currentFilter.setor, allProdutos, produtosBySetor]);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentFilter.setor || "all"}
        onValueChange={(v) => {
          const newSetor = v === "all" ? null : v;
          onFilterChange(cardKey, 'setor', newSetor);
          if (newSetor !== currentFilter.setor) {
            onFilterChange(cardKey, 'produto', null);
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-7 text-xs">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Setores</SelectItem>
          {setores.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentFilter.produto || "all"}
        onValueChange={(v) => onFilterChange(cardKey, 'produto', v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-7 text-xs">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Produtos</SelectItem>
          {availableProdutos.map(p => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
