 import { useDroppable } from "@dnd-kit/core";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { CandidatoStatus } from "@/hooks/useRecrutamento";
 
 interface PipelineColumnProps {
   id: CandidatoStatus;
   title: string;
   color: string;
   count: number;
   children: React.ReactNode;
 }
 
 export function PipelineColumn({ id, title, color, count, children }: PipelineColumnProps) {
   const { setNodeRef, isOver } = useDroppable({ id });
 
   return (
     <Card
       ref={setNodeRef}
       className={`min-h-[500px] w-[280px] shrink-0 transition-colors ${
         isOver ? "ring-2 ring-primary" : ""
       }`}
     >
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className={`h-3 w-3 rounded-full ${color}`} />
             <CardTitle className="text-sm font-medium">{title}</CardTitle>
           </div>
           <Badge variant="secondary" className="text-xs">
             {count}
           </Badge>
         </div>
       </CardHeader>
       <CardContent className="space-y-2 px-2">{children}</CardContent>
     </Card>
   );
 }