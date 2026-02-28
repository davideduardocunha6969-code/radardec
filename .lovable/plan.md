
# Alterar cards do Kanban: mostrar tempo decorrido em vez de datas

## O que muda

Os 3 campos no card do lead no Kanban ("Cadastrado em", "Nesta etapa desde", "Sem contato desde") passarao a mostrar o tempo decorrido no formato "Xd Xh Xmin" em vez da data fixa (ex: "25/02/2026").

**Antes:** "Cadastrado em 25/02/2026"
**Depois:** "Cadastrado ha 3d 4h 12min"

## Detalhes tecnicos

### 1. Criar helper `formatElapsedTime` em `src/utils/dateFormat.ts`

Funcao que recebe uma data e retorna uma string com dias, horas e minutos decorridos desde aquela data ate agora. Exemplos:
- Menos de 1 hora: "32min"
- Menos de 1 dia: "4h 12min"
- Mais de 1 dia: "3d 4h"

### 2. Atualizar `src/pages/CrmFunilKanban.tsx` (linhas 60-64)

Substituir as 3 linhas que usam `toLocaleDateString` pelo helper `formatElapsedTime`:
- "Cadastrado ha Xd Xh" (baseado em `lead.created_at`)
- "Nesta etapa ha Xd Xh" (baseado em `lead.etapa_desde`)
- "Sem contato ha Xd Xh" (baseado em `lead.ultimo_contato_em`)

Nenhuma alteracao no banco de dados e necessaria.
