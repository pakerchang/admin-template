// a3：guard fail-closed（B 切法產物 + kernel 聚合檔）
import { spawnSync } from "node:child_process";
import { getResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { modules } from "../split-b/app/modules";
import { operationPermissions, operationRoutes } from "../split-b/app/operations.gen";
import { login } from "../split-b/modules/auth";
import { listBanners } from "../split-b/modules/banners";
import { listUsers } from "../split-b/modules/users";
import { assertPermissionsComplete, createPermissionGuard, fromModules } from "../src/permissions";

const ROLE_PERMS: Record<string, string[]> = { viewer: ["banners:read"], admin: ["banners:read", "banners:manage", "users:read"] };
const API = "http://api.test";
const guardWith = (permissions: Record<string, string>) =>
  createPermissionGuard({
    routes: operationRoutes,
    permissions,
    getGranted: (req) => new Set(ROLE_PERMS[req.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""] ?? []),
    apiBaseUrl: API,
  });
const as = (role: string): RequestInit => ({ headers: { Authorization: `Bearer ${role}` } });

const server = setupServer(guardWith(operationPermissions), ...modules.flatMap((m) => m.mockHandlers));
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("runtime guard", () => {
  it("比對到 route 但沒宣告 → 403，body 指出 operationId（admin 也一樣）", async () => {
    const { listUsers: _, ...withoutListUsers } = operationPermissions;
    server.use(guardWith(withoutListUsers));
    const res = await listUsers(undefined, as("admin"));
    expect(res.status).toBe(403);
    expect(res.data).toEqual({ error: "forbidden: listUsers has no permission declaration" });
  });

  it("public operation 不帶 token → 200；拿到的 token 可接著打受保護 operation", async () => {
    const res = await login({ username: "viewer", password: "x" });
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("unreachable");
    expect((await listBanners(undefined, as(res.data.token))).status).toBe(200);
  });

  it("原本的 403 / 200 情境照舊", async () => {
    expect((await listUsers(undefined, as("viewer"))).status).toBe(403);
    expect((await listUsers(undefined)).status).toBe(403); // 不帶 token
    expect((await listBanners(undefined, as("viewer"))).status).toBe(200);
  });

  it("API base 底下但契約沒有的 route → 404（不進任何 handler）", async () => {
    const res = await fetch(`${API}/admin/nope`, as("admin"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found: no operation for GET /admin/nope" });
  });

  it("API base 以外的 request → guard 放行（undefined = fall through）", async () => {
    const guard = guardWith(operationPermissions);
    expect(await getResponse([guard], new Request("http://cdn.test/users"))).toBeUndefined();
    expect(await getResponse([guard], new Request("http://api.testing/users"))).toBeUndefined(); // 前綴不誤吃
  });
});

describe("開發期偵測", () => {
  it("module 宣告完整 → 與 YAML 來源相同；漏一個 module 的宣告 → throw 列出 operationId", () => {
    const declared = fromModules(modules);
    expect(() => assertPermissionsComplete(operationRoutes, declared)).not.toThrow();
    expect(declared).toEqual(operationPermissions);
    expect(() => assertPermissionsComplete(operationRoutes, fromModules(modules.filter((m) => m.id !== "auth")))).toThrow(
      /for: login$/
    );
  });

  it("extract 遇到缺 x-permission 的 yaml → exit≠0，訊息列出 operationId", () => {
    const r = spawnSync("pnpm", ["exec", "tsx", "split-b/extract.ts", "test/fixtures/missing-permission.yaml"], { encoding: "utf8" });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("missing permission declaration (x-permission / module permissions) for: createBanner, deleteBanner");
  });
});
