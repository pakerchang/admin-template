import ts from "typescript";
import { describe, expect, it } from "vitest";

import en from "@/shared/i18n/locales/en.json";
import zh from "@/shared/i18n/locales/zh.json";

/**
 * i18n scope 搬遷 AC-1 / AC-2：以原始碼字串字面值判定 key 歸屬（spec §1.2 判準）。
 * - 掃 `src/**` 非測試 `.ts/.tsx` 的字串字面值（含 template literal 內嵌的字面值），與字典 leaf key 完全相等即算引用
 * - template literal 的靜態前綴（`` `x.y.${z}` `` 的 `x.y.`）覆蓋其下所有 key；透傳前綴列在 PASS_THROUGH
 * - module 字典 `nav` 段由 kernel 組 key 引用（AC-3 負責），不在此檢查
 */
const sources = import.meta.glob<string>(
  ["/src/**/*.{ts,tsx}", "!/src/**/__tests__/**", "!/src/**/*.d.ts"],
  { eager: true, query: "?raw", import: "default" }
);
const moduleLocales = import.meta.glob<Record<string, unknown>>(
  "/src/modules/*/locales/*.json",
  { eager: true, import: "default" }
);

/** 透傳前綴：只轉手呼叫端傳入的 key，呼叫端字面值已計 */
const PASS_THROUGH: readonly string[] = [];

const leaves = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? leaves(v as Record<string, unknown>, `${p}${k}.`)
      : [`${p}${k}`]
  );

const moduleIdOf = (path: string) => path.split("/")[3];
const ownerOf = (path: string) =>
  path.startsWith("/src/modules/") ? moduleIdOf(path) : "core";

const literalsOf = (path: string, text: string) => {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const exact: string[] = [];
  const prefixes: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      exact.push(n.text);
    else if (ts.isTemplateExpression(n) || ts.isTemplateLiteralTypeNode(n))
      prefixes.push(n.head.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { exact, prefixes };
};

const coreKeys = [...new Set([...leaves(zh), ...leaves(en)])];
/** module 字典（scope 後的全域 key），不含 nav 段 */
const moduleKeys = [
  ...new Set(
    Object.entries(moduleLocales).flatMap(([path, dict]) =>
      leaves(dict).map((k) => `${moduleIdOf(path)}.${k}`)
    )
  ),
];
const isNavKey = (k: string) => k.split(".")[1] === "nav";
const allKeys = [...coreKeys, ...moduleKeys];

/** key → 引用者集合（module id 或 "core"） */
const refs = new Map<string, Set<string>>(allKeys.map((k) => [k, new Set()]));
for (const [path, text] of Object.entries(sources)) {
  const owner = ownerOf(path);
  const { exact, prefixes } = literalsOf(path, text);
  for (const s of exact) refs.get(s)?.add(owner);
  for (const p of prefixes) {
    if (!p.includes(".") || PASS_THROUGH.includes(p)) continue;
    for (const k of allKeys) if (k.startsWith(p)) refs.get(k)!.add(owner);
  }
}
const users = (k: string) => [...refs.get(k)!];

describe("i18n key 歸屬（i18n-scope-migration AC-1）", () => {
  it("掃描有效：讀到原始碼與 core 字典", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
    expect(coreKeys.length).toBeGreaterThan(10);
  });

  it("(a) module 引用的 key 不是自己的 `<id>.*` 就必須是 core key", () => {
    const bad: string[] = [];
    for (const k of moduleKeys)
      for (const u of users(k))
        if (u !== "core" && !k.startsWith(`${u}.`)) bad.push(`${u} → ${k}`);
    expect(bad).toEqual([]);
  });

  it("(b) 不存在只被單一 module 引用的 core key", () => {
    const single = coreKeys.filter((k) => {
      const u = users(k);
      return u.length === 1 && u[0] !== "core";
    });
    expect(single.map((k) => `${k} ← ${users(k)}`)).toEqual([]);
  });

  it("(c) core 與 module 字典沒有無引用的 key（module nav 段除外）", () => {
    const unused = allKeys.filter(
      (k) => !refs.get(k)!.size && !(moduleKeys.includes(k) && isNavKey(k))
    );
    expect(unused).toEqual([]);
  });
});

describe("i18n en / zh 對齊（i18n-scope-migration AC-2）", () => {
  it("core 字典 en / zh 的 leaf key 集合相等", () => {
    expect(leaves(en).sort()).toEqual(leaves(zh).sort());
  });

  it("每個 module 字典兩個語系檔都存在，且 leaf key 集合相等", () => {
    const byId = new Map<string, Record<string, string[]>>();
    for (const [path, dict] of Object.entries(moduleLocales)) {
      const lng = path.split("/").pop()!.replace(".json", "");
      byId.set(moduleIdOf(path), {
        ...byId.get(moduleIdOf(path)),
        [lng]: leaves(dict).sort(),
      });
    }
    for (const [id, d] of byId) {
      expect([id, Object.keys(d).sort()]).toEqual([id, ["en", "zh"]]);
      expect([id, d.en]).toEqual([id, d.zh]);
    }
  });
});
