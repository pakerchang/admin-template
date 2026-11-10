import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { coreGrants, mergeGrants } from "@/app/mock/permission-matrix";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { users } from "@/modules/users/mocks/seed";
import { NavContext, useVisibleNav } from "@/shared/module";
import { can, GrantsContext } from "@/shared/permission";
import { apiFetch } from "@/test/api-fetch";
import { server } from "@/test/setup";

import type { TAuthSession } from "@/shared/api/session";
import type { TNavItem } from "@/shared/module";
import type { TGrantMatrix } from "@/shared/permission";
import type { ReactNode } from "react";

const { registry } = makeApp().build();
const matrix: TGrantMatrix = mergeGrants(
  coreGrants,
  ...registry.modules.flatMap((m) =>
    m.permissions?.mockGrants ? [m.permissions.mockGrants] : []
  )
);

const visibleNav = (role: string) =>
  renderHook(useVisibleNav, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <GrantsContext.Provider value={() => matrix[role] ?? []}>
        <NavContext.Provider value={registry.nav}>
          {children}
        </NavContext.Provider>
      </GrantsContext.Provider>
    ),
  }).result.current;

const ids = (items: TNavItem[]) =>
  items.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]);

/**
 * 期望值 = 依 main 裁決調整後的矩陣（m4-fix2 報告「矩陣最終內容」，owner 2026-11-10 覆核定案（OD-GRANT-1）），不是 6029bf0 畫面的逐字重現：
 * - 6029bf0 sidebar 8 項、AppSidebar 不過濾（constants/sidebar.tsx:20-65、AppSidebar.tsx:79），子頁 route 無檢查（router/routes.tsx:55-57）
 *   → 沒有檢查的頁 = 所有後台角色可見
 * - D1：support / partner 在 6029bf0 其實進不了後台（ProtectedAppLayout.tsx:9-13 的 canAccessAdminPanel 限 admin/superadmin）；
 *   可進後台（app:access）是 main 裁決
 * - D2：products / orders 依 canManageProducts（admin/superadmin/partner）、canManageOrders（admin/superadmin/support）
 *   （pages/users/hooks/use-user.ts:166-171；spec §6.1 對照 product:* / orders:*）；這兩個條件在 6029bf0 只有定義、沒有消費點，
 *   視為「有檢查」是 main 裁決
 */
const ALL = [
  "consumers",
  "team-members",
  "suppliers",
  "tags",
  "product",
  "orders",
  "orders.order-list",
  "banners",
  "articles",
];
const without = (...drop: string[]) => ALL.filter((id) => !drop.includes(id));

describe("各角色可見 nav 符合依 main 裁決調整後的矩陣（m4-fix2）", () => {
  it.each([
    ["superadmin", ALL],
    ["admin", ALL],
    ["support", without("product")],
    ["partner", without("orders", "orders.order-list")],
  ])("%s", (role, expected) => {
    expect(ids(visibleNav(role))).toEqual(expected);
  });

  it("every back-office role has app:access", () => {
    for (const role of ["superadmin", "admin", "support", "partner"])
      expect(can(matrix[role], "app:access")).toBe(true);
  });

  it("only superadmin may update users or their role (use-user.ts:164-165)", () => {
    for (const role of ["superadmin", "admin", "support", "partner"]) {
      expect([role, can(matrix[role], "users:update")]).toEqual([
        role,
        role === "superadmin",
      ]);
      expect([role, can(matrix[role], "users:update-role")]).toEqual([
        role,
        role === "superadmin",
      ]);
    }
  });
});

/** login 後展開的完整 grants（m4-fix2 報告「矩陣最終內容」，寫死） */
const EXPECTED_GRANTS: Record<string, string[]> = {
  superadmin: ["*"],
  admin: [
    "app:access",
    "users:read",
    "team-members:*",
    "orders:*",
    "product:*",
    "suppliers:*",
    "consumers:*",
    "banners:*",
    "articles:*",
    "tags:*",
  ],
  support: [
    "app:access",
    "team-members:read",
    "orders:*",
    "suppliers:read",
    "consumers:read",
    "banners:read",
    "articles:read",
    "tags:read",
  ],
  partner: [
    "app:access",
    "team-members:read",
    "product:*",
    "suppliers:read",
    "consumers:read",
    "banners:read",
    "articles:read",
    "tags:read",
  ],
};

describe("各角色 login 後的完整 grants 集合（W3）", () => {
  it.each(Object.entries(EXPECTED_GRANTS))("%s", async (role, expected) => {
    server.resetHandlers(...registry.mockHandlers);
    const res = await apiFetch<TAuthSession>("/api/auth/login", {
      method: "POST",
      body: {
        email: users.find((u) => u.role === role)!.email,
        password: DEMO_ACCOUNT.password,
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe(role);
    expect([...(res.body.grants ?? [])].sort()).toEqual([...expected].sort());
  });
});
