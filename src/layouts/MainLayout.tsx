import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-screen">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-primary-foreground/20 bg-primary px-4">
            <SidebarTrigger className="-ml-1 text-primary-foreground hover:bg-primary-foreground/10" />
            <div className="h-6 w-px bg-primary-foreground/20" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Sistema de Gestão Jurídica
            </span>
          </header>
          <main className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
