 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Separator } from "@/components/ui/separator";
 import { Vaga, useCandidatosVaga, CandidatoVaga } from "@/hooks/useRecrutamento";
 import { MapPin, Clock, DollarSign, GraduationCap, Briefcase, Users, Edit, Target, Trophy, User, RefreshCw, Eye } from "lucide-react";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { useState } from "react";
 import { CandidatoScoreDialog } from "./CandidatoScoreDialog";
 
 const statusLabels = {
   aberta: "Aberta",
   em_analise: "Em Análise",
   encerrada: "Encerrada",
 };
 
 const statusColors = {
   aberta: "bg-green-500/20 text-green-700 border-green-500/30",
   em_analise: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
   encerrada: "bg-muted text-muted-foreground",
 };
 
 const tipoLabels = { clt: "CLT", pj: "PJ", estagio: "Estágio" };
 const modalidadeLabels = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
 const senioridadeLabels = { junior: "Júnior", pleno: "Pleno", senior: "Sênior" };
 
 interface VagaDetailDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   vaga: Vaga | null;
   onEdit: () => void;
 }
 
 function getScoreColor(score: number): string {
   if (score >= 80) return "text-green-600 bg-green-500/20";
   if (score >= 60) return "text-yellow-600 bg-yellow-500/20";
   return "text-red-600 bg-red-500/20";
 }
 
 export function VagaDetailDialog({ open, onOpenChange, vaga, onEdit }: VagaDetailDialogProps) {
   const [selectedCandidato, setSelectedCandidato] = useState<CandidatoVaga | null>(null);
   const { data: candidatosVaga = [], isLoading: isLoadingCandidatos } = useCandidatosVaga(vaga?.id || null);
 
   if (!vaga) return null;
 
   return (
     <>
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-4xl max-h-[90vh]">
         <DialogHeader>
           <div className="flex items-start justify-between">
             <div>
               <DialogTitle className="text-xl">{vaga.titulo}</DialogTitle>
               <p className="text-muted-foreground">{vaga.setor}</p>
             </div>
             <Button variant="outline" size="sm" onClick={onEdit}>
               <Edit className="mr-2 h-4 w-4" />
               Editar
             </Button>
           </div>
         </DialogHeader>
 
           <Tabs defaultValue="ranking" className="w-full">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="ranking" className="flex items-center gap-2">
                 <Trophy className="h-4 w-4" />
                 Ranking ({candidatosVaga.length})
               </TabsTrigger>
               <TabsTrigger value="detalhes">Detalhes da Vaga</TabsTrigger>
             </TabsList>
 
             {/* Ranking Tab */}
             <TabsContent value="ranking" className="mt-4">
               <ScrollArea className="h-[55vh]">
                 {isLoadingCandidatos ? (
                   <div className="flex items-center justify-center py-12">
                     <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                   </div>
                 ) : candidatosVaga.length === 0 ? (
                   <div className="py-12 text-center">
                     <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                     <h3 className="mt-4 text-lg font-medium">Nenhum candidato analisado</h3>
                     <p className="mt-2 text-sm text-muted-foreground">
                       Adicione currículos no Banco de Talentos para ver o ranking
                     </p>
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-12">#</TableHead>
                         <TableHead>Candidato</TableHead>
                         <TableHead className="text-center">Score</TableHead>
                         <TableHead>Experiência</TableHead>
                         <TableHead>Último Cargo</TableHead>
                         <TableHead>Skills</TableHead>
                         <TableHead className="w-10"></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {candidatosVaga.map((cv, index) => (
                         <TableRow key={cv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCandidato(cv)}>
                           <TableCell className="font-bold text-muted-foreground">
                             {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Eye className="h-4 w-4" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </ScrollArea>
             </TabsContent>
 
             {/* Details Tab */}
             <TabsContent value="detalhes" className="mt-4">
               <ScrollArea className="h-[55vh] pr-4">
                 <div className="space-y-6">
                   {/* Status and Badges */}
                   <div className="flex flex-wrap gap-2">
                     <Badge className={statusColors[vaga.status]}>{statusLabels[vaga.status]}</Badge>
                     <Badge variant="secondary">{tipoLabels[vaga.tipo_contrato]}</Badge>
                     <Badge variant="secondary">{modalidadeLabels[vaga.modalidade]}</Badge>
                     <Badge variant="secondary">{senioridadeLabels[vaga.senioridade]}</Badge>
                   </div>
 
                   {/* Quick Info */}
                   <div className="grid gap-4 md:grid-cols-3">
                     <div className="flex items-center gap-2 text-sm">
                       <MapPin className="h-4 w-4 text-muted-foreground" />
                       <span>{modalidadeLabels[vaga.modalidade]}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <Clock className="h-4 w-4 text-muted-foreground" />
                       <span>{vaga.experiencia_minima_anos}+ anos de experiência</span>
                     </div>
                     {(vaga.salario_min || vaga.salario_max) && (
                       <div className="flex items-center gap-2 text-sm">
                         <DollarSign className="h-4 w-4 text-muted-foreground" />
                         <span>
                           {vaga.salario_min && vaga.salario_max
                             ? `R$ ${vaga.salario_min.toLocaleString()} - R$ ${vaga.salario_max.toLocaleString()}`
                             : vaga.salario_min
                             ? `A partir de R$ ${vaga.salario_min.toLocaleString()}`
                             : `Até R$ ${vaga.salario_max?.toLocaleString()}`}
                         </span>
                       </div>
                     )}
                   </div>
 
                   <Separator />
 
                   {/* Description */}
                   {vaga.descricao && (
                     <div>
                       <h4 className="mb-2 flex items-center gap-2 font-medium">
                         <Briefcase className="h-4 w-4" />
                         Descrição da Vaga
                       </h4>
                       <p className="whitespace-pre-wrap text-sm text-muted-foreground">{vaga.descricao}</p>
                     </div>
                   )}

                   {/* Responsibilities */}
                   {vaga.responsabilidades && (
                     <div>
                       <h4 className="mb-2 flex items-center gap-2 font-medium">
                         <Target className="h-4 w-4" />
                         Responsabilidades
                       </h4>
                       <p className="whitespace-pre-wrap text-sm text-muted-foreground">{vaga.responsabilidades}</p>
                     </div>
                   )}

                   {/* Skills */}
                   <div className="space-y-4">
                     {vaga.hard_skills_obrigatorias && vaga.hard_skills_obrigatorias.length > 0 && (
                       <div>
                         <h4 className="mb-2 text-sm font-medium">Hard Skills Obrigatórias</h4>
                         <div className="flex flex-wrap gap-2">
                           {vaga.hard_skills_obrigatorias.map((skill, i) => (
                             <Badge key={i} variant="default">
                               {skill}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}

                     {vaga.hard_skills_desejaveis && vaga.hard_skills_desejaveis.length > 0 && (
                       <div>
                         <h4 className="mb-2 text-sm font-medium">Hard Skills Desejáveis</h4>
                         <div className="flex flex-wrap gap-2">
                           {vaga.hard_skills_desejaveis.map((skill, i) => (
                             <Badge key={i} variant="secondary">
                               {skill}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}

                     {vaga.soft_skills && vaga.soft_skills.length > 0 && (
                       <div>
                         <h4 className="mb-2 text-sm font-medium">Soft Skills</h4>
                         <div className="flex flex-wrap gap-2">
                           {vaga.soft_skills.map((skill, i) => (
                             <Badge key={i} variant="outline">
                               {skill}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}
                 </div>
 
                   {/* Formation */}
                   {vaga.formacao_minima && (
                     <div>
                       <h4 className="mb-2 flex items-center gap-2 font-medium">
                         <GraduationCap className="h-4 w-4" />
                         Formação Mínima
                       </h4>
                       <p className="text-sm text-muted-foreground">{vaga.formacao_minima}</p>
                   </div>
                   )}
 
                   <Separator />

                   {/* Weights */}
                 <div>
                     <h4 className="mb-3 flex items-center gap-2 font-medium">
                       <Users className="h-4 w-4" />
                       Pesos para Score
                     </h4>
                     <div className="grid gap-2 md:grid-cols-5">
                       <div className="rounded-lg bg-muted p-3 text-center">
                         <p className="text-2xl font-bold text-primary">{vaga.peso_experiencia}%</p>
                         <p className="text-xs text-muted-foreground">Experiência</p>
                       </div>
                       <div className="rounded-lg bg-muted p-3 text-center">
                         <p className="text-2xl font-bold text-primary">{vaga.peso_soft_skills}%</p>
                         <p className="text-xs text-muted-foreground">Soft Skills</p>
                       </div>
                       <div className="rounded-lg bg-muted p-3 text-center">
                         <p className="text-2xl font-bold text-primary">{vaga.peso_formacao}%</p>
                         <p className="text-xs text-muted-foreground">Formação</p>
                       </div>
                       <div className="rounded-lg bg-muted p-3 text-center">
                         <p className="text-2xl font-bold text-primary">{vaga.peso_cursos}%</p>
                         <p className="text-xs text-muted-foreground">Cursos</p>
                       </div>
                       <div className="rounded-lg bg-muted p-3 text-center">
                         <p className="text-2xl font-bold text-primary">{vaga.peso_fit_cultural}%</p>
                         <p className="text-xs text-muted-foreground">Fit Cultural</p>
                       </div>
                   </div>
                 </div>
                 </div>
               </ScrollArea>
             </TabsContent>
           </Tabs>
         </DialogContent>
       </Dialog>
 
       <CandidatoScoreDialog
         open={!!selectedCandidato}
         onOpenChange={(open) => !open && setSelectedCandidato(null)}
         candidatoVaga={selectedCandidato}
       />
     </>
   );
 }