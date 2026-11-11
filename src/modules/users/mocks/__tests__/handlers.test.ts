import { beforeEach, describe, expect, it } from "vitest";

import { mountAsSuperadmin } from "@/test/sign-in";

import {
  createUser,
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

describe("users mock createUser (user-create AC-3)", () => {
  beforeEach(mountAsSuperadmin);

  const valid = (email: string) => ({
    email,
    first_name: "New",
    last_name: "User",
    phone_number: "0912345678",
    address: "Somewhere",
    remark: "",
  });
  const count = async () => (await listUsers({})).total;

  it("(a) valid body → 200 with a new id; list sees it", async () => {
    const before = await count();
    const { code, data } = await createUser(valid("ac3a@example.com"));
    expect(code).toBe(200);
    expect(data?.user_id).toMatch(/^user-/);
    const list = await listUsers({});
    expect(list.total).toBe(before! + 1);
    expect(list.data?.find((u) => u.user_id === data?.user_id)).toMatchObject({
      email: "ac3a@example.com",
      role: "user",
    });
  });

  it("(b) user_id / created_at / role in the body are ignored", async () => {
    const { data } = await createUser({
      ...valid("ac3b@example.com"),
      user_id: "user-hijack",
      created_at: "2000-01-01T00:00:00.000Z",
      role: "superadmin",
    } as never);
    expect(data?.user_id).not.toBe("user-hijack");
    expect(data?.created_at).not.toBe("2000-01-01T00:00:00.000Z");
    expect(data?.role).toBe("user");
  });

  it("(c) two creates in a row get different ids", async () => {
    const [a, b] = await Promise.all([
      createUser(valid("ac3c1@example.com")),
      createUser(valid("ac3c2@example.com")),
    ]);
    expect(a.data?.user_id).not.toBe(b.data?.user_id);
  });

  it.each([
    ["missing first_name", { first_name: undefined }],
    ["bad email", { email: "not-an-email" }],
    ["phone not 10 digits", { phone_number: "12345" }],
    ["remark omitted", { remark: undefined }],
  ])("(d) %s → 400, nothing written", async (_, patch) => {
    const before = await count();
    await expect(
      createUser({ ...valid("ac3d@example.com"), ...patch } as never)
    ).rejects.toMatchObject({ status: 400 });
    expect(await count()).toBe(before);
  });

  it('(d2) remark: "" is accepted', async () => {
    const { data } = await createUser(valid("ac3d2@example.com"));
    expect(data).toMatchObject({ email: "ac3d2@example.com", remark: "" });
  });

  it("(e) duplicate email (case-insensitive) → 409, nothing written", async () => {
    const existing = (await getUser("user-2")).data!.email;
    const before = await count();
    for (const email of [existing, existing.toUpperCase()])
      await expect(createUser(valid(email))).rejects.toMatchObject({
        status: 409,
      });
    expect(await count()).toBe(before);
  });
});
