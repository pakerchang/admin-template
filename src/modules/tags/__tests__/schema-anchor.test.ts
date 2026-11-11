import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";

import {
  type createTagSchema,
  type deleteTagSchema,
  tagSchema,
} from "../model/schema";

import type { CreateTagBody, DeleteTagBody, Tag } from "../api/model";
import type { Flat } from "@/test/type-utils";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("tags schema anchor (T3 AC-1)", () => {
  it("tagSchema ≡ Tag", () => {
    expectTypeOf<z.output<typeof tagSchema>>().toEqualTypeOf<Flat<Tag>>();
  });
  it("createTagSchema ≡ CreateTagBody", () => {
    expectTypeOf<z.output<typeof createTagSchema>>().toEqualTypeOf<
      Flat<CreateTagBody>
    >();
  });
  it("deleteTagSchema ≡ DeleteTagBody", () => {
    expectTypeOf<z.output<typeof deleteTagSchema>>().toEqualTypeOf<
      Flat<DeleteTagBody>
    >();
  });
});

/** T3 AC-2：錨定不會空跑（反例須讓 tsc 報錯，否則 TS2578 → tsc 失敗） */
describe("tags schema anchor rejects drift (T3 AC-2)", () => {
  it("rejects extra field / optional field / nominal enum", () => {
    const _withExtra = tagSchema.extend({ extra: z.string() });
    const _partial = tagSchema.partial();
    enum ELocal {
      A = "a",
      B = "b",
    }
    const _localEnum = z.enum(ELocal);
    type TExtra = z.output<typeof _withExtra>;
    type TPartial = z.output<typeof _partial>;
    type TLocal = z.output<typeof _localEnum>;
    // @ts-expect-error (a) schema 多欄位
    expectTypeOf<TExtra>().toEqualTypeOf<Flat<Tag>>();
    // @ts-expect-error (b) 必填變選填
    expectTypeOf<TPartial>().toEqualTypeOf<Flat<Tag>>();
    // @ts-expect-error (c) TS enum 名義型別 vs 等值字面值 union
    expectTypeOf<TLocal>().toEqualTypeOf<"a" | "b">();
  });
});
