import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface WeekFilterProps {
  weeks: number[];
  selectedWeek: number | null;
  onWeekChange: (week: number | null) => void;
  isLoading?: boolean;
}

export const WeekFilter = ({ 
  weeks, 
  selectedWeek, 
  onWeekChange, 
  isLoading = false 
}: WeekFilterProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Gera todas as 53 semanas
  const allWeeks = Array.from({ length: 53 }, (_, i) => i + 1);
  
  // Semanas que têm dados
  const weeksWithData = new Set(weeks);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [weeks]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleWeekClick = (week: number) => {
    // Toggle selection - se clicar na mesma semana, deseleciona
    if (selectedWeek === week) {
      onWeekChange(null);
    } else {
      onWeekChange(week);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Filtrar por Semana</h3>
        {selectedWeek && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
            Semana {selectedWeek}
          </span>
        )}
        {!selectedWeek && (
          <span className="text-xs text-muted-foreground">
            Todas as semanas
          </span>
        )}
      </div>

      <div className="relative flex items-center gap-2">
        {/* Botão scroll esquerda */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 h-8 w-8",
            !canScrollLeft && "opacity-30 cursor-not-allowed"
          )}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Container de semanas com scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          onScroll={checkScrollability}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-1 min-w-max py-1">
            {allWeeks.map((week) => {
              const hasData = weeksWithData.has(week);
              const isSelected = selectedWeek === week;
              
              return (
                <button
                  key={week}
                  onClick={() => hasData && handleWeekClick(week)}
                  disabled={!hasData || isLoading}
                  className={cn(
                    "relative flex flex-col items-center justify-center min-w-[40px] h-12 rounded-md transition-all duration-200",
                    "text-xs font-medium",
                    hasData && !isSelected && "bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    hasData && isSelected && "bg-primary text-primary-foreground shadow-md scale-105",
                    !hasData && "bg-muted/30 text-muted-foreground/40 cursor-not-allowed",
                    isLoading && "animate-pulse"
                  )}
                >
                  <span className="text-[10px] text-inherit opacity-70">SEM</span>
                  <span className="text-sm font-semibold">{week}</span>
                  {hasData && (
                    <div className={cn(
                      "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão scroll direita */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 h-8 w-8",
            !canScrollRight && "opacity-30 cursor-not-allowed"
          )}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Com dados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted/50" />
          <span>Sem dados</span>
        </div>
      </div>
    </div>
  );
};
