 import { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Separator } from "@/components/ui/separator";
 import { CheckCircle, XCircle, Building, DollarSign, Clock, User, Briefcase, MapPin, GraduationCap, Loader2 } from "lucide-react";
 import { SugestaoContratacao, calculateCosts, useApproveSugestao, useRejectSugestao } from "@/hooks/useSugestoesContratacao";
 import { useAuthContext } from "@/contexts/AuthContext";
 import { formatDistanceToNow, format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 interface SugestaoDetailDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   sugestao: SugestaoContratacao | null;
 }
 
 const tipoContratoLabels = {
   clt: "CLT",
   pj: "PJ",
   estagio: "Estágio",
 };
 
 const modalidadeLabels = {
   presencial: "Presencial",
   hibrido: "Híbrido",
   remoto: "Remoto",
 };
 
 const senioridadeLabels = {
   junior: "Júnior",
   pleno: "Pleno",
   senior: "Sênior",
 };
 
 export function SugestaoDetailDialog({ open, onOpenChange, sugestao }: SugestaoDetailDialogProps) {
   const { isAdmin } = useAuthContext();
   const approveSugestao = useApproveSugestao();
   const rejectSugestao = useRejectSugestao();
   
   const [showRejectForm, setShowRejectForm] = useState(false);
   const [rejectReason, setRejectReason] = useState("");
 
   if (!sugestao) return null;
 
   const { custoMensal, custoAnual } = calculateCosts(sugestao);
   const isPending = sugestao.status === "pendente";
 
   const handleApprove = async () => {
     await approveSugestao.mutateAsync({ id: sugestao.id });
     onOpenChange(false);
   };
 
   const handleReject = async () => {
     if (!rejectReason.trim()) return;
     await rejectSugestao.mutateAsync({ id: sugestao.id, motivo: rejectReason });
     setShowRejectForm(false);
     setRejectReason("");
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh]">
         <DialogHeader>
           <div className="flex items-center gap-3">
             <DialogTitle className="text-xl">{sugestao.cargo}</DialogTitle>
             <Badge 
               variant="outline" 
               className={
                 sugestao.status === "pendente" 
                   ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                   : sugestao.status === "aprovada"
                   ? "bg-green-500/20 text-green-700 border-green-500/30"
                   : "bg-red-500/20 text-red-700 border-red-500/30"
               }
             >
               {sugestao.status === "pendente" ? "Pendente" : sugestao.status === "aprovada" ? "Aprovada" : "Recusada"}
             </Badge>
           </div>
           <DialogDescription>
             {sugestao.setor} • Criado {formatDistanceToNow(new Date(sugestao.created_at), { addSuffix: true, locale: ptBR })}
           </DialogDescription>
         </DialogHeader>
 
         <ScrollArea className="max-h-[60vh]">
           <div className="space-y-6 pr-4">
             {/* Cost Summary */}
             <div className="rounded-lg bg-muted/50 p-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-sm text-muted-foreground">Custo Mensal</p>
                   <p className="text-2xl font-bold text-primary">
                     R$ {custoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                   </p>
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Custo Anual Estimado</p>
                   <p className="text-2xl font-bold">
                     R$ {custoAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                   </p>
                 </div>
               </div>
               <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                 <div>
                   <span className="text-muted-foreground">Salário:</span>
                   <span className="ml-1">R$ {sugestao.salario_mensal.toLocaleString("pt-BR")}</span>
                 </div>
                 {sugestao.is_advogado && (
                   <div>
                     <span className="text-muted-foreground">OAB:</span>
                     <span className="ml-1">R$ {sugestao.anuidade_oab.toLocaleString("pt-BR")}</span>
                   </div>
                 )}
                 <div>
                   <span className="text-muted-foreground">PPR:</span>
                   <span className="ml-1">R$ {sugestao.valor_ppr.toLocaleString("pt-BR")}</span>
                 </div>
                 <div>
                   <span className="text-muted-foreground">Comissões:</span>
                   <span className="ml-1">R$ {sugestao.comissoes_mensais.toLocaleString("pt-BR")}/mês</span>
                 </div>
               </div>
             </div>
 
             {/* Details Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="flex items-center gap-2">
                 <Briefcase className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground">Contrato</p>
                   <p className="text-sm font-medium">{tipoContratoLabels[sugestao.tipo_contrato]}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground">Modalidade</p>
                   <p className="text-sm font-medium">{modalidadeLabels[sugestao.modalidade]}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <GraduationCap className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground">Senioridade</p>
                   <p className="text-sm font-medium">{senioridadeLabels[sugestao.senioridade]}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground">Experiência</p>
                   <p className="text-sm font-medium">{sugestao.experiencia_minima_anos}+ anos</p>
                 </div>
               </div>
             </div>
 
             <Separator />
 
             {/* Description */}
             {sugestao.descricao && (
               <div>
                 <h4 className="font-medium mb-2">Descrição do Cargo</h4>
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sugestao.descricao}</p>
               </div>
             )}
 
             {/* Skills */}
             {(sugestao.hard_skills?.length || sugestao.soft_skills?.length) && (
               <div className="grid gap-4 md:grid-cols-2">
                 {sugestao.hard_skills?.length ? (
                   <div>
                     <h4 className="font-medium mb-2">Hard Skills</h4>
                     <div className="flex flex-wrap gap-1">
                       {sugestao.hard_skills.map((skill, i) => (
                         <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                       ))}
                     </div>
                   </div>
                 ) : null}
                 {sugestao.soft_skills?.length ? (
                   <div>
                     <h4 className="font-medium mb-2">Soft Skills</h4>
                     <div className="flex flex-wrap gap-1">
                       {sugestao.soft_skills.map((skill, i) => (
                         <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                       ))}
                     </div>
                   </div>
                 ) : null}
               </div>
             )}
 
             <Separator />
 
             {/* Justifications */}
             <div className="space-y-4">
               <div>
                 <h4 className="font-medium mb-2">Por que essa contratação é necessária?</h4>
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                   {sugestao.justificativa_contratacao}
                 </p>
               </div>
               <div>
                 <h4 className="font-medium mb-2">Por que não é possível delegar ou absorver pela equipe?</h4>
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                   {sugestao.justificativa_nao_delegar}
                 </p>
               </div>
             </div>
 
             {/* Rejection reason if rejected */}
             {sugestao.status === "recusada" && sugestao.motivo_recusa && (
               <>
                 <Separator />
                 <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                   <h4 className="font-medium text-red-700 mb-2">Motivo da Recusa</h4>
                   <p className="text-sm text-red-600">{sugestao.motivo_recusa}</p>
                 </div>
               </>
             )}
 
             {/* Reject Form */}
             {showRejectForm && (
               <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                 <Label>Motivo da recusa *</Label>
                 <Textarea
                   value={rejectReason}
                   onChange={(e) => setRejectReason(e.target.value)}
                   placeholder="Explique brevemente o motivo da recusa..."
                   rows={3}
                 />
                 <div className="flex gap-2">
                   <Button
                     variant="destructive"
                     onClick={handleReject}
                     disabled={!rejectReason.trim() || rejectSugestao.isPending}
                   >
                     {rejectSugestao.isPending ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <XCircle className="mr-2 h-4 w-4" />
                     )}
                     Confirmar Recusa
                   </Button>
                   <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                     Cancelar
                   </Button>
                 </div>
               </div>
             )}
           </div>
         </ScrollArea>
 
         {/* Actions for Admin */}
         {isAdmin && isPending && !showRejectForm && (
           <div className="flex justify-end gap-3 pt-4 border-t">
             <Button
               variant="outline"
               onClick={() => setShowRejectForm(true)}
               className="text-destructive border-destructive/30 hover:bg-destructive/10"
             >
               <XCircle className="mr-2 h-4 w-4" />
               Recusar
             </Button>
             <Button onClick={handleApprove} disabled={approveSugestao.isPending}>
               {approveSugestao.isPending ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               ) : (
                 <CheckCircle className="mr-2 h-4 w-4" />
               )}
               Aprovar e Criar Vaga
             </Button>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }