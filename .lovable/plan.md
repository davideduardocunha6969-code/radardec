
# Unificar aba "Dados" + "Contatos SDR" em "Atendimento SDR"

## Resumo
Renomear a aba "Dados" para "Atendimento SDR", remover a aba "Contatos SDR" separada, e trazer todo o conteudo do componente `LeadContatosTab` para dentro da aba unificada, posicionado apos as informacoes ja existentes (dados do lead, telefones, resumo do caso, mover coluna).

## Alteracoes

### 1. `src/pages/CrmFunilKanban.tsx`

- **Renomear tab**: Trocar `<TabsTrigger value="dados">Dados</TabsTrigger>` para `<TabsTrigger value="dados">Atendimento SDR</TabsTrigger>`
- **Remover tab "contatos"**: Excluir o `<TabsTrigger value="contatos">` e seu `<TabsContent value="contatos">` correspondente
- **Embutir `LeadContatosTab` na aba "dados"**: Adicionar o componente `<LeadContatosTab leadId={detailLead.id} />` ao final do `<TabsContent value="dados">`, depois da secao de "Mover para coluna / Excluir Lead" (apos a linha ~691)
- Adicionar um `<Separator />` visual antes do componente para separar as secoes

### 2. Nenhuma alteracao no `LeadContatosTab.tsx`
O componente continua funcionando de forma independente, apenas sera renderizado dentro da aba unificada em vez de uma aba separada.

## Resultado visual

A aba "Atendimento SDR" tera:
1. Dados extras do lead (empresa, cargo, CPF, etc.)
2. Endereco
3. Telefones (com botoes de ligar/WhatsApp e edicao)
4. Resumo do Caso (IA)
5. Mover coluna / Excluir Lead
6. --- Separador ---
7. Resumo IA dos Contatos (do LeadContatosTab)
8. Tabela de chamadas realizadas (do LeadContatosTab)
