import { HorarioTrabalhoSection } from "@/components/painel/HorarioTrabalhoSection";
import { IndisponibilidadeSection } from "@/components/painel/IndisponibilidadeSection";

export default function MeuPainel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
        <p className="text-muted-foreground">Visão geral das suas atividades e configurações.</p>
      </div>

      <div className="space-y-2">
        <HorarioTrabalhoSection />
        <IndisponibilidadeSection />
      </div>
    </div>
  );
}
