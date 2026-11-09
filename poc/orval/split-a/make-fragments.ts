// 一次性：從 a1 的單一 openapi.yaml 切出 A 切法的 per-module 片段（模擬日後手寫的 modules/<id>/openapi.yaml）
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";

const root = new URL("../openapi.yaml", import.meta.url);
const doc = parse(readFileSync(root, "utf8"));
const out = (p: string, d: unknown) => {
  const u = new URL(p, import.meta.url);
  mkdirSync(new URL(".", u), { recursive: true });
  writeFileSync(u, stringify(d, { aliasDuplicateObjects: false }));
};
const SHARED = "../../shared/openapi/common.yaml#/components/schemas/ErrorBody";

out("./shared/openapi/common.yaml", {
  openapi: doc.openapi, info: doc.info, paths: {},
  components: { securitySchemes: doc.components.securitySchemes, schemas: { ErrorBody: doc.components.schemas.ErrorBody } },
});

for (const [id, schema] of [["banners", "Banner"], ["users", "User"]]) {
  const paths: Record<string, unknown> = {};
  for (const [p, item] of Object.entries<Record<string, { tags: string[] }>>(doc.paths))
    if (Object.values(item).some((op) => op.tags.includes(id))) paths[p] = item;
  const text = JSON.stringify(paths).replaceAll("#/components/schemas/ErrorBody", SHARED);
  out(`./modules/${id}/openapi.yaml`, {
    openapi: doc.openapi, info: doc.info, tags: [{ name: id }], security: doc.security,
    paths: JSON.parse(text),
    components: { securitySchemes: doc.components.securitySchemes, schemas: { [schema]: doc.components.schemas[schema] } },
  });
}
console.log("wrote fragments");
