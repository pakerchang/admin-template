import { Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { LoadingPage } from "@/components/shared/LoadingPage";
import { UnauthorizedPage } from "@/components/shared/UnauthorizedPage";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  useGlobalPrefetchUserRole,
  useUserPermissions,
} from "@/pages/users/hooks/use-user";

const BackendAccessController = () => {
  useGlobalPrefetchUserRole();

  const { canAccessAdminPanel, isLoading } = useUserPermissions();

  if (isLoading) {
    return <LoadingPage />;
  }

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

export const ProtectedAppLayout = () => {
  return (
    <>
      {/* <SignedIn> */}
      <BackendAccessController />
      {/* </SignedIn>
      <SignedOut>
        <Navigate to="/login" />
      </SignedOut> */}
    </>
  );
};
