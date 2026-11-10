# 型別契約（Zod / 推導型別）Spec

狀態：**已裁決（owner 2026-11-10），T1 定稿可派工；本 spec 只涵蓋 T1**（T2 / T3 為後續棒次，各自另起 spec）

- 需求來源：`docs/specs/refactor/README.md`「全域（owner 2026-11-10 新需求）」列。
- 上位 spec：`docs/specs/fsd-module-architecture.spec.md`（下稱「架構 spec」）。本 spec 不改其 §0 鎖定決策；與鎖定決策的張力與 owner 處理見 §3。
- 基準：master `5b1ecfd`；PoC 指令、exit code 與原始輸出見調查報告（`~/.claude/plans/admin-template/s12-typed-contracts-report.md`，不進 repo）。
- OD-TYPE-1～6 與 nav `to` 已由 owner 2026-11-10 裁決（見 Owner Decisions）。
- **本 spec 的完成條件**（owner 2026-11-10 裁決）= 全部 OD 裁決 + 設計原則 + T1 完整 AC。T2（module 契約）、T3（domain 錨定）只記錄已裁決的範圍與歸屬（見「後續棒次」），**不在本 spec 完成條件內**；各自派工前另起 spec，AC 寫到測試路徑。

## 1. 現況盤點（摘要）

寫錯時的後果分三級：**編譯期**（`tsc` 擋）／**執行期 throw**（`build()` 或 vitest 擋，`pnpm build` 不擋）／**靜默**（不報錯，行為錯）。

| # | 契約點 | 現況型別 | 寫錯時 |
|---|---|---|---|
| 1 | `TPermission`（`src/shared/permission/types.ts:2`） | `` `${string}:${string}` `` | 見下列使用處；IDE 補全 0 筆（PoC P4 實測） |
| 1a | route `permission`（9 個 `model/routes.ts`，23 行字面值） | `TPermission \| "authenticated"`（`src/shared/module/types.ts:37`） | **靜默**：該頁永遠 403 |
| 1b | nav `permission`（`modules/*/index.ts`） | `TPermission`（`types.ts:30`） | 不在目錄 → **執行期 throw**（`build.ts:131` `assertNavPermissions`）；在目錄但選錯 → 靜默 |
| 1c | `rowActions` / `EditActions` / `FormSubmit` / `Guarded`（15 個 ui 檔，約 35 行字面值） | `TPermission`（`row-actions.tsx:12`、`edit-actions.tsx:12`、`form-submit.tsx:8`、`guarded.tsx:15`） | **靜默**：按鈕永遠隱藏 / disabled |
| 1d | `mockGrants`（`modules/*/index.ts`）與 `coreGrants`（`src/app/mock/permission-matrix.ts:4`） | `TGrantMatrix = Record<string, readonly TGrant[]>`（`types.ts:29`）；`TGrant` 的 `` `${string}:*` `` 也是寬的 | grant typo、role id typo（`admn`）皆**靜默**：該角色少權限；架構 spec §6.1 的 `coreRoles` 未實作 |
| 1e | `permissions.resources`（`types.ts:24`） | `Record<string, readonly string[]>` | 目錄本身就是真相，沒有更上層可對照；action typo 會讓 1a–1c 的正確字串變成執行期 / 靜默錯 |
| 1f | `openapi.yaml` `x-permission`（36 個 operation） | YAML 字串；extract 以 regex 檢格式；`operations.gen.ts` 以 `: TOperationTable` 註記（寬化） | 格式錯 → gen 期失敗；不在目錄 → **執行期 throw**（`build()` 1.5.3，vitest 擋，`tsc` 不擋） |
| 2 | `TModule.id`（`types.ts:75`） | `string` | 重複 → 執行期 throw（`build.ts:77`） |
| 3 | `TModule.requires`（`types.ts:79`） | `readonly string[]` | 缺依賴 / typo → 執行期 throw（`build.ts:87`） |
| 4 | `TNavItem.label`（`types.ts:25`） | `string`；shell 以 `t(item.label as TransKey)` 強轉（`app-sidebar.tsx:95/111/122`） | **靜默**：畫面顯示 raw key；註解要求 `${moduleId}.` 前綴，現況 10 個 module 全用 `dashboard.menu.*`（M6 未搬，已知限制） |
| 5 | `TNavItem.to`（`types.ts:27`） | `string` | **靜默**：點了到 404 / not-found |
| 6 | `staticData.routeId`（`types.ts:18`） | `string`（因 `TRouteId` 在無 augment 時為 `never`） | `ctx.page({ routeId })` 本身是 `TRouteId`（編譯期）；讀 staticData 端無型別 |
| 7 | `TModule.i18n`（`types.ts:84`） | `Record<TLocale, Record<string, unknown>>` | key 無推導；`TransKey` 只由 core `zh.json` 推導（`src/shared/i18n/types.ts:25`），架構 spec §5.4 的 `TranslationResources` augmentation 未落地 |
| 8 | domain 型別 | 兩套並存：手寫 Zod `modules/<id>/model/schema.ts`（form 驗證 + `z.infer` 型別）與 orval 產物 `modules/<id>/api/model/*.ts`（純 TS interface，hooks 回傳值的型別）；兩者**沒有**編譯期連結 | 見 §2 P5：YAML 改欄位名後 `tsc` 抓到 10 處（產物型別流經之處），手寫 `schema.ts`、表單、mock seed / collection（`TRecord`）**靜默** |

## 2. PoC 結論（TypeScript 6.0.3、Zod 4.6.7、orval 8.47.0；全部在 worktree 的 `poc-typed/`，未 commit）

| PoC | 問題 | 結果 |
|---|---|---|
| P1 | 從 `createApp().use(...)` 鏈 / module 宣告推導全域 union | **可行但只能在 app 層用**。`defineModule` 的 `const M` 已保住字面值；泛型累積 `use<M>(m): TApp<P \| PermsOf<M>>` 推出 10 module 的 union，core-only 鏈正確縮小（tsc exit 0，正反 `@ts-expect-error` 皆生效）。**限制**：module 內部（routes / ui）若要引用 app 層 union → 型別循環（TS2456 / TS2502 / TS7022，實測）；`shared/ui` 依 §3.1 不得 import `app`。故 `.use()` 鏈推導無法服務 route / ui / shared 元件 |
| P1' | 現有字面值是否都落在推導 union | 非測試碼 31 個不同字面值（含 YAML `x-permission`）**全數通過**（tsc exit 0）→ 一次切換時非測試碼 0 處需改字面值。測試碼有刻意的非法 fixture（`orders:typo`、`a:read`…，5 檔），需改寫 |
| P2 | `TRouteIdRegistry` 式 declaration merging 註冊權限 | **可行**。`interface TPermissionRegistry extends Record<PermsOf<typeof resources>, true> {}` 由 module 檔 augment；core 自帶 `app:access`，拔光 module 不會變 `never`；同檔用 `TGrant` 不循環；core-only program 下 domain 權限確實不在 union（正反測試 exit 0）。**限制**：registry 反映「在 program 內的檔案」而非「有 `.use()` 的 module」——檔案在、沒 `.use()` 仍算數，故 `build()` 執行期檢查要保留 |
| P2z | Zod-first 目錄（`z.templateLiteral([z.literal(r), ":", z.enum(actions)])`）→ `z.infer` → registry | **可行**；tsc exit 0；runtime `safeParse` 正確（`["orders:read"→true, "orders:raed"→false]`）；IDE 補全 7 筆 |
| P3 | orval `client: "zod"` | **可產出**（exit 0）。形狀：**以 operation 為單位**（`ListTagsQueryParams` / `CreateTagBody` / `ListTagsResponse`…），component schema（`Tag`）不單獨匯出、inline 進各 operation；信封以 `.and()` 交集表示；YAML 沒寫的驗證規則不會出現（例：`UpdateTagBody.tag_name` 無 `.min(1)`，手寫 `updateTagSchema` 有）。`x-permission` 不會出現在任何 orval 產物（0 筆） |
| P3b | `x-permission` codegen 成型別常數 | **可行，靠既有 extract**：`operations.gen.ts` 改輸出 `as const satisfies TOperationTable` 後，`(typeof operations.permissions)[keyof …]` 推出 YAML 權限 union、operationId union（tsc exit 0） |
| P4 | Zod 4 `z.enum` / `z.templateLiteral` 在 TS 6 | **可用**：`z.templateLiteral` 存在；非笛卡兒積的 union（每個 resource 自己的 action enum）推導正確；`z.enum(...).options` 回 readonly tuple。IDE 補全（以 TS LanguageService `getCompletionsAtPosition` 量測，即 VS Code 所用 API）：現行 `TPermission` **0 筆**；registry **5 / 7 筆**；Zod union **7 筆** |
| P5 | YAML 結構抽換時 UI 是否編譯期報錯（owner 附帶效益 a） | 把 `Tag.tag_name` 改名 → `pnpm gen:api` → `tsc` **10 個錯誤**（product 3 個表單、`TagList`、`use-tag.ts`、handlers 測試）。**沒抓到**：`model/schema.ts`、`TagFormDialog`、mock seed 與 `createCollection`（型別為 `TRecord`）。結論：效益 (a) 已部分存在（orval TS interface），缺口在手寫 Zod 與 mock 層沒有錨定到產物型別 |

