import FlowCanvas from '@/components/plano-comercial/FlowCanvas';

const PlanoImplementacaoComercial = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plano de Implementação Comercial</h1>
        <p className="text-sm text-muted-foreground">Arraste para mover cards, conecte arrastando os pontos entre cards, clique em + para criar.</p>
      </div>
      <FlowCanvas />
    </div>
  );
};

export default PlanoImplementacaoComercial;
