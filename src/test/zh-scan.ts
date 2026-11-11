/**
 * 硬寫中文盤點定義（docs/specs/i18n-hardcoded-strings.spec.md §1.1、§1.5）。
 * `scripts/zh-inventory.ts` 與 `no-hardcoded-zh.test.ts` 共用，確保盤點與防回歸同一份判準。
 */
import ts from "typescript";

const CJK = /[一-鿿　-〿＀-￯]/;

export type TZhNode = { line: number; kind: string; text: string };

export function findZhNodes(fileName: string, sourceText: string): TZhNode[] {
  const sf = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const out: TZhNode[] = [];
  const push = (pos: number, kind: string, text: string) => {
    if (CJK.test(text))
      out.push({
        line: sf.getLineAndCharacterOfPosition(pos).line + 1,
        kind,
        text,
      });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node)) {
      push(node.getStart(sf), "StringLiteral", node.text);
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      push(node.getStart(sf), "NoSubstitutionTemplateLiteral", node.text);
    } else if (ts.isTemplateExpression(node)) {
      push(node.getStart(sf), "TemplateExpression", node.getText(sf));
      return; // 整段算一處
    } else if (ts.isJsxText(node)) {
      const raw = node.getFullText(sf);
      const lead = raw.length - raw.trimStart().length;
      push(node.getFullStart() + lead, "JsxText", raw.trim());
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}
