import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  lastUpdate?: Date;
  isLive?: boolean;
}

const Header = ({ lastUpdate, isLive = false }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-primary sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Logo do escritório em texto */}
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-primary-foreground tracking-[0.2em]">
              DAVID EDUARDO
            </span>
            <span className="text-2xl font-bold text-accent tracking-wider font-display">
              CUNHA
            </span>
            <span className="text-[10px] font-medium text-primary-foreground tracking-[0.3em]">
              ADVOGADOS
            </span>
          </div>
          <div className="h-10 w-px bg-accent/30" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary-foreground tracking-wide">
              RADAR CONTROLADORIA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-accent font-display">
              Gestão Jurídica
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-xs font-medium text-accent">Ao Vivo</span>
            </div>
          )}

          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
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
