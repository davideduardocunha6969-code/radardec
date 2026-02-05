 import { useState } from "react";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Funnel, FunnelChart, LabelList } from "recharts";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useVagas, useCandidatos, useRecrutamentoStats } from "@/hooks/useRecrutamento";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 import { BarChart3, PieChartIcon, TrendingUp, Users, Briefcase, Clock, CheckCircle } from "lucide-react";
 
 const COLORS = ["#3b82f6", "#8b5cf6", "#6366f1", "#f59e0b", "#10b981", "#ef4444"];
 
 export default function Relatorios() {
   const { data: stats } = useRecrutamentoStats();
   const { data: vagas = [] } = useVagas();
   const { data: candidatos = [] } = useCandidatos();
 
   // Fetch pipeline data for funnel
   const { data: pipelineData = [] } = useQuery({
     queryKey: ["pipeline-stats"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("candidato_vaga")
         .select("status");
       if (error) throw error;
 
       const counts: Record<string, number> = {};
       (data || []).forEach((item: { status: string }) => {
         counts[item.status] = (counts[item.status] || 0) + 1;
       });
 
       return [
         { name: "Triagem IA", value: counts.triagem_ia || 0 },
         { name: "Entrevista RH", value: counts.entrevista_rh || 0 },
         { name: "Entrevista Técnica", value: counts.entrevista_tecnica || 0 },
         { name: "Proposta", value: counts.proposta || 0 },
         { name: "Contratado", value: counts.contratado || 0 },
       ];
     },
   });
 
   // Skills chart data
   const skillsData = (() => {
     const skillCounts: Record<string, number> = {};
     candidatos.forEach((c) => {
       (c.skills_detectadas || []).forEach((skill) => {
         skillCounts[skill] = (skillCounts[skill] || 0) + 1;
       });
     });
     return Object.entries(skillCounts)
       .sort((a, b) => b[1] - a[1])
       .slice(0, 10)
       .map(([skill, count]) => ({ skill, count }));
   })();
 
   // Vagas por setor
   const vagasSetorData = (() => {
     const setorCounts: Record<string, number> = {};
     vagas.forEach((v) => {
       setorCounts[v.setor] = (setorCounts[v.setor] || 0) + 1;
     });
     return Object.entries(setorCounts).map(([setor, count]) => ({ setor, count }));
   })();
 
   // Candidatos por status (pie)
   const statusData = (() => {
     const statusLabels: Record<string, string> = {
       triagem_ia: "Triagem IA",
       entrevista_rh: "Entrevista RH",
       entrevista_tecnica: "Entrev. Técnica",
       proposta: "Proposta",
       contratado: "Contratado",
       reprovado: "Reprovado",
       banco_talentos: "Banco Talentos",
     };
     return pipelineData.map((item) => ({
       ...item,
       name: statusLabels[item.name] || item.name,
     }));
   })();
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div>
         <h1 className="text-2xl font-bold">Relatórios</h1>
         <p className="text-muted-foreground">Análise de dados do processo de recrutamento</p>
       </div>
 
       {/* KPIs */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
             <Briefcase className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats?.totalVagas || 0}</div>
             <p className="text-xs text-muted-foreground">
               {stats?.vagasAbertas || 0} abertas • {stats?.vagasEncerradas || 0} encerradas
             </p>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats?.totalCandidatos || 0}</div>
             <p className="text-xs text-muted-foreground">No banco de talentos</p>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Contratados</CardTitle>
             <CheckCircle className="h-4 w-4 text-green-600" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-600">{stats?.totalContratados || 0}</div>
             <p className="text-xs text-muted-foreground">Total de contratações</p>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {stats?.totalCandidatos && stats.totalCandidatos > 0
                 ? ((stats.totalContratados / stats.totalCandidatos) * 100).toFixed(1)
                 : 0}
               %
             </div>
             <p className="text-xs text-muted-foreground">Candidatos → Contratados</p>
           </CardContent>
         </Card>
       </div>
 
       {/* Charts Row 1 */}
       <div className="grid gap-6 lg:grid-cols-2">
         {/* Skills mais encontradas */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BarChart3 className="h-5 w-5" />
               Skills Mais Encontradas
             </CardTitle>
             <CardDescription>Top 10 habilidades identificadas nos currículos</CardDescription>
           </CardHeader>
           <CardContent>
             {skillsData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={skillsData} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis type="number" />
                   <YAxis type="category" dataKey="skill" width={120} tick={{ fontSize: 12 }} />
                   <Tooltip />
                   <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                 Nenhum dado disponível
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Funil de Conversão */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <TrendingUp className="h-5 w-5" />
               Funil de Conversão
             </CardTitle>
             <CardDescription>Candidatos em cada etapa do processo</CardDescription>
           </CardHeader>
           <CardContent>
             {pipelineData.some((d) => d.value > 0) ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={pipelineData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="value" fill="hsl(var(--primary))">
                     {pipelineData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                 Nenhum dado disponível
               </div>
             )}
           </CardContent>
         </Card>
       </div>
 
       {/* Charts Row 2 */}
       <div className="grid gap-6 lg:grid-cols-2">
         {/* Vagas por Setor */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <PieChartIcon className="h-5 w-5" />
               Vagas por Setor
             </CardTitle>
             <CardDescription>Distribuição de vagas por área</CardDescription>
           </CardHeader>
           <CardContent>
             {vagasSetorData.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={vagasSetorData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ setor, percent }) => `${setor} (${(percent * 100).toFixed(0)}%)`}
                     outerRadius={100}
                     dataKey="count"
                   >
                     {vagasSetorData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                 Nenhum dado disponível
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Experiência dos Candidatos */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Clock className="h-5 w-5" />
               Experiência dos Candidatos
             </CardTitle>
             <CardDescription>Distribuição por tempo de experiência</CardDescription>
           </CardHeader>
           <CardContent>
             {candidatos.length > 0 ? (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart
                   data={[
                     { range: "0-2 anos", count: candidatos.filter((c) => c.experiencia_total_anos <= 2).length },
                     { range: "3-5 anos", count: candidatos.filter((c) => c.experiencia_total_anos > 2 && c.experiencia_total_anos <= 5).length },
                     { range: "6-10 anos", count: candidatos.filter((c) => c.experiencia_total_anos > 5 && c.experiencia_total_anos <= 10).length },
                     { range: "10+ anos", count: candidatos.filter((c) => c.experiencia_total_anos > 10).length },
                   ]}
                 >
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="range" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                 Nenhum dado disponível
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }