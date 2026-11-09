import { Outlet } from "@tanstack/react-router";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/shells/default/app-sidebar";

/** 無權限不在這裡判斷：內容區的 shell.Forbidden 由 kernel 注入的 ForbiddenBoundary 渲染於 <Outlet />（R10） */
export const ProtectedAppLayout = () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset className="flex flex-1 flex-col">
      <main className="dark:bg-sidebar-background flex h-full flex-1 bg-background">
        <Outlet />
      </main>
    </SidebarInset>
  </SidebarProvider>
);
