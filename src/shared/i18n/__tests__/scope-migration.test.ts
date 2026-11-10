import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import coreEn from "@/shared/i18n/locales/en.json";
import coreZh from "@/shared/i18n/locales/zh.json";

import coreAdditions from "./fixtures/core-en-additions.json";
import deleted from "./fixtures/scope-deleted.json";
import keymap from "./fixtures/scope-keymap.json";

/**
 * i18n scope 搬遷 AC-6：值不變（keymap）、core 補譯（core-en-additions）、刪除（scope-deleted）。
 * 三份 fixture 由 codemod 產生；zh / en 為基準 43c76a9 的 old key 值（en 原本缺者為沿用舊路徑譯文或新撰）。
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
/** registry（module 字典，已 scope）優先，再查 core 字典 */
const resolve = (lng: "zh" | "en", key: string) =>
  get(registry.i18n[lng], key) ?? get(core[lng], key);

const leaves = (o: TDict, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? leaves(v as TDict, `${p}${k}.`)
      : [`${p}${k}`]
  );

/** 新撰 en 的 3 個 banners key（搬遷後名稱；old key 由下方 regex 對回 banners 舊路徑） */
const NEW_EN_KEYMAP = [
  "banners.confirmDelete",
  "banners.deleteConfirm",
  "banners.deleteDescription",
];
const OLD_BANNER =
  /^pages\.banner\.(confirmDelete|deleteConfirm|deleteDescription)$/;

describe("scope-keymap：搬遷後值不變（AC-6）", () => {
  it.each(keymap.map((r) => [r.old, r] as const))("%s", (_old, r) => {
    expect(resolve("zh", r.new)).toBe(r.zh);
    expect(resolve("en", r.new)).toBe(r.en);
  });

  it('"enSource": "new" 恰為 banners 舊路徑的 3 個 key', () => {
    const fresh = keymap.filter((r) => "enSource" in r && r.enSource === "new");
    expect(fresh.map((r) => r.new).sort()).toEqual(NEW_EN_KEYMAP);
    for (const r of fresh) expect(r.old).toMatch(OLD_BANNER);
  });

  it("old 不重複、new 不重複", () => {
    expect(new Set(keymap.map((r) => r.old)).size).toBe(keymap.length);
    expect(new Set(keymap.map((r) => r.new)).size).toBe(keymap.length);
  });
});

describe("core-en-additions：留 core、只補 en（AC-6）", () => {
  it.each(coreAdditions.map((r) => [r.key, r] as const))("%s", (_k, r) => {
    expect(get(core.zh, r.key)).toBe(r.zh);
    expect(get(core.en, r.key)).toBe(r.en);
    expect(keymap.some((m) => m.old === r.key || m.new === r.key)).toBe(false);
    expect(deleted).not.toContain(r.key);
  });

  it('三份 fixture 合計 "enSource": "new" 恰為 4 個 key', () => {
    expect(
      [
        ...keymap
          .filter((r) => "enSource" in r && r.enSource === "new")
          .map((r) => r.old),
        ...coreAdditions.filter((r) => r.enSource === "new").map((r) => r.key),
      ].sort()
    ).toHaveLength(4);
    expect(
      coreAdditions.filter((r) => r.enSource === "new").map((r) => r.key)
    ).toEqual(["validation.email.invalid"]);
  });
});

describe("scope-deleted：無引用 key 已刪除（AC-6）", () => {
  it.each(deleted)("%s 在 zh / en 都解析不到", (key) => {
    expect(resolve("zh", key)).toBeUndefined();
    expect(resolve("en", key)).toBeUndefined();
  });

  it("與 scope-keymap 互斥", () => {
    const olds = new Set(keymap.map((r) => r.old));
    expect(deleted.filter((k) => olds.has(k))).toEqual([]);
  });

  it("覆蓋完整：keymap + deleted + core 未改名 key = 基準 core 字典 552 個 leaf key", () => {
    const news = new Set(keymap.map((r) => r.new));
    const kept = new Set(
      [...leaves(core.zh), ...leaves(core.en)].filter((k) => !news.has(k))
    );
    expect(keymap.length + deleted.length + kept.size).toBe(552);
  });
});
