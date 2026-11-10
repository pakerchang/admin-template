import { describe, expect, expectTypeOf, it } from "vitest";

import { coreGrants, coreRoles } from "@/app/mock/permission-matrix";

import type { TGrantMatrix, TRole } from "@/shared/permission";

/** T1 AC-2：role key 收窄為 coreRoles（架構 spec §6.1 的 7 個角色）；core-safe，只引用 coreRoles */
describe("role keys are typed (T1 AC-2)", () => {
  it("coreRoles is exactly the 7 roles of §6.1", () => {
    expectTypeOf<(typeof coreRoles)[number]>().toEqualTypeOf<
      | "superadmin"
      | "admin"
      | "support"
      | "partner"
      | "premium"
      | "user"
      | "guest"
    >();
    expectTypeOf<TRole>().toEqualTypeOf<(typeof coreRoles)[number]>();
    expect(coreRoles).toEqual([
      "superadmin",
      "admin",
      "support",
      "partner",
      "premium",
      "user",
      "guest",
    ]);
  });

  it("mockGrants / coreGrants keys reject roles outside coreRoles", () => {
    const ok: TGrantMatrix = { admin: ["app:access"], guest: [] };
    // @ts-expect-error role typo
    const admn: TGrantMatrix = { admn: ["app:access"] };
    // @ts-expect-error role typo on top of coreGrants
    const core: TGrantMatrix = { ...coreGrants, supprt: ["app:access"] };
    expectTypeOf([ok, admn, core]).toBeArray();
    expectTypeOf(coreGrants).toExtend<TGrantMatrix>();
  });
});
