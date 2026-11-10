import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";

/** i18n-scope-migration AC-3（完整安裝）：實際 10 個 module 的 nav / routeTitles 標題可解析、沒有孤兒 nav key */
type TDict = Record<string, unknown>;
const { registry } = makeApp().build();
const get = (dict: TDict, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (o, k) =>
        typeof o === "object" && o !== null ? (o as TDict)[k] : undefined,
      dict
    );

const navItems = registry.nav.flatMap((n) => [n, ...(n.children ?? [])]);

describe("nav label（完整安裝）", () => {
  it("每個 nav 項目（含 children）的全域 key 在 zh / en 都解析為字串", () => {
    expect(navItems.length).toBe(9);
    for (const n of navItems)
      for (const lng of ["zh", "en"] as const)
        expect([
          n.labelKey,
          lng,
          typeof get(registry.i18n[lng], n.labelKey),
        ]).toEqual([n.labelKey, lng, "string"]);
  });

  it("每個 module 字典 nav 段的 key 都被 nav 或 routeTitles 使用（無孤兒）", () => {
    const used = new Set(registry.titles.values());
    for (const m of registry.modules)
      for (const lng of ["zh", "en"] as const)
        for (const k of Object.keys((m.i18n?.[lng]?.nav ?? {}) as TDict))
          expect([`${m.id}.nav.${k}`, used.has(`${m.id}.nav.${k}`)]).toEqual([
            `${m.id}.nav.${k}`,
            true,
          ]);
  });

  it("users 不在 sidebar nav，/users 標題經 routeTitles 解析", () => {
    expect(navItems.some((n) => n.to.startsWith("/users"))).toBe(false);
    expect(registry.titles.get("/users")).toBe("users.nav.title");
    expect(get(registry.i18n.zh, "users.nav.title")).toBe("使用者管理");
    expect(get(registry.i18n.en, "users.nav.title")).toBe("User Management");
  });
});
