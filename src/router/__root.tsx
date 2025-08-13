import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Toaster } from "@/components/ui/toaster";

const publicKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const env = import.meta.env.MODE;

const queryClient = new QueryClient();

const RootComponent = () => {
  return (
    <ClerkProvider
      publishableKey={publicKey}
      afterSignOutUrl="/login"
      appearance={{
        baseTheme: dark,
      }}
    >
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
    </ClerkProvider>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
