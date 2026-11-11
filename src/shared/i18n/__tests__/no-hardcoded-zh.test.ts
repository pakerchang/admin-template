import { describe, expect, it } from "vitest";

import { findZhNodes } from "@/test/zh-scan";

/**
 * 硬寫中文 i18n 化 AC-1：src/ 非測試程式碼沒有含中文的字串 / JSX 文字（§1.1 定義，與 scripts/zh-inventory.ts 同一份）。
 * 白名單以「路徑 pattern + 字面值 + 處數」表示，不寫死 module id（core-only 副本仍成立）。
 */
const sources = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ALLOW: { path: RegExp; text?: string; count?: number }[] = [
  { path: /\/mocks\/seed\.ts$/ }, // OD-HZ-2 A：mock seed 是 API 資料
  {
    path: /^\/src\/shells\/default\/app-sidebar\.tsx$/,
    text: "中文",
    count: 1,
  }, // OD-HZ-3 A：語言自稱名
];

const isScanned = (p: string) =>
  !p.includes("/__tests__/") &&
  !/\.test\.tsx?$/.test(p) &&
  !p.startsWith("/src/test/");

describe("no hardcoded zh（AC-1）", () => {
  const hits = Object.entries(sources)
    .filter(([p]) => isScanned(p))
    .flatMap(([p, src]) => findZhNodes(p, src).map((n) => ({ path: p, ...n })));

  it("掃描範圍非空（防 glob 失效假綠）", () => {
    expect(Object.keys(sources).filter(isScanned).length).toBeGreaterThan(50);
  });

  it("只剩白名單", () => {
    const rest = hits.filter(
      (h) =>
        !ALLOW.some(
          (a) =>
            a.path.test(h.path) && (a.text === undefined || a.text === h.text)
        )
    );
    expect(rest.map((h) => `${h.path}:${h.line} ${h.text}`)).toEqual([]);
  });

  it("有處數限制的白名單恰為該處數", () => {
    for (const a of ALLOW.filter((x) => x.count !== undefined)) {
      const n = hits.filter((h) => a.path.test(h.path) && h.text === a.text);
      expect(n.length, `${a.path} ${a.text}`).toBe(a.count);
    }
  });
});
