

# Adicionar indicador visual de transcrição parcial

## O que muda
No historico de contatos (`LeadContatosTab.tsx`), chamadas com status `interrompida` que possuem transcrição receberão um indicador visual diferenciado.

## Alterações

### 1. Badge "Parcial" no botão de transcrição (linha ~457-465)
Quando a chamada tem `status === "interrompida"` e possui transcrição, o botão de transcrição exibirá:
- Icone `FileText` em cor amarela/laranja (em vez do cinza padrão)
- Tooltip alterado para **"Transcrição Parcial (chamada interrompida)"**

### 2. Badge "Parcial" na coluna de Status
Quando o status for `interrompida` e houver transcrição, será adicionado um mini-badge "Parcial" ao lado do badge "Interrompida" existente, indicando que a transcrição foi recuperada mas pode estar incompleta.

### 3. Título do dialog de transcrição
No dialog que abre ao clicar no botão de transcrição (linha ~540+), se a chamada for `interrompida`, o título exibirá **"Transcrição (Parcial)"** com um aviso de que a gravação foi recuperada automaticamente.

## Arquivo afetado
- `src/components/crm/LeadContatosTab.tsx`

## Detalhes técnicos
- Nenhuma alteração de banco de dados necessária
- A lógica é puramente visual: `chamada.status === "interrompida" && hasTranscricao`
- O icone do botão de transcrição usará `text-yellow-600` para chamadas interrompidas com transcrição parcial
