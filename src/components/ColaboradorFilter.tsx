import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ColaboradorFilterProps {
  colaboradores: string[];
  selectedColaboradores: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function ColaboradorFilter({
  colaboradores,
  selectedColaboradores,
  onSelectionChange,
}: ColaboradorFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleColaborador = (colaborador: string) => {
    if (selectedColaboradores.includes(colaborador)) {
      onSelectionChange(selectedColaboradores.filter(c => c !== colaborador));
    } else {
      onSelectionChange([...selectedColaboradores, colaborador]);
    }
  };

  const selectAll = () => {
    onSelectionChange([...colaboradores]);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="justify-between min-w-[200px]"
          >
            {selectedColaboradores.length === 0
              ? "Todos os colaboradores"
              : `${selectedColaboradores.length} selecionado(s)`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar colaborador..." />
            <CommandList>
              <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
              <CommandGroup>
                <div className="flex gap-2 p-2 border-b">
                  <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
                    Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} className="flex-1">
                    Limpar
                  </Button>
                </div>
                {colaboradores.map((colaborador) => (
                  <CommandItem
                    key={colaborador}
                    value={colaborador}
                    onSelect={() => toggleColaborador(colaborador)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedColaboradores.includes(colaborador) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {colaborador}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedColaboradores.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedColaboradores.slice(0, 3).map(col => (
            <Badge key={col} variant="secondary" className="text-xs">
              {col}
            </Badge>
          ))}
          {selectedColaboradores.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{selectedColaboradores.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
