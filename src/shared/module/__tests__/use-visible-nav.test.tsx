import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavContext, useVisibleNav } from "@/shared/module";
import { GrantsContext } from "@/shared/permission";

import type { TNavItem } from "@/shared/module";
import type { TGrant } from "@/shared/permission";
import type { ReactNode } from "react";

const nav: TNavItem[] = [
  { id: "users", label: "users.nav", to: "/users", permission: "users:read" },
  {
    id: "orders",
    label: "orders.nav",
    to: "/orders",
    permission: "orders:read",
    children: [
      {
        id: "orders.list",
        label: "orders.list",
        to: "/orders/list",
        permission: "orders:read",
      },
      {
        id: "orders.export",
        label: "orders.export",
        to: "/orders/export",
        permission: "orders:export",
      },
    ],
  },
  {
    id: "reports",
    label: "reports.nav",
    to: "/reports",
    permission: "reports:read",
    children: [
      {
        id: "reports.x",
        label: "reports.x",
        to: "/reports/x",
        permission: "reports:export",
      },
    ],
  },
];

const visible = (grants: TGrant[], provideNav = true) =>
  renderHook(useVisibleNav, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <GrantsContext.Provider value={() => grants}>
        {provideNav ? (
          <NavContext.Provider value={nav}>{children}</NavContext.Provider>
        ) : (
          children
        )}
      </GrantsContext.Provider>
    ),
  }).result.current;

const ids = (items: TNavItem[]) =>
  items.map((i) => [i.id, i.children?.map((c) => c.id)]);

describe("useVisibleNav (§6.3, AC-1 nav side)", () => {
  it("superadmin sees everything (AC-6)", () => {
    expect(visible(["*"])).toEqual(nav);
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
