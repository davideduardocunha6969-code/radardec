 import { useState } from "react";
 import { Plus, Clock, CheckCircle, XCircle, DollarSign, Calendar, Building } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useSugestoesContratacao, calculateCosts, SugestaoContratacao, SugestaoStatus } from "@/hooks/useSugestoesContratacao";
 import { SugestaoFormDialog } from "@/components/recrutamento/SugestaoFormDialog";
 import { SugestaoDetailDialog } from "@/components/recrutamento/SugestaoDetailDialog";
 import { useAuthContext } from "@/contexts/AuthContext";
 import { formatDistanceToNow } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
 
 const statusConfig: Record<SugestaoStatus, { label: string; color: string; icon: typeof Clock }> = {
   pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: Clock },
   aprovada: { label: "Aprovada", color: "bg-green-500/20 text-green-700 border-green-500/30", icon: CheckCircle },
   recusada: { label: "Recusada", color: "bg-red-500/20 text-red-700 border-red-500/30", icon: XCircle },
 };
 
 export default function SugestoesContratacao() {
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [selectedSugestao, setSelectedSugestao] = useState<SugestaoContratacao | null>(null);
   const [tabFilter, setTabFilter] = useState<"all" | SugestaoStatus>("all");
 
   const { isAdmin } = useAuthContext();
   const { data: sugestoes = [], isLoading } = useSugestoesContratacao();
 
   const filteredSugestoes = tabFilter === "all" 
     ? sugestoes 
     : sugestoes.filter(s => s.status === tabFilter);
 
   const pendingCount = sugestoes.filter(s => s.status === "pendente").length;
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold">Contratações Sugeridas</h1>
           <p className="text-muted-foreground">
             {isAdmin 
               ? "Gerencie as sugestões de contratação dos coordenadores" 
               : "Sugira novas contratações para sua equipe"}
           </p>
         </div>
         <Button onClick={() => setIsFormOpen(true)}>
           <Plus className="mr-2 h-4 w-4" />
           Nova Sugestão
         </Button>
       </div>
 
       {/* Stats Cards */}
       <div className="grid gap-4 md:grid-cols-4">
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Total de Sugestões</CardDescription>
             <CardTitle className="text-2xl">{sugestoes.length}</CardTitle>
           </CardHeader>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Pendentes</CardDescription>
             <CardTitle className="text-2xl text-yellow-600">{pendingCount}</CardTitle>
           </CardHeader>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Aprovadas</CardDescription>
             <CardTitle className="text-2xl text-green-600">
               {sugestoes.filter(s => s.status === "aprovada").length}
             </CardTitle>
           </CardHeader>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Recusadas</CardDescription>
             <CardTitle className="text-2xl text-red-600">
               {sugestoes.filter(s => s.status === "recusada").length}
             </CardTitle>
           </CardHeader>
         </Card>
       </div>
 
       {/* Tabs Filter */}
       <Tabs value={tabFilter} onValueChange={(v) => setTabFilter(v as typeof tabFilter)}>
         <TabsList>
           <TabsTrigger value="all">Todas</TabsTrigger>
           <TabsTrigger value="pendente">
             Pendentes
             {pendingCount > 0 && (
               <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
             )}
           </TabsTrigger>
           <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
           <TabsTrigger value="recusada">Recusadas</TabsTrigger>
         </TabsList>
       </Tabs>
 
       {/* List */}
       {isLoading ? (
         <div className="space-y-4">
           {[1, 2, 3].map((i) => (
             <Card key={i} className="animate-pulse">
               <CardContent className="p-6">
                 <div className="h-6 w-1/3 rounded bg-muted mb-2" />
                 <div className="h-4 w-1/4 rounded bg-muted" />
               </CardContent>
             </Card>
           ))}
         </div>
       ) : filteredSugestoes.length === 0 ? (
         <Card className="py-12 text-center">
           <Building className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-medium">Nenhuma sugestão encontrada</h3>
           <p className="mt-2 text-muted-foreground">
             {tabFilter !== "all" 
               ? "Não há sugestões neste status" 
               : "Clique em 'Nova Sugestão' para começar"}
           </p>
         </Card>
       ) : (
         <div className="space-y-4">
           {filteredSugestoes.map((sugestao) => {
             const { custoMensal, custoAnual } = calculateCosts(sugestao);
             const config = statusConfig[sugestao.status];
             const StatusIcon = config.icon;
 
             return (
               <Card 
                 key={sugestao.id} 
                 className="cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => setSelectedSugestao(sugestao)}
               >
                 <CardContent className="p-6">
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     {/* Left: Main Info */}
                     <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         <h3 className="text-lg font-semibold">{sugestao.cargo}</h3>
                         <Badge variant="outline" className={config.color}>
                           <StatusIcon className="mr-1 h-3 w-3" />
                           {config.label}
                         </Badge>
                       </div>
                       <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                         <span className="flex items-center gap-1">
                           <Building className="h-3.5 w-3.5" />
                           {sugestao.setor}
                         </span>
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3.5 w-3.5" />
                           {formatDistanceToNow(new Date(sugestao.created_at), { 
                             addSuffix: true, 
                             locale: ptBR 
                           })}
                         </span>
                         {sugestao.criador && (
                           <span>Criado por: {sugestao.criador.display_name}</span>
                         )}
                       </div>
                     </div>
 
                     {/* Right: Costs */}
                     <div className="flex gap-6 text-right">
                       <div>
                         <p className="text-xs text-muted-foreground">Custo Mensal</p>
                         <p className="text-lg font-semibold text-primary">
                           R$ {custoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                         </p>
                       </div>
                       <div>
                         <p className="text-xs text-muted-foreground">Custo Anual</p>
                         <p className="text-lg font-semibold">
                           R$ {custoAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                         </p>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           })}
         </div>
       )}
 
       {/* Dialogs */}
       <SugestaoFormDialog 
         open={isFormOpen} 
         onOpenChange={setIsFormOpen} 
       />
 
       <SugestaoDetailDialog
         open={!!selectedSugestao}
         onOpenChange={(open) => !open && setSelectedSugestao(null)}
         sugestao={selectedSugestao}
       />
     </div>
   );
 }