import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createBanner, listBanners } from "../generated/api/banners/banners";
import { getCreateBannerMockHandler, getListBannersMockHandler } from "../generated/api/banners/banners.msw";
import { listUsers } from "../generated/api/users/users";
import { getListUsersMockHandler } from "../generated/api/users/users.msw";
import type { Banner, CreateBannerBody } from "../generated/model";
import { operationPermissions, operationRoutes } from "../generated/operations.gen";
import { createPermissionGuard, fromModules, PUBLIC, type AppModule } from "../src/permissions";

// 記憶體狀態（代表日後的 mock-db）
const bannerDb: Banner[] = [];
const img = { file_name: "a.png", file_url: "https://x/a.png" };
const body: CreateBannerBody = {
  title: "hello",
  desktop_image_url: img,
  mobile_image_url: img,
  redirect_url: "https://example.com",
  sort_order: 1,
  banner_status: "active",
};

const bannersModule: AppModule = {
  id: "banners",
  mockHandlers: [
    getListBannersMockHandler(() => ({ code: 200, msg: "success", error: "", data: bannerDb, total: bannerDb.length })),
    getCreateBannerMockHandler(async ({ request }) => {
      const input = await request.json();
      bannerDb.unshift({ ...input, banner_id: `banner-${bannerDb.length + 1}` });
      return { message: "created" };
    }),
  ],
  permissions: { listBanners: "banners:read", createBanner: "banners:manage" },
};
const usersModule: AppModule = {
  id: "users",
  mockHandlers: [getListUsersMockHandler()], // 不給 override → faker
  permissions: { listUsers: "users:read" },
};

const ROLE_PERMS: Record<string, string[]> = {
  viewer: ["banners:read"],
  admin: ["banners:read", "banners:manage", "users:read"],
};
const as = (role: string): RequestInit => ({ headers: { Authorization: `Bearer ${role}` } });

const guard = createPermissionGuard({
  routes: operationRoutes,
  permissions: operationPermissions, // 來源 (b)
  getGranted: (req) => new Set(ROLE_PERMS[req.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""] ?? []),
  apiBaseUrl: "http://api.test",
});

// a3：yaml 加了公開的 login；a1 這裡只宣告、不掛 handler
const authModule: AppModule = { id: "auth", mockHandlers: [], permissions: { login: PUBLIC } };
const modules = [bannersModule, usersModule, authModule];
const server = setupServer(guard, ...modules.flatMap((m) => m.mockHandlers));

beforeAll(() => server.listen({ onUnhandledFrame: "error" }) /* msw 3：onUnhandledRequest → onUnhandledFrame */);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("AC1 orval msw handler × msw", () => {
  it("overrideResponse 函式接記憶體狀態：create 後 list 讀得到", async () => {
    const created = await createBanner(body, as("admin"));
    expect(created.status).toBe(200);
    expect(created.data).toEqual({ message: "created" });

    const list = await listBanners({ page: 1 }, as("admin"));
    expect(list.status).toBe(200);
    if (list.status !== 200) throw new Error("unreachable");
    expect(list.data.total).toBe(1);
    expect(list.data.data?.[0]).toMatchObject({ title: "hello", banner_id: "banner-1" });
  });

  it("沒給 override 時回 faker 資料", async () => {
    const res = await listUsers(undefined, as("admin"));
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("unreachable");
    expect(typeof res.data.code).toBe("number");
  });
});

describe("AC4 operationId → permission 中間格式 + guard", () => {
  it("兩個來源產出相同中間格式", () => {
    expect(fromModules(modules)).toEqual(operationPermissions);
  });

  it("module 來源衝突會報錯", () => {
    const bad: AppModule = { id: "x", mockHandlers: [], permissions: { listBanners: "other" } };
    expect(() => fromModules([bannersModule, bad])).toThrow(/conflict on listBanners/);
  });

  it("無權限 → 403（guard 擋下，不進 orval handler）", async () => {
    const before = bannerDb.length;
    const res = await createBanner(body, as("viewer"));
    expect(res.status).toBe(403);
    expect(res.data).toEqual({ error: "forbidden: createBanner requires banners:manage" });
    expect(bannerDb.length).toBe(before);

    expect((await listUsers(undefined, as("viewer"))).status).toBe(403);
  });

  it("有權限 → fall through 到 orval handler 回 200", async () => {
    const res = await listBanners(undefined, as("viewer"));
    expect(res.status).toBe(200);
  });

  it("module 來源一樣能驅動 guard", async () => {
    server.use(
      createPermissionGuard({
        routes: operationRoutes,
        permissions: fromModules(modules), // 來源 (a)
        getGranted: () => new Set(), // 誰都沒權限
        apiBaseUrl: "http://api.test",
      })
    );
    expect((await listBanners(undefined, as("admin"))).status).toBe(403);
  });
});
