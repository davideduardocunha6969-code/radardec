

# Mover configuracao de IAs e Scripts das colunas para o funil

## Problema atual
1. A pagina de Atendimento busca o coach da coluna com `robo_coach_id || robo_coach_closer_id`, priorizando sempre o SDR
2. O `RealtimeCoachingPanel` usa `useActiveScriptSdr()` que busca o primeiro script ativo global, ignorando completamente a configuracao da coluna
3. O edge function `feedback-chamada` so verifica `robo_feedback_id` (SDR), ignorando `robo_feedback_closer_id`
4. A configuracao por coluna e confusa - o usuario quer configurar uma vez no funil

## Solucao

Mover a configuracao de IAs e Scripts para a tabela `crm_funis`, associando cada recurso a uma aba especifica (SDR ou Closer).

### 1. Migracao SQL - Adicionar colunas em `crm_funis`

```sql
ALTER TABLE public.crm_funis
  ADD COLUMN script_sdr_id uuid REFERENCES scripts_sdr(id) ON DELETE SET NULL,
  ADD COLUMN robo_coach_sdr_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN robo_feedback_sdr_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN script_closer_id uuid REFERENCES scripts_sdr(id) ON DELETE SET NULL,
  ADD COLUMN robo_coach_closer_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN robo_feedback_closer_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL;
```

### 2. Tela de configuracao do funil

No `CrmFunilKanban.tsx`, adicionar um botao de "Configuracoes do Funil" (icone engrenagem ao lado do titulo) que abre um dialog com:

**Atendimento SDR:**
- Script SDR (select dos scripts tipo "sdr")
- Coach Tempo Real SDR (select dos robos coach)
- Feedback SDR (select dos robos coach tipo feedback)

**Atendimento Closer:**
- Script Closer (select dos scripts tipo "closer")
- Coach Tempo Real Closer (select dos robos coach)
- Feedback Closer (select dos robos coach tipo feedback)

### 3. Remover selects de IAs/Scripts do dialog de coluna

O dialog de edicao de coluna (`editColunaDialog`) passara a ter apenas nome e cor. Os 6 selects de coach/feedback/script serao removidos.

### 4. Atualizar `Atendimento.tsx` - Consumir config do funil

Alterar a busca do coach: em vez de pegar da coluna, buscar do funil.

```text
Antes: crm_colunas.robo_coach_id || crm_colunas.robo_coach_closer_id
Agora: crm_funis.robo_coach_sdr_id (para aba SDR) ou crm_funis.robo_coach_closer_id (para aba Closer)
```

O parametro `tipo` (voip/whatsapp) ja e passado na URL. Precisaremos adicionar um parametro `papel=sdr|closer` na URL de abertura da janela de atendimento para saber qual coach buscar.

### 5. Atualizar `RealtimeCoachingPanel.tsx` - Usar script do funil

Em vez de `useActiveScriptSdr()` (busca global), o componente recebera o script ja resolvido como prop, vindo do `Atendimento.tsx` que buscara o `script_sdr_id` ou `script_closer_id` do funil.

### 6. Atualizar `feedback-chamada` edge function

Alterar para buscar o feedback coach do funil em vez da coluna:

```text
Antes: crm_leads -> coluna_id -> crm_colunas.robo_feedback_id
Agora: crm_leads -> funil_id -> crm_funis.robo_feedback_sdr_id ou robo_feedback_closer_id
```

Sera necessario passar o `papel` (sdr/closer) no request do feedback, ou inferir do canal da chamada.

### 7. Atualizar hooks

- `useCrmOutbound.ts`: Adicionar `useUpdateFunil` mutation para salvar a configuracao do funil
- `useCrmOutbound.ts`: Atualizar interface `CrmFunil` com os novos campos
- `useScriptsSdr.ts`: A funcao `useActiveScriptSdr` pode ser mantida como fallback mas nao sera mais a fonte principal

## Arquivos afetados

- **Migracao SQL**: Novas colunas em `crm_funis`
- **`src/hooks/useCrmOutbound.ts`**: Interface `CrmFunil` + `useUpdateFunil`
- **`src/pages/CrmFunilKanban.tsx`**: Dialog de config do funil, remover selects das colunas, passar `papel` na URL
- **`src/pages/Atendimento.tsx`**: Buscar coach/script do funil, passar script como prop ao coaching panel
- **`src/components/crm/RealtimeCoachingPanel.tsx`**: Receber script como prop em vez de buscar globalmente
- **`supabase/functions/feedback-chamada/index.ts`**: Buscar feedback coach do funil

## Fluxo resultante

```text
Configuracao:
  Funil → Configuracoes → Define Script/Coach/Feedback para SDR e Closer

Uso (ligacao):
  Aba "Atendimento SDR" → Clica "Ligar" → URL com papel=sdr → Atendimento busca coach_sdr + script_sdr do funil
  Aba "Atendimento Closer" → Clica "Ligar" → URL com papel=closer → Atendimento busca coach_closer + script_closer do funil

Feedback pos-ligacao:
  Edge function recebe papel → Busca feedback_sdr ou feedback_closer do funil
```

