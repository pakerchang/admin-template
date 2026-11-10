import { beforeEach, describe, expect, it } from "vitest";

import { mountAsSuperadmin } from "@/test/sign-in";

import { listUsers, updateUserRole } from "../../api/users";

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
});
