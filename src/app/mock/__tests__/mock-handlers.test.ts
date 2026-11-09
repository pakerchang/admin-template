import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { mockHandlers } from "@/app/mock";
import { operations } from "@/app/operations.gen";
import {
  apiBaseUrl,
  apiFetch,
  clearAuth,
  setAuth,
} from "@/services/api-client";
import { DEMO_ACCOUNT, users } from "@/services/mock/data";
import { server } from "@/test/setup";

import type { TAuthSession } from "@/services/api-client";
import type { TUser } from "@/services/schemas/user";

const login = (email: string) =>
  apiFetch<TAuthSession>("/api/auth/login", {
    method: "POST",
    body: { email, password: DEMO_ACCOUNT.password },
  });

const emailOf = (role: string) => users.find((u) => u.role === role)!.email;

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
      expect(support.grants).toEqual(["app:access", "orders:*"]);
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

    it("superadmin reaches every operation (AC-6 API side)", async () => {
      await signIn(DEMO_ACCOUNT.email);
      for (const { method, path } of operations.routes) {
        if (method !== "GET") continue;
        const res = await apiFetch(path);
        expect([path, res.status]).toEqual([path, 200]);
      }
    });

    it("unknown route → 404 with the legacy body, even for superadmin", async () => {
      await signIn(DEMO_ACCOUNT.email);
      const res = await apiFetch<{ error: string }>("/admin/nope");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No mock handler for GET /admin/nope");
    });

    it("superadmin: every non-GET operation passes the guard and reaches its handler (AC-6 API side)", async () => {
      await signIn(DEMO_ACCOUNT.email);
      const writes = operations.routes.filter((r) => r.method !== "GET");
      expect(writes.length).toBeGreaterThan(0);
      for (const { method, path } of writes) {
        const res = await apiFetch<{ error?: string } | null>(path, {
          method: method as "POST" | "PUT" | "DELETE",
          body: {},
        });
        // 403 = guard 擋；guard 的 404 body 是 "No mock handler…"；其餘都是 handler 自己的回應
        expect([method, path, res.status]).not.toEqual([method, path, 403]);
        expect(res.body?.error ?? "").not.toMatch(/^No mock handler/);
      }
    });

    describe("session token cannot be forged (C1)", () => {
      /** 直接把 Authorization header 設成指定值，不經 setAuth 的 Bearer 包裝 */
      const fetchWith = (authorization: string) =>
        fetch(new URL("/admin/order", apiBaseUrl), {
          headers: { Authorization: authorization },
        });

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
