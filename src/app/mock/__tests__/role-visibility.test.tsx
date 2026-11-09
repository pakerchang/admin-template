import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { coreGrants, mergeGrants } from "@/app/mock/permission-matrix";
import { NavContext, useVisibleNav } from "@/shared/module";
import { can, GrantsContext } from "@/shared/permission";

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
 * 重構前（master 6029bf0）各角色可見 sidebar，期望值寫死：
 * - sidebar 8 項、AppSidebar 不過濾（constants/sidebar.tsx:20-65、AppSidebar.tsx:79），子頁 route 無檢查（router/routes.tsx:55-57）
 *   → 沒有檢查的頁 = 所有後台角色可見
 * - products / orders 照舊條件 canManageProducts（admin/superadmin/partner）、canManageOrders（admin/superadmin/support）
 *   （pages/users/hooks/use-user.ts:166-171；spec §6.1 對照 product:* / orders:*）
 * - support / partner 可進後台是 main 裁決（app:access）；6029bf0 ProtectedAppLayout.tsx:9-13 原本擋掉，見 m4-fix2 報告 DECISION D1
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

describe("各角色可見 nav 與重構前一致（m4-fix2）", () => {
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
