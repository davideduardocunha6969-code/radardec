

## Editar nome das colunas do Kanban

### Alterações

**1. `src/hooks/useAtividadesMarketing.ts`**
- Adicionar mutation `updateColuna` que faz `supabase.from("atividades_colunas").update({ nome }).eq("id", id)`

**2. `src/components/atividades/KanbanBoard.tsx`**
- Adicionar prop `onRenameColuna: (id: string, nome: string) => void`
- No header da coluna, ao fazer duplo-clique no nome (ou via item "Renomear" no dropdown menu existente), trocar o `<h3>` por um `<Input>` inline para edição
- Ao pressionar Enter ou perder foco (onBlur), salvar o novo nome via `onRenameColuna`
- Adicionar item "Renomear Coluna" com ícone `Pencil` no `DropdownMenu` já existente (acima de "Excluir Coluna")

**3. `src/pages/AtividadesMarketing.tsx`** (ou onde o KanbanBoard é montado)
- Passar a nova prop `onRenameColuna` chamando `updateColuna.mutate()`

