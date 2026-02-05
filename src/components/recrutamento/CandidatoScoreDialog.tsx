 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Separator } from "@/components/ui/separator";
 import { CandidatoVaga } from "@/hooks/useRecrutamento";
 import { User, TrendingUp, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 function getScoreColor(score: number): string {
   if (score >= 80) return "text-green-600";
   if (score >= 60) return "text-yellow-600";
   return "text-red-600";
 }
 
 function getScoreBg(score: number): string {
   if (score >= 80) return "bg-green-500";
   if (score >= 60) return "bg-yellow-500";
   return "bg-red-500";
 }
 
 interface CandidatoScoreDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   candidatoVaga: CandidatoVaga | null;
 }
 
 export function CandidatoScoreDialog({ open, onOpenChange, candidatoVaga }: CandidatoScoreDialogProps) {
   if (!candidatoVaga) return null;
 
   const candidato = candidatoVaga.candidato;
   const scoreDetalhado = candidatoVaga.score_detalhado as Record<string, number> | undefined;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
               <User className="h-6 w-6" />
             </div>
             <div>
               <span className="text-xl">{candidato?.nome}</span>
               <p className="text-sm font-normal text-muted-foreground">{candidato?.email}</p>
             </div>
           </DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="max-h-[65vh] pr-4">
           <div className="space-y-6">
             {/* Score Principal */}
             <div className="text-center">
               <div className={`text-6xl font-bold ${getScoreColor(candidatoVaga.score_total)}`}>
                 {candidatoVaga.score_total}%
               </div>
               <p className="mt-1 text-sm text-muted-foreground">Score de Compatibilidade</p>
               <Progress
                 value={candidatoVaga.score_total}
                 className="mt-3 h-3"
               />
             </div>
 
             <Separator />
 
             {/* Score Detalhado */}
             {scoreDetalhado && Object.keys(scoreDetalhado).length > 0 && (
               <div>
                 <h4 className="mb-3 flex items-center gap-2 font-medium">
                   <TrendingUp className="h-4 w-4" />
                   Detalhamento do Score
                 </h4>
                 <div className="space-y-3">
                   {Object.entries(scoreDetalhado).map(([key, value]) => (
                     <div key={key}>
                       <div className="flex items-center justify-between text-sm">
                         <span className="capitalize">{key.replace(/_/g, " ")}</span>
                         <span className={getScoreColor(value)}>{value}%</span>
                       </div>
                       <Progress value={value} className="h-2" />
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Explicação */}
             {candidatoVaga.explicacao_score && (
               <div>
                 <h4 className="mb-2 flex items-center gap-2 font-medium">
                   <FileText className="h-4 w-4" />
                   Análise da IA
                 </h4>
                 <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                   {candidatoVaga.explicacao_score}
                 </p>
               </div>
             )}
 
             {/* Skills Match */}
             {candidato?.skills_detectadas && candidato.skills_detectadas.length > 0 && (
               <div>
                 <h4 className="mb-2 font-medium">Skills Detectadas</h4>
                 <div className="flex flex-wrap gap-2">
                   {candidato.skills_detectadas.map((skill, i) => (
                     <Badge key={i} variant="secondary">
                       {skill}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Notas */}
             {candidatoVaga.notas && (
               <div>
                 <h4 className="mb-2 font-medium">Observações</h4>
                 <p className="text-sm text-muted-foreground">{candidatoVaga.notas}</p>
               </div>
             )}
           </div>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }