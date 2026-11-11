import { describe, expectTypeOf, it } from "vitest";

import type { Staff, StaffCreate } from "../api/model";
import type { createStaffUserSchema, staffUserSchema } from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("team-members schema anchor (T3 AC-1)", () => {
  it("staffUserSchema ≡ Staff", () => {
    expectTypeOf<z.output<typeof staffUserSchema>>().toEqualTypeOf<
      Flat<Staff>
    >();
  });
  it("createStaffUserSchema ≡ StaffCreate", () => {
    expectTypeOf<z.output<typeof createStaffUserSchema>>().toEqualTypeOf<
      Flat<StaffCreate>
    >();
  });
});
