import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RouteTitlesContext } from "@/shared/module";
import { createTestI18n } from "@/test/i18n";

import useBreadcrumb from "../use-breadcrumb";

import type { ReactNode } from "react";

/** i18n-scope-migration AC-11 (c)：breadcrumb 由 registry 注入標題，不碰 key（假 registry、假字典，core-safe） */
let pathname = "/";
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
}));

const titles = new Map([
  ["/orders", "sales.nav.title"],
  ["/orders/order-list", "sales.nav.orderList"],
  ["/users", "users.nav.title"],
]);
const dict = (s: string) => ({
  breadcrumb: { home: `Home${s}`, create: `Create${s}`, edit: `Edit${s}` },
  sales: { nav: { title: `Sales${s}`, orderList: `List${s}` } },
  users: { nav: { title: `Users${s}` } },
});

const setup = (path: string) => {
  pathname = path;
  const { i18n, I18nWrapper } = createTestI18n({
    zh: dict("-zh"),
    en: dict("-en"),
  });
  const hook = renderHook(useBreadcrumb, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <RouteTitlesContext.Provider value={titles}>
          {children}
        </RouteTitlesContext.Provider>
      </I18nWrapper>
    ),
  });
  return { i18n, hook };
};
const labels = (items: { label: string }[]) => items.map((i) => i.label);

afterEach(() => vi.restoreAllMocks());

describe("useBreadcrumb", () => {
  it("nav 項目與 children 的 to → 注入文字", () => {
    expect(labels(setup("/orders/order-list").hook.result.current)).toEqual([
      "Home-zh",
      "Sales-zh",
      "List-zh",
    ]);
  });

  it("routeTitles 的 to（無 nav 的 route）→ 標題文字；edit → core breadcrumb；id → 原字串", () => {
    expect(labels(setup("/users/edit/user-1").hook.result.current)).toEqual([
      "Home-zh",
      "Users-zh",
      "Edit-zh",
      "user-1",
    ]);
  });

  it("create → core breadcrumb；未宣告的 segment → 原字串", () => {
    expect(labels(setup("/reports/create").hook.result.current)).toEqual([
      "Home-zh",
      "reports",
      "Create-zh",
    ]);
  });

  it("label 一律是 string；isActive 只在最後一段", () => {
    const items = setup("/orders/order-1001").hook.result.current;
    expect(items.map((i) => [typeof i.label, i.isActive])).toEqual([
      ["string", false],
      ["string", false],
      ["string", true],
    ]);
  });

  it("切語系後 nav 與 route 標題文字都更新", async () => {
    const { i18n, hook } = setup("/users");
    await act(() => i18n.changeLanguage("en"));
    expect(labels(hook.result.current)).toEqual(["Home-en", "Users-en"]);
  });

  it("跨路由深度 rerender：結果正確且沒有 hook 順序錯誤", async () => {
    const error = vi.spyOn(console, "error");
    const { i18n, hook } = setup("/orders");
    expect(labels(hook.result.current)).toEqual(["Home-zh", "Sales-zh"]);

    pathname = "/users/edit/user-1";
    hook.rerender();
    expect(labels(hook.result.current)).toEqual([
      "Home-zh",
      "Users-zh",
      "Edit-zh",
      "user-1",
    ]);

    pathname = "/";
    hook.rerender();
    expect(labels(hook.result.current)).toEqual(["Home-zh"]);

    pathname = "/orders/order-list";
    hook.rerender();
    expect(labels(hook.result.current)).toEqual([
      "Home-zh",
      "Sales-zh",
      "List-zh",
    ]);

    await act(() => i18n.changeLanguage("en"));
    expect(labels(hook.result.current)).toEqual([
      "Home-en",
      "Sales-en",
      "List-en",
    ]);
    expect(error).not.toHaveBeenCalled();
  });
});
