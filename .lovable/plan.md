

# Fase 3 — Campo de Prompt da IA Extratora no Script Closer

## O que sera feito

Adicionar um campo de texto (textarea) no dialog de edicao do Script Closer para configurar o prompt da IA Extratora. O campo sera salvo numa nova coluna `instrucoes_extrator` na tabela `scripts_sdr`.

## Alteracoes

### 1. Migracao de banco — nova coluna

Adicionar coluna `instrucoes_extrator` (text, nullable, default vazio) na tabela `scripts_sdr`:

```sql
ALTER TABLE public.scripts_sdr
ADD COLUMN instrucoes_extrator text DEFAULT '';
```

### 2. Hook `useScriptsCloser.ts`

- Incluir `instrucoes_extrator` no tipo `ScriptCloser` (campo `string`)
- Incluir `instrucoes_extrator` nos payloads de create e update

### 3. Componente `ScriptsCloserTab.tsx`

- Adicionar `instrucoes_extrator: ""` ao estado do form
- No dialog de edicao, apos a secao de Fechamento e antes do DialogFooter, inserir um novo bloco com:
  - Separator
  - Label "Prompt da IA Extratora" com icone FileSearch
  - Descricao curta explicando o proposito
  - Textarea com altura minima generosa (min-h-[200px]) para colar prompts longos
- Preencher o campo ao abrir para edicao (`openEdit`)
- Incluir no payload do `handleSave`

### 4. Card do script (listagem)

- Adicionar badge indicando se o prompt extrator esta configurado (ex: "Extrator IA" com icone)

## Resultado

Ao abrir o card do script "Closer - Motorista de Caminhao" e clicar em Editar, havera um campo de texto para colar o prompt da IA Extratora. O prompt sera persistido na coluna `instrucoes_extrator` do banco e ficara disponivel para uso pela Edge Function de extracao.

