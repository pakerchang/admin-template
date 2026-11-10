import { describe, expectTypeOf, it } from "vitest";

import type { TranslationResources, TransKey } from "@/shared/i18n/types";
import type { TFunction } from "i18next";

/**
 * i18n-scope-migration AC-4 (1)：module 字典經 `TranslationResources` augmentation 進 `TransKey`，
 * typo 與搬遷前的舊 key `tsc` 失敗；`TransKey` 沒有被撐寬成 string。純型別檢查：函式不會被執行。
 */
describe("tags i18n keys are typed (AC-4 (1))", () => {
  it("module key / core key 合法，typo 與舊 key 失敗", () => {
    const check = (t: TFunction) => [
      t("tags.addTag"),
      t("tags.messages.createSuccess"),
      t("common.cancel"),
    ];
    const ok: TransKey = "tags.addTag";
    const core: TransKey = "common.cancel";
    // @ts-expect-error module key typo
    const typo: TransKey = "tags.addTga";
    // @ts-expect-error 搬遷前的舊 key
    const legacy: TransKey = "pages.tag.addTag";
    // @ts-expect-error 舊 nav key
    const legacyNav: TransKey = "dashboard.menu.tags.title";
    expectTypeOf(check).toBeFunction();
    expectTypeOf([ok, core, typo, legacy, legacyNav]).toBeArray();
  });

  it("TransKey 未被撐寬成 string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<TransKey>();
  });

  it("TranslationResources 不含 index signature", () => {
    type THasIndex = string extends keyof TranslationResources ? true : false;
    expectTypeOf<THasIndex>().toEqualTypeOf<false>();
    expectTypeOf<TranslationResources["tags"]>().toHaveProperty("addTag");
  });
});
