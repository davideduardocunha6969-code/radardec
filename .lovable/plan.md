

# Campo de Prompt da IA Analisadora de Lacunas no Script Closer

## Alteracoes

### 1. Migracao de banco

Adicionar coluna `instrucoes_lacunas` (text, nullable, default vazio) na tabela `scripts_sdr`:

```sql
ALTER TABLE public.scripts_sdr ADD COLUMN IF NOT EXISTS instrucoes_lacunas text DEFAULT '';
```

### 2. Hook `useScriptsCloser.ts`

- Adicionar `instrucoes_lacunas: string` ao tipo `ScriptCloser`
- Incluir no mapeamento da query (fallback para string vazia)
- Incluir nos payloads de create e update

### 3. Componente `ScriptsCloserTab.tsx`

- Adicionar `instrucoes_lacunas: ""` ao estado do form
- Preencher ao abrir para edicao (`openEdit`)
- Incluir no payload do `handleSave`
- No dialog, logo apos o bloco do Extrator e antes do DialogFooter, adicionar:
  - Separator
  - Label "Prompt da IA Analisadora de Lacunas" com icone HelpCircle (roxo)
  - Descricao curta do proposito
  - Textarea min-h-[200px] font-mono
- No card da listagem, adicionar badge "Lacunas IA" quando o campo estiver preenchido

