import { Home, Radar, TrendingUp, Landmark, Scale, Briefcase, Settings, LogOut, ChevronDown, Bot, Mic, FileText, Megaphone } from "lucide-react";
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
  { title: "Radar Geral", url: "/", icon: Home, pageKey: "gestao-geral" },
  { title: "Radar Controladoria", url: "/radar-controladoria", icon: Radar, pageKey: "radar-controladoria" },
  { title: "Radar Comercial", url: "/radar-comercial", icon: TrendingUp, pageKey: "radar-comercial" },
  { title: "Radar Bancário", url: "/radar-bancario", icon: Landmark, pageKey: "radar-bancario" },
  { title: "Radar Previdenciário", url: "/radar-previdenciario", icon: Scale, pageKey: "radar-previdenciario" },
  { title: "Radar Trabalhista", url: "/radar-trabalhista", icon: Briefcase, pageKey: "radar-trabalhista" },
];

// Robôs subitems
const robosItems = [
  { title: "Transcritor de Audiências", url: "/robos/transcricao", icon: Mic, pageKey: "robos-transcricao" },
  { title: "Prompts de IA", url: "/robos/prompts", icon: FileText, pageKey: "robos-prompts" },
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

  // Filtra robôs visíveis baseado em permissões
  const visibleRobosItems = robosItems.filter(item => hasPageAccess(item.pageKey));

  // Verifica se algum radar está ativo para manter o menu aberto
  const isAnyRadarActive = useMemo(() => {
    return radarItems.some(item => isActive(item.url));
  }, [currentPath]);

  // Verifica se algum robô está ativo
  const isAnyRobosActive = useMemo(() => {
    return robosItems.some(item => isActive(item.url));
  }, [currentPath]);

  const [radarOpen, setRadarOpen] = useState(isAnyRadarActive);
  const [robosOpen, setRobosOpen] = useState(isAnyRobosActive);

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

              {/* Robôs - Segundo item, colapsável */}
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

              {/* Mídias Sociais - Item avulso */}
              {hasPageAccess("midia-social") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/midia-social")}
                    tooltip="Mídias Sociais"
                  >
                    <NavLink
                      to="/midia-social"
                      end
                      className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <Megaphone className="h-4 w-4" />
                      <span>Mídias Sociais</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

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
