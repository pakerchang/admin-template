import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp, createAppRouter } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl, clearAuth, setAuth } from "@/services/api-client";
import { defaultShell } from "@/shells/default";

import type { TGrant } from "@/shared/permission";

// shadcn sidebar 的 useIsMobile 需要 matchMedia（jsdom 沒有）
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => clearAuth());

/** 真實 default shell + 預設 createCore()：grants 走 setAuth → session.grants → core.getGrants */
const renderAt = async (url: string, grants: TGrant[]) => {
  setAuth({
    token: "t",
    user: { user_id: "user-3", email: "c", name: "c", role: "support" },
    grants,
  });
  const app = installModules(
    createApp({
      shell: defaultShell,
      operations,
      apiBaseUrl,
      core: createCore(),
    })
  );
  const router = createAppRouter(app.build().routeTree);
  router.update({ history: createMemoryHistory({ initialEntries: [url] }) });
  render(<RouterProvider router={router} />);
  const forbidden = await screen.findByText("unauthorized.accessDenied.title");
  return { router, forbidden };
};

const sidebarLabels = () =>
  Array.from(
    document.querySelectorAll('[data-sidebar="menu-button"] span')
  ).map((el) => el.textContent);

describe("content-area 403 (AC-1, R10)", () => {
  it("support without users:read on /users: URL kept, sidebar rendered, Forbidden inside <main>", async () => {
    const { router, forbidden } = await renderAt("/users", [
      "app:access",
      "orders:*",
    ]);

    expect(router.state.location.pathname).toBe("/users");
    const main = document.querySelector("main")!;
    expect(within(main).getByText("unauthorized.accessDenied.title")).toBe(
      forbidden
    );
    // shell 仍在：sidebar 渲染，且只有 support 可見的項目
    expect(document.querySelector('[data-sidebar="sidebar"]')).not.toBeNull();
    const labels = sidebarLabels();
    expect(labels).toContain("dashboard.menu.orders.title");
    expect(labels.some((l) => l?.includes("users"))).toBe(false);
    expect(labels).not.toContain("dashboard.menu.products.title");
  });

  it("nested layout guard (/users/edit/1) also renders inside the shell", async () => {
    const { router } = await renderAt("/users/edit/1", [
      "app:access",
      "orders:*",
    ]);
    expect(router.state.location.pathname).toBe("/users/edit/1");
    expect(document.querySelector('[data-sidebar="sidebar"]')).not.toBeNull();
  });

  it("session without app:access: layout still renders, nav empty, content 403 (§6.2)", async () => {
    const { router } = await renderAt("/orders/order-list", ["orders:*"]);
    expect(router.state.location.pathname).toBe("/orders/order-list");
    expect(document.querySelector('[data-sidebar="sidebar"]')).not.toBeNull();
    expect(sidebarLabels()).toEqual([]);
  });
});
