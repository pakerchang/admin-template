import { describe, expectTypeOf, it } from "vitest";

import type { User, UserRole } from "../api/model";
import type { TUserRole, userRoleEnum, userSchema } from "../model/schema";
import type { TRole } from "@/shared/permission";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1 / AC-6：手寫 schema 與 orval 產物雙向相等；角色列舉三方一致 */
describe("users schema anchor (T3 AC-1 / AC-6)", () => {
  it("userSchema ≡ User", () => {
    expectTypeOf<z.output<typeof userSchema>>().toEqualTypeOf<Flat<User>>();
  });
  it("userRoleEnum ≡ UserRole", () => {
    expectTypeOf<z.output<typeof userRoleEnum>>().toEqualTypeOf<UserRole>();
  });
  it("TUserRole ≡ TRole ≡ UserRole", () => {
    expectTypeOf<TUserRole>().toEqualTypeOf<TRole>();
    expectTypeOf<TRole>().toEqualTypeOf<UserRole>();
    expectTypeOf<TUserRole>().toEqualTypeOf<UserRole>();
  });
});
