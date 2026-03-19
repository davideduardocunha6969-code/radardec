

## Fluxograma Interativo para Plano de Implementação Comercial

### Objetivo
Construir um editor visual de fluxograma onde o usuário cria cards (posições/cargos), conecta-os com linhas hierárquicas, e organiza seu plano de implementação comercial com funis de atendimento.

### Biblioteca
Instalar **@xyflow/react** (React Flow v12) -- a biblioteca padrão para fluxogramas interativos em React. Suporta drag-and-drop, conexões com linhas, zoom/pan, e custom nodes.

### Modelo de Dados (banco de dados)

Criar tabela `plano_comercial_nodes` para persistir os cards:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| user_id | uuid | Dono |
| node_type | text | "posicao", "setor", "funil", "grupo" |
| label | text | Nome do card (ex: "SDR Inbound") |
| setor | text | "previdenciario", "trabalhista", null |
| funil | text | Nome do funil (ex: "inbound", "caminhoneiros") |
| pessoa_nome | text | Nome da pessoa contratada (null se vaga aberta) |
| precisa_contratar | boolean | Se a posição precisa ser preenchida |
| position_x | float | Posição X no canvas |
| position_y | float | Posição Y no canvas |
| dados_extras | jsonb | Campos livres (descrição, observações) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Criar tabela `plano_comercial_edges` para persistir as conexões:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| user_id | uuid | |
| source_node_id | uuid FK | Card de origem |
| target_node_id | uuid FK | Card de destino |
| label | text | Rótulo opcional da conexão |
| created_at | timestamptz | |

RLS: usuários autenticados podem gerenciar seus próprios registros (`auth.uid() = user_id`).

### Componentes

1. **PlanoImplementacaoComercial.tsx** (page) -- canvas React Flow com toolbar
2. **FlowCanvas.tsx** -- wrapper do React Flow com handlers de drag, connect, save
3. **PosicaoNode.tsx** -- custom node que exibe:
   - Tipo do card (ícone: setor, funil, posição)
   - Label / cargo
   - Setor + Funil (badges coloridos)
   - Nome da pessoa ou badge "Precisa Contratar" (vermelho)
   - Botão de editar
4. **NodeFormDialog.tsx** -- dialog para criar/editar um card com campos:
   - Tipo (setor, funil, posição)
   - Label/cargo
   - Setor (select: previdenciário, trabalhista)
   - Funil (select dinâmico conforme setor)
   - Pessoa (input texto)
   - Precisa contratar (switch)
   - Observações

### Hook: usePlanoComercial.ts
- Carrega nodes e edges do banco
- Converte para formato React Flow
- Salva alterações (posição, conexões, CRUD de nodes)
- Auto-save ao mover cards ou criar conexões

### UX do Fluxograma
- **Adicionar card**: botão "+" na toolbar superior abre o dialog
- **Conectar cards**: arrastar do handle de um card para outro (gera edge/linha)
- **Mover cards**: drag livre no canvas, posição salva automaticamente
- **Editar card**: duplo-clique ou botão de editar no card
- **Excluir**: botão de excluir no card (com confirmação)
- **Zoom/Pan**: scroll + arrastar canvas (nativo do React Flow)
- **Minimap**: minimapa no canto inferior para navegação rápida

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/pages/PlanoImplementacaoComercial.tsx` | Reescrever com React Flow |
| `src/components/plano-comercial/FlowCanvas.tsx` | Criar |
| `src/components/plano-comercial/PosicaoNode.tsx` | Criar |
| `src/components/plano-comercial/NodeFormDialog.tsx` | Criar |
| `src/hooks/usePlanoComercial.ts` | Criar |
| Migration SQL | Criar tabelas + RLS |
| `package.json` | Adicionar `@xyflow/react` |

### Visual dos Cards

```text
┌─────────────────────────────┐
│ 🏢 Funil                    │
│ ─────────────────────────── │
│ SDR Inbound Previdenciário  │
│ [Previdenciário] [Inbound]  │
│                             │
│ 👤 João Silva               │
│   ou                        │
│ 🔴 Precisa Contratar        │
│                     [✏️][🗑️]│
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 🏢 Posição                  │
│ ─────────────────────────── │
│ Closer Previdenciário       │
│ [Previdenciário] [Inbound]  │
│                             │
│ 🔴 Precisa Contratar        │
│                     [✏️][🗑️]│
└─────────────────────────────┘
```

