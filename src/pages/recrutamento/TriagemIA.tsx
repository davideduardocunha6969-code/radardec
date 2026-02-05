 import { useState } from "react";
 import { Brain, Upload, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { useVagas, useCandidatosVaga, Vaga } from "@/hooks/useRecrutamento";
 import { CurriculoUploader } from "@/components/recrutamento/CurriculoUploader";
 import { RankingTable } from "@/components/recrutamento/RankingTable";
 
 export default function TriagemIA() {
   const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null);
   const [isUploading, setIsUploading] = useState(false);
 
   const { data: vagas = [], isLoading: loadingVagas } = useVagas("aberta");
   const { data: candidatosVaga = [], isLoading: loadingCandidatos, refetch } = useCandidatosVaga(selectedVagaId);
 
   const selectedVaga = vagas.find((v) => v.id === selectedVagaId);
 
   const stats = {
     total: candidatosVaga.length,
     aprovados: candidatosVaga.filter((c) => c.score_total >= 80).length,
     medianos: candidatosVaga.filter((c) => c.score_total >= 60 && c.score_total < 80).length,
     baixos: candidatosVaga.filter((c) => c.score_total < 60).length,
     avgScore: candidatosVaga.length > 0
       ? Math.round(candidatosVaga.reduce((acc, c) => acc + c.score_total, 0) / candidatosVaga.length)
       : 0,
   };
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold">Triagem IA</h1>
           <p className="text-muted-foreground">Análise automática de currículos com inteligência artificial</p>
         </div>
       </div>
 
       {/* Vaga Selection */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Selecione uma Vaga</CardTitle>
           <CardDescription>Escolha a vaga para fazer upload e análise de currículos</CardDescription>
         </CardHeader>
         <CardContent>
           <Select value={selectedVagaId || ""} onValueChange={setSelectedVagaId}>
             <SelectTrigger className="w-full max-w-md">
               <SelectValue placeholder="Selecione uma vaga aberta..." />
             </SelectTrigger>
             <SelectContent>
               {loadingVagas ? (
                 <SelectItem value="loading" disabled>
                   Carregando vagas...
                 </SelectItem>
               ) : vagas.length === 0 ? (
                 <SelectItem value="empty" disabled>
                   Nenhuma vaga aberta
                 </SelectItem>
               ) : (
                 vagas.map((vaga) => (
                   <SelectItem key={vaga.id} value={vaga.id}>
                     {vaga.titulo} - {vaga.setor}
                   </SelectItem>
                 ))
               )}
             </SelectContent>
           </Select>
         </CardContent>
       </Card>
 
       {selectedVaga && (
         <>
           {/* Upload Section */}
           <CurriculoUploader
             vaga={selectedVaga}
             isUploading={isUploading}
             setIsUploading={setIsUploading}
             onUploadComplete={() => refetch()}
           />
 
           {/* Stats */}
           {candidatosVaga.length > 0 && (
             <div className="grid gap-4 md:grid-cols-5">
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Total Analisados</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2">
                     <FileText className="h-5 w-5 text-primary" />
                     <span className="text-2xl font-bold">{stats.total}</span>
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Score Médio</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2">
                     <Brain className="h-5 w-5 text-primary" />
                     <span className="text-2xl font-bold">{stats.avgScore}%</span>
                   </div>
                 </CardContent>
               </Card>
 
               <Card className="border-green-500/30 bg-green-500/5">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-green-700">Alta Compat. (80+)</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-green-600" />
                     <span className="text-2xl font-bold text-green-700">{stats.aprovados}</span>
                   </div>
                 </CardContent>
               </Card>
 
               <Card className="border-yellow-500/30 bg-yellow-500/5">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-yellow-700">Média (60-79)</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2">
                     <Clock className="h-5 w-5 text-yellow-600" />
                     <span className="text-2xl font-bold text-yellow-700">{stats.medianos}</span>
                   </div>
                 </CardContent>
               </Card>
 
               <Card className="border-red-500/30 bg-red-500/5">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-red-700">Baixa (&lt;60)</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2">
                     <XCircle className="h-5 w-5 text-red-600" />
                     <span className="text-2xl font-bold text-red-700">{stats.baixos}</span>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
 
           {/* Ranking Table */}
           <RankingTable
             candidatosVaga={candidatosVaga}
             isLoading={loadingCandidatos}
             vagaId={selectedVagaId!}
           />
         </>
       )}
 
       {!selectedVaga && !loadingVagas && (
         <Card className="py-12 text-center">
           <Brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-medium">Selecione uma vaga para começar</h3>
           <p className="mt-2 text-muted-foreground">
             Escolha uma vaga aberta para fazer upload e análise de currículos
           </p>
         </Card>
       )}
     </div>
   );
 }