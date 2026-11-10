import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCore } from "@/app/core";
import { createApp, createAppRouter } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
// ponytail: orders 的 index.ts 未具名 export headless hook（src/modules 本棒不可改），測試直接取 model；tests 不受 boundaries lint
import { useGetOrderList } from "@/modules/orders/model/use-order";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { mountAsSuperadmin } from "@/test/sign-in";

import { fixtureShell } from "./fixture";

import type { TShell } from "@/shared/module";

/** 覆寫頁：只用 orders 的 headless model（D1：換 ui、model 共用），參數與預設頁首屏相同 */
const CompactOrderList = () => {
  const { data } = useGetOrderList({
    page: 1,
    limit: paginationSchema.parse({}).limit,
  });
  return (
    <ul data-testid="compact-orders">
      {data?.data?.map((o) => (
        <li key={o.order_id}>{o.order_id}</li>
      ))}
    </ul>
  );
};

/** 預設頁的 Navbar 需要 SidebarProvider（default shell 的 ProtectedLayout 提供） */
const sidebarShell: TShell = {
  ...fixtureShell,
  ProtectedLayout: () => (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  ),
};

const compactShell: TShell = {
  ...fixtureShell,
  id: "compact",
  pages: { "orders.list": CompactOrderList },
};

/** 每次一個新 QueryClient，才能比較兩棵 app 各自寫進 cache 的 query key 與資料 */
const renderOrderList = (shell: TShell) => {
  const client = new QueryClient();
  const app = installModules(
    createApp({
      shell,
      operations,
      apiBaseUrl,
      core: createCore({
        root: createRootRoute({
          component: () => (
            <QueryClientProvider client={client}>
              <Outlet />
            </QueryClientProvider>
          ),
        }),
        isAuthenticated: () => true,
        getGrants: () => ["*"],
      }),
    })
  );
  const router = createAppRouter(app.build().routeTree);
  router.update({
    history: createMemoryHistory({ initialEntries: ["/orders/order-list"] }),
  });
  render(<RouterProvider router={router} />);
  return { client, router };
};

const loadedOrderLists = async (client: QueryClient) => {
  let queries: ReturnType<ReturnType<QueryClient["getQueryCache"]>["findAll"]> =
    [];
  await waitFor(
    () => {
      queries = client
        .getQueryCache()
        .findAll({ queryKey: ["orderList"] })
        .filter((q) => q.state.status === "success");
      expect(queries).not.toHaveLength(0);
      // 全量平行跑時首次渲染整個 shell 會超過預設 1s（實測 1.4s 失敗）
    },
    { timeout: 5000 }
  );
  return queries.map((q) => ({ key: q.queryKey, data: q.state.data }));
};

describe("shell.pages overrides a page by route id (M8 AC-2, D1 / R2 / R23)", () => {
  beforeEach(async () => {
    // SidebarProvider 的 useIsMobile 用 matchMedia，jsdom 沒有
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    await mountAsSuperadmin();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('pages["orders.list"] renders the override with the same orders model data as the default page', async () => {
    const byDefault = renderOrderList(sidebarShell);
    const defaultLists = await loadedOrderLists(byDefault.client);
    expect(screen.queryByTestId("compact-orders")).not.toBeInTheDocument();
    byDefault.router.history.destroy();

    document.body.innerHTML = "";
    const overridden = renderOrderList(compactShell);
    const list = await screen.findByTestId("compact-orders");
    const overrideLists = await loadedOrderLists(overridden.client);

    expect(overridden.router.state.matches.at(-1)?.staticData.routeId).toBe(
      "orders.list"
    );
    // 同一 query key、同一份資料（headless model 共用）
    expect(overrideLists.map((q) => q.key)).toEqual(
      defaultLists.map((q) => q.key)
    );
    expect(overrideLists.map((q) => q.data)).toEqual(
      defaultLists.map((q) => q.data)
    );
    const ids = (
      overrideLists[0].data as { data: { order_id: string }[] }
    ).data.map((o) => o.order_id);
    expect(ids.length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        [...list.querySelectorAll("li")].map((li) => li.textContent)
      ).toEqual(ids)
    );
  });
});
