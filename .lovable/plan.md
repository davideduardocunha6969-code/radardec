

# Radar visivel apenas para robos tipo Closer

## Problema atual

Hoje a tabela `robos_coach` tem apenas dois tipos: `coaching` (usado tanto para SDR quanto Closer) e `feedback_sdr`. Nao ha como distinguir se um robo coaching e de SDR ou de Closer. A diferenciacao acontece apenas no funil (campo `robo_coach_sdr_id` vs `robo_coach_closer_id`).

Para mostrar o accordion "Instrucoes da IA Radar" apenas para robos do Closer, precisamos primeiro criar essa distincao.

## Solucao proposta

### 1. Adicionar tipo `coaching_closer` na tabela `robos_coach`

Criar um novo valor de tipo. Os robos existentes com `tipo = 'coaching'` passam a ser entendidos como SDR (comportamento atual preservado). Novos robos closer usam `tipo = 'coaching_closer'`.

Migracao SQL:
- Adicionar coluna `instrucoes_radar` (text, nullable) na tabela `robos_coach`
- Nao e necessario alterar o tipo da coluna `tipo` pois ja e `text` livre

### 2. Separar as abas no admin: Coaches SDR vs Coaches Closer

Na pagina `RobosCoach.tsx`, a aba "Coaches Tempo Real" sera dividida em duas abas:
- **Coaches SDR** — filtra `tipo = 'coaching'`, mostra accordions de Coach + Detectora (como hoje)
- **Coaches Closer** — filtra `tipo = 'coaching_closer'`, mostra accordions de Coach + Detectora + Radar

Isso torna a interface mais clara e evita confusao sobre qual robo e de qual papel.

### 3. Accordion "Instrucoes da IA Radar" apenas no formulario de Closer

No dialog de criacao/edicao, o accordion "Instrucoes da IA Radar" so aparece quando `form.tipo === 'coaching_closer'`.

### 4. Atualizar filtros e selects do funil

No `CrmFunilKanban.tsx`, o select de "Coach Tempo Real Closer" filtrara por `tipo === 'coaching_closer'` e o de SDR por `tipo === 'coaching'`. Isso evita que o admin associe um robo SDR ao closer por engano.

## Detalhes tecnicos

### Arquivos modificados

1. **Migracao SQL** — `ALTER TABLE robos_coach ADD COLUMN instrucoes_radar text;`
2. **`src/hooks/useRobosCoach.ts`** — Adicionar `instrucoes_radar` na interface `RoboCoach` e nos mutations de create/update
3. **`src/pages/RobosCoach.tsx`**:
   - Nova aba "Coaches Closer" no `TabsList`
   - Filtro: `coachingSdrRobos = robos.filter(r => r.tipo === 'coaching')` e `coachingCloserRobos = robos.filter(r => r.tipo === 'coaching_closer')`
   - No dialog, exibir accordion Radar apenas quando `form.tipo === 'coaching_closer'`
   - Funcao `openNew("coaching_closer")` para criar robos closer
4. **`src/pages/CrmFunilKanban.tsx`** — Filtrar selects de coach por tipo correto

### Layout das abas (resultado final)

```text
[ Coaches SDR | Coaches Closer | Coaches Feedback | Scripts SDR | Scripts Closers ]
```

### Formulario do Closer (accordions)

```text
[v] Instrucoes da IA Coach *
[v] Instrucoes da IA Detectora
[v] Instrucoes da IA Radar        <-- so aparece para coaching_closer
```

### Formulario do SDR (accordions)

```text
[v] Instrucoes da IA Coach *
[v] Instrucoes da IA Detectora
```

Nenhuma alteracao nas edge functions neste momento — apenas a estrutura de dados e UI para configurar o prompt do Radar. A edge function `coaching-radar` sera criada na etapa seguinte da implementacao.
