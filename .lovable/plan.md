

# Perguntas condicionais colapsáveis no card de Qualificação

## O que muda

Atualmente, todas as perguntas (principais e condicionais) aparecem ao mesmo tempo no card, com indentação visual. A mudança faz com que:

- **Somente perguntas principais** apareçam no card inicialmente
- Perguntas que possuem condicionais (`sub_items`) mostram um **botão de resposta** ao lado (Sim/Não, ou as opções relevantes)
- Ao clicar na resposta, as **condicionais correspondentes se expandem** abaixo da pergunta principal
- Perguntas sem condicionais continuam funcionando normalmente (check/descartar)

## Lógica de expansão por tipo

O sistema identifica o `tipo_campo` de cada pergunta principal para determinar a interação:

- **sim_nao**: Mostra botões "Sim" e "Não". Sub-items com "SE NÃO:" expandem ao clicar Não; "SE SIM:" ao clicar Sim
- **selecao**: Mostra as opções do `opcoes_campo`. Sub-items que contêm a opção selecionada expandem
- **Outros tipos** (texto, numero, data, valor): Ao marcar como feito (check), expande todos os sub-items

## Alterações técnicas

### 1. `ChecklistCard.tsx` — Refatoração principal

- Remover o `flattenScriptItems` do `RealtimeCoachingPanel` para o card de Qualificação. Em vez de receber itens já achatados, o card receberá os **itens originais com sub_items** intactos
- Criar nova interface `ScriptChecklistCardProps` que aceita `ScriptItem[]` (estrutura hierárquica) em vez de `ChecklistItem[]` (flat)
- Adicionar estado interno `expandedItems` (Map de id para resposta escolhida)
- Renderizar apenas itens de profundidade 0 por padrão
- Quando um item tem `sub_items`:
  - Se `tipo_campo === "sim_nao"`: mostra botões Sim/Não em vez do check simples
  - Se `tipo_campo === "selecao"`: mostra dropdown com opções
  - Outros: mostra check normal, que ao clicar expande sub_items
- Ao responder, filtra sub_items pela condição (prefixo "SE SIM:", "SE NÃO:" no label) e os exibe com animação de expansão
- Sub_items expandidos funcionam como checklist normal (check/descartar)
- Sub_items que possuem seus próprios sub_items seguem a mesma lógica recursiva

### 2. Novo componente `ScriptChecklistCard.tsx`

Para evitar quebrar os cards de Apresentação e Show Rate (que não têm essa complexidade), será criado um **novo componente** `ScriptChecklistCard` específico para a Qualificação:

- Aceita `items: ScriptItem[]` (estrutura original com sub_items)
- Mantém estado de `expandedItems` e `answers` (Map de id para resposta)
- Quando o closer responde uma pergunta principal:
  1. A resposta é armazenada no estado
  2. O item principal é marcado como "feito"
  3. Os sub_items relevantes aparecem com animação
- O contador mostra progresso considerando apenas itens visíveis/expandidos
- Badge do `campo_lead_key` continua aparecendo ao lado de cada item

### 3. `RealtimeCoachingPanel.tsx` — Integração

- O card de **Qualificação** passa a usar `ScriptChecklistCard` recebendo `activeScript.qualificacao` diretamente (sem flatten)
- Os cards de **Apresentação** e **Show Rate** continuam usando `ChecklistCard` com flatten (sem mudança)
- O handler `handleCheckQualificacao` é adaptado para trabalhar com IDs compostos (parent__child) para manter compatibilidade com o estado `qualificationDone`

### 4. Fluxo visual

```text
Antes:
  O P3 — Contrato ativo?
    O SE NÃO: Data de desligamento
    O SE NÃO: Modalidade
    O SE NÃO: Aviso prévio trabalhado?
    ...

Depois:
  O P3 — Contrato ativo?  [Sim] [Não]

  (ao clicar "Não"):
  ✓ P3 — Contrato ativo?  → Não
    O SE NÃO: Data de desligamento
    O SE NÃO: Modalidade
    O SE NÃO: Aviso prévio trabalhado?
    ...
```

### 5. Arquivos alterados

1. **Novo**: `src/components/crm/coaching/ScriptChecklistCard.tsx` — Componente com lógica de expansão condicional
2. **Editar**: `src/components/crm/RealtimeCoachingPanel.tsx` — Substituir ChecklistCard por ScriptChecklistCard no card de Qualificação
3. **Sem alteração**: `ChecklistCard.tsx` (continua sendo usado para Apresentação e Show Rate)
