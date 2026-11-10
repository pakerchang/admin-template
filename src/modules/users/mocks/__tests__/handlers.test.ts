import { beforeEach, describe, expect, it } from "vitest";

import { mountAsSuperadmin } from "@/test/sign-in";

import {
  getUser,
  listUsers,
  updateUser,
  updateUserRole,
} from "../../api/users";

describe("users mock handlers (M7 AC-6)", () => {
  beforeEach(mountAsSuperadmin);

  it("role update is visible in the list", async () => {
    expect(
      await updateUserRole({ target_user_id: "user-8", role: "user" })
    ).toMatchObject({ code: 200, data: { role: "user" } });
    const { data } = await listUsers({ search: "" });
    expect(data?.find((u) => u.user_id === "user-8")?.role).toBe("user");
  });

  it("role update of an unknown user → 404 before the orval handler", async () => {
    await expect(
      updateUserRole({ target_user_id: "user-nope", role: "user" })
    ).rejects.toMatchObject({ status: 404, body: { error: "Not found" } });
  });

  it("getUser returns the user by id", async () => {
    expect(await getUser("user-2")).toMatchObject({
      code: 200,
      data: { user_id: "user-2", first_name: "Bob" },
    });
  });

  it("getUser / updateUser of an unknown id → 404", async () => {
    await expect(getUser("user-nope")).rejects.toMatchObject({ status: 404 });
    await expect(
      updateUser("user-nope", { first_name: "X" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("updateUser writes whitelisted fields only; list sees the change", async () => {
    const { data } = await updateUser("user-3", {
      first_name: "Caroline",
      email: "caroline@example.com",
      role: "superadmin",
      user_id: "user-hijack",
    } as never);
    expect(data).toMatchObject({
      user_id: "user-3",
      first_name: "Caroline",
      email: "caroline@example.com",
      role: "support",
    });
    const list = await listUsers({ search: "" });
    expect(list.data?.find((u) => u.user_id === "user-3")?.first_name).toBe(
      "Caroline"
    );
  });
});
