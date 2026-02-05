 import { Outlet, useLocation } from "react-router-dom";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Brain, KanbanIcon, BarChart3, FileQuestion } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
 
 const tabs = [
  { value: "sugestoes", label: "Contratações Sugeridas", icon: FileQuestion, path: "/recrutamento/sugestoes", requiresCoordinator: true },
   { value: "vagas", label: "Vagas", icon: Briefcase, path: "/recrutamento/vagas" },
   { value: "banco-talentos", label: "Banco de Talentos", icon: Users, path: "/recrutamento/banco-talentos" },
   { value: "pipeline", label: "Pipeline", icon: KanbanIcon, path: "/recrutamento/pipeline" },
   { value: "relatorios", label: "Relatórios", icon: BarChart3, path: "/recrutamento/relatorios" },
 ];
 
 export default function RecrutamentoLayout() {
   const navigate = useNavigate();
   const location = useLocation();
  const { isAdmin, permissions } = useAuthContext();
 
  // Check if user is coordinator (has coordinator role or is admin)
  const isCoordinator = isAdmin || permissions.allowedPages.includes("coordinator");

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => {
    if (tab.requiresCoordinator) {
      return isCoordinator;
    }
    return true;
  });

  const currentTab = visibleTabs.find((tab) => location.pathname === tab.path)?.value || "sugestoes";
 
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
      <Tabs value={currentTab} onValueChange={(v) => navigate(visibleTabs.find((t) => t.value === v)?.path || "/recrutamento/sugestoes")}>
        <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
          {visibleTabs.map((tab) => (
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