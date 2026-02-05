 import { useSortable } from "@dnd-kit/sortable";
 import { CSS } from "@dnd-kit/utilities";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { CandidatoVaga } from "@/hooks/useRecrutamento";
 import { User, GripVertical } from "lucide-react";
 
 function getScoreColor(score: number): string {
   if (score >= 80) return "bg-green-500/20 text-green-700";
   if (score >= 60) return "bg-yellow-500/20 text-yellow-700";
   return "bg-red-500/20 text-red-700";
 }
 
 interface PipelineCardProps {
   candidatoVaga: CandidatoVaga;
   vagaId: string;
   isDragging?: boolean;
 }
 
 export function PipelineCard({ candidatoVaga, vagaId, isDragging }: PipelineCardProps) {
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging: isSortableDragging,
   } = useSortable({ id: candidatoVaga.id });
 
   const style = {
     transform: CSS.Transform.toString(transform),
     transition,
   };
 
   const candidato = candidatoVaga.candidato;
 
   return (
     <Card
       ref={setNodeRef}
       style={style}
       className={`cursor-grab transition-shadow ${
         isDragging || isSortableDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"
       }`}
       {...attributes}
       {...listeners}
     >
       <CardContent className="p-3">
         <div className="flex items-start gap-2">
           <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
           <div className="min-w-0 flex-1">
             <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2 truncate">
                 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                   <User className="h-3.5 w-3.5" />
                 </div>
                 <span className="truncate text-sm font-medium">{candidato?.nome || "Candidato"}</span>
               </div>
               <Badge className={`shrink-0 text-xs ${getScoreColor(candidatoVaga.score_total)}`}>
                 {candidatoVaga.score_total}%
               </Badge>
             </div>
             <div className="mt-1 text-xs text-muted-foreground">
               {candidato?.ultimo_cargo || candidato?.formacao || candidato?.email}
             </div>
             {candidato?.skills_detectadas && candidato.skills_detectadas.length > 0 && (
               <div className="mt-2 flex flex-wrap gap-1">
                 {candidato.skills_detectadas.slice(0, 2).map((skill, i) => (
                   <Badge key={i} variant="outline" className="text-[10px]">
                     {skill}
                   </Badge>
                 ))}
               </div>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }