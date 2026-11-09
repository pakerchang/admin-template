import { Outlet } from "@tanstack/react-router";

import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useUserPermissions } from "@/pages/users/hooks/use-user";
import { AppSidebar } from "@/shells/default/app-sidebar";

export const ProtectedAppLayout = () => {
  const { canAccessAdminPanel } = useUserPermissions();

  if (!canAccessAdminPanel) {
    return <UnauthorizedPage />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <main className="dark:bg-sidebar-background flex h-full flex-1 bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
