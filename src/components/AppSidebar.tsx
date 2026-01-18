import { Home, Radar, TrendingUp, Landmark, Scale, Briefcase } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logoEscritorio from "@/assets/logo-escritorio.webp";

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
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Gestão Geral", url: "/", icon: Home },
  { title: "Radar Controladoria", url: "/radar-controladoria", icon: Radar },
  { title: "Radar Comercial", url: "/radar-comercial", icon: TrendingUp },
  { title: "Radar Bancário", url: "/radar-bancario", icon: Landmark },
  { title: "Radar Previdenciário", url: "/radar-previdenciario", icon: Scale },
  { title: "Radar Trabalhista", url: "/radar-trabalhista", icon: Briefcase },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

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
              {menuItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
