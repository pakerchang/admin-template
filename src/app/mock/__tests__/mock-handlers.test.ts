import { getResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { mockHandlers } from "@/app/mock";
import { operations } from "@/app/operations.gen";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { users } from "@/modules/users/mocks/seed";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { clearAuth, setAuth } from "@/shared/api/session";
import { apiFetch } from "@/test/api-fetch";
import { server } from "@/test/setup";

import type { TUser } from "@/modules/users/model/schema";
import type { TAuthSession } from "@/shared/api/session";

const login = (email: string) =>
  apiFetch<TAuthSession>("/api/auth/login", {
    method: "POST",
    body: { email, password: DEMO_ACCOUNT.password },
  });

const emailOf = (role: string) => users.find((u) => u.role === role)!.email;
// ponytail: 目前唯一的 path param 是 users 的 `:id`；出現其他 param 時改成依 path 對照表代換
const concrete = (path: string) => path.replace(":id", "user-2");

/** 登入後把 session 存起來，apiFetch 之後的 request 都帶它的 token */
const signIn = async (email: string) => {
  const res = await login(email);
  setAuth(res.body);
  return res.body;
};

describe("kernel mock handlers wired with the real operation table (AC-2, R22 / R25)", () => {
  beforeEach(() => clearAuth());

  it("test env uses a dedicated mock origin and the four API prefixes are unchanged (R24)", () => {
    expect(apiBaseUrl).toBe("http://mock-api.test");
    expect(new Set(operations.routes.map((r) => r.path.split("/")[1]))).toEqual(
      new Set(["api", "users", "user", "admin"])
    );
  });

  it("guard is the first handler", () => {
    expect(String(mockHandlers[0].info.path)).toBe("*");
  });

  describe("with the installed modules' grant matrix (registry.mockHandlers)", () => {
    beforeEach(() =>
      server.resetHandlers(...makeApp().build().registry.mockHandlers)
    );

    it("login (public) returns grants expanded from the role matrix", async () => {
      expect((await login(DEMO_ACCOUNT.email)).body.grants).toEqual(["*"]);
      const support = (await login(emailOf("support"))).body;
      expect(support.user.role).toBe("support");
      expect(support.grants).toEqual([
        "app:access",
        "team-members:read",
        "orders:*",
        "suppliers:read",
        "consumers:read",
        "banners:read",
        "articles:read",
        "tags:read",
      ]);
    });

    it("no token on a non-public operation → 403, not 401", async () => {
      const res = await apiFetch<{ error: string }>("/admin/tag");
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("forbidden: listTags requires tags:read");
    });

    it("support: orders allowed, users denied", async () => {
      await signIn(emailOf("support"));
      expect((await apiFetch("/admin/order")).status).toBe(200);
      expect((await apiFetch("/users")).status).toBe(403);
      expect(
        (
          await apiFetch("/admin/user/role", {
            method: "POST",
            body: { target_user_id: "user-1", role: "guest" },
          })
        ).status
      ).toBe(403);
    });

    it("admin (users:read only): list allowed, POST /users denied", async () => {
      await signIn(emailOf("admin"));
      expect((await apiFetch("/users")).status).toBe(200);
      const res = await apiFetch<{ error: string }>("/users", {
        method: "POST",
        body: { email: "x@example.com" },
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe(
        "forbidden: createUser requires users:create"
      );
    });

    it("superadmin reaches every operation (AC-6 API side)", async () => {
      await signIn(DEMO_ACCOUNT.email);
      for (const { method, path } of operations.routes) {
        if (method !== "GET") continue;
        const res = await apiFetch(concrete(path));
        expect([path, res.status]).toEqual([path, 200]);
      }
    });

    it("unknown route → 404 with the legacy body, even for superadmin", async () => {
      await signIn(DEMO_ACCOUNT.email);
      const res = await apiFetch<{ error: string }>("/admin/nope");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(
        "not found: no operation for GET /admin/nope"
      );
    });

    describe("superadmin: every non-GET operation succeeds (AC-6 API side, W2)", () => {
      const created = { message: "created" };
      const updated = { message: "updated" };
      const deleted = { message: "deleted" };
      const image = {
        file_name: "w2.png",
        file_value: "data:image/png;base64,AA==",
      };
      /** `METHOD path` → [有效 payload（存在的 id）, 預期 body]；全部預期 200 */
      const CASES: Record<string, [Record<string, unknown>, object]> = {
        "POST /api/auth/login": [
          { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password },
          { user: { role: "superadmin" }, grants: ["*"] },
        ],
        "PUT /user/me/profile": [
          { first_name: "Alicia" },
          { code: 200, data: { user_id: "user-1", first_name: "Alicia" } },
        ],
        "POST /users": [
          {
            email: "w2-user@example.com",
            first_name: "W2",
            last_name: "User",
            phone_number: "0912345678",
            address: "W2 street",
            remark: "",
          },
          { code: 200, data: { email: "w2-user@example.com", role: "user" } },
        ],
        "PUT /users/:id": [
          { first_name: "Bobby" },
          { code: 200, data: { user_id: "user-2", first_name: "Bobby" } },
        ],
        "POST /admin/user/role": [
          { target_user_id: "user-8", role: "user" },
          { code: 200, data: { role: "user" } },
        ],
        "POST /admin/products": [{ product_name: "W2 product" }, created],
        "POST /admin/products/update": [
          { product_id: "product-1", product_name: "W2 renamed" },
          updated,
        ],
        "DELETE /admin/products": [{ product_id: "product-2" }, deleted],
        "POST /admin/images": [
          image,
          { file_name: image.file_name, file_url: image.file_value },
        ],
        "DELETE /admin/images": [{ file_name: image.file_name }, deleted],
        "POST /admin/order": [
          { order_id: "order-1001", order_status: "completed" },
          updated,
        ],
        "POST /admin/order/update": [
          { order_id: "order-1002", order_status: "completed" },
          updated,
        ],
        "POST /admin/banners": [{ title: "W2 banner" }, created],
        "PUT /admin/banners": [{ banner_id: "banner-1", title: "W2" }, updated],
        "DELETE /admin/banners": [{ banner_id: "banner-2" }, deleted],
        "POST /admin/supplier": [{ supplier_name: "W2 supplier" }, created],
        "PUT /admin/supplier": [
          { supplier_id: "supplier-1", supplier_name: "W2" },
          updated,
        ],
        "DELETE /admin/supplier": [{ supplier_id: "supplier-2" }, deleted],
        "POST /admin/tag": [{ tag_name: "W2 tag" }, created],
        "PUT /admin/tag": [{ tag_id: "tag-1", tag_name: "W2" }, updated],
        "DELETE /admin/tag": [{ tag_id: "tag-2" }, deleted],
        "POST /admin/staff": [
          { first_name: "W2", email: "w2@example.com", password: "secret" },
          created,
        ],
        "PUT /admin/staff": [
          { staff_id: "staff-1", first_name: "W2" },
          updated,
        ],
        "DELETE /admin/staff": [{ staff_id: "staff-2" }, deleted],
        "POST /admin/articles": [{ title: "W2 article" }, created],
        "PUT /admin/articles": [
          { article_id: "article-1", title: "W2" },
          updated,
        ],
        "DELETE /admin/articles": [{ article_id: "article-2" }, deleted],
      };
      const writes = operations.routes
        .filter((r) => r.method !== "GET")
        .map((r) => `${r.method} ${r.path}`);

      beforeEach(() => signIn(DEMO_ACCOUNT.email));

      it("the case table covers exactly the non-GET operations", () => {
        expect(Object.keys(CASES).sort()).toEqual([...writes].sort());
      });

      it.each(writes)(
        "%s → 200 with the handler's success body",
        async (key) => {
          const [method, path] = key.split(" ");
          const [body, expected] = CASES[key];
          const res = await apiFetch(concrete(path), {
            method: method as "POST" | "PUT" | "DELETE",
            body,
          });
          expect([key, res.status]).toEqual([key, 200]);
          expect(res.body).toMatchObject(expected);
        }
      );

      it("tags round trip: create is listed, update changes the field, delete removes it", async () => {
        type TList = { data: { tag_id: string; tag_name: string }[] };
        const list = (query: object) =>
          apiFetch<TList>("/admin/tag", { query }).then((r) => r.body.data);

        await apiFetch("/admin/tag", {
          method: "POST",
          body: { tag_name: "w2-created" },
        });
        expect(await list({ search: "w2-created" })).toHaveLength(1);

        expect((await list({ tag_id: "tag-3" }))[0].tag_name).not.toBe("w2-up");
        await apiFetch("/admin/tag", {
          method: "PUT",
          body: { tag_id: "tag-3", tag_name: "w2-up" },
        });
        expect((await list({ tag_id: "tag-3" }))[0].tag_name).toBe("w2-up");

        expect(await list({ tag_id: "tag-4" })).toHaveLength(1);
        await apiFetch("/admin/tag", {
          method: "DELETE",
          body: { tag_id: "tag-4" },
        });
        expect(await list({ tag_id: "tag-4" })).toEqual([]);
      });
    });

    /** 直接把 Authorization header 設成指定值，不經 setAuth 的 Bearer 包裝 */
    const fetchWith = (authorization: string) =>
      fetch(new URL("/admin/order", apiBaseUrl), {
        headers: { Authorization: authorization },
      });

    describe("issued sessions survive a page reload (W1)", () => {
      const KEY = "mock-sessions";
      beforeEach(() => localStorage.removeItem(KEY));
      afterEach(() => vi.unstubAllGlobals());

      it("after the mock runtime restarts, the same token still reaches protected APIs", async () => {
        const { token } = (await login(emailOf("support"))).body;
        // 模擬重新整理：MSW 與 handlers 模組重新載入，記憶體 session 表清空，只剩 localStorage
        vi.resetModules();
        const fresh = await import("@/app/__tests__/fixture");
        server.resetHandlers(...fresh.makeApp().build().registry.mockHandlers);
        expect((await fetchWith(`Bearer ${token}`)).status).toBe(200);
        expect((await fetchWith(`Bearer ${"0".repeat(32)}`)).status).toBe(403);
      });

      it("malformed or tampered storage entries are not accepted", async () => {
        const planted = {
          "not-hex-token": "user-1",
          abcd: "user-1",
          ["A".repeat(32)]: "user-1",
          ["b".repeat(33)]: "user-1",
          ["c".repeat(32)]: 1,
          ["d".repeat(32)]: { user_id: "user-1" },
        };
        localStorage.setItem(KEY, JSON.stringify(planted));
        for (const token of Object.keys(planted))
          expect([token, (await fetchWith(`Bearer ${token}`)).status]).toEqual([
            token,
            403,
          ]);

        for (const raw of ["not json", "[]", "null", '"x"']) {
          localStorage.setItem(KEY, raw);
          expect((await fetchWith("Bearer not-hex-token")).status).toBe(403);
        }
        // 壞表不影響之後的 login：重新寫成合法表
        const { token } = (await login(emailOf("support"))).body;
        expect((await fetchWith(`Bearer ${token}`)).status).toBe(200);
      });

      it("without storage (node), issued tokens live in memory for this runtime", async () => {
        vi.stubGlobal("localStorage", undefined);
        vi.resetModules();
        // auth 的 login handler 與 session store 同一份新載入的模組（users module 隨 auth 載入並註冊角色查詢）
        const { authMockHandlers } =
          await import("@/modules/auth/mocks/handlers");
        const store = await import("@/shared/api/mock/session-store");
        const res = await getResponse(
          authMockHandlers,
          new Request(new URL("/api/auth/login", apiBaseUrl), {
            method: "POST",
            body: JSON.stringify(DEMO_ACCOUNT),
          })
        );
        const { token } = (await res!.json()) as { token: string };
        expect(store.mockRoleOf(`Bearer ${token}`)).toBe("superadmin");
        expect(store.mockRoleOf(`Bearer ${"0".repeat(32)}`)).toBe(undefined);
        vi.unstubAllGlobals();
        expect(localStorage.getItem(KEY)).toBeNull();
      });
    });

    describe("session token cannot be forged (C1)", () => {
      it("a guessed legacy-format token without login → 403", async () => {
        for (const id of users.map((u) => u.user_id)) {
          expect((await fetchWith(`Bearer mock-token-${id}`)).status).toBe(403);
        }
      });

      it("an issued token works only verbatim behind `Bearer `", async () => {
        const { token } = (await login(emailOf("support"))).body;
        expect((await fetchWith(`Bearer ${token}`)).status).toBe(200);

        const last = token.at(-1) === "0" ? "1" : "0";
        expect(
          (await fetchWith(`Bearer ${token.slice(0, -1)}${last}`)).status
        ).toBe(403);
        expect((await fetchWith(token)).status).toBe(403);
        expect((await fetchWith(`bearer ${token}`)).status).toBe(403);
      });

      it("tokens are not derived from the user id", async () => {
        const a = (await login(emailOf("support"))).body.token;
        const b = (await login(emailOf("support"))).body.token;
        expect(a).not.toBe(b);
        expect(a).not.toContain("user-");
      });
    });

    describe("/user/me/profile is bound to the caller (C2)", () => {
      const support = users.find((u) => u.role === "support")!;
      const getProfile = () =>
        apiFetch<TUser>("/user/me/profile").then((r) => r.body);

      it("GET returns the caller, not the demo account", async () => {
        await signIn(support.email);
        expect(await getProfile()).toMatchObject({
          user_id: support.user_id,
          email: support.email,
          role: "support",
        });
      });

      it("PUT applies whitelisted fields only; role / user_id / email cannot be changed", async () => {
        const session = await signIn(support.email);
        const res = await apiFetch("/user/me/profile", {
          method: "PUT",
          body: {
            role: "superadmin",
            user_id: "user-1",
            email: DEMO_ACCOUNT.email,
            first_name: "Caroline",
          },
        });
        expect(res.status).toBe(200);
        expect(await getProfile()).toMatchObject({
          user_id: support.user_id,
          email: support.email,
          role: "support",
          first_name: "Caroline",
        });

        // 同一 token 仍是 support 的權限
        expect((await apiFetch("/admin/order")).status).toBe(200);
        expect((await apiFetch("/users")).status).toBe(403);
        // 也沒有把 superadmin 那筆改掉
        setAuth((await login(DEMO_ACCOUNT.email)).body);
        expect(await getProfile()).toMatchObject({
          user_id: "user-1",
          role: "superadmin",
        });
        setAuth(session);
        expect((await apiFetch("/users")).status).toBe(403);
      });
    });

    it("an unknown token gets no grants", async () => {
      setAuth({
        token: "forged",
        user: { user_id: "x", email: "x", name: "x", role: "superadmin" },
        grants: ["*"],
      });
      expect((await apiFetch("/admin/tag")).status).toBe(403);
    });
  });
});