## 3. 與架構 spec 的張力（owner 2026-11-10 已處理）

- **R4（接受 typed route 寬化）vs nav `to` 型別化**：owner 裁決**納入 T2**。處理方式：`to` 以 path registry（`TRoutePathRegistry`，與 `TRouteIdRegistry` 同手法）收窄；route **樹**型別寬化（R4 字面）不動，`router/index.ts` 的 `Register`、module 內以 route 物件導航（§4.6）維持原狀。此為 owner 裁決**部分收回 R4 的取捨**（只收回「跨 module 導航字串無型別」這一塊），R4 本體不改。
- **架構 spec §4.5「zod 產物不在 M7 範圍（form schema 維持手寫）」**：不受影響（OD-TYPE-3 選 C，orval 不產 Zod）。
- **架構 spec §4.1 註解「label 以 `${moduleId}.` 開頭」vs 現況全用 `dashboard.menu.*`**：owner 2026-11-10 裁決——前綴強制（module `<id>` 的 label 只能是 `<id>.*`）歸「i18n scope 搬遷」那項工作（`docs/specs/refactor/README.md` M6 follow-up：domain key 與 nav label 改成 `<id>.` scope），**不屬本 spec 任何棒次**。T2 只負責「label 必須是合法 i18n key」（見「後續棒次」）。

### 設計原則

owner 2026-11-10 原話要點：「填寫時要有 type hint suggest。這關乎防呆；後續開發若沒有這一層，底層串接的心智模型會過於散亂、難在脈絡上整合，久而久之無法透過 DX 去提醒關聯性。」

**原則**：每個跨檔串接的契約欄位都必須同時滿足：

1. **填寫時 IDE 有補全**（值域是有限字面值 union，而非 `string` / `` `${string}:${string}` ``）；
2. **寫錯 `tsc` 失敗**（`pnpm build` 擋下，不靠執行期 throw 或靜默）。

適用欄位與落點：

| 欄位 | 值域來源 | 落點 |
|---|---|---|
| 權限（route `staticData.permission`、nav `permission`、`rowActions` / `EditActions` / `FormSubmit` / `Guarded`、`mockGrants` 值、`operations.gen.ts`） | module Zod 權限目錄 → `TPermissionRegistry` | T1 |
| role（`mockGrants` / `coreGrants` key） | `coreRoles`（`as const`） | T1 |
| module id、`requires` | module id registry | T2 |
| route id（`staticData.routeId`） | `TRouteIdRegistry`（既有） | T2 |
| nav `to` | `TRoutePathRegistry` | T2 |
| nav label / i18n key | `TransKey` + `TranslationResources` augmentation（架構 spec §5.4） | T2 只負責 `TNavItem.label: TransKey`；augmentation 與 `<id>.*` 前綴強制屬 i18n scope 搬遷（owner 2026-11-11 裁決 OD-I18N-1 = A，見 `docs/specs/i18n-scope-migration.spec.md`） |

T2 / T3 列在此表僅記錄原則的適用範圍與歸屬，驗收由各自後續 spec 定義。

型別是第一道防線，`build()` 的執行期檢查保留為第二道（registry 反映「檔案在 program 內」，不等於「已 `.use()`」，PoC P2）。

### User Story

身為 admin-template 的開發者，我在 route / nav / 操作元件 / `mockGrants` / `coreGrants` / `openapi.yaml` 寫權限字串與 role id 時，要有 IDE 補全，且寫錯在 `tsc`（`pnpm build`）就失敗，而不是執行期 throw 或靜默變成「永遠無權限」；整個 module 被抽換時，殘留的權限引用在編譯期報錯。（module 契約與 domain 型別的同類需求見「後續棒次」。）

### Milestones

依 OD-TYPE-4 = A：T1 → T2 → T3，每棒獨立 PR、獨立 merge。本 spec 只定義 T1；done 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0。

- **T1 權限（可派工）**：
  - 單一來源（OD-TYPE-1 C）：各 module 以 Zod 宣告權限目錄（每個 resource 一個 `z.enum(actions)`，組成 `z.templateLiteral([z.literal(resource), ":", actions])` 的 union，PoC P2z）；同一物件推導 `TPermission`（`z.infer`）並提供 runtime schema。core 自帶 `app:access` 目錄，拔光 domain module 不會變 `never`。`permissions.resources` 由此目錄推出，不另寫第二份。
  - 組裝（OD-TYPE-2 B）：`shared/permission` 宣告 `interface TPermissionRegistry {}`，各 module 在自己的檔案 augment；`TPermission` / `TGrant` 改由 registry 推導（`TGrant` = `TPermission | ${resource}:* | "*"`，resource 亦取自 registry）。
  - 一次切換（OD-TYPE-5 A）：10 個 module 同棒 augment；非測試碼字面值 0 處需改（PoC P1'）；5 個含刻意非法 fixture 的測試檔改以明確寬型別入口或 cast 表達，原斷言的執行期行為不變。
  - `operations.gen.ts`（OD-TYPE-2 的 C 部分）：`scripts/extract-operations.ts` 改輸出 `as const satisfies TOperationTable`，`TOperationTable.permissions` 值型別收窄為 `TPermission | "public"`（PoC P3b）；不另建權限 codegen。
  - 邊界 `safeParse`（OD-TYPE-1 C）：`session.grants` 進入前端的入口（login 回應寫入 session 前、`getAuth()` 讀 localStorage 後）以權限目錄組出的 grant schema（含 `resource:*`、`*`）`safeParse` 逐筆驗證；不合法的 grant 丟棄、合法者保留（unknown grant 原本就不授權任何權限，fail-closed 行為不變）。schema 依**已 `.use()` 的 module** 組出（kernel 端），注入 session 讀取路徑的方式由實作棒決定，但須守架構 spec §3.1 依賴方向（`shared` 不 import `app`）。
  - role 型別化（OD-TYPE-6 A）：落地 `coreRoles = [...] as const`（架構 spec §6.1 的 7 個角色，位置依 §6.1 在 `app/mock/permission-matrix.ts`）；以 `TRoleRegistry` declaration merging 讓 `shared/permission` 的 `TGrantMatrix` key 收窄為 role union（`shared` 不 import `app`）；`coreGrants` 與 module `mockGrants` 的 key 都受此約束。grant 矩陣內容不變（OD-GRANT-1）。

### 後續棒次（不在本 spec 完成條件內）

以下只記錄 owner 已裁決的範圍與歸屬。**各自派工前另起 spec，AC 寫到測試路徑**；本 spec 不為它們定義 AC、Touches 或 Done Command。

- **T2 module 契約**：module id registry（`id` / `requires` 收窄）；`staticData.routeId` 收窄為 `TRouteId`；**nav `to` path registry**（`TRoutePathRegistry`，owner 裁決納入 T2，R4 處理見 §3）；nav label 必須是合法 i18n key（`TNavItem.label: TransKey`、有補全、寫錯 `tsc` 失敗，去掉 shell 的 `as TransKey` 強轉）。`i18n` 字典 `TranslationResources` augmentation（架構 spec §5.4 落地）移出 T2，改由 i18n scope 搬遷那一棒負責（owner 2026-11-11 裁決 OD-I18N-1 = A，見 `docs/specs/i18n-scope-migration.spec.md`）。
- **T3 domain 型別錨定**：OD-TYPE-3 C——`model/schema.ts` 加 `satisfies z.ZodType<產物型別>`（或等價雙向相容斷言），mock seed `satisfies 產物型別[]`、`createCollection` 帶泛型；users schema / YAML `UserRole` 與 `coreRoles` 的一致性錨定（OD-TYPE-6 後果欄）。orval 產 Zod（OD-TYPE-3 B）列為之後評估。

明確排除（不屬 T1 / T2 / T3）：

- **nav label 的 i18n key 前綴強制**（module `<id>` 的 label 只能是 `<id>.*`）：owner 2026-11-10 裁決歸「i18n scope 搬遷」（`docs/specs/refactor/README.md` M6 follow-up：domain key 與 nav label 改成 `<id>.` scope，需改 key 名 + codemod，另案）。

### Acceptance Criteria

#### T1 權限（定稿）

型別測試以 vitest `.test.ts` 撰寫（同 `src/shared/lib/image-validation/__tests__/types.test.ts` 的 `expectTypeOf` 寫法），錯誤案例一律以 `// @ts-expect-error` 標記（指令未觸發錯誤 → TS2578 → `tsc` 失敗，故錯誤案例不會真空通過；`tsconfig.app.json` 的 `include` 為 `src/**/*`，`__tests__/` 在 program 內）。檔案位置：

- domain 權限的型別測試：`src/modules/tags/__tests__/permission-types.test.ts`（以 tags 為代表 module；隨 module 刪除，core-only 不受影響）
- core 權限的型別測試：`src/shared/permission/__tests__/permission-types.test.ts`（只用 `app:access`、`*`，core-safe）
- role 型別測試：`src/app/mock/__tests__/role-types.test.ts`（只引用 `coreRoles`，core-safe）

- [ ] AC-1 [cmd] 權限 typo 在下列每一處 `tsc` 失敗，每處至少一個 action typo（例 `tags:raed`）與一個 resource typo（例 `tag:read`）：route `ctx.page` / `ctx.layout` 的 `permission`（即 `staticData.permission`）、nav `permission`、`rowActions` 項目、`EditActions` 的 `{ handler, permission }`、`FormSubmit` 的 `permission` prop、`Guarded` 的 `permission` prop、`mockGrants` 與 `coreGrants` 的 grant 值（另含 `tag:*` 這類 resource 不存在的 wildcard）。案例寫在 `src/modules/tags/__tests__/permission-types.test.ts`。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-2 [cmd] role typo 在 `mockGrants` 與 `coreGrants` 的 key `tsc` 失敗（例 `admn`），`coreRoles` 以外的 key 皆拒；`coreRoles` 恰為架構 spec §6.1 的 7 個角色（型別測試以 `expectTypeOf` 鎖住 union）。案例寫在 `src/app/mock/__tests__/role-types.test.ts`。驗收同 AC-1。
- [ ] AC-3 [cmd] `operations.gen.ts`：permissions 值型別為 `TPermission | "public"`；型別測試寫在既有 `src/app/kernel/__tests__/operations-gen.test.ts`，以 `@ts-expect-error` 鎖住「不在 registry 的 `resource:action` 指派給 `TOperationTable["permissions"]` 的值」；`pnpm gen:api && git diff --exit-code -- src/app/operations.gen.ts` 確認產物與 extract 腳本一致；`build()` 1.5.3 執行期檢查保留且既有測試照過。
- [ ] AC-4 [cmd] 合法值通過：AC-1 / AC-2 每一處（含 `Guarded`）各至少一個合法案例，不帶 `@ts-expect-error`——route 含 `"authenticated"`；`app:access` 寫在 `src/shared/permission/__tests__/permission-types.test.ts`，並以 `expectTypeOf` 斷言 core-only 下 `TPermission` 非 `never`；grant 值含 `resource:*` 與 `*`。`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-5 [cmd] grants 邊界 `safeParse`：`src/app/kernel/__tests__/grant-boundary.test.ts` 對兩個入口（login 回應寫入 session 前、`getAuth()` 讀 localStorage 後）各餵 `["orders:read", "orders:raed", "orders:*", "*", "nope", 123]`，結果只保留 `["orders:read", "orders:*", "*"]`；完全合法的 grants 原樣保留；以未 `.use()` orders 的 app 組出 schema 時 `orders:*` 權限被丟棄。此檔引用 domain 權限字串，補進 `scripts/verify-core-only.sh` 的 `FULL_INSTALL_TESTS`。`pnpm exec vitest run src/app/kernel/__tests__/grant-boundary.test.ts` exit 0。
- [ ] AC-6 [cmd] `pnpm verify:core-only` exit 0、輸出含 `core-only build: OK`（core-only 下 `TPermission` 只含 core 權限，非 `never`）；新增的完整安裝型測試若放在 core 目錄，補進腳本 `FULL_INSTALL_TESTS`。
- [ ] AC-7 [cmd] `pnpm build && pnpm exec vitest run` exit 0；5 個含刻意非法 fixture 的測試檔（`build.test.ts`、`operations-yaml.test.ts`、`use-visible-nav.test.tsx`、`can.test.ts`、`data-table-row-actions.test.tsx`）原斷言的執行期行為不變。
- [ ] AC-8 [cmd] `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 0 error（boundaries 規則不放寬）。
- [ ] AC-9 [manual] IDE 補全目視：VS Code 於 route / nav / `rowActions` / `Guarded` / `mockGrants` 的 `permission: "` 與 role key 位置觸發補全，看到 registry 全集；寫 `tags:raed` 出現紅線。**owner 親驗 pending，不阻擋交付**。
- [ ] AC-10 [cmd] 單一來源：在既有 `src/app/__tests__/permission-structure.test.ts` 新增案例，斷言每個已 `.use()` module 的 `permissions.resources` 與其 Zod 權限目錄（各 resource `z.enum(...).options`）逐一相等，且 core 目錄含 `app:access`。`pnpm exec vitest run src/app/__tests__/permission-structure.test.ts` exit 0。

T1 承諾 → AC 對照：Zod 目錄單一來源（AC-10）；registry 推導 `TPermission` / `TGrant`（AC-1、AC-4、AC-6）；一次切換與 5 個 fixture 測試檔（AC-7）；`operations.gen.ts`（AC-3）；邊界 `safeParse`（AC-5）；role 型別化（AC-2）；權限各強制點含 `Guarded`（AC-1、AC-4、AC-9）；grant 矩陣內容不變（Must-Not-Touch，AC-7 既有測試照過）。

### Touches

T1 範圍：

- `src/shared/permission/types.ts`、`src/shared/permission/index.ts`（`TPermissionRegistry`、`TRoleRegistry`、推導型別、目錄 → Zod schema helper、grant schema）
- `src/shared/permission/__tests__/`（core 型別測試、grant `safeParse` 測試）
- `src/shared/module/types.ts`（`TModulePermissions` / `TNavItem.permission` / `TGuard` 引用處）
- `src/shared/api/session.ts`（grants 讀入邊界）；login 寫入 session 處（`src/modules/auth/**` 內呼叫 `setAuth` 的 model 檔）
- `src/modules/<id>/index.ts` 或新增 `src/modules/<id>/model/permissions.ts`（Zod 目錄 + augmentation），10 個 module；`src/modules/tags/__tests__/permission-types.test.ts`（domain 型別測試）
- 測試：`src/app/mock/__tests__/role-types.test.ts`、`src/app/kernel/__tests__/grant-boundary.test.ts`（新增）；`src/app/kernel/__tests__/operations-gen.test.ts`、`src/app/__tests__/permission-structure.test.ts`（新增案例）
- `src/shared/ui/guarded.tsx` 等操作元件（僅型別引用隨 `TPermission` 收窄，若需要）
- `src/app/mock/permission-matrix.ts`（`coreRoles`、`TRoleRegistry` augment、`coreGrants` 收窄）、`src/app/kernel/build.ts`（型別；組 grant schema；執行期檢查保留）、app 組裝處（注入 grant schema，若需要）
- `scripts/extract-operations.ts` 與產物 `src/app/operations.gen.ts`（由 `pnpm gen:api` 重產，不手改）
- AC-7 列名的 5 個測試檔
- `scripts/verify-core-only.sh`（`FULL_INSTALL_TESTS` 補 `grant-boundary.test.ts`；其他新增測試需列入時同）
- `.claude/skills/declare-permission/`、`docs/TRAPS.md`（宣告方式改變時同步）

### Must-Not-Touch

T1 範圍：

- 架構 spec 本體與其 §0 鎖定決策（R1–R29、D1–D5）；權限字串格式維持 `resource:action`（R17）、operation → permission 只在 YAML `x-permission`（R21）
- `build()` 的執行期驗證（R8 / R13 / R21 / R23）不得移除
- `openapi.yaml`、`orval.config.ts`；orval 產物（`src/modules/*/api/**`、`*.msw.ts`）不手改
- 角色 grants 矩陣內容（OD-GRANT-1 已定案）：只收窄型別，不增減任何 grant；`coreRoles` 清單照架構 spec §6.1
- 不新增 module；`app/modules.ts` 的 `.use(` 數量不變
- T2 / T3 範圍（module id、route id、nav `to` / label、i18n、domain schema 錨定）

### Done Command

T1：

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm gen:api && git diff --exit-code -- src/modules/*/api src/modules/*/mocks src/app/operations.gen.ts && pnpm verify:core-only
```

expected: exit 0；輸出含 `core-only build: OK`

### Owner Decisions

全部已由 owner 2026-11-10 裁決；選項表與原建議保留供追溯。

#### OD-TYPE-1 單一來源的形式

已裁決（owner 2026-11-10）：**C 混合**——跨信任邊界的契約（權限目錄）用 Zod `z.enum` 為來源，同時推導型別並在邊界 `safeParse` grants；純編譯期結構（module id / route id / nav / i18n key）用 `as const` / registry。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 全 Zod | 權限目錄、module id、route id、nav 等契約都用 Zod schema 宣告，型別一律 `z.infer` | 符合「Zod 為單一來源」字面。但 module id / route id / nav 這類純編譯期結構不經過任何不可信輸入，Zod 只多 runtime 物件與 bundle 成本，沒有額外的檢查能力 |
| B 全 `as const` | 契約以 `as const` 字面值宣告，型別由 `typeof` 推導；Zod 只留在 form 與信任邊界 | 最輕；但權限的 runtime 驗證（例如 login 回來 / localStorage 讀出的 `session.grants`）要另寫一份 → 兩個來源 |
| C 混合（依「是否跨信任邊界」） | **有 runtime 資料要驗的契約用 Zod 當來源**：權限目錄以 `z.enum` 宣告 action，同一物件既推導 `TPermission`（`z.infer`）也在邊界 `safeParse` grants；**純編譯期結構用 `as const` / registry**（module id、route id、nav to、i18n key） | 每類契約仍只有一個來源；Zod 用在它能多做事的地方 |

PoC 證據：P2（`as const` registry）與 P2z（Zod-first registry）都可行，IDE 補全與 typo 擋法相同；Zod 版另有 runtime `safeParse`。
**建議：C**。理由：owner 要的是「單一來源 + 推導 + 編譯期擋錯」，這三點 A 與 C 在權限上等價（P2z）；但在 route id / nav 上 Zod 沒有信任邊界可守，強行套用只增加程式量。若 owner 堅持字面「全部 Zod」，A 也可行，代價是多一層 runtime 物件。

#### OD-TYPE-2 全域 union 怎麼組裝

已裁決（owner 2026-11-10）：**B registry + 一點 C**——`TPermissionRegistry` declaration merging（同 `TRouteIdRegistry`）；`operations.gen.ts` 改輸出 `as const` 並對 registry 的 `TPermission` 型別檢查；保留 `build()` 執行期檢查；不另建權限 codegen。

| 選項 | 內容 | 後果 |
|---|---|---|
| A kernel `.use()` 鏈泛型推導 | `createApp().use()` 以泛型累積 union | P1：只在 app 層可用；module 內部與 `shared/ui` 引用會循環（TS2456）或違反依賴方向，**擋不到 route / ui 的 typo**，達不到需求 |
| B declaration merging registry | `shared/permission` 宣告 `interface TPermissionRegistry`，各 module 在自己的檔案 augment（同 `TRouteIdRegistry`） | P2：可行；刪 module 目錄即移除；core 永遠有 `app:access` 不會 `never`。限制：反映「檔案在 program 內」而非「已 `.use()`」→ 保留 `build()` 執行期檢查 |
| C `pnpm gen:api` codegen | 由 codegen 產出全域權限 union 檔 | 權限目錄宣告在 module 的 TS 裡，codegen 要執行 TS 才拿得到 → 多一個產物與「忘了重跑 gen」的失效模式；YAML 端已有 extract 可順帶做（P3b） |

**建議：B 為主，加上 C 的一小部分**：module 權限用 registry；`x-permission` 沿用既有 extract，讓 `operations.gen.ts` 改輸出 `as const` 並以 registry 的 `TPermission` 檢查（P3b），YAML typo 從 vitest 前移到 `tsc`。不另建權限 codegen。

#### OD-TYPE-3 domain 型別來源

已裁決（owner 2026-11-10）：**C 手寫 + 錨定**——`model/schema.ts` 加 `satisfies z.ZodType<產物型別>`（或等價雙向相容斷言），mock seed `satisfies 產物型別[]`；orval 產 Zod（B）列為之後評估，不在本 spec 範圍。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 維持現況 | 手寫 `model/schema.ts`（Zod）+ orval TS interface 並存、不連結 | P5：YAML 抽換時 `tsc` 抓到產物型別流經之處（10 個），手寫 schema / 表單 / mock 靜默 |
| B orval 產 Zod | `orval.config.ts` 加 `client: "zod"` target，`model/schema.ts` 改由產物 `.extend()`（加 i18n 訊息） | P3：產物以 operation 為單位、無 component 級 `Tag` schema；YAML 沒寫的規則（`min(1)` 等）會消失，需先把驗證規則補進 YAML；改動 orval config 與 10 個 module 的 schema |
| C 手寫保留，編譯期錨定到產物 | `model/schema.ts` 加 `satisfies z.ZodType<Tag>`（或等價的雙向相容斷言），mock seed 以 `satisfies Tag[]`、`createCollection` 帶泛型 | 補上 P5 的三個缺口；改動小、不動 orval config；表單驗證規則留在手寫處 |

**建議：C 先行，B 列為之後評估**。理由：owner 要的效益 (a) 主要缺口是「手寫層沒有錨定到產物」，C 直接補上；B 的產物形狀（operation 為單位、規則不完整）目前不適合直接當 form schema。若 owner 希望 YAML 成為驗證規則的唯一來源，再開 B（前置：YAML 補齊驗證規則）。

#### OD-TYPE-4 分期與第一棒範圍

已裁決（owner 2026-11-10）：**A 權限先**——T1 權限 → T2 module 契約 → T3 domain 錨定。nav `to`：已裁決（owner 2026-11-10）：**納入 T2**（path registry，R4 處理見 §3）。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 權限先（T1 → T2 → T3） | 見 Milestones | 最急的靜默失效（route / ui 永遠無權限）先解；T2 有 M6 key 搬遷前置，延後不卡 |
| B 權限 + module 契約一棒 | T1 + T2 合併 | 一次到位但範圍大；nav label 前置未完成會卡住整棒 |
| C 先做 domain 型別錨定（T3） | 先處理 openapi 抽換效益 | 效益 (a) 已部分存在（P5），急迫度低於權限 |

**建議：A**。另請 owner 裁決 T2 是否納入 `TNavItem.to` path registry（已裁：納入，見上）。

#### OD-TYPE-5 `defineModule` 相容策略

已裁決（owner 2026-11-10）：**A 一次切換**。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 一次切換 | T1 一棒內把 `TPermission` 改為 registry 推導，10 個 module 同步 augment | P1'：非測試碼現有 31 個字面值全數合法，0 處要改；需改 5 個測試檔的刻意非法 fixture |
| B 漸進並存 | 過渡期 `TPermission = 已註冊 \| \`${string}:${string}\`` 或 flag 切換 | 並存期 typo 照樣通過，補全也會被寬型別稀釋；多一段要記得移除的過渡碼 |

**建議：A**。module 數固定（M8 凍結）、字面值已全合法，漸進只增加成本。

#### OD-TYPE-6 role id 是否型別化（`mockGrants` 的 key）

已裁決（owner 2026-11-10）：**A 型別化，併入 T1**——落地 `coreRoles`（`as const`），`mockGrants` key 收窄為 role union。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 型別化 | 落地架構 spec §6.1 的 `coreRoles`（現況未實作：角色清單只散在 `coreGrants` 的 key、`users/model/schema.ts:10` 與 YAML `UserRole`），以 `as const` 宣告於 core，`mockGrants` key 收窄為 role union | `admn` typo 編譯期擋；module 不能自創角色（現況也沒有）；users schema / YAML 的角色列舉與 core 清單的一致性需另一個錨定（可併入 OD-TYPE-3 C） |
| B 維持 `string` | 只收窄 grant 值 | role typo 仍靜默 |

**建議：A**，併入 T1（同檔、改動小）。前端 runtime 不讀 role（架構 spec §6.1），只影響 mock 矩陣。
