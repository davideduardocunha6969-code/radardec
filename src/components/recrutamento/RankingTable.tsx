 import { useState } from "react";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Card } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { CandidatoVaga, CandidatoStatus, useUpdateCandidatoVaga } from "@/hooks/useRecrutamento";
 import { User, TrendingUp, Briefcase, GraduationCap, Eye, RefreshCw } from "lucide-react";
 import { CandidatoScoreDialog } from "./CandidatoScoreDialog";
 
 const statusLabels: Record<CandidatoStatus, string> = {
   triagem_ia: "Triagem IA",
   entrevista_rh: "Entrevista RH",
   entrevista_tecnica: "Entrevista Técnica",
   proposta: "Proposta",
   contratado: "Contratado",
   reprovado: "Reprovado",
   banco_talentos: "Banco Talentos",
  agendar_entrevista: "Agendar Entrevista",
  entrevista_agendada: "Entrevista Agendada",
  entrevista_coordenador: "Entrevista Coordenador",
  proposta_enviada: "Proposta Enviada",
  proposta_recusada: "Proposta Recusada",
 };
 
 const statusColors: Record<CandidatoStatus, string> = {
   triagem_ia: "bg-blue-500/20 text-blue-700",
   entrevista_rh: "bg-purple-500/20 text-purple-700",
   entrevista_tecnica: "bg-indigo-500/20 text-indigo-700",
   proposta: "bg-orange-500/20 text-orange-700",
   contratado: "bg-green-500/20 text-green-700",
   reprovado: "bg-red-500/20 text-red-700",
   banco_talentos: "bg-muted text-muted-foreground",
  agendar_entrevista: "bg-blue-500/20 text-blue-700",
  entrevista_agendada: "bg-cyan-500/20 text-cyan-700",
  entrevista_coordenador: "bg-purple-500/20 text-purple-700",
  proposta_enviada: "bg-orange-500/20 text-orange-700",
  proposta_recusada: "bg-gray-500/20 text-gray-700",
 };
 
 function getScoreColor(score: number): string {
   if (score >= 80) return "text-green-600 bg-green-500/20";
   if (score >= 60) return "text-yellow-600 bg-yellow-500/20";
   return "text-red-600 bg-red-500/20";
 }
 
 interface RankingTableProps {
   candidatosVaga: CandidatoVaga[];
   isLoading: boolean;
   vagaId: string;
 }
 
 export function RankingTable({ candidatosVaga, isLoading, vagaId }: RankingTableProps) {
   const [selectedCandidato, setSelectedCandidato] = useState<CandidatoVaga | null>(null);
   const updateCandidatoVaga = useUpdateCandidatoVaga();
 
   const handleStatusChange = (id: string, newStatus: CandidatoStatus) => {
     updateCandidatoVaga.mutate({ id, vagaId, status: newStatus });
   };
 
   if (isLoading) {
     return (
       <Card className="p-8 text-center">
         <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
         <p className="mt-2 text-muted-foreground">Carregando candidatos...</p>
       </Card>
     );
   }
 
   if (candidatosVaga.length === 0) {
     return (
       <Card className="py-12 text-center">
         <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
         <h3 className="mt-4 text-lg font-medium">Nenhum candidato analisado</h3>
         <p className="mt-2 text-muted-foreground">
           Faça upload de currículos para iniciar a triagem automática
         </p>
       </Card>
     );
   }
 
   return (
     <>
       <Card>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead className="w-8">#</TableHead>
               <TableHead>Candidato</TableHead>
               <TableHead className="text-center">Score</TableHead>
               <TableHead>Experiência</TableHead>
               <TableHead>Último Cargo</TableHead>
               <TableHead>Formação</TableHead>
               <TableHead>Skills</TableHead>
               <TableHead>Status</TableHead>
               <TableHead className="w-10"></TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {candidatosVaga.map((cv, index) => (
               <TableRow key={cv.id} className="hover:bg-muted/50">
                 <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                 <TableCell>
                   <div className="flex items-center gap-3">
                     <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                       <User className="h-4 w-4" />
                     </div>
                     <div>
                       <p className="font-medium">{cv.candidato?.nome || "Candidato"}</p>
                       <p className="text-xs text-muted-foreground">{cv.candidato?.email}</p>
                     </div>
                   </div>
                 </TableCell>
                 <TableCell>
                   <Badge className={`text-lg font-bold ${getScoreColor(cv.score_total)}`}>
                     {cv.score_total}%
                   </Badge>
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-1">
                     <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                     {cv.candidato?.experiencia_total_anos || 0} anos
                   </div>
                 </TableCell>
                 <TableCell className="max-w-[150px] truncate">
                   {cv.candidato?.ultimo_cargo || "-"}
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-1 text-sm">
                     <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                     {cv.candidato?.formacao || "-"}
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="flex flex-wrap gap-1">
                     {(cv.candidato?.skills_detectadas || []).slice(0, 2).map((skill, i) => (
                       <Badge key={i} variant="outline" className="text-xs">
                         {skill}
                       </Badge>
                     ))}
                     {(cv.candidato?.skills_detectadas || []).length > 2 && (
                       <Badge variant="outline" className="text-xs">
                         +{(cv.candidato?.skills_detectadas || []).length - 2}
                       </Badge>
                     )}
                   </div>
                 </TableCell>
                 <TableCell>
                   <Select
                     value={cv.status}
                     onValueChange={(v) => handleStatusChange(cv.id, v as CandidatoStatus)}
                   >
                     <SelectTrigger className={`h-8 w-[140px] text-xs ${statusColors[cv.status]}`}>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {Object.entries(statusLabels).map(([key, label]) => (
                         <SelectItem key={key} value={key}>
                           {label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </TableCell>
                 <TableCell>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8"
                     onClick={() => setSelectedCandidato(cv)}
                   >
                     <Eye className="h-4 w-4" />
                   </Button>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </Card>
 
       <CandidatoScoreDialog
         open={!!selectedCandidato}
         onOpenChange={(open) => !open && setSelectedCandidato(null)}
         candidatoVaga={selectedCandidato}
       />
     </>
   );
 }