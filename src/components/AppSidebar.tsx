import { Home, Radar, TrendingUp, Landmark, Scale, Briefcase, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logoEscritorio from "@/assets/logo-escritorio.webp";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Gestão Geral", url: "/", icon: Home, pageKey: "gestao-geral" },
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

  const visibleMenuItems = menuItems.filter(item => hasPageAccess(item.pageKey));

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
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
            <div className="text-xs text-primary-foreground/70 truncate">
              {profile.display_name}
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
