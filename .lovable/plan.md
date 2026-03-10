

## Bug: Telefones sumiram da aba Dados

### Causa raiz
Linha 55 do `LeadDadosTab.tsx`:
```
.filter((g) => g.campos.length > 0)
```
Após filtrar campos `telefone_*` (linha 50), a seção "Dados de Contato" fica com 0 campos e é removida do array `porSecao`. Porém, `contatoSecaoId` continua definido (linha 61), então `hasContatoSection = true` e o fallback no final também não renderiza. Resultado: telefones não aparecem em lugar nenhum.

### Correção
Alterar o filtro na linha 55 para **manter** a seção "contato" mesmo que tenha 0 campos não-telefone, pois os telefones serão injetados nela:

```typescript
.filter((g) => g.campos.length > 0 || g.secao.id === contatoSecaoId)
```

Problema: `contatoSecaoId` é calculado depois de `groupedCampos`. Solução: mover o cálculo de `contatoSecaoId` para antes do `groupedCampos`, ou calcular inline.

### Alterações em `src/components/crm/LeadDadosTab.tsx`
1. Mover o `useMemo` de `contatoSecaoId` (linhas 59-63) para **antes** do `useMemo` de `groupedCampos` (linha 48)
2. Incluir `contatoSecaoId` como dependência do `groupedCampos`
3. Alterar o filtro para: `.filter((g) => g.campos.length > 0 || g.secao.id === contatoSecaoId)`

