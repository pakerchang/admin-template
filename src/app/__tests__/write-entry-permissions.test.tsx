import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp, createAppRouter } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { users } from "@/modules/users/mocks/seed";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { clearAuth, setAuth } from "@/shared/api/session";
import { ForbiddenError } from "@/shared/permission";
import { defaultShell } from "@/shells/default";
import { apiFetch } from "@/test/api-fetch";
import { server } from "@/test/setup";

import { makeApp } from "./fixture";

import type { TAuthSession } from "@/shared/api/session";
import type { TGrant } from "@/shared/permission";

/**
 * F-1（docs/specs/f1-permission-declarations.spec.md）：唯讀角色看不到寫入入口、進不了 create / edit。
 * grants 來自真實 login（permission-matrix + module mockGrants 展開）；token 讓 MSW guard 放行讀取，
 * 頁面資料真的載入後才斷言「沒有」入口，避免空表格假綠。
 */
// shadcn sidebar 的 useIsMobile 需要 matchMedia（jsdom 沒有）；頁面的 Navbar 需要真實 shell 的 SidebarProvider
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
const { registry } = makeApp().build();
beforeEach(() => server.resetHandlers(...registry.mockHandlers));
afterEach(() => clearAuth());

/** role 決定 token（讀取 API 用）；grantsOverride 只換 session 內的 grants（product 沒有唯讀角色時用合成 grants） */
const renderAt = async (
  url: string,
  role: string,
  grantsOverride?: TGrant[]
) => {
  const { body } = await apiFetch<TAuthSession>("/api/auth/login", {
    method: "POST",
    body: {
      email: users.find((u) => u.role === role)!.email,
      password: DEMO_ACCOUNT.password,
    },
  });
  setAuth({ ...body, grants: grantsOverride ?? body.grants });
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
  return router;
};

// 整個 app（真 shell + DataTable）渲染，全量並行時單測可達數秒：放寬等待與逾時
const WAIT = { timeout: 15_000 };
const TEST_TIMEOUT = 30_000;

// typed-contracts T1：domain 權限在 core-only 不在 registry → 以 string 宣告再 cast（執行期行為不變）
const PRODUCT_READ_ONLY = [
  "app:access",
  "product:read",
] as string[] as TGrant[];

const btn = (name: string) => screen.queryAllByRole("button", { name });

type TPage = {
  path: string;
  create: string;
  /** 頁面資料已載入的訊號 */
  loaded: () => Promise<unknown>;
  /** 除 common.edit / common.delete 外的寫入入口（按鈕名稱） */
  extra?: string[];
};

const tableLoaded = () =>
  waitFor(
    () => expect(screen.getAllByRole("row").length).toBeGreaterThan(1),
    WAIT
  );

const PAGES: Record<string, TPage> = {
  tags: { path: "/tags", create: "tags.addTag", loaded: tableLoaded },
  suppliers: {
    path: "/suppliers",
    create: "suppliers.addSupplier",
    loaded: tableLoaded,
  },
  "team-members": {
    path: "/team-members",
    create: "team-members.createStaff",
    loaded: tableLoaded,
  },
  articles: {
    path: "/articles",
    create: "articles.common.createArticle",
    loaded: tableLoaded,
  },
  banners: {
    path: "/banners",
    create: "banners.addBanner",
    loaded: () =>
      waitFor(
        () => expect(screen.getAllByRole("img").length).toBeGreaterThan(1),
        WAIT
      ),
    extra: [
      "banners.actions.promoteToActive",
      "banners.actions.demoteToInactive",
    ],
  },
  product: {
    path: "/products",
    create: "product.productCreate.addProduct",
    loaded: tableLoaded,
    extra: ["product.productDraft.copyToCreate"],
  },
};

const writeEntries = (page: TPage) => ({
  create: btn(page.create).length,
  edit: btn("common.edit").length,
  delete: btn("common.delete").length,
  ...Object.fromEntries((page.extra ?? []).map((n) => [n, btn(n).length])),
  ...(page.path === "/banners" && {
    draggable: document.querySelectorAll(".cursor-grab").length,
  }),
});

