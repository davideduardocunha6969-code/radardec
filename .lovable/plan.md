

# Fase 5 — Fix: Edge Functions buscando prompts na tabela errada + Lacunas sempre vazias

## Causa Raiz (confirmada com imagem do usuario)

Os prompts `instrucoes_extrator` e `instrucoes_lacunas` estao salvos na tabela **`scripts_sdr`** (tipo `closer`, card "Atendimento Closer - Motorista de Caminhao"). Porem:

1. **Edge functions** (`extract-lead-data` e `analyze-gaps`) buscam esses campos na tabela `robos_coach` via `coachId` -- onde estao **vazios**. Resultado: retorna 404 e nada funciona.
2. **`estimarImpactoCampo()`** retorna 0 para TODOS os campos quando `data_admissao` nao esta preenchida (linha 1340: `if (!params) return 0`). Como o extrator nunca funciona, nenhum dado e preenchido, e o painel de lacunas mostra "todos preenchidos" -- quando na verdade nenhum esta.

## Correcoes (4 arquivos + 2 edge functions)

### 1. Edge Function `extract-lead-data/index.ts`

- Aceitar `scriptId` no body (alem de `coachId`)
- Se `scriptId` presente: buscar `instrucoes_extrator` de `scripts_sdr` pelo id
- Se apenas `coachId`: fallback em `robos_coach` (compatibilidade SDR)

Trecho afetado: linhas 14-36 (parsing do body + busca do prompt)

### 2. Edge Function `analyze-gaps/index.ts`

- Mesma logica: aceitar `scriptId`, buscar `instrucoes_lacunas` de `scripts_sdr`
- Fallback em `robos_coach` se apenas `coachId`

Trecho afetado: linhas 14-36

### 3. `src/pages/Atendimento.tsx`

- Passar `scriptId={script?.id}` como prop ao `DataExtractorPanel` e `GapsPanel`
- Linhas 369-377 (DataExtractorPanel) e 380-385 (GapsPanel)

### 4. `src/components/crm/extrator/DataExtractorPanel.tsx`

- Adicionar prop `scriptId?: string` na interface (linha 13)
- Enviar `scriptId` no body da chamada `invoke("extract-lead-data")` (linha 61)

### 5. `src/components/crm/lacunas/GapsPanel.tsx`

- Adicionar prop `scriptId?: string` na interface (linha 14)
- Enviar `scriptId` no body da chamada `invoke("analyze-gaps")` (linha 75)

### 6. `src/utils/trabalhista/calculator.ts` (linha 1339-1340)

Quando `calcularParametrosBase` retorna `null` (porque `data_admissao` esta vazia), usar valores default razoaveis em vez de retornar 0:

```text
Antes:
  const params = calcularParametrosBase(dadosAtuais);
  if (!params) return 0;

Depois:
  const params = calcularParametrosBase(dadosAtuais);
  if (!params) {
    // Sem data_admissao, usar defaults para que lacunas criticas aparecam
    const salFallback = getNum(dadosAtuais, 'salario_ctps_mensal') || 2000;
    const mesesFallback = 24;
    // Retornar impactos fixos baseados no campo
    const impactosDefault: Record<string, number> = {
      data_admissao: salFallback * mesesFallback * 0.3,
      salario_ctps_mensal: 2000 * 24 * 0.5,
      ... (mesma tabela de impactos, com salFallback e mesesFallback)
    };
    return Math.round((impactosDefault[campo] || 500) * 100) / 100;
  }
```

Isso garante que campos criticos como `data_admissao` e `salario_ctps_mensal` aparecam com impacto alto no painel de lacunas **mesmo antes de qualquer dado ser preenchido**.

## Resumo

| Arquivo | Acao |
|---|---|
| `supabase/functions/extract-lead-data/index.ts` | Aceitar `scriptId`, buscar prompt de `scripts_sdr` |
| `supabase/functions/analyze-gaps/index.ts` | Aceitar `scriptId`, buscar prompt de `scripts_sdr` |
| `src/pages/Atendimento.tsx` | Passar `scriptId={script?.id}` aos paineis |
| `src/components/crm/extrator/DataExtractorPanel.tsx` | Adicionar prop `scriptId`, enviar na chamada |
| `src/components/crm/lacunas/GapsPanel.tsx` | Adicionar prop `scriptId`, enviar na chamada |
| `src/utils/trabalhista/calculator.ts` | Fallback com valores default quando `calcularParametrosBase` retorna null |

Nenhuma migracao de banco. Deploy automatico das edge functions.

