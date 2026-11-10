import { describe, expectTypeOf, it } from "vitest";

import { coreGrants } from "@/app/mock/permission-matrix";

import type { TModule, TNavItem, TRouteContext } from "@/shared/module";
import type { TGrant, TGrantMatrix, TPermission } from "@/shared/permission";
import type { TRowAction } from "@/shared/ui/data-table/row-actions";
import type EditActions from "@/shared/ui/edit-actions";
import type { FormSubmit } from "@/shared/ui/form-submit";
import type { Guarded } from "@/shared/ui/guarded";
import type { ComponentProps, ComponentType } from "react";

/**
 * T1 AC-1 / AC-4（typed-contracts-zod spec）：權限字串的每個填寫點，錯字 `tsc` 失敗、合法值通過。
 * 錯誤案例以 `@ts-expect-error` 標記：若沒有觸發錯誤 → TS2578 → `tsc` 失敗，不會真空通過。
 * 純型別檢查：下面的函式不會被執行。
 */
type TEditProps = ComponentProps<typeof EditActions>;
type TFormSubmitPermission = ComponentProps<typeof FormSubmit>["permission"];
type TGuardedPermission = ComponentProps<typeof Guarded>["permission"];
const Page = (() => null) as ComponentType;
const noop = () => {};

describe("tags permissions are typed (T1 AC-1 / AC-4)", () => {
  it("route ctx.page / ctx.layout permission", () => {
    // 錯誤案例以 opts 的 permission 型別表達：泛型呼叫的錯誤會擴散到每個屬性，prettier 折行後 @ts-expect-error 對不到行
    type TPagePermission = Parameters<TRouteContext["page"]>[0]["permission"];
    type TLayoutPermission = Parameters<
      TRouteContext["layout"]
    >[0]["permission"];
    const check = (ctx: TRouteContext) => [
      ctx.page({
        routeId: "tags.list",
        component: Page,
        permission: "tags:read",
      }),
      ctx.layout({ path: "tags", permission: "authenticated" }),
    ];
    const page: TPagePermission = "tags:read";
    // @ts-expect-error action typo
    const pageRaed: TPagePermission = "tags:raed";
    // @ts-expect-error resource typo
    const pageTag: TPagePermission = "tag:read";
    const layout: TLayoutPermission = "authenticated";
    // @ts-expect-error action typo
    const layoutRaed: TLayoutPermission = "tags:raed";
    // @ts-expect-error resource typo
    const layoutTag: TLayoutPermission = "tag:read";
    expectTypeOf(check).toBeFunction();
    expectTypeOf([page, pageRaed, pageTag]).toBeArray();
    expectTypeOf([layout, layoutRaed, layoutTag]).toBeArray();
  });

  it("nav permission", () => {
    const item = { id: "t", label: "x", to: "/tags" };
    const ok: TNavItem = { ...item, permission: "tags:read" };
    // @ts-expect-error action typo
    const raed: TNavItem = { ...item, permission: "tags:raed" };
    // @ts-expect-error resource typo
    const tag: TNavItem = { ...item, permission: "tag:read" };
    expectTypeOf([ok, raed, tag]).toBeArray();
  });

  it("rowActions item", () => {
    const base = { id: "e", label: "edit", onSelect: noop };
    const ok: TRowAction<unknown> = { ...base, permission: "tags:update" };
    // @ts-expect-error action typo
    const raed: TRowAction<unknown> = { ...base, permission: "tags:raed" };
    // @ts-expect-error resource typo
    const tag: TRowAction<unknown> = { ...base, permission: "tag:read" };
    expectTypeOf([ok, raed, tag]).toBeArray();
  });

  it("EditActions { handler, permission }", () => {
    const ok: TEditProps = {
      onEdit: { handler: noop, permission: "tags:update" },
    };
    const raed: TEditProps = {
      // @ts-expect-error action typo
      onEdit: { handler: noop, permission: "tags:raed" },
    };
    const tag: TEditProps = {
      // @ts-expect-error resource typo
      onDelete: { handler: noop, permission: "tag:delete" },
    };
    expectTypeOf([ok, raed, tag]).toBeArray();
  });

  it("FormSubmit / Guarded permission prop", () => {
    const submit: TFormSubmitPermission = "tags:create";
    // @ts-expect-error action typo
    const submitRaed: TFormSubmitPermission = "tags:raed";
    // @ts-expect-error resource typo
    const submitTag: TFormSubmitPermission = "tag:create";
    const guarded: TGuardedPermission = "tags:delete";
    // @ts-expect-error action typo
    const guardedRaed: TGuardedPermission = "tags:raed";
    // @ts-expect-error resource typo
    const guardedTag: TGuardedPermission = "tag:read";
    expectTypeOf([submit, submitRaed, submitTag]).toBeArray();
    expectTypeOf([guarded, guardedRaed, guardedTag]).toBeArray();
  });

  it("mockGrants / coreGrants grant values (incl. wildcards)", () => {
    type TMockGrants = NonNullable<TModule["permissions"]>["mockGrants"];
    const ok: TMockGrants = { admin: ["tags:*", "tags:read", "*"] };
    // @ts-expect-error action typo
    const raed: TMockGrants = { admin: ["tags:raed"] };
    // @ts-expect-error resource typo
    const tag: TMockGrants = { admin: ["tag:read"] };
    // @ts-expect-error wildcard on an unknown resource
    const tagStar: TMockGrants = { admin: ["tag:*"] };
    const core: TGrantMatrix = {
      ...coreGrants,
      support: ["app:access", "tags:*"],
    };
    // @ts-expect-error action typo
    const coreRaed: TGrantMatrix = { ...coreGrants, support: ["tags:raed"] };
    // @ts-expect-error resource typo
    const coreTag: TGrantMatrix = { ...coreGrants, support: ["tag:read"] };
    // @ts-expect-error wildcard on an unknown resource
    const coreTagStar: TGrantMatrix = { ...coreGrants, support: ["tag:*"] };
    expectTypeOf([ok, raed, tag, tagStar]).toBeArray();
    expectTypeOf([core, coreRaed, coreTag, coreTagStar]).toBeArray();
  });

  it("registry carries the full tags catalog", () => {
    expectTypeOf<
      "tags:read" | "tags:create" | "tags:update" | "tags:delete"
    >().toExtend<TPermission>();
    expectTypeOf<"tags:*">().toExtend<TGrant>();
    expectTypeOf<"tags:raed">().not.toExtend<TPermission>();
  });
});
