import { describe, expectTypeOf, it } from "vitest";

import type { TGrant, TPermission } from "@/shared/permission";

/** T1 AC-4 / AC-6：core 權限（core-safe，只用 `app:access`、`*`）；拔光 domain module 時 TPermission 不是 never */
describe("core permission types (T1 AC-4)", () => {
  it("app:access is a permission, * and app:* are grants", () => {
    const p: TPermission = "app:access";
    const grants: TGrant[] = ["app:access", "app:*", "*"];
    // @ts-expect-error action typo
    const typo: TPermission = "app:acess";
    // @ts-expect-error wildcard is a grant, not a permission
    const star: TPermission = "*";
    expectTypeOf([p, typo, star]).toBeArray();
    expectTypeOf(grants).toBeArray();
  });

  it("TPermission is never `never` (core catalog always present)", () => {
    expectTypeOf<TPermission>().not.toBeNever();
    expectTypeOf<"app:access">().toExtend<TPermission>();
  });
});
