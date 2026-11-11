import { describe, expectTypeOf, it } from "vitest";

import type { UserRole } from "../api/model";
import type { TRole } from "@/shared/permission";

/** T3 AC-6：auth 產物 UserRole 與 core 角色目錄一致 */
describe("auth role anchor (T3 AC-6)", () => {
  it("UserRole ≡ TRole", () => {
    expectTypeOf<UserRole>().toEqualTypeOf<TRole>();
  });
});
