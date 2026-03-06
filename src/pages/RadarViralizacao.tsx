import { Flame } from "lucide-react";

const RadarViralizacao = () => {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Radar de Viralização</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Em construção — aguardando instruções.</p>
      </div>
    </div>
  );
};

export default RadarViralizacao;
