import { describe, expectTypeOf, it } from "vitest";

import type { Article } from "../api/model";
import type { articleSchema } from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("articles schema anchor (T3 AC-1)", () => {
  it("articleSchema ≡ Article", () => {
    expectTypeOf<z.output<typeof articleSchema>>().toEqualTypeOf<
      Flat<Article>
    >();
  });
});
