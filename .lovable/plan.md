
# Fix: Painel lateral visivel mesmo quando fechado

## Problema
O painel deslizante esta posicionado com `right-14` e usa `translate-x-full` para esconder. Como `translate-x-full` desloca o painel pela sua propria largura (1/3 da tela), mas ele comeca em `right-14` (nao `right-0`), uma faixa do painel continua visivel, tampando parte dos botoes de chamada.

## Solucao
Renderizar o painel **somente quando `activePanel` nao for null**. Isso elimina qualquer residuo visual. Manter a animacao de entrada usando CSS, mas nao depender de `translate-x` para esconder.

## Alteracao

**Arquivo: `src/pages/Atendimento.tsx`**

Linha 354-365 — O bloco do sliding panel sera envolto em uma condicional `{activePanel && (...)}` e a classe de translate sera removida (ja que ele so existe quando aberto):

```tsx
{/* Sliding overlay panel */}
{activePanel && (
  <div className="fixed top-0 bottom-0 right-14 w-1/3 min-w-[320px] max-w-[480px] z-40 bg-background border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
    <div className="p-4">
      {activePanel === "extrator" && lead && <DataExtractorPanel leadId={lead.id} />}
      {activePanel === "lacunas" && lead && <GapsPanel leadId={lead.id} />}
      {activePanel === "estimativa" && lead && <ValuesEstimationPanel leadId={lead.id} />}
    </div>
  </div>
)}
```

Mudancas especificas:
- Envolver o `div` do painel em `{activePanel && (...)}`
- Remover a logica `activePanel ? "translate-x-0" : "translate-x-full"`
- Adicionar `animate-in slide-in-from-right duration-300` (do tailwindcss-animate, ja instalado) para manter a animacao de entrada
