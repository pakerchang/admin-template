import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { server } from "@/test/setup";

import { login } from "../../api/auth";
import { DEMO_ACCOUNT } from "../seed";

describe("auth mock handlers (M7 AC-6)", () => {
  beforeEach(() =>
    server.resetHandlers(...makeApp().build().registry.mockHandlers)
  );

  it("valid credentials reach the orval handler override", async () => {
    expect(await login(DEMO_ACCOUNT)).toMatchObject({
      user: { email: DEMO_ACCOUNT.email, role: "superadmin" },
      grants: ["*"],
    });
  });

  it("wrong password → 401 from the hand-written handler placed first", async () => {
    await expect(
      login({ email: DEMO_ACCOUNT.email, password: "wrong" })
    ).rejects.toMatchObject({
      status: 401,
      body: { error: "Invalid email or password" },
    });
  });
});
