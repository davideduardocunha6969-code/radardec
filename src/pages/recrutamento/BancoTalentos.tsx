import { useState } from "react";
import { Search, Filter, Download, RefreshCw, User, Mail, Phone, Briefcase, GraduationCap, Upload, Inbox, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCandidatos, Candidato } from "@/hooks/useRecrutamento";
import { CandidatoDetailDialog } from "@/components/recrutamento/CandidatoDetailDialog";
import { TalentBankUploader } from "@/components/recrutamento/TalentBankUploader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
 
 export default function BancoTalentos() {
   const [search, setSearch] = useState("");
   const [skillFilter, setSkillFilter] = useState<string>("all");
    const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
    const [showUploader, setShowUploader] = useState(false);
    const [isImportingEmail, setIsImportingEmail] = useState(false);
    const { toast } = useToast();
   const { data: candidatos = [], isLoading, refetch } = useCandidatos(search || undefined);
 
   // Extract unique skills from all candidates
   const allSkills = [...new Set(candidatos.flatMap((c) => c.skills_detectadas || []))].sort();
 
   const filteredCandidatos = candidatos.filter((c) => {
     if (skillFilter !== "all") {
       return c.skills_detectadas?.includes(skillFilter);
     }
     return true;
   });
 
   const exportCSV = () => {
     const headers = ["Nome", "Email", "Telefone", "Último Cargo", "Experiência (anos)", "Formação", "Skills"];
     const rows = filteredCandidatos.map((c) => [
       c.nome,
       c.email,
       c.telefone || "",
       c.ultimo_cargo || "",
       c.experiencia_total_anos.toString(),
       c.formacao || "",
       (c.skills_detectadas || []).join("; "),
     ]);
 
     const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
     const link = document.createElement("a");
     link.href = URL.createObjectURL(blob);
     link.download = `banco-talentos-${new Date().toISOString().split("T")[0]}.csv`;
     link.click();
    };

    const importFromEmail = async () => {
      setIsImportingEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke("fetch-email-curriculos");
        if (error) throw error;

        if (data?.processedCount > 0) {
          toast({
            title: "Importação concluída",
            description: `${data.processedCount} currículo(s) importado(s) do email${data.errorCount > 0 ? `, ${data.errorCount} com erro` : ""}`,
          });
          refetch();
        } else {
          toast({
            title: "Nenhum currículo encontrado",
            description: data?.message || "Não há emails não lidos com anexos PDF/DOCX",
          });
        }
      } catch (error: any) {
        console.error("Email import error:", error);
        toast({
          title: "Erro na importação",
          description: error.message || "Falha ao buscar currículos do email",
          variant: "destructive",
        });
      } finally {
        setIsImportingEmail(false);
      }
    };

    return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold">Banco de Talentos</h1>
           <p className="text-muted-foreground">
             {candidatos.length} candidatos cadastrados
           </p>
         </div>
          <div className="flex flex-wrap gap-2">
              <Button onClick={importFromEmail} disabled={isImportingEmail} variant="outline">
                {isImportingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Inbox className="mr-2 h-4 w-4" />
                )}
                {isImportingEmail ? "Importando..." : "Importar do Email"}
              </Button>
              <Button onClick={() => setShowUploader(!showUploader)}>
                <Upload className="mr-2 h-4 w-4" />
                {showUploader ? "Fechar Upload" : "Adicionar Currículos"}
              </Button>
           <Button variant="outline" onClick={() => refetch()}>
             <RefreshCw className="mr-2 h-4 w-4" />
             Atualizar
           </Button>
           <Button variant="outline" onClick={exportCSV} disabled={filteredCandidatos.length === 0}>
             <Download className="mr-2 h-4 w-4" />
             Exportar CSV
           </Button>
         </div>
       </div>
 
         {/* Uploader Section */}
         {showUploader && (
           <TalentBankUploader />
         )}
 
       {/* Stats Cards */}
       <div className="grid gap-4 md:grid-cols-4">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total de Candidatos</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{candidatos.length}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Skills Únicas</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{allSkills.length}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Média de Experiência</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {candidatos.length > 0
                 ? (candidatos.reduce((acc, c) => acc + c.experiencia_total_anos, 0) / candidatos.length).toFixed(1)
                 : 0}{" "}
               anos
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Com Pós-Graduação</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {candidatos.filter((c) => c.formacao?.toLowerCase().includes("pós") || c.formacao?.toLowerCase().includes("mestrado") || c.formacao?.toLowerCase().includes("doutorado")).length}
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filters */}
       <div className="flex flex-col gap-4 sm:flex-row">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por nome, email ou cargo..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9"
           />
         </div>
         <Select value={skillFilter} onValueChange={setSkillFilter}>
           <SelectTrigger className="w-[200px]">
             <Filter className="mr-2 h-4 w-4" />
             <SelectValue placeholder="Filtrar por skill" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Todas as skills</SelectItem>
             {allSkills.map((skill) => (
               <SelectItem key={skill} value={skill}>
                 {skill}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
 
       {/* Candidates Table */}
       {isLoading ? (
         <Card className="p-8 text-center">
           <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
           <p className="mt-2 text-muted-foreground">Carregando candidatos...</p>
         </Card>
       ) : filteredCandidatos.length === 0 ? (
         <Card className="py-12 text-center">
           <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-medium">Nenhum candidato encontrado</h3>
           <p className="mt-2 text-muted-foreground">
             {search || skillFilter !== "all"
               ? "Tente ajustar os filtros de busca"
               : "Os candidatos aparecerão aqui após o upload de currículos"}
           </p>
         </Card>
       ) : (
         <Card>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Candidato</TableHead>
                 <TableHead>Contato</TableHead>
                 <TableHead>Último Cargo</TableHead>
                 <TableHead>Experiência</TableHead>
                 <TableHead>Formação</TableHead>
                 <TableHead>Skills</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredCandidatos.map((candidato) => (
                 <TableRow
                   key={candidato.id}
                   className="cursor-pointer hover:bg-muted/50"
                   onClick={() => setSelectedCandidato(candidato)}
                 >
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                         <User className="h-5 w-5" />
                       </div>
                       <div>
                         <p className="font-medium">{candidato.nome}</p>
                         {candidato.linkedin_url && (
                           <a
                             href={candidato.linkedin_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-xs text-blue-500 hover:underline"
                             onClick={(e) => e.stopPropagation()}
                           >
                             LinkedIn
                           </a>
                         )}
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="space-y-1 text-sm">
                       <div className="flex items-center gap-1 text-muted-foreground">
                         <Mail className="h-3 w-3" />
                         {candidato.email}
                       </div>
                       {candidato.telefone && (
                         <div className="flex items-center gap-1 text-muted-foreground">
                           <Phone className="h-3 w-3" />
                           {candidato.telefone}
                         </div>
                       )}
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1">
                       <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                       {candidato.ultimo_cargo || "-"}
                     </div>
                   </TableCell>
                   <TableCell>
                     <Badge variant="secondary">{candidato.experiencia_total_anos} anos</Badge>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1 text-sm">
                       <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                       {candidato.formacao || "-"}
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex flex-wrap gap-1">
                       {(candidato.skills_detectadas || []).slice(0, 3).map((skill, i) => (
                         <Badge key={i} variant="outline" className="text-xs">
                           {skill}
                         </Badge>
                       ))}
                       {(candidato.skills_detectadas || []).length > 3 && (
                         <Badge variant="outline" className="text-xs">
                           +{(candidato.skills_detectadas || []).length - 3}
                         </Badge>
                       )}
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </Card>
       )}
 
       {/* Detail Dialog */}
       <CandidatoDetailDialog
         open={!!selectedCandidato}
         onOpenChange={(open) => !open && setSelectedCandidato(null)}
         candidato={selectedCandidato}
       />
     </div>
   );
 }