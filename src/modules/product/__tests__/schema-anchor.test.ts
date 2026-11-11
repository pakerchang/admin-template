import { describe, expectTypeOf, it } from "vitest";

import type { Product, ProductType } from "../api/model";
import type { productSchema, productTypeEnums } from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("product schema anchor (T3 AC-1)", () => {
  it("productSchema ≡ Product", () => {
    expectTypeOf<z.output<typeof productSchema>>().toEqualTypeOf<
      Flat<Product>
    >();
  });
  it("productTypeEnums ≡ ProductType", () => {
    expectTypeOf<
      z.output<typeof productTypeEnums>
    >().toEqualTypeOf<ProductType>();
  });
});
