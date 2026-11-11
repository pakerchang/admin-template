/**
 * 硬寫中文盤點（docs/specs/i18n-hardcoded-strings.spec.md §1.5，AC-0）。
 *
 *   pnpm exec tsx scripts/zh-inventory.ts [--ref <git-ref>] [--check <fixture>]
 *
 * 沒給 --ref 讀工作目錄；給 --ref 以 git ls-tree / git show 讀該 commit。
 * 沒給 --check 印 JSON 陣列；給 --check 以 (site, text) 比對 fixture，相同印 `INVENTORY_MATCH <n>`、exit 0，否則 exit 1。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { findZhNodes } from "../src/test/zh-scan";

export type TSite = { site: string; kind: string; text: string };
const DISPOSITIONS = new Set([
  "key",
  "reuse",
  "delete-fallback",
  "english-literal",
  "keep",
  "seed",
]);

const isScanned = (p: string) =>
  /^src\/.*\.tsx?$/.test(p) &&
  !p.includes("/__tests__/") &&
  !/\.test\.tsx?$/.test(p) &&
  !p.startsWith("src/test/");

const lineOf = (s: string) => Number(s.slice(s.lastIndexOf(":") + 1));
const bySite = (a: TSite, b: TSite) => {
  const fa = a.site.slice(0, a.site.lastIndexOf(":"));
  const fb = b.site.slice(0, b.site.lastIndexOf(":"));
  return fa < fb ? -1 : fa > fb ? 1 : lineOf(a.site) - lineOf(b.site);
};

export function scan(ref?: string): TSite[] {
  const git = (...args: string[]) =>
    execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });
  const files = ref
    ? git("ls-tree", "-r", "--name-only", ref, "--", "src").split("\n")
    : git(
        "ls-files",
        "--cached",
        "--others",
        "--exclude-standard",
        "src"
      ).split("\n");
  return files
    .filter(isScanned)
    .flatMap((f) => {
      const text = ref ? git("show", `${ref}:${f}`) : readFileSync(f, "utf8");
      return findZhNodes(f, text).map((n) => ({
        site: `${f}:${n.line}`,
        kind: n.kind,
        text: n.text,
      }));
    })
    .sort(bySite);
}

export function checkInventory(
  scanned: TSite[],
  fixture: (TSite & { disposition?: string })[]
): { ok: boolean; lines: string[] } {
  const k = (s: TSite) => `${s.site} ${s.text}`;
  const fx = new Set(fixture.map(k));
  const sc = new Set(scanned.map(k));
  const lines = [
    ...scanned.filter((s) => !fx.has(k(s))).map((s) => `+ ${k(s)}`),
    ...fixture.filter((s) => !sc.has(k(s))).map((s) => `- ${k(s)}`),
    ...fixture
      .filter((s) => !DISPOSITIONS.has(s.disposition ?? ""))
      .map((s) => `! ${k(s)} invalid disposition: ${s.disposition}`),
  ];
  return lines.length
    ? { ok: false, lines: [...lines, `INVENTORY_MISMATCH ${lines.length}`] }
    : { ok: true, lines: [`INVENTORY_MATCH ${fixture.length}`] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: { ref: { type: "string" }, check: { type: "string" } },
  });
  const scanned = scan(values.ref);
  if (!values.check) {
    console.log(JSON.stringify(scanned, null, 2));
  } else {
    const r = checkInventory(
      scanned,
      JSON.parse(readFileSync(values.check, "utf8"))
    );
    r.lines.forEach((l) => console.log(l));
    process.exit(r.ok ? 0 : 1);
  }
}
