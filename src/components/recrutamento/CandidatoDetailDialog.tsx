import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Candidato } from "@/hooks/useRecrutamento";
import { User, Mail, Phone, Linkedin, Briefcase, GraduationCap, Globe, Award, FileText, ExternalLink, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 
 interface CandidatoDetailDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   candidato: Candidato | null;
 }
 
export function CandidatoDetailDialog({ open, onOpenChange, candidato }: CandidatoDetailDialogProps) {
  const { data: curriculos = [], isLoading: loadingCurriculos } = useQuery({
    queryKey: ["curriculos-candidato", candidato?.id],
    queryFn: async () => {
      if (!candidato) return [];
      const { data, error } = await supabase
        .from("curriculos")
        .select("id, arquivo_nome, arquivo_url, arquivo_tipo, created_at")
        .eq("candidato_id", candidato.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!candidato && open,
  });

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("curriculos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (!candidato) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
               <User className="h-6 w-6" />
             </div>
             <div>
               <span className="text-xl">{candidato.nome}</span>
               {candidato.ultimo_cargo && (
                 <p className="text-sm font-normal text-muted-foreground">{candidato.ultimo_cargo}</p>
               )}
             </div>
           </DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="max-h-[65vh] pr-4">
           <div className="space-y-6">
             {/* Contact Info */}
             <div className="grid gap-3 md:grid-cols-2">
               <div className="flex items-center gap-2 text-sm">
                 <Mail className="h-4 w-4 text-muted-foreground" />
                 <a href={`mailto:${candidato.email}`} className="text-primary hover:underline">
                   {candidato.email}
                 </a>
               </div>
               {candidato.telefone && (
                 <div className="flex items-center gap-2 text-sm">
                   <Phone className="h-4 w-4 text-muted-foreground" />
                   <span>{candidato.telefone}</span>
                 </div>
               )}
               {candidato.linkedin_url && (
                 <div className="flex items-center gap-2 text-sm">
                   <Linkedin className="h-4 w-4 text-muted-foreground" />
                   <a
                     href={candidato.linkedin_url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-primary hover:underline"
                   >
                     LinkedIn
                   </a>
                 </div>
               )}
             </div>
 
             <Separator />
 
             {/* Experience and Education */}
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <h4 className="flex items-center gap-2 font-medium">
                   <Briefcase className="h-4 w-4" />
                   Experiência
                 </h4>
                 <div className="rounded-lg bg-muted p-3">
                   <p className="text-2xl font-bold text-primary">{candidato.experiencia_total_anos} anos</p>
                   {candidato.ultimo_cargo && (
                     <p className="text-sm text-muted-foreground">Último: {candidato.ultimo_cargo}</p>
                   )}
                 </div>
               </div>
 
               {candidato.formacao && (
                 <div className="space-y-2">
                   <h4 className="flex items-center gap-2 font-medium">
                     <GraduationCap className="h-4 w-4" />
                     Formação
                   </h4>
                   <div className="rounded-lg bg-muted p-3">
                     <p className="text-sm">{candidato.formacao}</p>
                   </div>
                 </div>
               )}
             </div>
 
             {/* Resume */}
             {candidato.resumo && (
               <div>
                 <h4 className="mb-2 font-medium">Resumo Profissional</h4>
                 <p className="whitespace-pre-wrap text-sm text-muted-foreground">{candidato.resumo}</p>
               </div>
             )}
 
             {/* Skills */}
             {candidato.skills_detectadas && candidato.skills_detectadas.length > 0 && (
               <div>
                 <h4 className="mb-2 flex items-center gap-2 font-medium">
                   <Award className="h-4 w-4" />
                   Skills Detectadas
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {candidato.skills_detectadas.map((skill, i) => (
                     <Badge key={i} variant="secondary">
                       {skill}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Courses */}
             {candidato.cursos_extras && candidato.cursos_extras.length > 0 && (
               <div>
                 <h4 className="mb-2 font-medium">Cursos Extras</h4>
                 <div className="flex flex-wrap gap-2">
                   {candidato.cursos_extras.map((curso, i) => (
                     <Badge key={i} variant="outline">
                       {curso}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Languages */}
             {candidato.idiomas && candidato.idiomas.length > 0 && (
               <div>
                 <h4 className="mb-2 flex items-center gap-2 font-medium">
                   <Globe className="h-4 w-4" />
                   Idiomas
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {candidato.idiomas.map((idioma, i) => (
                     <Badge key={i} variant="outline">
                       {idioma}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}

              {/* Curriculos */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Currículos
                </h4>
                {loadingCurriculos ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : curriculos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum currículo encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {curriculos.map((cv) => (
                      <div key={cv.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{cv.arquivo_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cv.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(getPublicUrl(cv.arquivo_url), "_blank")}
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Abrir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


             <Separator />
             <div className="text-xs text-muted-foreground">
               <p>Cadastrado em: {new Date(candidato.created_at).toLocaleDateString("pt-BR")}</p>
               <p>Última atualização: {new Date(candidato.updated_at).toLocaleDateString("pt-BR")}</p>
             </div>
           </div>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }