 import { useState, useCallback } from "react";
 import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
 import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
 import { useVagas, usePipelineVaga, useUpdateCandidatoVaga, CandidatoVaga, CandidatoStatus } from "@/hooks/useRecrutamento";
 import { PipelineColumn } from "@/components/recrutamento/PipelineColumn";
 import { PipelineCard } from "@/components/recrutamento/PipelineCard";
 import { KanbanIcon } from "lucide-react";
 
 const columns: { id: CandidatoStatus; title: string; color: string }[] = [
   { id: "triagem_ia", title: "Triagem IA", color: "bg-blue-500" },
   { id: "entrevista_rh", title: "Entrevista RH", color: "bg-purple-500" },
   { id: "entrevista_tecnica", title: "Entrevista Técnica", color: "bg-indigo-500" },
   { id: "proposta", title: "Proposta", color: "bg-orange-500" },
   { id: "contratado", title: "Contratado", color: "bg-green-500" },
   { id: "reprovado", title: "Reprovado", color: "bg-red-500" },
 ];
 
 export default function Pipeline() {
   const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null);
   const [activeId, setActiveId] = useState<string | null>(null);
 
   const { data: vagas = [], isLoading: loadingVagas } = useVagas();
   const { data: pipeline = {}, isLoading: loadingPipeline } = usePipelineVaga(selectedVagaId);
   const updateCandidatoVaga = useUpdateCandidatoVaga();
 
   const sensors = useSensors(
     useSensor(PointerSensor, {
       activationConstraint: {
         distance: 8,
       },
     })
   );
 
   const selectedVaga = vagas.find((v) => v.id === selectedVagaId);
 
   const findCandidatoVaga = (id: string): CandidatoVaga | undefined => {
     for (const col of columns) {
       const found = (pipeline[col.id] || []).find((c) => c.id === id);
       if (found) return found;
     }
     return undefined;
   };
 
   const handleDragStart = (event: DragStartEvent) => {
     setActiveId(event.active.id as string);
   };
 
   const handleDragEnd = (event: DragEndEvent) => {
     const { active, over } = event;
     setActiveId(null);
 
     if (!over) return;
 
     const activeItem = findCandidatoVaga(active.id as string);
     if (!activeItem) return;
 
     // Determine target column
     let targetColumn: CandidatoStatus | null = null;
 
     // Check if dropped on a column
     const column = columns.find((c) => c.id === over.id);
     if (column) {
       targetColumn = column.id;
     } else {
       // Dropped on another card - find its column
       const overItem = findCandidatoVaga(over.id as string);
       if (overItem) {
         targetColumn = overItem.status;
       }
     }
 
     if (targetColumn && targetColumn !== activeItem.status) {
       updateCandidatoVaga.mutate({
         id: activeItem.id,
         vagaId: selectedVagaId!,
         status: targetColumn,
       });
     }
   };
 
   const activeItem = activeId ? findCandidatoVaga(activeId) : null;
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold">Pipeline Seletivo</h1>
           <p className="text-muted-foreground">Acompanhe os candidatos em cada etapa do processo</p>
         </div>
       </div>
 
       {/* Vaga Selection */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg">Selecione uma Vaga</CardTitle>
         </CardHeader>
         <CardContent>
           <Select value={selectedVagaId || ""} onValueChange={setSelectedVagaId}>
             <SelectTrigger className="w-full max-w-md">
               <SelectValue placeholder="Selecione uma vaga..." />
             </SelectTrigger>
             <SelectContent>
               {loadingVagas ? (
                 <SelectItem value="loading" disabled>
                   Carregando vagas...
                 </SelectItem>
               ) : vagas.length === 0 ? (
                 <SelectItem value="empty" disabled>
                   Nenhuma vaga cadastrada
                 </SelectItem>
               ) : (
                 vagas.map((vaga) => (
                   <SelectItem key={vaga.id} value={vaga.id}>
                     <div className="flex items-center gap-2">
                       {vaga.titulo} - {vaga.setor}
                       <Badge variant={vaga.status === "aberta" ? "default" : "secondary"} className="text-xs">
                         {vaga.status}
                       </Badge>
                     </div>
                   </SelectItem>
                 ))
               )}
             </SelectContent>
           </Select>
         </CardContent>
       </Card>
 
       {/* Kanban Board */}
       {selectedVaga ? (
         <DndContext
           sensors={sensors}
           collisionDetection={closestCorners}
           onDragStart={handleDragStart}
           onDragEnd={handleDragEnd}
         >
           <ScrollArea className="w-full">
             <div className="flex gap-4 pb-4" style={{ minWidth: columns.length * 300 }}>
               {columns.map((column) => (
                 <PipelineColumn
                   key={column.id}
                   id={column.id}
                   title={column.title}
                   color={column.color}
                   count={(pipeline[column.id] || []).length}
                 >
                   <SortableContext
                     items={(pipeline[column.id] || []).map((c) => c.id)}
                     strategy={verticalListSortingStrategy}
                   >
                     {(pipeline[column.id] || []).map((candidatoVaga) => (
                       <PipelineCard
                         key={candidatoVaga.id}
                         candidatoVaga={candidatoVaga}
                         vagaId={selectedVagaId!}
                       />
                     ))}
                   </SortableContext>
                 </PipelineColumn>
               ))}
             </div>
             <ScrollBar orientation="horizontal" />
           </ScrollArea>
 
           <DragOverlay>
             {activeItem ? (
               <PipelineCard candidatoVaga={activeItem} vagaId={selectedVagaId!} isDragging />
             ) : null}
           </DragOverlay>
         </DndContext>
       ) : (
         <Card className="py-12 text-center">
           <KanbanIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-medium">Selecione uma vaga para ver o pipeline</h3>
           <p className="mt-2 text-muted-foreground">
             O quadro Kanban mostrará os candidatos em cada etapa do processo seletivo
           </p>
         </Card>
       )}
     </div>
   );
 }