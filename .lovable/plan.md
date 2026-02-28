

# Fix: Tela de Atendimento nao carrega — mesmo problema de objeto renderizado

## Causa raiz

Identico ao bug corrigido no CrmFunilKanban: o campo `dados_extras` agora contem objetos com metadados (`{valor, confianca, origem, ...}`) em vez de strings simples. Na linha 253 de `Atendimento.tsx`, o valor e renderizado diretamente:

```typescript
<strong>{value}</strong>
```

Quando `value` e um objeto, o React lanca o erro "Objects are not valid as a React child" e a pagina inteira nao renderiza.

## Solucao

Atualizar o bloco "Lead context bar" (linhas 249-254) para extrair o valor textual de cada campo antes de renderizar, usando a mesma abordagem ja aplicada no CrmFunilKanban.

### Mudanca em `src/pages/Atendimento.tsx`

1. Importar `getFieldValue` e `DadosExtrasMap` de `@/utils/trabalhista/types`

2. Substituir o bloco de renderizacao dos dados extras (linhas 249-256) para:
   - Extrair o valor string com `getFieldValue`
   - Ignorar campos cujo valor extraido seja vazio

Isso corrige a renderizacao tanto para campos novos (objetos com metadados) quanto para campos legados (strings simples).

## Resultado esperado

- A tela de atendimento volta a abrir normalmente ao clicar no botao de ligar pelo WhatsApp
- Os dados extras do lead aparecem corretamente na barra de contexto no topo da pagina
