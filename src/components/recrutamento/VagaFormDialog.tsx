 import { useEffect, useState } from "react";
 import { useRef } from "react";
 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { z } from "zod";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Slider } from "@/components/ui/slider";
 import { Sparkles, Loader2 } from "lucide-react";
 import { Mic, Square, MicOff } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { useCreateVaga, useUpdateVaga, Vaga, VagaStatus, TipoContrato, Modalidade, Senioridade } from "@/hooks/useRecrutamento";
 import { supabase } from "@/integrations/supabase/client";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 const vagaSchema = z.object({
   titulo: z.string().min(1, "Título é obrigatório"),
   setor: z.string().min(1, "Setor é obrigatório"),
 tipo_contrato: z.enum(["clt", "pj", "estagio", "associado"]),
   modalidade: z.enum(["presencial", "hibrido", "remoto"]),
   senioridade: z.enum(["junior", "pleno", "senior"]),
   salario_min: z.coerce.number().optional(),
   salario_max: z.coerce.number().optional(),
   descricao: z.string().optional(),
   responsabilidades: z.string().optional(),
   hard_skills_obrigatorias: z.string().optional(),
   hard_skills_desejaveis: z.string().optional(),
   soft_skills: z.string().optional(),
   experiencia_minima_anos: z.coerce.number().min(0).default(0),
   formacao_minima: z.string().optional(),
   peso_experiencia: z.number().min(0).max(100).default(40),
   peso_soft_skills: z.number().min(0).max(100).default(20),
   peso_formacao: z.number().min(0).max(100).default(15),
   peso_cursos: z.number().min(0).max(100).default(10),
   peso_fit_cultural: z.number().min(0).max(100).default(15),
   status: z.enum(["aberta", "em_analise", "encerrada"]).default("aberta"),
 });
 
 type VagaFormData = z.infer<typeof vagaSchema>;
 
 interface VagaFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   vaga: Vaga | null;
 }
 
 export function VagaFormDialog({ open, onOpenChange, vaga }: VagaFormDialogProps) {
   const createVaga = useCreateVaga();
   const updateVaga = useUpdateVaga();
   const { toast } = useToast();
   const [aiPrompt, setAiPrompt] = useState("");
   const [isGenerating, setIsGenerating] = useState(false);
   const [showAiInput, setShowAiInput] = useState(false);
   const [isRecording, setIsRecording] = useState(false);
   const [isTranscribing, setIsTranscribing] = useState(false);
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const chunksRef = useRef<Blob[]>([]);
 
   const form = useForm<VagaFormData>({
     resolver: zodResolver(vagaSchema),
     defaultValues: {
       titulo: "",
       setor: "",
       tipo_contrato: "clt",
       modalidade: "presencial",
       senioridade: "pleno",
       experiencia_minima_anos: 0,
       peso_experiencia: 40,
       peso_soft_skills: 20,
       peso_formacao: 15,
       peso_cursos: 10,
       peso_fit_cultural: 15,
       status: "aberta",
     },
   });
 
   useEffect(() => {
     if (vaga) {
       form.reset({
         titulo: vaga.titulo,
         setor: vaga.setor,
         tipo_contrato: vaga.tipo_contrato,
         modalidade: vaga.modalidade,
         senioridade: vaga.senioridade,
         salario_min: vaga.salario_min || undefined,
         salario_max: vaga.salario_max || undefined,
         descricao: vaga.descricao || "",
         responsabilidades: vaga.responsabilidades || "",
         hard_skills_obrigatorias: (vaga.hard_skills_obrigatorias || []).join(", "),
         hard_skills_desejaveis: (vaga.hard_skills_desejaveis || []).join(", "),
         soft_skills: (vaga.soft_skills || []).join(", "),
         experiencia_minima_anos: vaga.experiencia_minima_anos,
         formacao_minima: vaga.formacao_minima || "",
         peso_experiencia: vaga.peso_experiencia,
         peso_soft_skills: vaga.peso_soft_skills,
         peso_formacao: vaga.peso_formacao,
         peso_cursos: vaga.peso_cursos,
         peso_fit_cultural: vaga.peso_fit_cultural,
         status: vaga.status,
       });
     } else {
       form.reset({
         titulo: "",
         setor: "",
         tipo_contrato: "clt",
         modalidade: "presencial",
         senioridade: "pleno",
         experiencia_minima_anos: 0,
         peso_experiencia: 40,
         peso_soft_skills: 20,
         peso_formacao: 15,
         peso_cursos: 10,
         peso_fit_cultural: 15,
         status: "aberta",
       });
     }
   }, [vaga, form]);
 
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
       form.reset({
         titulo: data.titulo || "",
         setor: data.setor || "",
         tipo_contrato: data.tipo_contrato || "clt",
         modalidade: data.modalidade || "presencial",
         senioridade: data.senioridade || "pleno",
         salario_min: data.salario_min || undefined,
         salario_max: data.salario_max || undefined,
         descricao: data.descricao || "",
         responsabilidades: data.responsabilidades || "",
         hard_skills_obrigatorias: (data.hard_skills_obrigatorias || []).join(", "),
         hard_skills_desejaveis: (data.hard_skills_desejaveis || []).join(", "),
         soft_skills: (data.soft_skills || []).join(", "),
         experiencia_minima_anos: data.experiencia_minima_anos || 0,
         formacao_minima: data.formacao_minima || "",
         peso_experiencia: data.peso_experiencia || 40,
         peso_soft_skills: data.peso_soft_skills || 20,
         peso_formacao: data.peso_formacao || 15,
         peso_cursos: data.peso_cursos || 10,
         peso_fit_cultural: data.peso_fit_cultural || 15,
         status: "aberta",
       });
 
       setShowAiInput(false);
       setAiPrompt("");
       toast({
         title: "Campos preenchidos!",
         description: "Revise os dados e ajuste o que for necessário.",
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
 
   const onSubmit = async (data: VagaFormData) => {
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) return;
 
     const parseSkills = (str: string | undefined) =>
       str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];
 
     const vagaData = {
       titulo: data.titulo,
       setor: data.setor,
       tipo_contrato: data.tipo_contrato as TipoContrato,
       modalidade: data.modalidade as Modalidade,
       senioridade: data.senioridade as Senioridade,
       salario_min: data.salario_min || null,
       salario_max: data.salario_max || null,
       descricao: data.descricao || null,
       responsabilidades: data.responsabilidades || null,
       hard_skills_obrigatorias: parseSkills(data.hard_skills_obrigatorias),
       hard_skills_desejaveis: parseSkills(data.hard_skills_desejaveis),
       soft_skills: parseSkills(data.soft_skills),
       experiencia_minima_anos: data.experiencia_minima_anos,
       formacao_minima: data.formacao_minima || null,
       peso_experiencia: data.peso_experiencia,
       peso_soft_skills: data.peso_soft_skills,
       peso_formacao: data.peso_formacao,
       peso_cursos: data.peso_cursos,
       peso_fit_cultural: data.peso_fit_cultural,
       status: data.status as VagaStatus,
       user_id: user.user.id,
     };
 
     if (vaga) {
       await updateVaga.mutateAsync({ id: vaga.id, ...vagaData });
     } else {
       await createVaga.mutateAsync(vagaData);
     }
 
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh]">
         <DialogHeader>
           <DialogTitle>{vaga ? "Editar Vaga" : "Nova Vaga"}</DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="max-h-[70vh] pr-4">
             {/* AI Assistant Section - Only for new vagas */}
             {!vaga && (
               <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <Sparkles className="h-5 w-5 text-primary" />
                     <span className="font-medium text-sm">Assistente IA</span>
                   </div>
                   {!showAiInput && (
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={() => setShowAiInput(true)}
                     >
                       <Sparkles className="mr-2 h-4 w-4" />
                       Preencher com IA
                     </Button>
                   )}
                 </div>
                 
                 {showAiInput && (
                   <div className="space-y-3">
                     <p className="text-sm text-muted-foreground">
                        Descreva a vaga digitando ou gravando um áudio.
                     </p>
                      <div className="relative">
                        <Textarea
                          placeholder="Ex: Preciso de um advogado trabalhista pleno, CLT, presencial, com experiência em audiências e conhecimento em PJe. Salário entre 6 e 8 mil."
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
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                          Gravando... Clique no botão para parar.
                        </p>
                      )}
                     <div className="flex gap-2">
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
                         onClick={() => {
                           setShowAiInput(false);
                           setAiPrompt("");
                         }}
                       >
                         Cancelar
                       </Button>
                     </div>
                   </div>
                 )}
                 
                 {!showAiInput && (
                   <p className="text-xs text-muted-foreground">
                     Descreva a vaga brevemente e deixe a IA preencher os campos automaticamente.
                   </p>
                 )}
               </div>
             )}
 
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               {/* Basic Info */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="titulo"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Título da Vaga *</FormLabel>
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
                         <Input placeholder="Ex: Jurídico, Comercial, Administrativo" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Contract Details */}
               <div className="grid gap-4 md:grid-cols-4">
                 <FormField
                   control={form.control}
                   name="tipo_contrato"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Tipo</FormLabel>
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
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="status"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Status</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="aberta">Aberta</SelectItem>
                           <SelectItem value="em_analise">Em Análise</SelectItem>
                           <SelectItem value="encerrada">Encerrada</SelectItem>
                         </SelectContent>
                       </Select>
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Salary */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="salario_min"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Salário Mínimo (R$)</FormLabel>
                       <FormControl>
                         <Input type="number" placeholder="Ex: 5000" {...field} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="salario_max"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Salário Máximo (R$)</FormLabel>
                       <FormControl>
                         <Input type="number" placeholder="Ex: 8000" {...field} />
                       </FormControl>
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
                     <FormLabel>Descrição da Vaga</FormLabel>
                     <FormControl>
                       <Textarea placeholder="Descreva a vaga..." rows={3} {...field} />
                     </FormControl>
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="responsabilidades"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Responsabilidades</FormLabel>
                     <FormControl>
                       <Textarea placeholder="Liste as responsabilidades..." rows={3} {...field} />
                     </FormControl>
                   </FormItem>
                 )}
               />
 
               {/* Skills */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="hard_skills_obrigatorias"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Hard Skills Obrigatórias</FormLabel>
                       <FormControl>
                         <Input placeholder="Separadas por vírgula" {...field} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="hard_skills_desejaveis"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Hard Skills Desejáveis</FormLabel>
                       <FormControl>
                         <Input placeholder="Separadas por vírgula" {...field} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
               </div>
 
               <FormField
                 control={form.control}
                 name="soft_skills"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Soft Skills</FormLabel>
                     <FormControl>
                       <Input placeholder="Separadas por vírgula" {...field} />
                     </FormControl>
                   </FormItem>
                 )}
               />
 
               {/* Requirements */}
               <div className="grid gap-4 md:grid-cols-2">
                 <FormField
                   control={form.control}
                   name="experiencia_minima_anos"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Experiência Mínima (anos)</FormLabel>
                       <FormControl>
                         <Input type="number" min={0} {...field} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="formacao_minima"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Formação Mínima</FormLabel>
                       <FormControl>
                         <Input placeholder="Ex: Bacharel em Direito" {...field} />
                       </FormControl>
                     </FormItem>
                   )}
                 />
               </div>
 
               {/* Weights */}
               <div className="space-y-4">
                 <h4 className="font-medium">Pesos para Cálculo de Score (%)</h4>
                 <div className="grid gap-6 md:grid-cols-2">
                   <FormField
                     control={form.control}
                     name="peso_experiencia"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Experiência: {field.value}%</FormLabel>
                         <FormControl>
                           <Slider
                             value={[field.value]}
                             onValueChange={(v) => field.onChange(v[0])}
                             max={100}
                             step={5}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
 
                   <FormField
                     control={form.control}
                     name="peso_soft_skills"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Soft Skills: {field.value}%</FormLabel>
                         <FormControl>
                           <Slider
                             value={[field.value]}
                             onValueChange={(v) => field.onChange(v[0])}
                             max={100}
                             step={5}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
 
                   <FormField
                     control={form.control}
                     name="peso_formacao"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Formação: {field.value}%</FormLabel>
                         <FormControl>
                           <Slider
                             value={[field.value]}
                             onValueChange={(v) => field.onChange(v[0])}
                             max={100}
                             step={5}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
 
                   <FormField
                     control={form.control}
                     name="peso_cursos"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Cursos: {field.value}%</FormLabel>
                         <FormControl>
                           <Slider
                             value={[field.value]}
                             onValueChange={(v) => field.onChange(v[0])}
                             max={100}
                             step={5}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
 
                   <FormField
                     control={form.control}
                     name="peso_fit_cultural"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Fit Cultural: {field.value}%</FormLabel>
                         <FormControl>
                           <Slider
                             value={[field.value]}
                             onValueChange={(v) => field.onChange(v[0])}
                             max={100}
                             step={5}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
                 </div>
               </div>
 
               <div className="flex justify-end gap-3 pt-4">
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                   Cancelar
                 </Button>
                 <Button type="submit" disabled={createVaga.isPending || updateVaga.isPending}>
                   {vaga ? "Salvar Alterações" : "Criar Vaga"}
                 </Button>
               </div>
             </form>
           </Form>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }