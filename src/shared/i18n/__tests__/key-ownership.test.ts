import ts from "typescript";
import { describe, expect, it } from "vitest";

import en from "@/shared/i18n/locales/en.json";
import zh from "@/shared/i18n/locales/zh.json";

/**
 * i18n scope 搬遷 AC-1 / AC-2：以原始碼字串字面值判定 key 歸屬（spec §1.2 判準）。
 * - 掃 `src/**` 非測試 `.ts/.tsx` 的字串字面值（含 template literal 內嵌的字面值），與字典 leaf key 完全相等即算引用
 * - template literal 的靜態前綴（`` `x.y.${z}` `` 的 `x.y.`）覆蓋其下所有 key，前綴必須列在 DYNAMIC_PREFIXES 白名單
 * - 「看起來是 key」的字面值（首段是某字典的頂層 key 或 module id）即使不在任何字典也要檢查歸屬（抓外部 / 不存在的 key）
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

/**
 * 動態組 key 的靜態前綴白名單（spec §1.2「動態組 key 處」）。新增動態 key 須在此登記；
 * 掃到未登記的前綴（且其下有字典 key）→ 測試失敗。本檔引用 domain key，列在 verify-core-only 的 FULL_INSTALL_TESTS
 */
const DYNAMIC_PREFIXES = [
  "auth.demo.descriptions.",
  "auth.demo.roles.",
  "product.productCreate.",
  "product.productTypes.",
  "product.status.",
  "team-members.roles.",
];
/** 掃到但不是 i18n key 的 template 前綴（不計引用）：product routes 的 `routeId: \`product.${name}\`` */
const NOT_I18N_PREFIXES = ["product."];

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
/** 字典頂層 key 與 module id：首段落在這裡的「a.b」字面值視為 key 引用 */
const tops = new Set([
  ...Object.keys(zh),
  ...Object.keys(en),
  ...Object.keys(moduleLocales).map(moduleIdOf),
]);
const KEY_LIKE = /^[A-Za-z][\w-]*(\.[\w-]+)+$/;
/** module → 引用的 key-like 字面值（含字典裡不存在的） */
const keyLike = new Map<string, Set<string>>();
const usedPrefixes = new Set<string>();
for (const [path, text] of Object.entries(sources)) {
  const owner = ownerOf(path);
  const { exact, prefixes } = literalsOf(path, text);
  for (const s of exact) {
    refs.get(s)?.add(owner);
    if (KEY_LIKE.test(s) && tops.has(s.split(".")[0]))
      keyLike.set(owner, (keyLike.get(owner) ?? new Set()).add(s));
  }
  for (const p of prefixes) {
    const covered = allKeys.filter((k) => k.startsWith(p));
    if (!p.includes(".") || !covered.length || NOT_I18N_PREFIXES.includes(p))
      continue;
    usedPrefixes.add(p);
    if (DYNAMIC_PREFIXES.includes(p))
      for (const k of covered) refs.get(k)!.add(owner);
  }
}
const users = (k: string) => [...refs.get(k)!];

describe("i18n key 歸屬（i18n-scope-migration AC-1）", () => {
  it("掃描有效：讀到原始碼與 core 字典", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
    expect(coreKeys.length).toBeGreaterThan(10);
  });

  it("(a) module 引用的 key 不是自己的 `<id>.*` 就必須是 core key（含字典裡不存在的 key）", () => {
    const core = new Set(coreKeys);
    const bad: string[] = [];
    for (const [owner, lits] of keyLike)
      if (owner !== "core")
        for (const k of lits)
          if (!k.startsWith(`${owner}.`) && !core.has(k))
            bad.push(`${owner} → ${k}`);
    expect(bad).toEqual([]);
  });

  it("動態前綴與白名單一致（未登記的動態 key 失敗）", () => {
    expect([...usedPrefixes].sort()).toEqual([...DYNAMIC_PREFIXES].sort());
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
