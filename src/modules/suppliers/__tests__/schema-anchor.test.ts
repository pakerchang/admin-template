import { describe, expectTypeOf, it } from "vitest";

import type { Supplier, SupplierInput, UpdateSupplierBody } from "../api/model";
import type {
  createSupplierSchema,
  supplierSchema,
  updateSupplierSchema,
} from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("suppliers schema anchor (T3 AC-1)", () => {
  it("supplierSchema ≡ Supplier", () => {
    expectTypeOf<z.output<typeof supplierSchema>>().toEqualTypeOf<
      Flat<Supplier>
    >();
  });
  it("createSupplierSchema ≡ SupplierInput", () => {
    expectTypeOf<z.output<typeof createSupplierSchema>>().toEqualTypeOf<
      Flat<SupplierInput>
    >();
  });
  it("updateSupplierSchema ≡ UpdateSupplierBody", () => {
    expectTypeOf<z.output<typeof updateSupplierSchema>>().toEqualTypeOf<
      Flat<UpdateSupplierBody>
    >();
  });
});
