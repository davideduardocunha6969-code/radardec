import { LayoutDashboard } from "lucide-react";

export default function MeuPainel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
        <p className="text-muted-foreground">Visão geral das suas atividades e compromissos.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/30">
        <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Meu Painel em construção</p>
        <p className="text-sm text-muted-foreground mt-1">Em breve você terá uma visão consolidada aqui.</p>
      </div>
    </div>
  );
}
