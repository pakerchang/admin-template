import { describe, expectTypeOf, it } from "vitest";

import { defineModule } from "@/shared/module";

import en from "../locales/en.json";
import zh from "../locales/zh.json";
import { tagsRoutes } from "../model/routes";

import type { createApp } from "@/app/kernel/create-app";
import type {
  TModule,
  TModuleId,
  TRouteContext,
  TRouteId,
  TRoutePath,
} from "@/shared/module";
import type { AnyRoute, StaticDataRouteOption } from "@tanstack/react-router";
import type { ComponentType } from "react";

/**
 * typed-contracts T2 AC-1／2／3／5：module id、requires、route id、nav／routeTitles `to` 寫錯 → `tsc` 失敗。
 * 以 tags 為代表（domain，core-only 隨 module 刪除）。錯誤案例以 `@ts-expect-error` 標記，沒觸發 → TS2578 → `tsc` 失敗。
 * 反例一律單行（prettier 折行會讓指令對不到，見 docs/TRAPS.md）。純型別檢查：函式不會被執行。
 */
const d = defineModule;
const t = { kind: "domain" } as const;
const tags = { ...t, id: "tags", i18n: { en, zh } } as const;
const Page = (() => null) as ComponentType;
const g = { permission: "authenticated", component: Page } as const;
const n = <P extends string>(to: P) => ({
  id: "t",
  label: "title" as const,
  permission: "tags:read" as const,
  to,
});
const productRoutes = (_: TRouteContext<"product">) => [] as AnyRoute[];
const otherId = { ...g, routeId: "product.list" } as const;

describe("module id／requires（AC-1）", () => {
  it("TModuleId 等於 10 個 module id，registry 沒被 index signature 撐寬", () => {
    expectTypeOf<TModuleId>().toEqualTypeOf<
      | "articles"
      | "auth"
      | "banners"
      | "consumers"
      | "orders"
      | "product"
      | "suppliers"
      | "tags"
      | "team-members"
      | "users"
    >();
    expectTypeOf<string>().not.toExtend<TModuleId>();
  });

  it("正例：requires 其他已註冊 id", () => {
    const m = d({ ...t, id: "tags", requires: ["suppliers", "users"] });
    expectTypeOf(m.requires).toEqualTypeOf<readonly ["suppliers", "users"]>();
  });

  it("反例：未註冊 id、requires 未註冊 id、requires 自己", () => {
    const check = () => [
      // @ts-expect-error 未註冊的 id
      d({ ...t, id: "tag" }),
      // @ts-expect-error requires 含未註冊 id
      d({ ...t, id: "tags", requires: ["tag"] }),
      // @ts-expect-error requires 自己
      d({ ...t, id: "tags", requires: ["tags"] }),
    ];
    expectTypeOf(check).toBeFunction();
  });
});

describe("route id（AC-2）", () => {
  it("staticData.routeId 讀取端是 TRouteId", () => {
    expectTypeOf<
      NonNullable<StaticDataRouteOption["routeId"]>
    >().toEqualTypeOf<TRouteId>();
  });

  it("TRouteContext<'tags'> 的 ctx.page 只收 tags 的 route id", () => {
    type TTagsRouteId = Parameters<TRouteContext<"tags">["page"]>[0]["routeId"];
    expectTypeOf<TTagsRouteId>().toEqualTypeOf<"tags.list">();
    const c = {} as TRouteContext<"tags">;
    const check = () => [
      c.page({ ...g, routeId: "tags.list" }),
      // @ts-expect-error 別的 module 的 route id
      c.page({ ...g, routeId: "product.list" }),
      // @ts-expect-error 不存在的 route id
      c.page({ ...g, routeId: "tags.lst" }),
    ];
    expectTypeOf(check).toBeFunction();
  });

  it("defineModule 的 routes：contextual ctx 收窄、別的 module 的 ctx 型別擋下", () => {
    const ok = d({
      ...t,
      id: "tags",
      routes: (ctx) => tagsRoutes(ctx, { list: Page }),
    });
    expectTypeOf(ok.id).toEqualTypeOf<"tags">();
    const check = () => [
      // @ts-expect-error contextual ctx 是 TRouteContext<"tags">：別的 module 的 route id
      d({ ...t, id: "tags", routes: (c) => [c.page(otherId)] }),
      // @ts-expect-error (ctx: TRouteContext<"product">) => … 指派給 tags 的 routes
      d({ ...t, id: "tags", routes: productRoutes }),
    ];
    expectTypeOf(check).toBeFunction();
  });
});

describe("nav／routeTitles to（AC-3）", () => {
  it("TRoutePath 沒被撐寬", () => {
    expectTypeOf<string>().not.toExtend<TRoutePath>();
  });

  it("正例：已登錄路徑（含別的 module 的路徑）", () => {
    const m = d({
      ...tags,
      nav: [{ ...n("/tags"), children: [n("/orders/order-list")] }],
      routeTitles: [{ to: "/tags", label: "title" }],
    });
    expectTypeOf(m.id).toEqualTypeOf<"tags">();
  });

  it("反例：未登錄、結尾斜線、param 模板（頂層／children／routeTitles）", () => {
    const check = () => [
      // @ts-expect-error nav 頂層未登錄路徑
      d({ ...tags, nav: [n("/tag")] }),
      // @ts-expect-error nav 頂層結尾斜線
      d({ ...tags, nav: [n("/tags/")] }),
      // @ts-expect-error nav 頂層 param 模板
      d({ ...tags, nav: [n("/orders/$id")] }),
      // @ts-expect-error children 未登錄路徑
      d({ ...tags, nav: [{ ...n("/tags"), children: [n("/tag")] }] }),
      // @ts-expect-error children 結尾斜線
      d({ ...tags, nav: [{ ...n("/tags"), children: [n("/tags/")] }] }),
      // @ts-expect-error children param 模板
      d({ ...tags, nav: [{ ...n("/tags"), children: [n("/orders/$id")] }] }),
      // @ts-expect-error routeTitles 未登錄路徑
      d({ ...tags, routeTitles: [{ to: "/tag", label: "title" }] }),
      // @ts-expect-error routeTitles 結尾斜線
      d({ ...tags, routeTitles: [{ to: "/tags/", label: "title" }] }),
      // @ts-expect-error routeTitles param 模板
      d({ ...tags, routeTitles: [{ to: "/orders/$id", label: "title" }] }),
    ];
    expectTypeOf(check).toBeFunction();
  });
});

describe("寬型別不退化（AC-5）", () => {
  it("帶 requires 的 module 可指派給 TModule、createApp().use() 接受、id 字面型別保留", () => {
    const m = defineModule({
      id: "tags",
      kind: "domain",
      requires: ["suppliers"],
      routes: (ctx) => tagsRoutes(ctx, { list: Page }),
    });
    expectTypeOf(m).toExtend<TModule>();
    expectTypeOf(m.id).toEqualTypeOf<"tags">();
    const use = (app: ReturnType<typeof createApp>) => app.use(m);
    expectTypeOf(use).toBeFunction();
  });
});