describe("AC-1：唯讀角色看不到寫入入口，admin 看得到", () => {
  const readOnly: [string, string, TGrant[] | undefined][] = [
    ...["tags", "suppliers", "team-members", "articles", "banners"].flatMap(
      (p) =>
        ["support", "partner"].map(
          (r) => [p, r, undefined] as [string, string, undefined]
        )
    ),
    ["product", "partner", PRODUCT_READ_ONLY],
  ];

  it.each(readOnly)(
    "%s as %s: no write entries",
    async (p, role, grants) => {
      const page = PAGES[p];
      await renderAt(page.path, role, grants);
      await page.loaded();
      const counts = writeEntries(page);
      expect(counts).toEqual(
        Object.fromEntries(Object.keys(counts).map((k) => [k, 0]))
      );
    },
    TEST_TIMEOUT
  );

  it.each(Object.keys(PAGES))(
    "%s as admin: every write entry shown",
    async (p) => {
      const page = PAGES[p];
      await renderAt(page.path, "admin");
      await page.loaded();
      const counts = writeEntries(page);
      for (const [k, n] of Object.entries(counts))
        expect([k, n > 0]).toEqual([k, true]);
    },
    TEST_TIMEOUT
  );
});

describe("AC-2：唯讀角色直接進 create / edit，內容區 Forbidden、URL 不變", () => {
  it.each([
    ["/articles/create", "partner", undefined],
    ["/banners/edit/banner-1", "partner", undefined],
    ["/products/create", "partner", PRODUCT_READ_ONLY],
    ["/products/edit/1", "partner", PRODUCT_READ_ONLY],
    ["/products/draft/1", "partner", PRODUCT_READ_ONLY],
  ] as [string, string, TGrant[] | undefined][])(
    "%s as %s → shell.Forbidden",
    async (url, role, grants) => {
      const router = await renderAt(url, role, grants);
      const forbidden = await screen.findByText(
        "unauthorized.accessDenied.title",
        undefined,
        WAIT
      );
      expect(
        within(document.querySelector("main")!).getByText(
          "unauthorized.accessDenied.title"
        )
      ).toBe(forbidden);
      expect(router.state.location.pathname).toBe(url);
    },
    TEST_TIMEOUT
  );

  it.each(["/articles/create", "/banners/edit/banner-1", "/products/create"])(
    "%s as admin → not forbidden",
    async (url) => {
      const router = await renderAt(url, "admin");
      await router.load();
      expect(
        router.state.matches.some((m) => m.error instanceof ForbiddenError)
      ).toBe(false);
    },
    TEST_TIMEOUT
  );
});

describe("user-create AC-7：只有 superadmin 能新增使用者（OD-UC-1 = A）", () => {
  it.each([
    ["admin", 0],
    ["superadmin", 1],
  ])(
    "/users as %s: add-user buttons = %i",
    async (role, expected) => {
      await renderAt("/users", role);
      await tableLoaded();
      expect(btn("users.addUser")).toHaveLength(expected);
    },
    TEST_TIMEOUT
  );

  it(
    "/users/create as admin → shell.Forbidden, URL unchanged",
    async () => {
      const router = await renderAt("/users/create", "admin");
      const forbidden = await screen.findByText(
        "unauthorized.accessDenied.title",
        undefined,
        WAIT
      );
      expect(
        within(document.querySelector("main")!).getByText(
          "unauthorized.accessDenied.title"
        )
      ).toBe(forbidden);
      expect(router.state.location.pathname).toBe("/users/create");
    },
    TEST_TIMEOUT
  );

  it(
    "/users/create as superadmin → not forbidden",
    async () => {
      const router = await renderAt("/users/create", "superadmin");
      await router.load();
      expect(
        router.state.matches.some((m) => m.error instanceof ForbiddenError)
      ).toBe(false);
    },
    TEST_TIMEOUT
  );
});
