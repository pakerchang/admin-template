import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import coreEn from "@/shared/i18n/locales/en.json";
import coreZh from "@/shared/i18n/locales/zh.json";

import inventory from "./fixtures/hardcoded-zh-inventory.json";
import keymap from "./fixtures/hardcoded-zh-keymap.json";

/**
 * 硬寫中文 i18n 化 AC-2（字典值對照）與 AC-0 (4)（keymap.sites ↔ inventory 的 disposition: "key" 雙向一致）。
 * docs/specs/i18n-hardcoded-strings.spec.md §1.2；完整安裝才成立（列在 verify-core-only.sh FULL_INSTALL_TESTS）。
 */
type TDict = Record<string, unknown>;
const { registry } = makeApp().build();
const core = { zh: coreZh as TDict, en: coreEn as TDict };

const get = (dict: TDict, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (o, k) =>
        typeof o === "object" && o !== null ? (o as TDict)[k] : undefined,
      dict
    );
const resolve = (lng: "zh" | "en", key: string) =>
  get(registry.i18n[lng], key) ?? get(core[lng], key);

describe("hardcoded-zh-keymap：新 key 的字典值（AC-2）", () => {
  it.each(keymap.map((r) => [r.key, r] as const))("%s", (_key, r) => {
    expect(resolve("zh", r.key)).toBe(r.zh);
    expect(resolve("en", r.key)).toBe(r.en);
    expect(r.en).not.toBe(r.zh);
    if (r.enSource !== "new") {
      expect(r.enSource).toMatch(/^existing:/);
      expect(resolve("en", r.enSource.slice("existing:".length))).toBe(r.en);
    }
  });

  it("key 不重複", () => {
    expect(new Set(keymap.map((r) => r.key)).size).toBe(keymap.length);
  });
});

describe("keymap.sites ↔ inventory disposition: key（AC-0 (4)）", () => {
  const keySites = new Set(
    inventory.filter((r) => r.disposition === "key").map((r) => r.site)
  );
  const mapSites = new Set(keymap.flatMap((r) => r.sites));

  it("每筆 disposition: key 都出現在某列 sites", () => {
    expect([...keySites].filter((s) => !mapSites.has(s))).toEqual([]);
  });

  it("每個 sites 項都對應一筆 disposition: key", () => {
    expect([...mapSites].filter((s) => !keySites.has(s))).toEqual([]);
  });
});
