import { Briefcase } from "lucide-react";

const RadarTrabalhista = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Radar Trabalhista</h1>
          <p className="text-muted-foreground">Acompanhamento de processos trabalhistas</p>
        </div>
      </div>

      <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <p className="text-muted-foreground">Em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default RadarTrabalhista;
