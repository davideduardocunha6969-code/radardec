

## Plano: Drag-and-drop para reordenar itens do script

### O que muda
Adicionar arrastar e soltar nos itens de cada seção do editor de scripts (Apresentação, Qualificação, etc.) nas abas Scripts SDR e Scripts Closer. O ícone de grip (⠿) que já existe visualmente passará a funcionar de fato.

### Implementação

**Arquivo:** `src/components/robos/ScriptItemEditor.tsx`

1. Importar `DndContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`, `useSensor`, `useSensors` de `@dnd-kit/core` e `SortableContext`, `verticalListSortingStrategy`, `useSortable`, `arrayMove` de `@dnd-kit/sortable`.
2. Criar um componente `SortableItem` que envolve cada item do script, usando `useSortable` para fornecer o handle de arraste no ícone `GripVertical` já existente.
3. Envolver a lista de itens com `DndContext` + `SortableContext`, usando `arrayMove` no `onDragEnd` para reordenar e chamar `onChange` com o novo array.
4. O cursor do grip muda para `cursor-grab` / `cursor-grabbing`.

Pacotes `@dnd-kit/core` e `@dnd-kit/sortable` já estão instalados no projeto.

