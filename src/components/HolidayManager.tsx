import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, X, CalendarDays, CalendarRange, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HolidayManagerProps {
  holidays: Date[];
  loading?: boolean;
  onAddHoliday: (date: Date, description?: string) => Promise<boolean>;
  onAddHolidayRange: (startDate: Date, endDate: Date, description?: string) => Promise<boolean>;
  onRemoveHoliday: (date: Date) => Promise<boolean>;
  onClearAll: () => Promise<boolean>;
}

export function HolidayManager({ 
  holidays, 
  loading,
  onAddHoliday, 
  onAddHolidayRange,
  onRemoveHoliday,
  onClearAll 
}: HolidayManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [recessDescription, setRecessDescription] = useState("Recesso de final de ano");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const currentYear = new Date().getFullYear();

  const addSingleHoliday = async () => {
    if (!selectedDate) return;
    setIsAdding(true);
    const success = await onAddHoliday(selectedDate, description || undefined);
    if (success) {
      setSelectedDate(undefined);
      setDescription("");
    }
    setIsAdding(false);
  };

  const addRecessPeriod = async () => {
    if (!startDate || !endDate) return;
    setIsAdding(true);
    const success = await onAddHolidayRange(startDate, endDate, recessDescription || undefined);
    if (success) {
      setStartDate(undefined);
      setEndDate(undefined);
    }
    setIsAdding(false);
  };

  const handleRemoveHoliday = async (date: Date) => {
    await onRemoveHoliday(date);
  };

  // Preset para recesso comum (23/12 a 01/01)
  const setDefaultRecess = () => {
    setStartDate(new Date(currentYear, 11, 23)); // 23 de dezembro
    setEndDate(new Date(currentYear + 1, 0, 1)); // 1 de janeiro
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Feriados ({holidays.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Gerenciar Feriados
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Feriado Individual
            </TabsTrigger>
            <TabsTrigger value="recess" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              Período de Recesso
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Adicione feriados individuais para excluí-los do cálculo de dias úteis.
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Button onClick={addSingleHoliday} disabled={!selectedDate || isAdding} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Descrição (opcional)</Label>
                <Input 
                  id="description"
                  placeholder="Ex: Carnaval, Corpus Christi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recess" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Adicione um período de recesso de uma só vez (ex: recesso de final de ano).
            </p>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Data inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-sm">Data final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="recessDescription" className="text-sm">Descrição</Label>
                <Input 
                  id="recessDescription"
                  placeholder="Ex: Recesso de final de ano"
                  value={recessDescription}
                  onChange={(e) => setRecessDescription(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={setDefaultRecess}
                  className="flex-1"
                >
                  Usar período padrão (23/12 a 01/01)
                </Button>
                <Button 
                  onClick={addRecessPeriod} 
                  disabled={!startDate || !endDate || isAdding}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar período
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-2 mt-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Feriados cadastrados ({holidays.length}):</h4>
            {holidays.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar todos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover todos os feriados?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os {holidays.length} feriados cadastrados serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearAll}>Remover todos</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Carregando feriados...
            </p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum feriado cadastrado
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {holidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <span className="text-sm">
                      {format(holiday, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveHoliday(holiday)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
