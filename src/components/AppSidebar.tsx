import { Home, Radar, TrendingUp, Landmark, Scale, Briefcase, Settings, LogOut, ChevronDown, Bot, Mic, FileText, CalendarDays, Megaphone, Lightbulb, Wand2, Package, ClipboardList, Phone, UserCog, Copy, Users, FileQuestion, Calendar, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logoEscritorio from "@/assets/logo-escritorio.webp";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Radares agrupados (incluindo Radar Geral)
const radarItems = [
  { title: "Gestão Geral", url: "/", icon: Home, pageKey: "gestao-geral" },
  { title: "Radar Controladoria", url: "/radar-controladoria", icon: Radar, pageKey: "radar-controladoria" },
  { title: "Radar Comercial", url: "/radar-comercial", icon: TrendingUp, pageKey: "radar-comercial" },
  { title: "Radar Bancário", url: "/radar-bancario", icon: Landmark, pageKey: "radar-bancario" },
  { title: "Radar Previdenciário", url: "/radar-previdenciario", icon: Scale, pageKey: "radar-previdenciario" },
  { title: "Radar Trabalhista", url: "/radar-trabalhista", icon: Briefcase, pageKey: "radar-trabalhista" },
  { title: "Radar Outbound", url: "/radar-outbound", icon: Phone, pageKey: "radar-outbound" },
];

// Comercial subitems
const comercialItems = [
  { title: "Atendimentos", url: "/comercial/atendimentos", icon: Phone, pageKey: "comercial-atendimentos" },
  { title: "CRM Outbound", url: "/crm-outbound", icon: TrendingUp, pageKey: "crm-outbound" },
];
 
 // Recrutamento
 const recrutamentoItems = [
  { title: "Contratações Sugeridas", url: "/recrutamento/sugestoes", icon: FileQuestion, pageKey: "recrutamento" },
   { title: "Vagas", url: "/recrutamento/vagas", icon: Briefcase, pageKey: "recrutamento" },
   { title: "Banco de Talentos", url: "/recrutamento/banco-talentos", icon: Users, pageKey: "recrutamento" },
   { title: "Pipeline", url: "/recrutamento/pipeline", icon: ClipboardList, pageKey: "recrutamento" },
   { title: "Relatórios", url: "/recrutamento/relatorios", icon: TrendingUp, pageKey: "recrutamento" },
 ];

// Robôs subitems
const robosItems = [
  { title: "Perfil IA.DEC", url: "/robos/perfil-ia", icon: UserCog, pageKey: "robos-perfil-ia" },
  { title: "Robô Coach", url: "/robos/coach", icon: Bot, pageKey: "robos-coach" },
  { title: "Transcritor de Audiências", url: "/robos/transcricao", icon: Mic, pageKey: "robos-transcricao" },
  { title: "Prompts Transcrições", url: "/robos/prompts", icon: FileText, pageKey: "robos-prompts" },
  { title: "Prompts Modelador", url: "/robos/prompts-modelador", icon: Wand2, pageKey: "robos-prompts-modelador" },
  { title: "Modelador Réplica", url: "/robos/modelador-replica", icon: Copy, pageKey: "robos-modelador-replica" },
  { title: "Tipos de Produtos", url: "/robos/produtos", icon: Package, pageKey: "robos-produtos" },
];

// Marketing subitems
const marketingItems = [
  { title: "Atividades", url: "/marketing/atividades", icon: ClipboardList, pageKey: "marketing-atividades" },
  { title: "Content Hub", url: "/content-hub", icon: Lightbulb, pageKey: "content-hub" },
  { title: "Calendário de Conteúdo", url: "/midia-social", icon: CalendarDays, pageKey: "midia-social" },
  { title: "Modelador de Conteúdo", url: "/marketing/modelador", icon: Wand2, pageKey: "marketing-modelador" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin, hasPageAccess, signOut, profile } = useAuthContext();

  const isActive = (path: string) => currentPath === path;

  // Filtra radares visíveis baseado em permissões
  const visibleRadarItems = radarItems.filter(item => hasPageAccess(item.pageKey));

  // Filtra comercial visíveis baseado em permissões
  const visibleComercialItems = comercialItems.filter(item => hasPageAccess(item.pageKey));

  // Filtra robôs visíveis baseado em permissões
  const visibleRobosItems = robosItems.filter(item => hasPageAccess(item.pageKey));

  // Filtra marketing visíveis baseado em permissões
  const visibleMarketingItems = marketingItems.filter(item => hasPageAccess(item.pageKey));

   // Filtra recrutamento visíveis baseado em permissões
   const visibleRecrutamentoItems = recrutamentoItems.filter(item => hasPageAccess(item.pageKey));
 
  // Verifica se algum radar está ativo para manter o menu aberto
  const isAnyRadarActive = useMemo(() => {
    return radarItems.some(item => isActive(item.url));
  }, [currentPath]);

  // Verifica se algum item comercial está ativo
  const isAnyComercialActive = useMemo(() => {
    return comercialItems.some(item => isActive(item.url)) || currentPath.startsWith("/crm-outbound");
  }, [currentPath]);

  // Verifica se algum robô está ativo
  const isAnyRobosActive = useMemo(() => {
    return robosItems.some(item => isActive(item.url));
  }, [currentPath]);

  // Verifica se algum item de marketing está ativo
  const isAnyMarketingActive = useMemo(() => {
    return marketingItems.some(item => isActive(item.url));
  }, [currentPath]);

   // Verifica se algum item de recrutamento está ativo
   const isAnyRecrutamentoActive = useMemo(() => {
     return recrutamentoItems.some(item => isActive(item.url));
   }, [currentPath]);
 
  const [radarOpen, setRadarOpen] = useState(isAnyRadarActive);
  const [comercialOpen, setComercialOpen] = useState(isAnyComercialActive);
  const [robosOpen, setRobosOpen] = useState(isAnyRobosActive);
  const [marketingOpen, setMarketingOpen] = useState(isAnyMarketingActive);
   const [recrutamentoOpen, setRecrutamentoOpen] = useState(isAnyRecrutamentoActive);

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/20 bg-primary">
      <SidebarHeader className="border-b border-primary-foreground/20 p-4 bg-primary">
        <div className="flex items-center gap-3">
          <img 
            src={logoEscritorio} 
            alt="David Eduardo Cunha Advogados"
            className={collapsed ? "h-8 w-auto" : "h-10 w-auto"}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/70">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Radares - Primeiro item, colapsável */}
              {visibleRadarItems.length > 0 && (
                <Collapsible
                  open={radarOpen}
                  onOpenChange={setRadarOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Radares"
                        className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        <Radar className="h-4 w-4" />
                        <span>Radares</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleRadarItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                            >
                              <NavLink 
                                to={item.url} 
                                end 
                                className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground"
                                activeClassName="bg-accent text-primary font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Comercial - Segundo item, colapsável */}
              {visibleComercialItems.length > 0 && (
                <Collapsible
                  open={comercialOpen}
                  onOpenChange={setComercialOpen}
                  className="group/collapsible-comercial"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Comercial"
                        className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Comercial</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-comercial:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleComercialItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                            >
                              <NavLink 
                                to={item.url} 
                                end 
                                className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground"
                                activeClassName="bg-accent text-primary font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Robôs - Terceiro item, colapsável */}
              {visibleRobosItems.length > 0 && (
                <Collapsible
                  open={robosOpen}
                  onOpenChange={setRobosOpen}
                  className="group/collapsible-robos"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Robôs"
                        className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        <Bot className="h-4 w-4" />
                        <span>Robôs</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-robos:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleRobosItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                            >
                              <NavLink 
                                to={item.url} 
                                end 
                                className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground"
                                activeClassName="bg-accent text-primary font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Marketing - Terceiro item, colapsável */}
              {visibleMarketingItems.length > 0 && (
                <Collapsible
                  open={marketingOpen}
                  onOpenChange={setMarketingOpen}
                  className="group/collapsible-marketing"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Marketing"
                        className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        <Megaphone className="h-4 w-4" />
                        <span>Marketing</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-marketing:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleMarketingItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                            >
                              <NavLink 
                                to={item.url} 
                                end 
                                className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground"
                                activeClassName="bg-accent text-primary font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

               {/* Recrutamento */}
               {visibleRecrutamentoItems.length > 0 && (
                 <Collapsible
                   open={recrutamentoOpen}
                   onOpenChange={setRecrutamentoOpen}
                   className="group/collapsible-recrutamento"
                 >
                   <SidebarMenuItem>
                     <CollapsibleTrigger asChild>
                       <SidebarMenuButton
                         tooltip="Recrutamento"
                         className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                       >
                         <Users className="h-4 w-4" />
                         <span>Recrutamento</span>
                         <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-recrutamento:rotate-180" />
                       </SidebarMenuButton>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <SidebarMenuSub>
                         {visibleRecrutamentoItems.map((item) => (
                           <SidebarMenuSubItem key={item.title}>
                             <SidebarMenuSubButton
                               asChild
                               isActive={isActive(item.url)}
                             >
                               <NavLink 
                                 to={item.url} 
                                 end 
                                 className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground"
                                 activeClassName="bg-accent text-primary font-medium"
                               >
                                 <item.icon className="h-3.5 w-3.5" />
                                 <span>{item.title}</span>
                               </NavLink>
                             </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                         ))}
                       </SidebarMenuSub>
                     </CollapsibleContent>
                   </SidebarMenuItem>
                 </Collapsible>
               )}

              {/* Agenda */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/agenda")}
                  tooltip="Agenda"
                >
                  <NavLink
                    to="/agenda"
                    end
                    className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    activeClassName="bg-accent text-primary font-medium"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Agenda</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Meu Painel */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/meu-painel")}
                  tooltip="Meu Painel"
                >
                  <NavLink
                    to="/meu-painel"
                    end
                    className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    activeClassName="bg-accent text-primary font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Meu Painel</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary-foreground/70">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/admin")}
                    tooltip="Administrador"
                  >
                    <NavLink 
                      to="/admin" 
                      end 
                      className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Administrador</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-primary-foreground/20 p-4 bg-primary">
        <div className="flex flex-col gap-2">
          {!collapsed && profile && (
            <span className="text-xs text-primary-foreground/60 truncate">
              {profile.display_name}
            </span>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={signOut}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
