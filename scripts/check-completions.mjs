// typed-contracts T2 AC-11：以 repo 安裝的 typescript LanguageService（與 VS Code 同一個 API）量測
// module 契約的 IDE 補全。虛擬檔只存在 LanguageServiceHost 內，不寫入磁碟。只在完整安裝下跑。
import { readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "tsconfig.app.json");
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
const probe = path.join(root, "src/modules/tags/__completion_probe__.ts");

const M = "/*|*/";
const source = (navTo) => `
import { defineModule } from "@/shared/module";
import type { TRouteContext } from "@/shared/module";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
const Page = () => null;
export const r = (ctx: TRouteContext<"tags">) =>
  ctx.page({ permission: "tags:read", component: Page, routeId: "${M}tags.list" });
export default defineModule({
  id: "tags",
  kind: "domain",
  i18n: { en, zh },
  requires: ["${M}suppliers"],
  nav: [
    {
      id: "t",
      label: "title",
      permission: "tags:read",
      to: "${navTo}",
      children: [{ id: "c", label: "title", permission: "tags:read", to: "${M}/tags" }],
    },
  ],
  routeTitles: [{ to: "${M}/tags", label: "title" }],
});
`;

let text = "";
const host = {
  getScriptFileNames: () => [...parsed.fileNames, probe],
  getScriptVersion: (f) => (f === probe ? text : "0"),
  getScriptSnapshot: (f) => {
    const content = f === probe ? text : ts.sys.readFile(f);
    return content === undefined
      ? undefined
      : ts.ScriptSnapshot.fromString(content);
  },
  getCurrentDirectory: () => root,
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: (f) => f === probe || ts.sys.fileExists(f),
  readFile: (f) => (f === probe ? text : ts.sys.readFile(f)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const ls = ts.createLanguageService(host, ts.createDocumentRegistry());

/** 依序取每個 marker 的補全（marker 從原文移除，位置換算到移除後的文字） */
const completionsAt = (raw) => {
  const positions = [];
  let out = "";
  let rest = raw;
  for (let i; (i = rest.indexOf(M)) !== -1; ) {
    out += rest.slice(0, i);
    positions.push(out.length);
    rest = rest.slice(i + M.length);
  }
  text = out + rest;
  return positions.map((pos) =>
    (ls.getCompletionsAtPosition(probe, pos, {})?.entries ?? []).map(
      (e) => e.name
    )
  );
};

let failed = false;
const check = (label, list, ok) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${JSON.stringify(list)}`);
  if (!ok) failed = true;
};

// 第一個 marker（nav 頂層 to）以 "${M}/tags" 帶入
const [routeIds, requires, navTop, navChild, titles] = completionsAt(
  source(`${M}/tags`)
);

const others = readdirSync(path.join(root, "src/modules"), {
  withFileTypes: true,
})
  .filter((d) => d.isDirectory() && d.name !== "tags")
  .map((d) => d.name)
  .sort();
check(
  "(a) requires",
  requires,
  JSON.stringify([...requires].sort()) === JSON.stringify(others)
);
check(
  "(b) ctx.page routeId",
  routeIds,
  routeIds.length > 0 &&
    routeIds.every((n) => n.startsWith("tags.")) &&
    routeIds.includes("tags.list")
);
for (const [label, list] of [
  ["(c) nav to", navTop],
  ["(c) children to", navChild],
  ["(c) routeTitles to", titles],
])
  check(
    label,
    list,
    ["/", "/tags", "/orders/order-list"].every((p) => list.includes(p)) &&
      list.every((p) => !p.includes("$") && (p === "/" || !p.endsWith("/")))
  );

const diagnosticsFor = (navTo) => {
  completionsAt(source(navTo));
  return ls.getSemanticDiagnostics(probe);
};
const bad = diagnosticsFor("/tag");
check("(d) nav to \"/tag\" 有紅線", bad.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")), bad.length > 0);
const good = diagnosticsFor("/tags");
check("(d) nav to \"/tags\" 無紅線", good.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")), good.length === 0);

process.exit(failed ? 1 : 0);
