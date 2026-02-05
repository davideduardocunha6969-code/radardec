 import { Outlet, useLocation } from "react-router-dom";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useNavigate } from "react-router-dom";
 import { Briefcase, Users, Brain, KanbanIcon, BarChart3 } from "lucide-react";
 
 const tabs = [
   { value: "vagas", label: "Vagas", icon: Briefcase, path: "/recrutamento/vagas" },
   { value: "banco-talentos", label: "Banco de Talentos", icon: Users, path: "/recrutamento/banco-talentos" },
   { value: "triagem-ia", label: "Triagem IA", icon: Brain, path: "/recrutamento/triagem-ia" },
   { value: "pipeline", label: "Pipeline", icon: KanbanIcon, path: "/recrutamento/pipeline" },
   { value: "relatorios", label: "Relatórios", icon: BarChart3, path: "/recrutamento/relatorios" },
 ];
 
 export default function RecrutamentoLayout() {
   const navigate = useNavigate();
   const location = useLocation();
 
   const currentTab = tabs.find((tab) => location.pathname === tab.path)?.value || "vagas";
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div>
         <h1 className="text-3xl font-bold tracking-tight">Recrutamento Inteligente</h1>
         <p className="text-muted-foreground">
           Sistema de gestão de vagas e triagem automática de candidatos com IA
         </p>
       </div>
 
       {/* Tabs Navigation */}
       <Tabs value={currentTab} onValueChange={(v) => navigate(tabs.find((t) => t.value === v)?.path || "/recrutamento/vagas")}>
         <TabsList className="grid w-full grid-cols-5">
           {tabs.map((tab) => (
             <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
               <tab.icon className="h-4 w-4" />
               <span className="hidden sm:inline">{tab.label}</span>
             </TabsTrigger>
           ))}
         </TabsList>
       </Tabs>
 
       {/* Content */}
       <Outlet />
     </div>
   );
 }