import { act, renderHook } from "@testing-library/react";
import { describe, expect, expectTypeOf, it } from "vitest";

import { NavContext, RouteTitlesContext, useVisibleNav } from "@/shared/module";
import { GrantsContext } from "@/shared/permission";
import { createTestI18n } from "@/test/i18n";

import type { TRegistryNavItem, TResolvedNavItem } from "@/shared/module";
import type { TGrant } from "@/shared/permission";
import type { ReactNode } from "react";

/** typed-contracts T1：fixture 刻意含 registry 外 / core-only 不存在的權限字串 → 以 string 宣告、在注入點 cast（執行期行為不變） */
const nav = [
  {
    id: "users",
    labelKey: "users.nav.title",
    to: "/users",
    permission: "users:read",
  },
  {
    id: "orders",
    labelKey: "orders.nav.title",
    to: "/orders",
    permission: "orders:read",
    children: [
      {
        id: "orders.list",
        labelKey: "orders.nav.list",
        to: "/orders/list",
        permission: "orders:read",
      },
      {
        id: "orders.export",
        labelKey: "orders.nav.export",
        to: "/orders/export",
        permission: "orders:export",
      },
    ],
  },
  {
    id: "reports",
    labelKey: "reports.nav.title",
    to: "/reports",
    permission: "reports:read",
    children: [
      {
        id: "reports.x",
        labelKey: "reports.nav.x",
        to: "/reports/x",
        permission: "reports:export",
      },
    ],
  },
];

const dict = (suffix: string) => ({
  users: { nav: { title: `Users${suffix}` } },
  orders: {
    nav: {
      title: `Orders${suffix}`,
      list: `List${suffix}`,
      export: `Export${suffix}`,
    },
  },
  reports: { nav: { title: `Reports${suffix}`, x: `X${suffix}` } },
  /** 只宣告 routeTitles 的 module：有標題、不在 nav */
  profile: { nav: { title: `Profile${suffix}` } },
});
const titles = new Map([
  ...nav
    .flatMap((n) => [n, ...(n.children ?? [])])
    .map((n) => [n.to, n.labelKey] as const),
  ["/profile", "profile.nav.title"] as const,
]);

const render = (grants: string[], provideNav = true) => {
  const { i18n, I18nWrapper } = createTestI18n({
    zh: dict("-zh"),
    en: dict("-en"),
  });
  const hook = renderHook(useVisibleNav, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <GrantsContext.Provider value={() => grants as TGrant[]}>
          {provideNav ? (
            <NavContext.Provider value={nav as TRegistryNavItem[]}>
              <RouteTitlesContext.Provider value={titles}>
                {children}
              </RouteTitlesContext.Provider>
            </NavContext.Provider>
          ) : (
            children
          )}
        </GrantsContext.Provider>
      </I18nWrapper>
    ),
  });
  return { i18n, hook };
};
const visible = (grants: string[], provideNav = true) =>
  render(grants, provideNav).hook.result.current;

const ids = (items: TResolvedNavItem[]) =>
  items.map((i) => [i.id, i.children?.map((c) => c.id)]);

describe("useVisibleNav (§6.3, AC-1 nav side)", () => {
  it("superadmin sees everything (AC-6)", () => {
    expect(ids(visible(["*"]))).toEqual([
      ["users", undefined],
      ["orders", ["orders.list", "orders.export"]],
      ["reports", ["reports.x"]],
    ]);
  });

  it("hides items without the grant (support: no users entry)", () => {
    expect(ids(visible(["app:access", "orders:*"]))).toEqual([
      ["orders", ["orders.list", "orders.export"]],
    ]);
  });

  it("filters children by their own permission", () => {
    expect(ids(visible(["orders:read"]))).toEqual([
      ["orders", ["orders.list"]],
    ]);
  });

  it("hides the parent when every child is filtered out", () => {
    expect(ids(visible(["reports:read"]))).toEqual([]);
  });

  it("no grants / no providers → empty (fail-closed)", () => {
    expect(visible([])).toEqual([]);
    expect(visible(["*"], false)).toEqual([]);
  });
});

describe("useVisibleNav label 注入（i18n-scope-migration AC-11 (a)）", () => {
  it("頂層與 children 的 label 皆為已翻譯 string，項目不含 key 欄位", () => {
    const items = visible(["*"]);
    const all = items.flatMap((i) => [i, ...(i.children ?? [])]);
    expect(all.map((i) => i.label)).toEqual([
      "Users-zh",
      "Orders-zh",
      "List-zh",
      "Export-zh",
      "Reports-zh",
      "X-zh",
    ]);
    for (const i of all) {
      expect(typeof i.label).toBe("string");
      expect(i).not.toHaveProperty("labelKey");
    }
  });

  it("i18n.changeLanguage 後同一個 hook 回傳另一語系文字", async () => {
    const { i18n, hook } = render(["*"]);
    expect(hook.result.current[1].label).toBe("Orders-zh");
    await act(() => i18n.changeLanguage("en"));
    expect(hook.result.current[1].label).toBe("Orders-en");
    expect(hook.result.current[1].children?.[0].label).toBe("List-en");
  });

  it("只宣告 routeTitles 的 module 不出現在回傳清單", () => {
    expect(visible(["*"]).map((i) => i.to)).not.toContain("/profile");
  });

  it("型別：label 為 string、沒有 labelKey", () => {
    expectTypeOf<TResolvedNavItem["label"]>().toEqualTypeOf<string>();
    // @ts-expect-error TResolvedNavItem 不外流 labelKey
    type _NoKey = TResolvedNavItem["labelKey"];
  });
});
