import { HorarioTrabalhoSection } from "@/components/painel/HorarioTrabalhoSection";
import { IndisponibilidadeSection } from "@/components/painel/IndisponibilidadeSection";

export default function MeuPainel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
        <p className="text-muted-foreground">Gerencie seus horários de trabalho e indisponibilidades.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorarioTrabalhoSection />
        <IndisponibilidadeSection />
      </div>
    </div>
  );
}
