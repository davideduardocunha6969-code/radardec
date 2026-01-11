import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 sticky top-0 z-40">
            <SidebarTrigger className="-ml-1" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">
              Sistema de Gestão Jurídica
            </span>
          </header>
          <main className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
