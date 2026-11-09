// a2：a1 guard 測試改吃 module 目錄產物；kernel 端只 import app/（module 註冊表 + gen 聚合檔）
import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as A from "../split-a/app/modules";
import * as genA from "../split-a/app/operations.gen";
import * as B from "../split-b/app/modules";
import * as genB from "../split-b/app/operations.gen";
// 測試扮演 UI：只經 module 公開面
import * as bannersA from "../split-a/modules/banners";
import * as usersA from "../split-a/modules/users";
import * as bannersB from "../split-b/modules/banners";
import * as usersB from "../split-b/modules/users";
import { createPermissionGuard } from "../src/permissions";

const ROLE_PERMS: Record<string, string[]> = { viewer: ["banners.read"], admin: ["banners.read", "banners.manage", "users.read"] };
const as = (role: string): RequestInit => ({ headers: { Authorization: `Bearer ${role}` } });
const img = { file_name: "a.png", file_url: "https://x/a.png" };
const body = { title: "hi", desktop_image_url: img, mobile_image_url: img, redirect_url: "https://e.com", sort_order: 1, banner_status: "active" } as const;

describe.each([
  { name: "A 多 yaml 片段", app: A, gen: genA, banners: bannersA, users: usersA },
  { name: "B 單 yaml 依 tag", app: B, gen: genB, banners: bannersB, users: usersB },
])("$name", ({ app, gen, banners, users }) => {
  const guard = createPermissionGuard({
    routes: gen.operationRoutes,
    permissions: gen.operationPermissions,
    getGranted: (req) => new Set(ROLE_PERMS[req.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""] ?? []),
    apiBaseUrl: "http://api.test",
  });
  const server = setupServer(guard, ...app.modules.flatMap((m) => m.mockHandlers));
  beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
  afterAll(() => server.close());

  it("無權限 → 403，guard 擋下不進 handler", async () => {
    const before = banners.bannerDb.length;
    const res = await banners.createBanner(body, as("viewer"));
    expect(res.status).toBe(403);
    expect(banners.bannerDb.length).toBe(before);
    expect((await users.listUsers(undefined, as("viewer"))).status).toBe(403);
  });

  it("有權限 → 200，fall through 到 module mocks/ 的 handler（含記憶體狀態）", async () => {
    expect((await banners.createBanner(body, as("admin"))).status).toBe(200);
    const res = await banners.listBanners(undefined, as("viewer"));
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("unreachable");
    expect(res.data.total).toBe(1);
    expect((await users.listUsers(undefined, as("admin"))).status).toBe(200);
  });
});
