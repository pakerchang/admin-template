import { describe, expect, it } from "vitest";

import { fixtureShell } from "@/app/__tests__/fixture";
import { createCore } from "@/app/core";
import { operations } from "@/app/operations.gen";
import articlesModule from "@/modules/articles";
import authModule from "@/modules/auth";
import bannersModule from "@/modules/banners";
import consumersModule from "@/modules/consumers";
import ordersModule from "@/modules/orders";
import productModule from "@/modules/product";
import suppliersModule from "@/modules/suppliers";
import tagsModule from "@/modules/tags";
import teamMembersModule from "@/modules/team-members";
import usersModule from "@/modules/users";
import { apiBaseUrl } from "@/shared/api/fetcher";

import { createApp } from "../create-app";

import type { TModule } from "@/shared/module";
import type { TOperationTable } from "@/shared/permission";

const ALL: TModule[] = [
  authModule,
  usersModule,
  teamMembersModule,
  ordersModule,
  productModule,
  suppliersModule,
  consumersModule,
  bannersModule,
  articlesModule,
  tagsModule,
];

/** 以真實 module（扣掉 drop）與給定 operation 表建 app，模擬「只刪 .use() 與目錄」 */
const buildWithout = (drop: string[], ops: TOperationTable = operations) => {
  const app = createApp({
    shell: fixtureShell,
    operations: ops,
    apiBaseUrl,
    core: createCore({ isAuthenticated: () => true, getGrants: () => ["*"] }),
  });
  for (const m of ALL) if (!drop.includes(m.id)) app.use(m);
  return () => app.build();
};

/** 模擬 §8.2 步驟 2 + 4（刪 YAML tag 後重 gen）：去掉 permission 屬於 resource 的 operation */
const opsWithout = (resource: string): TOperationTable => {
  const gone = new Set(
    Object.entries(operations.permissions)
      .filter(([, p]) => p.startsWith(`${resource}:`))
      .map(([id]) => id)
  );
  return {
    routes: operations.routes.filter((r) => !gone.has(r.operationId)),
    permissions: Object.fromEntries(
      Object.entries(operations.permissions).filter(([id]) => !gone.has(id))
    ),
  };
};

describe("removing modules fails fast (M8 AC-3, §4.3 1.2 / 1.5.3, §8.2)", () => {
  it("drop suppliers but keep product → build() names product's missing requirement", () => {
    expect(buildWithout(["suppliers"], opsWithout("suppliers"))).toThrow(
      'module "product" requires "suppliers" but it is not installed'
    );
  });

  it("drop only orders' .use() + dir, YAML / operations.gen.ts untouched → 1.5.3 throws", () => {
    expect(buildWithout(["orders"])).toThrow(
      /^operation "\w+" requires "orders:\w+" which is not in any installed module's permission catalog$/
    );
  });

  it("control: after the YAML tag is removed and gen re-run, the same install builds", () => {
    expect(buildWithout(["orders"], opsWithout("orders"))).not.toThrow();
  });
});
