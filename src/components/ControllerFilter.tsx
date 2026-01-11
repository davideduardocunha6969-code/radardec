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

interface ControllerFilterProps {
  controllers: string[];
  selectedControllers: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function ControllerFilter({
  controllers,
  selectedControllers,
  onSelectionChange,
}: ControllerFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleController = (controller: string) => {
    if (selectedControllers.includes(controller)) {
      onSelectionChange(selectedControllers.filter(c => c !== controller));
    } else {
      onSelectionChange([...selectedControllers, controller]);
    }
  };

  const selectAll = () => {
    onSelectionChange([...controllers]);
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
            {selectedControllers.length === 0
              ? "Todos os controllers"
              : `${selectedControllers.length} selecionado(s)`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar controller..." />
            <CommandList>
              <CommandEmpty>Nenhum controller encontrado.</CommandEmpty>
              <CommandGroup>
                <div className="flex gap-2 p-2 border-b">
                  <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
                    Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} className="flex-1">
                    Limpar
                  </Button>
                </div>
                {controllers.map((controller) => (
                  <CommandItem
                    key={controller}
                    value={controller}
                    onSelect={() => toggleController(controller)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedControllers.includes(controller) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {controller}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedControllers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedControllers.slice(0, 3).map(col => (
            <Badge key={col} variant="secondary" className="text-xs">
              {col}
            </Badge>
          ))}
          {selectedControllers.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{selectedControllers.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
