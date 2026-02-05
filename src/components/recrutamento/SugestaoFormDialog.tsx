 import { useEffect, useState, useRef } from "react";
 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { z } from "zod";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Switch } from "@/components/ui/switch";
 import { Sparkles, Loader2, Mic, Square } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { useCreateSugestao } from "@/hooks/useSugestoesContratacao";
 import { supabase } from "@/integrations/supabase/client";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 const sugestaoSchema = z.object({
   cargo: z.string().min(1, "Cargo é obrigatório"),
   setor: z.string().min(1, "Setor é obrigatório"),
 tipo_contrato: z.enum(["clt", "pj", "estagio", "associado"]),
   modalidade: z.enum(["presencial", "hibrido", "remoto"]),
   senioridade: z.enum(["junior", "pleno", "senior"]),
   descricao: z.string().optional(),
   responsabilidades: z.string().optional(),
   hard_skills: z.string().optional(),
   soft_skills: z.string().optional(),
   experiencia_minima_anos: z.coerce.number().min(0).default(0),
   formacao_minima: z.string().optional(),
   salario_mensal: z.coerce.number().min(1, "Salário é obrigatório"),
   anuidade_oab: z.coerce.number().min(0).default(0),
   valor_ppr: z.coerce.number().min(0).default(0),
   comissoes_mensais: z.coerce.number().min(0).default(0),
   is_advogado: z.boolean().default(false),
   justificativa_contratacao: z.string().min(10, "Justificativa é obrigatória (mínimo 10 caracteres)"),
   justificativa_nao_delegar: z.string().min(10, "Justificativa é obrigatória (mínimo 10 caracteres)"),
 });
 
 type SugestaoFormData = z.infer<typeof sugestaoSchema>;
 
 interface SugestaoFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function SugestaoFormDialog({ open, onOpenChange }: SugestaoFormDialogProps) {
   const createSugestao = useCreateSugestao();
   const { toast } = useToast();
   const [aiPrompt, setAiPrompt] = useState("");
   const [isGenerating, setIsGenerating] = useState(false);
   const [showAiInput, setShowAiInput] = useState(true);
   const [isRecording, setIsRecording] = useState(false);
   const [isTranscribing, setIsTranscribing] = useState(false);
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const chunksRef = useRef<Blob[]>([]);
 
   const form = useForm<SugestaoFormData>({
     resolver: zodResolver(sugestaoSchema),
     defaultValues: {
       cargo: "",
       setor: "",
       tipo_contrato: "clt",
       modalidade: "presencial",
       senioridade: "pleno",
       experiencia_minima_anos: 0,
       salario_mensal: 0,
       anuidade_oab: 0,
       valor_ppr: 0,
       comissoes_mensais: 0,
       is_advogado: false,
       justificativa_contratacao: "",
       justificativa_nao_delegar: "",
     },
   });
 
   const isAdvogado = form.watch("is_advogado");
 
   const handleAiGenerate = async () => {
     if (!aiPrompt.trim()) {
       toast({
         title: "Descrição vazia",
         description: "Digite uma descrição da vaga para a IA preencher os campos.",
         variant: "destructive",
       });
       return;
     }
 
     setIsGenerating(true);
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-vaga`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
           body: JSON.stringify({ descricao: aiPrompt }),
         }
       );
 
       const data = await response.json();
 
       if (!response.ok) {
         throw new Error(data.error || "Erro ao gerar vaga");
       }
 
       // Fill the form with AI-generated data
       form.setValue("cargo", data.titulo || "");
       form.setValue("setor", data.setor || "");
       form.setValue("tipo_contrato", data.tipo_contrato || "clt");
       form.setValue("modalidade", data.modalidade || "presencial");
       form.setValue("senioridade", data.senioridade || "pleno");
       form.setValue("descricao", data.descricao || "");
       form.setValue("responsabilidades", data.responsabilidades || "");
       form.setValue("hard_skills", (data.hard_skills_obrigatorias || []).join(", "));
       form.setValue("soft_skills", (data.soft_skills || []).join(", "));
       form.setValue("experiencia_minima_anos", data.experiencia_minima_anos || 0);
       form.setValue("formacao_minima", data.formacao_minima || "");
       
       if (data.salario_min) {
         form.setValue("salario_mensal", data.salario_min);
       }
 
       setShowAiInput(false);
       toast({
         title: "Campos preenchidos!",
         description: "Revise os dados e preencha as informações de custo e justificativas.",
       });
     } catch (error) {
       console.error("Error generating vaga:", error);
       toast({
         title: "Erro ao gerar vaga",
         description: error instanceof Error ? error.message : "Tente novamente",
         variant: "destructive",
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const startRecording = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
       mediaRecorderRef.current = mediaRecorder;
       chunksRef.current = [];
 
       mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) {
           chunksRef.current.push(e.data);
         }
       };
 
       mediaRecorder.onstop = async () => {
         stream.getTracks().forEach((track) => track.stop());
         const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
         await transcribeAudio(audioBlob);
       };
 
       mediaRecorder.start();
       setIsRecording(true);
     } catch (error) {
       console.error("Error accessing microphone:", error);
       toast({
         title: "Erro ao acessar microfone",
         description: "Verifique as permissões do navegador.",
         variant: "destructive",
       });
     }
   };
 
   const stopRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.stop();
       setIsRecording(false);
     }
   };
 
   const transcribeAudio = async (audioBlob: Blob) => {
     setIsTranscribing(true);
     try {
       const formData = new FormData();
       formData.append("audio", audioBlob, "recording.webm");
 
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-voice`,
         {
           method: "POST",
           headers: {
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
           body: formData,
         }
       );
 
       const data = await response.json();
 
       if (!response.ok) {
         throw new Error(data.error || "Erro na transcrição");
       }
 
       if (data.text) {
         setAiPrompt((prev) => (prev ? `${prev} ${data.text}` : data.text));
         toast({
           title: "Áudio transcrito!",
           description: "O texto foi adicionado ao campo.",
         });
       }
     } catch (error) {
       console.error("Error transcribing:", error);
       toast({
         title: "Erro na transcrição",
         description: error instanceof Error ? error.message : "Tente novamente",
         variant: "destructive",
       });
     } finally {
       setIsTranscribing(false);
     }
   };
 
   const onSubmit = async (data: SugestaoFormData) => {
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) return;
 
     const parseSkills = (str: string | undefined) =>
       str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];
 
     await createSugestao.mutateAsync({
       user_id: user.user.id,
       cargo: data.cargo,
       setor: data.setor,
       tipo_contrato: data.tipo_contrato,
       modalidade: data.modalidade,
       senioridade: data.senioridade,
       descricao: data.descricao || null,
       responsabilidades: data.responsabilidades || null,
       hard_skills: parseSkills(data.hard_skills),
       soft_skills: parseSkills(data.soft_skills),
       experiencia_minima_anos: data.experiencia_minima_anos,
       formacao_minima: data.formacao_minima || null,
       salario_mensal: data.salario_mensal,
       anuidade_oab: data.anuidade_oab,
       valor_ppr: data.valor_ppr,
       comissoes_mensais: data.comissoes_mensais,
       is_advogado: data.is_advogado,
       justificativa_contratacao: data.justificativa_contratacao,
       justificativa_nao_delegar: data.justificativa_nao_delegar,
     });
 
     form.reset();
     setAiPrompt("");
     setShowAiInput(true);
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle>Nova Sugestão de Contratação</DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="max-h-[70vh] pr-4">
           {/* AI Assistant Section */}
           {showAiInput && (
             <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="h-5 w-5 text-primary" />
                 <span className="font-medium text-sm">Assistente IA</span>
               </div>
               <p className="text-sm text-muted-foreground mb-3">
                 Descreva o cargo digitando ou gravando um áudio.
               </p>
               <div className="relative">
                 <Textarea
                   placeholder="Ex: Preciso de um advogado trabalhista pleno, CLT, presencial, com experiência em audiências. Salário de 6 mil."
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   rows={3}
                   className="resize-none pr-14"
                   disabled={isRecording || isTranscribing}
                 />
                 <div className="absolute right-2 top-2">
                   {isTranscribing ? (
                     <div className="flex items-center justify-center h-10 w-10">
                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                     </div>
                   ) : isRecording ? (
                     <Button
                       type="button"
                       variant="destructive"
                       size="icon"
                       className="h-10 w-10 rounded-full animate-pulse"
                       onClick={stopRecording}
                     >
                       <Square className="h-4 w-4" />
                     </Button>
                   ) : (
                     <Button
                       type="button"
                       variant="outline"
                       size="icon"
                       className="h-10 w-10 rounded-full"
                       onClick={startRecording}
                       title="Gravar áudio"
                     >
                       <Mic className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               </div>
               {isRecording && (
                 <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                   <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                   Gravando... Clique no botão para parar.
                 </p>
               )}
               <div className="flex gap-2 mt-3">
                 <Button
                   type="button"
                   onClick={handleAiGenerate}
                   disabled={isGenerating || !aiPrompt.trim() || isRecording || isTranscribing}
                   className="flex-1"
                 >
                   {isGenerating ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Gerando...
                     </>
                   ) : (
                     <>
                       <Sparkles className="mr-2 h-4 w-4" />
                       Preencher Campos
                     </>
                   )}
                 </Button>
                 <Button
                   type="button"
                   variant="ghost"
                   onClick={() => setShowAiInput(false)}
                 >
                   Preencher Manualmente
                 </Button>
               </div>
             </div>
           )}
 
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               {/* Basic Info */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="cargo"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Cargo *</FormLabel>
                       <FormControl>
                         <Input placeholder="Ex: Advogado Trabalhista" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="setor"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Setor *</FormLabel>
                       <FormControl>
                         <Input placeholder="Ex: Trabalhista" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Contract Details */}
               <div className="grid gap-4 md:grid-cols-3">
                 <FormField
                   control={form.control}
                   name="tipo_contrato"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Tipo de Contrato</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="clt">CLT</SelectItem>
                           <SelectItem value="pj">PJ</SelectItem>
                           <SelectItem value="estagio">Estágio</SelectItem>
                           <SelectItem value="associado">Associado</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="modalidade"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Modalidade</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="presencial">Presencial</SelectItem>
                           <SelectItem value="hibrido">Híbrido</SelectItem>
                           <SelectItem value="remoto">Remoto</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="senioridade"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Senioridade</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="junior">Júnior</SelectItem>
                           <SelectItem value="pleno">Pleno</SelectItem>
                           <SelectItem value="senior">Sênior</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Description */}
               <FormField
                 control={form.control}
                 name="descricao"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Descrição do Cargo</FormLabel>
                     <FormControl>
                       <Textarea rows={3} {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               {/* Skills */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="hard_skills"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Hard Skills</FormLabel>
                       <FormControl>
                         <Input placeholder="Separadas por vírgula" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="soft_skills"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Soft Skills</FormLabel>
                       <FormControl>
                         <Input placeholder="Separadas por vírgula" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Cost Section */}
               <div className="border-t pt-6">
                 <h3 className="text-lg font-medium mb-4">Informações de Custo</h3>
                 
                 <FormField
                   control={form.control}
                   name="is_advogado"
                   render={({ field }) => (
                     <FormItem className="flex items-center justify-between rounded-lg border p-4 mb-4">
                       <div>
                         <FormLabel>É advogado?</FormLabel>
                         <FormDescription>
                           Se sim, incluiremos a anuidade da OAB no cálculo de custo anual
                         </FormDescription>
                       </div>
                       <FormControl>
                         <Switch checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
 
                 <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                     control={form.control}
                     name="salario_mensal"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Salário Mensal (R$) *</FormLabel>
                         <FormControl>
                           <Input type="number" step="0.01" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
 
                   {isAdvogado && (
                     <FormField
                       control={form.control}
                       name="anuidade_oab"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Anuidade OAB (R$)</FormLabel>
                           <FormControl>
                             <Input type="number" step="0.01" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   )}
 
                   <FormField
                     control={form.control}
                     name="valor_ppr"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Valor Médio PPR (R$)</FormLabel>
                         <FormControl>
                           <Input type="number" step="0.01" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
 
                   <FormField
                     control={form.control}
                     name="comissoes_mensais"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Comissões Mensais Médias (R$)</FormLabel>
                         <FormControl>
                           <Input type="number" step="0.01" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
               </div>
 
               {/* Justifications */}
               <div className="border-t pt-6">
                 <h3 className="text-lg font-medium mb-4">Justificativas</h3>
                 
                 <FormField
                   control={form.control}
                   name="justificativa_contratacao"
                   render={({ field }) => (
                     <FormItem className="mb-4">
                       <FormLabel>Por que essa contratação é necessária? *</FormLabel>
                       <FormControl>
                         <Textarea 
                           rows={3} 
                           placeholder="Explique a necessidade desta contratação para o setor..."
                           {...field} 
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="justificativa_nao_delegar"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Por que não é possível delegar ou absorver pela equipe? *</FormLabel>
                       <FormControl>
                         <Textarea 
                           rows={3} 
                           placeholder="Explique por que a equipe atual não pode absorver essas atividades..."
                           {...field} 
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Submit */}
               <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                   Cancelar
                 </Button>
                 <Button type="submit" disabled={createSugestao.isPending}>
                   {createSugestao.isPending ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Criando...
                     </>
                   ) : (
                     "Criar Sugestão"
                   )}
                 </Button>
               </div>
             </form>
           </Form>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }