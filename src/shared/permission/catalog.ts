import { z } from "zod";

import type { TGrant } from "./types";

/** module 權限目錄（Zod 單一來源，typed-contracts spec T1 / OD-TYPE-1 C）：resource → action enum */
export type TZodCatalog = Record<string, z.ZodEnum<Record<string, string>>>;

/** 目錄 → `resource:action` union（每個 resource 自己的 action，非笛卡兒積） */
export type TPermissionsOf<C extends TZodCatalog> = {
  [R in keyof C & string]: `${R}:${z.infer<C[R]>}`;
}[keyof C & string];

/**
 * 宣告一份權限目錄；回傳同一物件推出的
 * - `schema`：`z.templateLiteral` union（runtime 驗證 + `z.infer` 推 registry）
 * - `resources`：`build()` 比對用的 `{ resource: actions[] }`，不另寫第二份
 */
export const definePermissions = <const C extends TZodCatalog>(catalog: C) => {
  const entries = Object.entries(catalog);
  const parts = entries.map(([r, actions]) =>
    z.templateLiteral([z.literal(r), ":", actions])
  );
  return {
    catalog,
    resources: Object.fromEntries(
      entries.map(([r, actions]) => [r, actions.options])
    ) as { [R in keyof C]: C[R]["options"] },
    schema: (parts.length === 1
      ? parts[0]
      : z.union(parts)) as unknown as z.ZodType<TPermissionsOf<C>>,
  };
};

/** core 自帶目錄（§6.1）：拔光 domain module 時 TPermission 不會變 never */
export const corePermissions = definePermissions({ app: z.enum(["access"]) });

/** grant schema：已安裝目錄的 `resource:action`、`resource:*` 與 `*`（wildcard 只出現在 grant） */
export const grantSchema = (catalogs: readonly TZodCatalog[]) =>
  // ponytail: 有限集合直接列舉成 z.enum；目錄是編譯期 registry 的 runtime 對應，故 cast 成 TGrant
  z.enum([
    "*",
    ...catalogs.flatMap((c) =>
      Object.entries(c).flatMap(([r, actions]) => [
        `${r}:*`,
        ...actions.options.map((a) => `${r}:${a}`),
      ])
    ),
  ]) as unknown as z.ZodType<TGrant>;

/** 逐筆 safeParse；不合法者丟棄（unknown grant 原本就不授權任何權限，fail-closed 不變） */
export const parseGrants = <T>(schema: z.ZodType<T>, grants: unknown): T[] =>
  Array.isArray(grants)
    ? grants.filter((g): g is T => schema.safeParse(g).success)
    : [];
