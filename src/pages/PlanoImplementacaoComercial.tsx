import FlowCanvas from '@/components/plano-comercial/FlowCanvas';
import PlanoStatsCards from '@/components/plano-comercial/PlanoStatsCards';
import { usePlanoComercial } from '@/hooks/usePlanoComercial';

const PlanoImplementacaoComercial = () => {
  const planoData = usePlanoComercial();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plano de Implementação Comercial</h1>
        <p className="text-sm text-muted-foreground">Arraste para mover cards, conecte arrastando os pontos entre cards, clique em + para criar.</p>
      </div>
      {!planoData.loading && <PlanoStatsCards nodes={planoData.nodes} />}
      <FlowCanvas planoData={planoData} />
    </div>
  );
};

export default PlanoImplementacaoComercial;
