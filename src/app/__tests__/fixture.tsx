import { createMemoryHistory, Outlet } from "@tanstack/react-router";

import { createCore } from "@/app/core";
import { createApp, createAppRouter } from "@/app/kernel/create-app";
import { operations } from "@/app/mock";
import { installModules } from "@/app/modules";
import { apiBaseUrl } from "@/services/api-client";

import type { TCore } from "@/app/kernel/build";
import type { TShell } from "@/shared/module";

/** 只有 testid 的 shell，讓測試不必渲染 sidebar */
export const fixtureShell: TShell = {
  id: "fixture",
  ProtectedLayout: () => (
    <div data-testid="protected-layout">
      <Outlet />
    </div>
  ),
  AuthLayout: Outlet,
  Forbidden: () => <div data-testid="forbidden" />,
};

/** 以真實的 10 個 module 建 app（app/modules.ts） */
export const makeApp = (core: Partial<TCore> = {}) =>
  installModules(
    createApp({
      shell: fixtureShell,
      operations,
      apiBaseUrl,
      core: createCore({
        isAuthenticated: () => true,
        getGrants: () => ["*"],
        ...core,
      }),
    })
  );

export const routerAt = (app: ReturnType<typeof makeApp>, url: string) => {
  const { routeTree, registry } = app.build();
  const router = createAppRouter(routeTree, registry);
  router.update({ history: createMemoryHistory({ initialEntries: [url] }) });
  return router;
};
