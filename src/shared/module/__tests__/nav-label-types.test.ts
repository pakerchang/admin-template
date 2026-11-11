import { describe, expectTypeOf, it } from "vitest";

import { defineModule } from "@/shared/module";

/**
 * i18n-scope-migration AC-4 (2)：nav / routeTitles 的 label 只能是 module 自己字典 `nav` 段（en 與 zh 共同）的局部 key。
 * 測試內 `as const` 字典、不 import domain module（core-safe）。錯誤案例以 `@ts-expect-error` 標記：沒觸發錯誤 → TS2578 → `tsc` 失敗。
 * 純型別檢查：函式不會被執行。
 */
const dict = { nav: { title: "A", list: "L" }, list: { title: "X" } } as const;
const i18n = { en: dict, zh: dict };
const enOnly = {
  en: { nav: { title: "A", extra: "E" } },
  zh: { nav: { title: "甲" } },
} as const;
const otherI18n = {
  en: { nav: { other: "O" } },
  zh: { nav: { other: "O" } },
} as const;
const noNav = { en: { list: { title: "X" } }, zh: { list: { title: "X" } } };

const base = { kind: "generic", i18n } as const;
const p = "app:access" as const;
/** T2：id 與 to 收窄成已登錄的 generic id／core 路徑（core-safe）；斷言對象仍是 label */
const n = (label: string) => ({ id: label, to: "/" as const, permission: p });
/** 反例用短寫法：@ts-expect-error 只壓下一行，每個反例必須單行放得下（prettier 折行會讓指令對不到，見 docs/TRAPS.md） */
const d = defineModule;
const a = { ...base, id: "users" } as const;
const g = { kind: "generic", id: "users" } as const;
const item = <L extends string>(label: L) => ({ ...n("a"), label });

describe("defineModule nav label 局部 key（AC-4 (2)）", () => {
  it("正例：頂層與 children 用存在的局部 key；保留 id 字面型別", () => {
    const m = defineModule({
      ...base,
      id: "users",
      nav: [
        {
          ...n("a"),
          label: "title",
          children: [{ ...n("a-list"), label: "list" }],
        },
      ],
    });
    expectTypeOf(m.id).toEqualTypeOf<"users">();
    // 反例用的短寫法本身合法（反例失敗只因 label）
    const short = d({
      ...a,
      nav: [{ ...item("title"), children: [item("list")] }],
    });
    expectTypeOf(short.id).toEqualTypeOf<"users">();
  });

  it("反例：每一類都 tsc 失敗", () => {
    const check = () => [
      // @ts-expect-error 不存在的局部 key
      d({ ...a, nav: [item("typo")] }),
      // @ts-expect-error children 不存在的 key
      d({ ...a, nav: [{ ...item("title"), children: [item("typo")] }] }),
      // @ts-expect-error 別的 module 字典才有的 key
      d({ ...a, nav: [item("other")] }),
      // @ts-expect-error 完整路徑 key
      d({ ...a, nav: [item("a.nav.title")] }),
      // @ts-expect-error nav 段以外的 key
      d({ ...a, nav: [item("list.title")] }),
      // @ts-expect-error 只存在於單一語系的 key
      d({ ...g, i18n: enOnly, nav: [item("extra")] }),
      // @ts-expect-error 字典無 nav 段卻宣告 nav
      d({ ...g, i18n: noNav, nav: [item("title")] }),
      // @ts-expect-error 無 i18n 卻宣告 nav
      d({ ...g, nav: [item("title")] }),
    ];
    expectTypeOf(check).toBeFunction();
    expectTypeOf(otherI18n).toBeObject();
  });
});

describe("defineModule routeTitles（AC-4 (2)、補裁 4）", () => {
  it("正例：只有 routeTitles、沒有 nav 的 module", () => {
    const m = defineModule({
      ...base,
      id: "users",
      routeTitles: [{ to: "/users", label: "title" }],
    });
    expectTypeOf(m.id).toEqualTypeOf<"users">();
  });

  it("反例：不存在的局部 key、無 i18n", () => {
    const check = () => [
      // @ts-expect-error routeTitles 用不存在的局部 key
      d({ ...a, routeTitles: [{ to: "/", label: "typo" }] }),
      // @ts-expect-error 無 i18n 卻宣告 routeTitles
      d({ ...g, routeTitles: [{ to: "/", label: "title" }] }),
    ];
    expectTypeOf(check).toBeFunction();
  });
});
