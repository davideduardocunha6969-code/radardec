
# Separar Historico de Contatos SDR/Closer + Instruções de Resumo IA Customizaveis

## Resumo

Duas mudancas principais:
1. Adicionar coluna `papel` em `crm_chamadas` para separar contatos SDR e Closer, e adicionar a secao de contatos na aba Closer
2. Adicionar campo `instrucoes_resumo` na tabela `robos_coach` para customizar o prompt de resumo de contatos por papel (SDR vs Closer)

---

## 1. Banco de Dados

### Migration 1: Coluna `papel` em `crm_chamadas`
```sql
ALTER TABLE public.crm_chamadas
ADD COLUMN papel text NOT NULL DEFAULT 'sdr';
```

### Migration 2: Coluna `instrucoes_resumo` em `robos_coach`
```sql
ALTER TABLE public.robos_coach
ADD COLUMN instrucoes_resumo text DEFAULT '';
```

---

## 2. Backend: Edge Function `resumo-contatos-lead`

Atualizar para:
- Aceitar parametro `papel` (default `'sdr'`)
- Filtrar chamadas por `papel`
- Buscar o coach do funil correspondente ao papel (`robo_coach_sdr_id` ou `robo_coach_closer_id`)
- Ler o campo `instrucoes_resumo` do coach
- Se existir, usar como base do prompt de resumo em vez do prompt hardcoded atual
- Se nao existir, manter o prompt padrao atual

---

## 3. Frontend: Hook `useCrmChamadas`

- Adicionar parametro opcional `papel` ao hook `useCrmChamadas(leadId, papel?)`
- Quando `papel` for fornecido, filtrar com `.eq("papel", papel)`
- Adicionar `papel` ao `useCreateChamada` para gravar o campo na criacao

---

## 4. Frontend: `LeadContatosTab`

- Adicionar prop `papel?: string` (default `undefined` = mostra tudo, para retrocompatibilidade)
- Passar `papel` para `useCrmChamadas`
- Passar `papel` para a edge function `resumo-contatos-lead`
- Ajustar label "Encerrada por" — mostrar "Closer" em vez de "SDR" quando `papel === "closer"`

---

## 5. Frontend: `CrmFunilKanban.tsx`

- Na aba "Contatos SDR" (atual): passar `papel="sdr"` para `LeadContatosTab`
- Na aba "Atendimento Closer": adicionar `LeadContatosTab` com `papel="closer"` apos os telefones e o resumo SDR existente

---

## 6. Frontend: Componentes de ligacao

Passar `papel` ao criar chamadas:
- `src/pages/Atendimento.tsx` — obter `papel` da URL e passar aos componentes de chamada
- `src/components/crm/WhatsAppCallRecorder.tsx` — aceitar prop `papel`, passar no `createChamada`
- `src/components/crm/VoipDialer.tsx` — aceitar prop `papel`, passar no `createChamada`
- `src/components/crm/WhatsAppAICallButton.tsx` — aceitar prop `papel`, passar no `createChamada`

---

## 7. Frontend: Admin de Robos (`RobosCoach.tsx`)

Adicionar nova secao no formulario de criacao/edicao de coaches SDR e Closer:

- Novo `AccordionItem` chamado "Instrucoes de Resumo IA"
- Campo `Textarea` vinculado a `instrucoes_resumo`
- Descricao: "Prompt usado pela IA que gera o resumo dos contatos realizados com o lead. Se vazio, usa o prompt padrao."
- Visivel tanto para coaches SDR (`coaching`) quanto Closer (`coaching_closer`)
- Icone: `Sparkles` (mesma cor do resumo IA)

Atualizar `useCreateRoboCoach` e `useUpdateRoboCoach` para incluir `instrucoes_resumo`.

---

## Arquivos Modificados

1. **Migration SQL** — `papel` em `crm_chamadas` + `instrucoes_resumo` em `robos_coach`
2. `supabase/functions/resumo-contatos-lead/index.ts` — aceitar `papel`, buscar prompt do coach
3. `src/hooks/useCrmChamadas.ts` — filtro por `papel` + campo no insert
4. `src/hooks/useRobosCoach.ts` — `instrucoes_resumo` nos tipos e mutations
5. `src/components/crm/LeadContatosTab.tsx` — prop `papel`
6. `src/pages/CrmFunilKanban.tsx` — `LeadContatosTab` na aba Closer + `papel="sdr"` na SDR
7. `src/pages/Atendimento.tsx` — passar `papel` aos componentes de chamada
8. `src/components/crm/WhatsAppCallRecorder.tsx` — prop `papel`
9. `src/components/crm/VoipDialer.tsx` — prop `papel`
10. `src/components/crm/WhatsAppAICallButton.tsx` — prop `papel`
11. `src/pages/RobosCoach.tsx` — campo `instrucoes_resumo` no formulario

## Resultado Esperado

- Aba SDR mostra apenas contatos feitos como SDR, com resumo IA usando prompt customizado do coach SDR
- Aba Closer mostra contatos feitos como Closer, com resumo IA usando prompt customizado do coach Closer
- Admin de Robos permite configurar instrucoes de resumo independentes para cada coach
- Chamadas existentes permanecem como `papel='sdr'` (default)
