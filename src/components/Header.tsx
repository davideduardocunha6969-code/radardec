import { Radar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  lastUpdate?: Date;
  isLive?: boolean;
}

const Header = ({ lastUpdate, isLive = false }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg gradient-primary p-2.5 shadow-md">
            <Radar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight">
              Radar Controladoria{" "}
              <span className="text-accent font-display">DEC</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Gestão Jurídica Inteligente
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-medium text-success">Ao Vivo</span>
            </div>
          )}

          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>
                Atualizado: {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
