 import { useState } from "react";
 import { Plus, Briefcase, MapPin, Clock, Users, Filter, Search, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
 import { useVagas, useDeleteVaga, Vaga, VagaStatus } from "@/hooks/useRecrutamento";
 import { VagaFormDialog } from "@/components/recrutamento/VagaFormDialog";
 import { VagaDetailDialog } from "@/components/recrutamento/VagaDetailDialog";
 
 const statusColors: Record<VagaStatus, string> = {
   aberta: "bg-green-500/20 text-green-700 border-green-500/30",
   em_analise: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
   encerrada: "bg-gray-500/20 text-gray-700 border-gray-500/30",
 };
 
 const statusLabels: Record<VagaStatus, string> = {
   aberta: "Aberta",
   em_analise: "Em Análise",
   encerrada: "Encerrada",
 };
 
 const senioridadeLabels = {
   junior: "Júnior",
   pleno: "Pleno",
   senior: "Sênior",
 };
 
 const modalidadeLabels = {
   presencial: "Presencial",
   hibrido: "Híbrido",
   remoto: "Remoto",
 };
 
 const tipoContratoLabels = {
   clt: "CLT",
   pj: "PJ",
   estagio: "Estágio",
  associado: "Associado",
 };
 
 export default function Vagas() {
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState<VagaStatus | "all">("all");
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
   const [viewVaga, setViewVaga] = useState<Vaga | null>(null);
 
   const { data: vagas = [], isLoading } = useVagas();
   const deleteVaga = useDeleteVaga();
 
   const filteredVagas = vagas.filter((vaga) => {
     const matchSearch =
       vaga.titulo.toLowerCase().includes(search.toLowerCase()) ||
       vaga.setor.toLowerCase().includes(search.toLowerCase());
     const matchStatus = statusFilter === "all" || vaga.status === statusFilter;
     return matchSearch && matchStatus;
   });
 
   const handleEdit = (vaga: Vaga) => {
     setSelectedVaga(vaga);
     setIsFormOpen(true);
   };
 
   const handleDelete = (id: string) => {
     if (confirm("Tem certeza que deseja excluir esta vaga?")) {
       deleteVaga.mutate(id);
     }
   };
 
   const handleNew = () => {
     setSelectedVaga(null);
     setIsFormOpen(true);
   };
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold">Vagas</h1>
           <p className="text-muted-foreground">Gerencie as vagas abertas do escritório</p>
         </div>
         <Button onClick={handleNew}>
           <Plus className="mr-2 h-4 w-4" />
           Nova Vaga
         </Button>
       </div>
 
       {/* Filters */}
       <div className="flex flex-col gap-4 sm:flex-row">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por título ou setor..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9"
           />
         </div>
         <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VagaStatus | "all")}>
           <SelectTrigger className="w-[180px]">
             <Filter className="mr-2 h-4 w-4" />
             <SelectValue placeholder="Status" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Todos os status</SelectItem>
             <SelectItem value="aberta">Abertas</SelectItem>
             <SelectItem value="em_analise">Em Análise</SelectItem>
             <SelectItem value="encerrada">Encerradas</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
       {/* Vagas Grid */}
       {isLoading ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[1, 2, 3].map((i) => (
             <Card key={i} className="animate-pulse">
               <CardHeader className="space-y-2">
                 <div className="h-5 w-3/4 rounded bg-muted" />
                 <div className="h-4 w-1/2 rounded bg-muted" />
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                   <div className="h-4 w-full rounded bg-muted" />
                   <div className="h-4 w-2/3 rounded bg-muted" />
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       ) : filteredVagas.length === 0 ? (
         <Card className="py-12 text-center">
           <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-medium">Nenhuma vaga encontrada</h3>
           <p className="mt-2 text-muted-foreground">
             {search || statusFilter !== "all"
               ? "Tente ajustar os filtros de busca"
               : "Clique em 'Nova Vaga' para começar"}
           </p>
         </Card>
       ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {filteredVagas.map((vaga) => (
             <Card
               key={vaga.id}
               className="cursor-pointer transition-shadow hover:shadow-md"
               onClick={() => setViewVaga(vaga)}
             >
               <CardHeader className="pb-2">
                 <div className="flex items-start justify-between">
                   <div className="space-y-1">
                     <CardTitle className="text-lg">{vaga.titulo}</CardTitle>
                     <CardDescription>{vaga.setor}</CardDescription>
                   </div>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewVaga(vaga); }}>
                         <Eye className="mr-2 h-4 w-4" />
                         Ver detalhes
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(vaga); }}>
                         <Edit className="mr-2 h-4 w-4" />
                         Editar
                       </DropdownMenuItem>
                       <DropdownMenuItem
                         className="text-destructive"
                         onClick={(e) => { e.stopPropagation(); handleDelete(vaga.id); }}
                       >
                         <Trash2 className="mr-2 h-4 w-4" />
                         Excluir
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className={statusColors[vaga.status]}>
                     {statusLabels[vaga.status]}
                   </Badge>
                   <Badge variant="secondary">{tipoContratoLabels[vaga.tipo_contrato]}</Badge>
                   <Badge variant="secondary">{senioridadeLabels[vaga.senioridade]}</Badge>
                 </div>
 
                 <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                   <div className="flex items-center gap-1">
                     <MapPin className="h-3.5 w-3.5" />
                     {modalidadeLabels[vaga.modalidade]}
                   </div>
                   <div className="flex items-center gap-1">
                     <Clock className="h-3.5 w-3.5" />
                     {vaga.experiencia_minima_anos}+ anos
                   </div>
                 </div>
 
                 {(vaga.salario_min || vaga.salario_max) && (
                   <p className="text-sm font-medium text-primary">
                     {vaga.salario_min && vaga.salario_max
                       ? `R$ ${vaga.salario_min.toLocaleString()} - R$ ${vaga.salario_max.toLocaleString()}`
                       : vaga.salario_min
                       ? `A partir de R$ ${vaga.salario_min.toLocaleString()}`
                       : `Até R$ ${vaga.salario_max?.toLocaleString()}`}
                   </p>
                 )}
 
                 {vaga.hard_skills_obrigatorias && vaga.hard_skills_obrigatorias.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                     {vaga.hard_skills_obrigatorias.slice(0, 3).map((skill, i) => (
                       <Badge key={i} variant="outline" className="text-xs">
                         {skill}
                       </Badge>
                     ))}
                     {vaga.hard_skills_obrigatorias.length > 3 && (
                       <Badge variant="outline" className="text-xs">
                         +{vaga.hard_skills_obrigatorias.length - 3}
                       </Badge>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           ))}
         </div>
       )}
 
       {/* Dialogs */}
       <VagaFormDialog
         open={isFormOpen}
         onOpenChange={setIsFormOpen}
         vaga={selectedVaga}
       />
 
       <VagaDetailDialog
         open={!!viewVaga}
         onOpenChange={(open) => !open && setViewVaga(null)}
         vaga={viewVaga}
         onEdit={() => {
           if (viewVaga) {
             handleEdit(viewVaga);
             setViewVaga(null);
           }
         }}
       />
     </div>
   );
 }