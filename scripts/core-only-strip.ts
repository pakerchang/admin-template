/**
 * spec §8.2 步驟 1–2（D4 core-only）：只給 scripts/verify-core-only.sh 在暫存副本用，**不要在工作目錄執行**。
 *
 *   pnpm exec tsx scripts/core-only-strip.ts <repoDir>
 *
 * domain 名單 = src/modules/<id>/index.ts 中 `kind: "domain"` 的 module（不寫死）。
 * 1. src/app/modules.ts：刪 domain module 的 import 與 `.use()` 行
 * 2. openapi.yaml：刪 domain tag 與 tag 屬於它們的 operation，刪掉後變空的 path 一併刪
 * stdout 每行印一個 domain id（給 shell 接著 rm -rf / 篩測試）；名單為空 → exit 1。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parseDocument } from "yaml";

const root = process.argv[2];
if (!root) throw new Error("usage: core-only-strip.ts <repoDir>");

const modulesDir = join(root, "src/modules");
const domains = readdirSync(modulesDir).filter((id) => {
  try {
    return /kind:\s*["']domain["']/.test(
      readFileSync(join(modulesDir, id, "index.ts"), "utf8")
    );
  } catch {
    return false;
  }
});
if (domains.length === 0) {
  console.error("core-only-strip: no domain module found");
  process.exit(1);
}

// 1. app/modules.ts
const modulesTs = join(root, "src/app/modules.ts");
const lines = readFileSync(modulesTs, "utf8").split("\n");
const vars = new Set<string>();
for (const line of lines) {
  const m = line.match(/^import (\w+) from "@\/modules\/([\w-]+)";$/);
  if (m && domains.includes(m[2])) vars.add(m[1]);
}
const kept = lines.filter((line) => {
  const imp = line.match(/^import (\w+) from "@\/modules\//);
  const use = line.match(/^\s*\.use\((\w+)\);?$/);
  return !(imp && vars.has(imp[1])) && !(use && vars.has(use[1]));
});
if (
  vars.size !== domains.length ||
  lines.length - kept.length !== domains.length * 2
)
  throw new Error("modules.ts: could not remove every domain import / .use()");
// ponytail: 刪掉的最後一個 .use() 可能帶走分號；ASI 照樣成立，tsc 不在意，副本也不跑 lint
writeFileSync(modulesTs, kept.join("\n"));

// 2. openapi.yaml
{
  const yamlPath = join(root, "openapi.yaml");
  const doc = parseDocument(readFileSync(yamlPath, "utf8"));
  const spec = doc.toJS() as {
    tags: { name: string }[];
    paths: Record<string, Record<string, { tags?: string[] }>>;
  };
  doc.set(
    "tags",
    spec.tags.filter((t) => !domains.includes(t.name))
  );
  for (const [path, item] of Object.entries(spec.paths)) {
    const methods = Object.keys(item);
    const drop = methods.filter((m) =>
      item[m]?.tags?.some((t) => domains.includes(t))
    );
    if (drop.length === methods.length) doc.deleteIn(["paths", path]);
    else for (const m of drop) doc.deleteIn(["paths", path, m]);
  }
  writeFileSync(yamlPath, doc.toString());
}

console.log(domains.join("\n"));
