import { describe, expectTypeOf, it } from "vitest";

import type { Banner } from "../api/model";
import type { bannerSchema } from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("banners schema anchor (T3 AC-1)", () => {
  it("bannerSchema ≡ Banner", () => {
    expectTypeOf<z.output<typeof bannerSchema>>().toEqualTypeOf<Flat<Banner>>();
  });
});
