import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import en from "@/shared/i18n/locales/en.json";
import zh from "@/shared/i18n/locales/zh.json";

/** 各 module 的 locales/*.json（路徑 → 內容），以檔案系統為準，不經 index.ts */
const moduleLocales = import.meta.glob<Record<string, unknown>>(
  "/src/modules/*/locales/*.json",
  { eager: true, import: "default" }
);
const moduleIdOf = (path: string) => path.split("/")[3];

describe("i18n 字典分層（spec §4.3 步驟 4、§5.4；M6 AC-3）", () => {
  const { registry } = makeApp().build();
  const ids = registry.modules.map((m) => m.id);

  it("以實際 10 個 module 跑 build() 不 throw", () => {
    expect(ids).toHaveLength(10);
  });

  it.each([
    ["zh", zh],
    ["en", en],
  ])("core %s 字典頂層 key 不含任何 module id", (_lng, dict) => {
    expect(Object.keys(dict).filter((k) => ids.includes(k))).toEqual([]);
  });

  it("modules/<id>/locales/*.json 是裸字典（頂層不含自己的 module id）", () => {
    const files = Object.entries(moduleLocales);
    expect(files.length).toBeGreaterThan(0);
    for (const [path, dict] of files)
      expect([path, moduleIdOf(path) in dict]).toEqual([path, false]);
  });

  it("module 字典經 kernel scope 到 `<id>.` 之下", () => {
    for (const [path, dict] of Object.entries(moduleLocales)) {
      const lng = path.split("/").pop()!.replace(".json", "") as "en" | "zh";
      expect(registry.i18n[lng][moduleIdOf(path)]).toEqual(dict);
    }
  });
});
