import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowCanvas, { type FlowCanvasHandle } from '@/components/plano-comercial/FlowCanvas';
import PlanoStatsCards from '@/components/plano-comercial/PlanoStatsCards';
import { usePlanoComercial } from '@/hooks/usePlanoComercial';
import { printPlanoComercial } from '@/utils/printPlanoComercial';

const PlanoImplementacaoComercial = () => {
  const planoData = usePlanoComercial();
  const flowRef = useRef<FlowCanvasHandle>(null);

  const handlePrint = async () => {
    const flowElement = flowRef.current?.getFlowElement() ?? null;
    await printPlanoComercial(planoData.nodes, flowElement);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Implementação Comercial</h1>
          <p className="text-sm text-muted-foreground">Arraste para mover cards, conecte arrastando os pontos entre cards, clique em + para criar.</p>
        </div>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2" disabled={planoData.loading}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </div>
      {!planoData.loading && <PlanoStatsCards nodes={planoData.nodes} />}
      <FlowCanvas ref={flowRef} planoData={planoData} />
    </div>
  );
};

export default PlanoImplementacaoComercial;
