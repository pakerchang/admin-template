import { describe, expectTypeOf, it } from "vitest";

import { createCollection } from "../mock-db";

/** T3 AC-5：`createCollection` 泛型化，idKey / searchField / seed 形狀錯誤 `tsc` 失敗（core-safe，只用本地型別） */
type TItem = { item_id: string; name: string };
type TOther = { other: number };
const seed: TItem[] = [{ item_id: "1", name: "a" }];
const others: TOther[] = [{ other: 1 }];

describe("createCollection types (T3 AC-5)", () => {
  it("all() 回傳 T[]", () => {
    const c = createCollection<TItem>(seed, "item_id", { searchField: "name" });
    expectTypeOf(c.all()).toEqualTypeOf<TItem[]>();
  });

  it("idKey / searchField typo、seed 形狀不符 → tsc 失敗", () => {
    // @ts-expect-error idKey typo
    createCollection<TItem>(seed, "itemid");
    // @ts-expect-error searchField typo
    createCollection<TItem>(seed, "item_id", { searchField: "nmae" });
    // @ts-expect-error seed 元素不符合顯式泛型 T
    createCollection<TItem>(others, "item_id");
  });
});
