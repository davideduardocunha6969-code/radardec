
# Remover duplicacao do campo Nome no card do lead

## Problema
O componente `LeadDadosTab` exibe o campo "Nome" duas vezes:
1. Um bloco hardcoded no topo (linhas 131-138 no modo edicao, linhas 163-175 no modo visualizacao)
2. O campo `__nome__` que aparece dentro da secao "Dados Pessoais" via sistema de secoes

## Solucao
Remover os blocos hardcoded de "Nome" e "Endereco" que ficam fora das secoes. O campo `__nome__` ja esta cadastrado no banco e atribuido a uma secao, entao ele sera renderizado automaticamente no lugar correto.

### Alteracoes no arquivo `src/components/crm/LeadDadosTab.tsx`

1. **Modo edicao**: Remover o bloco fixo de "Nome" e "Endereco" (linhas 129-139). Os campos `__nome__` e `endereco` ja existem como campos dinamicos e serao renderizados dentro de suas secoes.

2. **Modo visualizacao**: Remover o bloco fixo de "Nome sempre visivel" e "Endereco" (linhas 163-175). Esses campos aparecerao dentro da secao correspondente.

3. **Ajustar `renderFieldView` e `renderFieldEdit`**: Para campos com key `__nome__`, ler/escrever de `lead.nome` em vez de `dadosExtras`. Mesma logica para `__endereco__` usando `lead.endereco`.

4. **Ajustar `hasValue`**: Para `__nome__`, verificar `lead.nome` em vez de `dadosExtras`.

5. **Ajustar `startEditing`**: Ja popula `editValues.__nome__` corretamente, so precisa garantir que nao duplica.

6. **Ajustar `handleSave`**: Extrair `__nome__` e `__endereco__` dos campos dinamicos para salvar nas colunas nativas, e remover do `dados_extras`.

### Resultado
O nome aparecera apenas uma vez, dentro da secao onde foi configurado (ex: "Dados Pessoais").
