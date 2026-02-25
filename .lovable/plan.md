

# Aba "Dados" com Campos Dinamicos e Mapeamento Inteligente de Importacao

## Visao Geral
Criar uma aba "Dados" como primeira aba do card do lead, contendo todos os dados pessoais. Substituir o sistema de importacao com colunas fixas (A=Nome, B=Empresa...) por um sistema de mapeamento inteligente onde o usuario escolhe para qual campo cada coluna da planilha sera importada, podendo inclusive criar novos campos durante a importacao.

## Arquitetura

### 1. Nova tabela: `crm_lead_campos`
Armazena a definicao dos campos customizaveis que aparecem na aba "Dados" de todos os leads.

```text
crm_lead_campos
- id (uuid, PK)
- nome (text) -- ex: "CPF", "Empresa", "Data Admissao"
- key (text, unique) -- ex: "cpf", "empresa", "data_admissao" (slug para uso no dados_extras)
- tipo (text) -- "texto", "data", "numero" (para exibicao futura)
- ordem (integer) -- para ordenar na aba
- obrigatorio (boolean, default false)
- created_at (timestamptz)
```

Campos iniciais pre-populados (baseados nos dados_extras ja existentes): nome, cpf, empresa, cargo, data_admissao, data_demissao, motivo_demissao, municipio, uf, endereco.

Os dados continuarao sendo salvos no campo JSONB `dados_extras` do `crm_leads`, usando a `key` como chave. O campo `nome` do lead permanece como coluna separada na tabela (nao entra no dados_extras).

### 2. Nova aba "Dados" no card do lead

Sera a **primeira aba** do card, antes de "Atendimento SDR":
- Tabs: **Dados** | Atendimento SDR | Atendimento Closer | Agenda Closers

Conteudo:
- Grid exibindo todos os campos definidos em `crm_lead_campos`, mostrando o valor correspondente do `dados_extras` do lead
- Botao "Editar" para alterar os valores de cada campo
- Campos sem valor aparecem vazios mas visiveis (com placeholder "Nao informado")

### 3. Sistema de mapeamento na importacao

Ao carregar uma planilha, em vez de usar posicoes fixas:

1. Sistema le os headers da planilha (primeira linha)
2. Exibe uma tela de mapeamento: para cada coluna da planilha, um select permite escolher o campo de destino (dos campos cadastrados em `crm_lead_campos` + "Nome" + "Telefone" + "Ignorar")
3. Se uma coluna da planilha nao tem campo correspondente, o usuario pode clicar em "Criar campo" ali mesmo, informando o nome do novo campo
4. O novo campo e salvo em `crm_lead_campos` e fica disponivel para todos os leads
5. Colunas marcadas como "Ignorar" nao sao importadas
6. Sugestao automatica: o sistema tenta correlacionar headers da planilha com nomes dos campos existentes (match por similaridade simples - ex: "CPF" -> campo "cpf", "Municipio" -> campo "municipio")

### 4. Hook `useCrmLeadCampos`

Novo hook para CRUD dos campos:
- `useCrmLeadCampos()` - lista todos os campos ordenados
- `useCreateCrmLeadCampo()` - cria novo campo
- `useUpdateCrmLeadCampo()` - atualiza campo
- `useDeleteCrmLeadCampo()` - exclui campo

### 5. Fluxo de importacao revisado

```text
1. Usuario clica "Importar"
2. Seleciona arquivo Excel/CSV
3. Sistema le headers e linhas
4. Exibe tela de mapeamento:
   [Coluna "NOME"]        -> [Select: Nome do Lead v]
   [Coluna "EMPRESA"]     -> [Select: Empresa v]
   [Coluna "TEL1"]        -> [Select: Telefone v]
   [Coluna "BAIRRO"]      -> [Select: (nenhum) v] [+ Criar campo]
   [Coluna "OBS"]         -> [Select: Ignorar v]
5. Usuario confirma mapeamento
6. Preview dos leads parseados
7. Importa
```

## Arquivos a criar/modificar

1. **Migracao SQL** - Criar tabela `crm_lead_campos` com campos iniciais pre-populados
2. **`src/hooks/useCrmLeadCampos.ts`** (novo) - Hook para gerenciar campos
3. **`src/pages/CrmFunilKanban.tsx`** (modificar):
   - Adicionar aba "Dados" como primeira aba
   - Substituir dialog de importacao por fluxo com mapeamento
   - Renderizar campos dinamicos na aba Dados
4. **`src/hooks/useCrmOutbound.ts`** (modificar) - Ajustar `useBulkCreateLeads` para receber dados_extras dinamicos

## Detalhes tecnicos

### Migracao SQL
```sql
CREATE TABLE public.crm_lead_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  key text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'texto',
  ordem integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_lead_campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campos"
  ON public.crm_lead_campos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage campos"
  ON public.crm_lead_campos FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Campos iniciais
INSERT INTO public.crm_lead_campos (nome, key, tipo, ordem) VALUES
  ('CPF', 'cpf', 'texto', 1),
  ('Empresa', 'empresa', 'texto', 2),
  ('Cargo', 'cargo', 'texto', 3),
  ('Data Admissao', 'data_admissao', 'data', 4),
  ('Data Demissao', 'data_demissao', 'data', 5),
  ('Motivo Demissao', 'motivo_demissao', 'texto', 6),
  ('Municipio', 'municipio', 'texto', 7),
  ('UF', 'uf', 'texto', 8),
  ('Endereco', 'endereco', 'texto', 9);
```

### Logica de auto-sugestao no mapeamento
Normaliza o header da planilha (lowercase, sem acentos, sem espacos) e compara com as keys dos campos. Se match >= 80% de similaridade, pre-seleciona automaticamente.

### Aba "Dados" - Exibicao
Renderiza dinamicamente todos os campos de `crm_lead_campos`, buscando o valor em `detailLead.dados_extras[campo.key]`. No modo edicao, exibe inputs para cada campo.
