import { Home, Radar, TrendingUp, Landmark, Scale, Briefcase, Settings, LogOut, ChevronDown } from "lucide-react";
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

// Item principal (não é radar)
const mainItem = { title: "Gestão Geral", url: "/", icon: Home, pageKey: "gestao-geral" };

// Radares agrupados
const radarItems = [
  { title: "Radar Controladoria", url: "/radar-controladoria", icon: Radar, pageKey: "radar-controladoria" },
  { title: "Radar Comercial", url: "/radar-comercial", icon: TrendingUp, pageKey: "radar-comercial" },
  { title: "Radar Bancário", url: "/radar-bancario", icon: Landmark, pageKey: "radar-bancario" },
  { title: "Radar Previdenciário", url: "/radar-previdenciario", icon: Scale, pageKey: "radar-previdenciario" },
  { title: "Radar Trabalhista", url: "/radar-trabalhista", icon: Briefcase, pageKey: "radar-trabalhista" },
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
  const hasGestaoAccess = hasPageAccess(mainItem.pageKey);

  // Verifica se algum radar está ativo para manter o menu aberto
  const isAnyRadarActive = useMemo(() => {
    return radarItems.some(item => isActive(item.url));
  }, [currentPath]);

  const [radarOpen, setRadarOpen] = useState(isAnyRadarActive);

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

              {/* Gestão Geral */}
              {hasGestaoAccess && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(mainItem.url)}
                    tooltip={mainItem.title}
                  >
                    <NavLink 
                      to={mainItem.url} 
                      end 
                      className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <mainItem.icon className="h-4 w-4" />
                      <span>{mainItem.title}</span>
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
