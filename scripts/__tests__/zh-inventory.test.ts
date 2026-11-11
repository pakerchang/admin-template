import { describe, expect, it } from "vitest";

import { checkInventory } from "../zh-inventory";

import { findZhNodes } from "@/test/zh-scan";

describe("findZhNodes（§1.1 盤點定義）", () => {
  it("四種節點各命中一例，行號為內容起點", () => {
    const src = [
      'const a = "中文";', // 1 StringLiteral
      "const b = `無替換`;", // 2 NoSubstitutionTemplateLiteral
      "const c = `${a}（複製）`;", // 3 TemplateExpression
      "const d = (", // 4
      "  <div>", // 5
      "    標題", // 6 JsxText
      "  </div>", // 7
      ");",
    ].join("\n");
    expect(findZhNodes("x.tsx", src)).toEqual([
      { line: 1, kind: "StringLiteral", text: "中文" },
      { line: 2, kind: "NoSubstitutionTemplateLiteral", text: "無替換" },
      { line: 3, kind: "TemplateExpression", text: "`${a}（複製）`" },
      { line: 6, kind: "JsxText", text: "標題" },
    ]);
  });

  it("註解、純英文、全形標點以外的非 CJK 不命中；全形標點命中", () => {
    const src = [
      "// 註解中文",
      "/* 區塊註解 */",
      'const a = "English";',
      "const b = <p>Hello</p>;",
      'const c = "、";',
    ].join("\n");
    expect(findZhNodes("x.tsx", src)).toEqual([
      { line: 5, kind: "StringLiteral", text: "、" },
    ]);
  });
});

describe("checkInventory（--check 比對）", () => {
  const scanned = [
    { site: "src/a.ts:1", kind: "StringLiteral", text: "甲" },
    { site: "src/b.ts:2", kind: "StringLiteral", text: "乙" },
  ];
  const fixture = scanned.map((s) => ({ ...s, disposition: "key" }));

  it("相同 → INVENTORY_MATCH n", () => {
    expect(checkInventory(scanned, fixture)).toEqual({
      ok: true,
      lines: ["INVENTORY_MATCH 2"],
    });
  });

  it("掃描多一筆 → + 行、mismatch", () => {
    const r = checkInventory(
      [...scanned, { site: "src/c.ts:3", kind: "JsxText", text: "丙" }],
      fixture
    );
    expect(r).toEqual({
      ok: false,
      lines: ["+ src/c.ts:3 丙", "INVENTORY_MISMATCH 1"],
    });
  });

  it("掃描少一筆 → - 行、mismatch", () => {
    const r = checkInventory(scanned.slice(0, 1), fixture);
    expect(r).toEqual({
      ok: false,
      lines: ["- src/b.ts:2 乙", "INVENTORY_MISMATCH 1"],
    });
  });

  it("disposition 缺漏或不合法 → mismatch", () => {
    const bad = [
      { ...fixture[0], disposition: "nope" },
      { site: fixture[1].site, kind: fixture[1].kind, text: fixture[1].text },
    ];
    const r = checkInventory(scanned, bad);
    expect(r.ok).toBe(false);
    expect(r.lines).toEqual([
      "! src/a.ts:1 甲 invalid disposition: nope",
      "! src/b.ts:2 乙 invalid disposition: undefined",
      "INVENTORY_MISMATCH 2",
    ]);
  });
});
