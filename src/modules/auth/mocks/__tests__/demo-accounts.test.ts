import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { isMockEnabled } from "@/app/mock/enabled";
import { users } from "@/modules/users/mocks/seed";
import { server } from "@/test/setup";

import { login } from "../../api/auth";
import { DEMO_ACCOUNTS, demoAccountsFor } from "../demo-accounts";

describe("demo accounts (login-demo-accounts spec)", () => {
  beforeEach(() =>
    server.resetHandlers(...makeApp().build().registry.mockHandlers)
  );

  it("AC-a：五個角色依序", () => {
    expect(DEMO_ACCOUNTS.map((a) => a.role)).toEqual([
      "superadmin",
      "admin",
      "support",
      "partner",
      "premium",
    ]);
  });

  it("AC-c：email / role 與 users seed 一致", () => {
    for (const account of DEMO_ACCOUNTS)
      expect(users.find((u) => u.email === account.email)?.role).toBe(
        account.role
      );
  });

  it.each([undefined, "", "true", "false"])(
    "AC-b：VITE_API_MOCK=%s 與 isMockEnabled 一致",
    (flag) => {
      expect(demoAccountsFor(flag)).toEqual(
        isMockEnabled(flag) ? DEMO_ACCOUNTS : []
      );
    }
  );

  it.each(DEMO_ACCOUNTS.map((a) => [a.role, a] as const))(
    "AC-d：%s 經 mock handler 登入成功",
    async (role, { email, password }) => {
      expect(await login({ email, password })).toMatchObject({
        user: { email, role },
      });
    }
  );
});
