import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Toaster } from "@/components/ui/toaster";

const env = import.meta.env.MODE;

const queryClient = new QueryClient();

const RootComponent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {env === "staging" && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools client={queryClient} />
        </>
      )}
      <Toaster />
    </QueryClientProvider>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
