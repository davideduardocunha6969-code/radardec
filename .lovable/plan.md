

# Clique na Fala do Lead para Gerar RECA/RALOCA/RAPOVECA

## Resumo

Cada fala do Lead na transcricao em tempo real tera um indicador visual de clique. Ao clicar, um pequeno popover aparece com 3 opcoes: RECA, RALOCA ou RAPOVECA. Ao selecionar uma, o sistema envia a fala para a IA gerar uma sugestao especifica e a insere no card correspondente.

## Comportamento do usuario

1. Durante a chamada, o SDR ve as falas do Lead na transcricao
2. Ao passar o mouse sobre uma fala do Lead, aparece um cursor pointer e highlight sutil
3. Ao clicar, abre um Popover compacto com 3 botoes: "RECA", "RALOCA", "RAPOVECA"
4. Ao selecionar, o popover fecha, mostra um loading discreto, e a IA gera uma sugestao baseada naquela frase
5. A sugestao e inserida no card correspondente (RECA, RALOCA ou Objecoes)

## Mudancas tecnicas

### 1. Criar edge function `supabase/functions/generate-coaching-item/index.ts`

Nova edge function dedicada que recebe:
- `leadPhrase`: a fala exata do lead clicada
- `type`: "reca" | "raloca" | "rapoveca"
- `leadName`: nome do lead
- `coachInstructions`: instrucoes do coach

Retorna um unico item estruturado (id, label, description) gerado pela IA com base na frase do lead. Usa `google/gemini-2.5-flash` para equilibrio custo/qualidade.

### 2. Modificar `src/components/crm/RealtimeCoachingPanel.tsx`

- Importar `Popover`, `PopoverTrigger`, `PopoverContent` de `@/components/ui/popover`
- Adicionar estado `generatingItemFor` (string | null) para indicar qual fala esta sendo processada
- Criar handler `handleGenerateFromLead(transcriptId, type)` que:
  - Chama a edge function `generate-coaching-item`
  - Insere o resultado no estado correto (`recaItems`, `ralocaItems` ou `objections`)
- Na renderizacao das falas (linha ~530), envolver cada fala do Lead em um Popover clicavel:
  - Fala do Lead recebe `cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1`
  - PopoverContent mostra 3 botoes compactos com icones (Heart = RECA, Brain = RALOCA, AlertTriangle = RAPOVECA)
  - Enquanto processa, mostra Loader2 no lugar dos botoes

### Arquivos a criar/modificar

1. `supabase/functions/generate-coaching-item/index.ts` -- nova edge function
2. `src/components/crm/RealtimeCoachingPanel.tsx` -- popover nas falas do Lead + handler

