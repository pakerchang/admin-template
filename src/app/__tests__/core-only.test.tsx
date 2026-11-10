import { createMemoryHistory } from "@tanstack/react-router";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp, createAppRouter } from "@/app/kernel/create-app";
import { coreGrants, mergeGrants } from "@/app/mock/permission-matrix";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { NavContext, useVisibleNav } from "@/shared/module";
import { GrantsContext } from "@/shared/permission";

import { fixtureShell, makeApp } from "./fixture";

import type { TOperationTable } from "@/shared/permission";
import type { ReactNode } from "react";

/**
 * M8 AC-4 的自動佐證（瀏覽器驗收仍待驗）：只裝 generic module 的 app。
 * 不引用任何 domain module，因此 scripts/verify-core-only.sh 的 core-only 副本也會跑本檔（那裡 operations.gen.ts 已是 core-only）。
 */
const generic = makeApp()
  .build()
  .registry.modules.filter((m) => m.kind === "generic");

/** 模擬 §8.2 重 gen：只留 public 與 generic module（+ kernel `app`）權限目錄內的 operation；core-only 副本中為 no-op */
const resources = new Set([
  "app",
  ...generic.flatMap((m) => Object.keys(m.permissions?.resources ?? {})),
]);
const keep = new Set(
  Object.entries(operations.permissions)
    .filter(([, p]) => p === "public" || resources.has(p.split(":")[0]))
    .map(([id]) => id)
);
const coreOps: TOperationTable = {
  routes: operations.routes.filter((r) => keep.has(r.operationId)),
  permissions: Object.fromEntries(
    Object.entries(operations.permissions).filter(([id]) => keep.has(id))
  ),
};

const coreApp = () => {
  const app = createApp({
    shell: fixtureShell,
    operations: coreOps,
    apiBaseUrl,
    core: createCore({ isAuthenticated: () => true, getGrants: () => ["*"] }),
  });
  for (const m of generic) app.use(m);
  return app;
};

describe("core-only app (M8 AC-4 automated evidence, D4)", () => {
  it("installs only the generic modules", () => {
    expect(generic.map((m) => m.id).sort()).toEqual([
      "auth",
      "team-members",
      "users",
    ]);
  });

  it("superadmin sees only the generic nav (users declares none, M3 behaviour)", () => {
    const { registry } = coreApp().build();
    const superadmin = mergeGrants(
      coreGrants,
      ...generic.flatMap((m) =>
        m.permissions?.mockGrants ? [m.permissions.mockGrants] : []
      )
    ).superadmin;
    const nav = renderHook(useVisibleNav, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <GrantsContext.Provider value={() => superadmin}>
          <NavContext.Provider value={registry.nav}>
            {children}
          </NavContext.Provider>
        </GrantsContext.Provider>
      ),
    }).result.current;
    expect(nav.map((n) => n.to)).toEqual(["/team-members"]);
  });

  it("'/' redirects to the first visible nav item", async () => {
    const router = createAppRouter(coreApp().build().routeTree);
    router.update({ history: createMemoryHistory({ initialEntries: ["/"] }) });
    await router.load();
    expect(router.state.location.pathname).toBe("/team-members");
  });
});
