import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b border-primary-foreground/20 bg-primary px-4 sticky top-0 z-40">
            <SidebarTrigger className="-ml-1 text-primary-foreground hover:bg-primary-foreground/10" />
            <div className="h-6 w-px bg-primary-foreground/20" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Sistema de Gestão Jurídica
            </span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
