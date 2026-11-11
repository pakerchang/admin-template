import { describe, expectTypeOf, it } from "vitest";

import type { TModuleId, TRouteId, TRoutePath } from "@/shared/module";

/**
 * typed-contracts T2 AC-4（core-safe）：拔掉 domain module 後三個 registry 都不是 never。
 * 只引用 generic id 與 core 自帶的 "/"，core-only 副本照跑。
 */
describe("module 契約 registry 在 core-only 仍成立（AC-4）", () => {
  it("TModuleId／TRouteId／TRoutePath 都不是 never", () => {
    expectTypeOf<TModuleId>().not.toBeNever();
    expectTypeOf<TRouteId>().not.toBeNever();
    expectTypeOf<TRoutePath>().not.toBeNever();
  });

  it('"/" 是 TRoutePath、"users" 是 TModuleId', () => {
    expectTypeOf<"/">().toExtend<TRoutePath>();
    expectTypeOf<"users">().toExtend<TModuleId>();
  });
});
