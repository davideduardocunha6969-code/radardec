

## Diferenciação por setor nos cards de estatísticas

### Alteração

**`src/components/plano-comercial/PlanoStatsCards.tsx`**

Substituir a função `groupByCargo` por `groupBySetorCargo` que retorna `Record<string, Record<string, number>>` — primeiro nível é o setor (`n.setor || 'Sem setor'`), segundo nível é o cargo (`n.label`).

No breakdown expandido, renderizar os cargos agrupados sob headers de setor:

```text
── Previdenciário
   Closer           2
   SDR              1
── Trabalhista
   Closer           1
```

Cada setor aparece como um label em negrito/semibold com os cargos indentados abaixo. Mantém ordenação por contagem dentro de cada setor.

Único arquivo alterado: `PlanoStatsCards.tsx`.

