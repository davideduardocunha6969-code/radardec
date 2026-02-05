 import { useState, useCallback } from "react";
 import { useDropzone } from "react-dropzone";
 import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useQueryClient } from "@tanstack/react-query";
 
 interface FileWithStatus {
   file: File;
   status: "pending" | "uploading" | "processing" | "done" | "error";
   error?: string;
   progress: number;
   vagasAnalisadas?: number;
 }
 
// Helper function to sanitize file names for storage
function sanitizeFileName(fileName: string): string {
  // Remove accents and special characters
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/_+/g, "_"); // Collapse multiple underscores
}

 export function TalentBankUploader() {
   const [files, setFiles] = useState<FileWithStatus[]>([]);
   const [isUploading, setIsUploading] = useState(false);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const onDrop = useCallback((acceptedFiles: File[]) => {
     const newFiles = acceptedFiles.map((file) => ({
       file,
       status: "pending" as const,
       progress: 0,
     }));
     setFiles((prev) => [...prev, ...newFiles]);
   }, []);
 
   const { getRootProps, getInputProps, isDragActive } = useDropzone({
     onDrop,
     accept: {
       "application/pdf": [".pdf"],
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
       "application/msword": [".doc"],
     },
     maxFiles: 50,
     disabled: isUploading,
   });
 
   const removeFile = (index: number) => {
     setFiles((prev) => prev.filter((_, i) => i !== index));
   };
 
   const processFiles = async () => {
     if (files.length === 0) return;
 
     setIsUploading(true);
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) {
       toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
       setIsUploading(false);
       return;
     }
 
     let successCount = 0;
     let errorCount = 0;
 
     for (let i = 0; i < files.length; i++) {
       const fileItem = files[i];
 
       setFiles((prev) =>
         prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", progress: 10 } : f))
       );
 
       try {
         // Upload to storage (banco-talentos folder)
          const sanitizedName = sanitizeFileName(fileItem.file.name);
          const filePath = `banco-talentos/${Date.now()}-${sanitizedName}`;
         const { error: uploadError } = await supabase.storage
           .from("curriculos")
           .upload(filePath, fileItem.file);
 
         if (uploadError) throw uploadError;
 
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: 30 } : f))
          );

          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "processing", progress: 50 } : f))
          );
 
         // Call the new edge function that analyzes for ALL open vagas
         const { data: result, error: analysisError } = await supabase.functions.invoke(
           "analyze-curriculum-all-vagas",
           {
             body: {
                // The "curriculos" storage bucket is private, so we send the path for server-side download.
                bucket: "curriculos",
                filePath,
                fileName: fileItem.file.name,
             },
           }
         );
 
         if (analysisError) throw analysisError;
 
         setFiles((prev) =>
           prev.map((f, idx) =>
             idx === i
               ? { ...f, status: "done", progress: 100, vagasAnalisadas: result?.vagasAnalisadas || 0 }
               : f
           )
         );
 
         successCount++;
       } catch (error: any) {
         console.error("Error processing file:", error);
         setFiles((prev) =>
           prev.map((f, idx) =>
             idx === i ? { ...f, status: "error", error: error.message, progress: 0 } : f
           )
         );
         errorCount++;
       }
     }
 
     setIsUploading(false);
     queryClient.invalidateQueries({ queryKey: ["candidatos"] });
     queryClient.invalidateQueries({ queryKey: ["candidatos-vaga"] });
 
     if (successCount > 0) {
       toast({
         title: "Upload concluído",
         description: `${successCount} currículo(s) processado(s) e analisado(s) para todas as vagas abertas${errorCount > 0 ? `, ${errorCount} com erro` : ""}`,
       });
     } else if (errorCount > 0) {
       toast({
         title: "Erro no upload",
         description: "Nenhum currículo foi processado",
         variant: "destructive",
       });
     }
   };
 
   const clearCompleted = () => {
     setFiles((prev) => prev.filter((f) => f.status !== "done"));
   };
 
   const pendingFiles = files.filter((f) => f.status === "pending");
   const processingFiles = files.filter((f) => f.status === "uploading" || f.status === "processing");
   const completedFiles = files.filter((f) => f.status === "done");
   const errorFiles = files.filter((f) => f.status === "error");
 
   const overallProgress =
     files.length > 0 ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length) : 0;
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Upload className="h-5 w-5" />
           Adicionar Currículos ao Banco
         </CardTitle>
         <CardDescription>
           Os currículos serão automaticamente analisados para todas as vagas abertas
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div
           {...getRootProps()}
           className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
             isDragActive
               ? "border-primary bg-primary/5"
               : isUploading
               ? "cursor-not-allowed border-muted bg-muted/50"
               : "border-muted-foreground/25 hover:border-primary/50"
           }`}
         >
           <input {...getInputProps()} />
           <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
           <p className="mt-2 text-sm text-muted-foreground">
             {isDragActive
               ? "Solte os arquivos aqui..."
               : "Arraste currículos aqui ou clique para selecionar"}
           </p>
           <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX (máx. 50 arquivos)</p>
         </div>
 
         {isUploading && (
           <div className="space-y-2">
             <div className="flex items-center justify-between text-sm">
               <span>Processando currículos...</span>
               <span>{overallProgress}%</span>
             </div>
             <Progress value={overallProgress} />
           </div>
         )}
 
         {files.length > 0 && (
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <div className="flex gap-2">
                 {pendingFiles.length > 0 && (
                   <Badge variant="secondary">{pendingFiles.length} pendente(s)</Badge>
                 )}
                 {processingFiles.length > 0 && (
                   <Badge variant="default">{processingFiles.length} processando</Badge>
                 )}
                 {completedFiles.length > 0 && (
                    <Badge className="bg-primary text-primary-foreground">{completedFiles.length} concluído(s)</Badge>
                 )}
                 {errorFiles.length > 0 && (
                   <Badge variant="destructive">{errorFiles.length} com erro</Badge>
                 )}
               </div>
               {completedFiles.length > 0 && (
                 <Button variant="ghost" size="sm" onClick={clearCompleted}>
                   Limpar concluídos
                 </Button>
               )}
             </div>
 
             <div className="max-h-40 space-y-1 overflow-y-auto">
               {files.slice(0, 20).map((fileItem, index) => (
                 <div
                   key={index}
                   className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                 >
                   <div className="flex items-center gap-2 truncate">
                     {fileItem.status === "done" ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                     ) : fileItem.status === "error" ? (
                       <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                     ) : fileItem.status === "uploading" || fileItem.status === "processing" ? (
                       <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                     ) : (
                       <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                     )}
                     <span className="truncate">{fileItem.file.name}</span>
                     {fileItem.vagasAnalisadas !== undefined && fileItem.vagasAnalisadas > 0 && (
                       <Badge variant="outline" className="ml-2 text-xs">
                         {fileItem.vagasAnalisadas} vagas
                       </Badge>
                     )}
                   </div>
                   {fileItem.status === "pending" && !isUploading && (
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-6 w-6"
                       onClick={() => removeFile(index)}
                     >
                       <X className="h-3 w-3" />
                     </Button>
                   )}
                 </div>
               ))}
               {files.length > 20 && (
                 <p className="text-center text-xs text-muted-foreground">
                   ... e mais {files.length - 20} arquivo(s)
                 </p>
               )}
             </div>
           </div>
         )}
 
         {pendingFiles.length > 0 && (
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setFiles([])} disabled={isUploading}>
               Limpar
             </Button>
             <Button onClick={processFiles} disabled={isUploading}>
               {isUploading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Processando...
                 </>
               ) : (
                 <>
                   <Upload className="mr-2 h-4 w-4" />
                   Enviar {pendingFiles.length} currículo(s)
                 </>
               )}
             </Button>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }