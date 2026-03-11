

## Plano: Campo "Variável" editável + Persistência do mapeamento

O Claude está correto — e a sugestão de salvar o mapeamento é valiosa e não difícil de implementar. Proponho fazer ambos agora.

### Parte 1: Campo "Variável" editável (correção imediata)

**Arquivo:** `src/components/crm/ZapSignDialog.tsx`

- Adicionar estado `fieldPlaceholders` (Record<string, string>) inicializado com `campo.nome`
- No Step 2, cada campo mostra dois inputs: **Variável** (editável) e **Valor**
- No `handleSend`, usar `fieldPlaceholders[key]` como chave do `field_data` em vez de `campo.key`
- Remover injeção de `__email__`/`__telefone__` e grupo "Contato (Signatário)"

### Parte 2: Persistir mapeamento por template

**Migração:** criar tabela `zapsign_template_mappings`
```
id, template_id (text), campo_key (text), variavel_zapsign (text), user_id (uuid), created_at
unique(template_id, campo_key)
```

**Lógica no `ZapSignDialog.tsx`:**
- Ao carregar Step 2, buscar mapeamentos salvos para o template selecionado
- Se existir mapeamento para um `campo.key`, pré-preencher o input "Variável" com o valor salvo (em vez de `campo.nome`)
- Ao enviar com sucesso, fazer upsert dos mapeamentos editados

Resultado: na primeira vez o usuário ajusta manualmente. A partir da segunda vez, os nomes das variáveis já vêm corretos.

### Arquivos alterados
- `src/components/crm/ZapSignDialog.tsx` — UI + lógica de persistência
- Migração SQL — nova tabela `zapsign_template_mappings`

