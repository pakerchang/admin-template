import Breadcrumb from "@/components/shared/Breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useBreadcrumb from "@/hooks/use-breadcrumb";

export const Navbar = ({ children }: { children?: React.ReactNode }) => {
  const breadcrumbs = useBreadcrumb();
  return (
    <div className="dark:bg-sidebar-background sticky top-0 z-10 flex h-16 items-center gap-1.5 border-b bg-background px-4">
      <SidebarTrigger />
      <Breadcrumb items={breadcrumbs} />
      {children}
    </div>
  );
};
