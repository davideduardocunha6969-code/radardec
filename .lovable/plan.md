
# Reorganizar campos da aba Dados do Lead

## Situacao atual
Existem 8 campos configurados: CPF, Empresa, Cargo, Data Admissao, Data Demissao, Motivo Demissao, Municipio, UF.

## O que sera feito

### 1. Excluir campos desnecessarios
Remover da tabela `crm_lead_campos`:
- Empresa
- Cargo
- Data Admissao
- Data Demissao
- Motivo Demissao

### 2. Criar novos campos
Adicionar na tabela `crm_lead_campos`:
- Telefone 1 (key: `telefone_1`, ordem: 2)
- Telefone 2 (key: `telefone_2`, ordem: 3)
- Telefone 3 (key: `telefone_3`, ordem: 4)
- Telefone 4 (key: `telefone_4`, ordem: 5)
- UF (ja existe, reordenar para ordem 6)
- Municipio (ja existe, reordenar para ordem 7)
- Endereco (key: `endereco`, ordem: 8)
- N (key: `numero`, ordem: 9)
- Bairro (key: `bairro`, ordem: 10)
- CEP (key: `cep`, ordem: 11)

### 3. Reordenar campos existentes
- CPF: ordem 1
- UF: ordem 6
- Municipio: ordem 7

### Resultado final (ordem)
1. CPF
2. Telefone 1
3. Telefone 2
4. Telefone 3
5. Telefone 4
6. UF
7. Municipio
8. Endereco
9. N
10. Bairro
11. CEP

O campo "Nome" ja e nativo do lead (coluna `nome` na tabela `crm_leads`), nao precisa ser criado como campo extra.

### Execucao
Tudo via queries SQL diretas no banco -- sem alteracao de codigo.
