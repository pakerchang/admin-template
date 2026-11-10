# 型別契約（Zod / 推導型別）Spec

狀態：**DRAFT（待 owner 裁決 OD-TYPE-*）**

- 需求來源：`docs/specs/refactor/README.md`「全域（owner 2026-11-10 新需求）」列。
- 上位 spec：`docs/specs/fsd-module-architecture.spec.md`（下稱「架構 spec」）。本 spec 不改其 §0 鎖定決策；與鎖定決策有張力處列在 §3，交 owner 裁決。
- 基準：master `5b1ecfd`；PoC 指令、exit code 與原始輸出見調查報告（`~/.claude/plans/admin-template/s12-typed-contracts-report.md`，不進 repo）。
- 本 spec 只定方向與驗收；OD-TYPE-* 裁決前不得開實作棒。

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

## 3. 與架構 spec 的張力（surface，未自行擇一）

- **R4（接受 typed route 寬化）vs 本需求的 `TNavItem.to` 型別化**：R4 接受的是 route **樹**型別寬化；把 `to` 收窄需另建 path registry（與 `TRouteIdRegistry` 同手法），不違反 R4 字面，但等於部分回收 R4 的取捨。列在 OD-TYPE-4 範圍內由 owner 決定是否納入。
- **架構 spec §4.5「zod 產物不在 M7 範圍（form schema 維持手寫）」**：OD-TYPE-3 選項 B 會改變此點（該句寫明「日後要用再加」，非 R 編號鎖定）。
- **架構 spec §4.1 註解「label 以 `${moduleId}.` 開頭」vs 現況全用 `dashboard.menu.*`**：型別強制前綴會讓 10 個 module 全部編譯失敗；必須先做 M6 遺留的 key 搬遷（另案）。

### User Story

身為 admin-template 的開發者，我在 route / nav / 操作元件 / `mockGrants` / `openapi.yaml` 寫權限字串，以及宣告 module 契約時，要有 IDE 補全，且寫錯在 `tsc`（`pnpm build`）就失敗，而不是執行期 throw 或靜默變成「永遠無權限」；當 `openapi.yaml` 結構或整個 module 被抽換時，依賴它的程式在編譯期報錯，作為 TDD 式重構的自動糾錯。

### Acceptance Criteria

（以第一棒「權限」為範圍；第二棒以後的 AC 依 OD-TYPE-4 裁決補寫。）

- [ ] AC-1 [cmd] 型別測試檔以 `@ts-expect-error` 鎖住下列寫錯情形，每處至少一個 action typo（例 `tags:raed`）與一個 resource typo（例 `tag:read`），並各有一個正向案例：route `ctx.page` / `ctx.layout` 的 `permission`、nav `permission`、`rowActions` 項目、`EditActions` 的 `{ handler, permission }`、`FormSubmit` / `Guarded` 的 `permission` prop、`mockGrants` 的 grant 值。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0（任一 `@ts-expect-error` 未觸發 → TS2578 → 失敗）。
- [ ] AC-2 [cmd] 非真空檢查：把 AC-1 任一 `@ts-expect-error` 註解移除，`tsc` 必須失敗。以 vitest 跑 `tsc` 於暫存副本或等價腳本自動化（實作棒決定形式，指令寫進 Done Command）。
- [ ] AC-3 [cmd] `openapi.yaml` 的 `x-permission` 不在已註冊權限中 → `tsc` 失敗（`operations.gen.ts` 的 permissions 值型別為已註冊 `TPermission | "public"`）；`build()` 1.5.3 執行期檢查保留（P2 限制：registry ≠ 已 `.use()`）。
- [ ] AC-4 [cmd] domain module 的型別測試放在 `src/modules/<id>/__tests__/` 內（隨 module 刪除）；`pnpm verify:core-only` 印 `core-only build: OK`、exit 0。
- [ ] AC-5 [cmd] 既有測試全綠：`pnpm build && pnpm exec vitest run` exit 0；測試中刻意非法的權限 fixture（`build.test.ts`、`operations-yaml.test.ts`、`use-visible-nav.test.tsx`、`can.test.ts`、`data-table-row-actions.test.tsx`）改以明確的寬型別入口或 cast 表達，且原本斷言的執行期行為不變。
- [ ] AC-6 [cmd] `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 0 error（boundaries 規則不放寬）。
- [ ] AC-7 [cmd] 補全可量測：以 TS LanguageService 對 `permission: "` 位置取補全，回傳項目 = 已註冊權限全集（腳本形式由實作棒決定，可沿用 PoC `completions.mjs`）。
- [ ] AC-8 [manual] owner 在 VS Code 內於 route / nav / `rowActions` 的 `permission: "` 處觸發補全，看到 `resource:action` 清單；寫 `tags:raed` 出現紅線。**owner 親驗 pending，不阻擋交付**。

### Milestones

依 OD-TYPE-4 建議（裁決後定稿）：

- **T1 權限（第一棒）**：權限 registry + module 權限目錄單一來源（形式依 OD-TYPE-1）；`TPermission` / `TGrant` 改由 registry 推導；`mockGrants` 型別收窄（grant 值；role id 依 OD-TYPE-6）；`operations.gen.ts` 改輸出 `as const` 並對 registry 型別檢查；型別測試（AC-1–AC-8）。
- **T2 module 契約**：module id registry（`id` / `requires`）、`staticData.routeId` 收窄為 `TRouteId`、nav `to` path registry（若 owner 納入，見 §3）、nav `label` 改 `TransKey`（前置：M6 key 搬遷另案完成）、`i18n` 字典 augmentation（架構 spec §5.4 落地）。
- **T3 domain 型別錨定**：依 OD-TYPE-3。
- 每棒 done 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0。

### Touches

T1 預計（OD 裁決後確認）：

- `src/shared/permission/types.ts`、`src/shared/permission/index.ts`（registry、推導型別、helper）
- `src/shared/module/types.ts`（`TModulePermissions` 引用處；`defineModule` 簽名依 OD-TYPE-5）
- `src/modules/<id>/index.ts` 或新增 `src/modules/<id>/model/permissions.ts`（目錄宣告 + augmentation）
- `src/app/mock/permission-matrix.ts`、`src/app/kernel/build.ts`（只動型別；執行期檢查保留）
- `scripts/extract-operations.ts` 與其產物 `src/app/operations.gen.ts`
- 上列 5 個測試檔；新增型別測試檔（`src/modules/<id>/__tests__/`、core 用 `src/shared/permission/__tests__/`）
- `scripts/verify-core-only.sh`（僅當新增測試需列入 `FULL_INSTALL_TESTS`）
- `.claude/skills/declare-permission/`、`docs/TRAPS.md`（宣告方式改變時同步）

### Must-Not-Touch

- 架構 spec §0 的鎖定決策（R1–R29、D1–D5）；權限字串格式維持 `resource:action`（R17）、operation → permission 只在 YAML `x-permission`（R21）
- `build()` 的執行期驗證（R13 / R21 / R23 / R8）不得移除——型別只是前移的第一道防線
- 不新增 module（M8 凍結）；`app/modules.ts` 的 `.use(` 數量不變
- 角色 grants 矩陣內容（OD-GRANT-1 已定案）：本 spec 只收窄型別，不改任何 grant
- orval 產物（`src/modules/*/api/**`、`*.msw.ts`）不手改
- 本 DRAFT 階段：`src/**`、`openapi.yaml`、`orval.config.ts` 一律不動

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm verify:core-only
```

expected: exit 0；輸出含 `core-only build: OK`

### Owner Decisions（待裁決）

#### OD-TYPE-1 單一來源的形式

| 選項 | 內容 | 後果 |
|---|---|---|
| A 全 Zod | 權限目錄、module id、route id、nav 等契約都用 Zod schema 宣告，型別一律 `z.infer` | 符合「Zod 為單一來源」字面。但 module id / route id / nav 這類純編譯期結構不經過任何不可信輸入，Zod 只多 runtime 物件與 bundle 成本，沒有額外的檢查能力 |
| B 全 `as const` | 契約以 `as const` 字面值宣告，型別由 `typeof` 推導；Zod 只留在 form 與信任邊界 | 最輕；但權限的 runtime 驗證（例如 login 回來 / localStorage 讀出的 `session.grants`）要另寫一份 → 兩個來源 |
| C 混合（依「是否跨信任邊界」） | **有 runtime 資料要驗的契約用 Zod 當來源**：權限目錄以 `z.enum` 宣告 action，同一物件既推導 `TPermission`（`z.infer`）也在邊界 `safeParse` grants；**純編譯期結構用 `as const` / registry**（module id、route id、nav to、i18n key） | 每類契約仍只有一個來源；Zod 用在它能多做事的地方 |

PoC 證據：P2（`as const` registry）與 P2z（Zod-first registry）都可行，IDE 補全與 typo 擋法相同；Zod 版另有 runtime `safeParse`。
**建議：C**。理由：owner 要的是「單一來源 + 推導 + 編譯期擋錯」，這三點 A 與 C 在權限上等價（P2z）；但在 route id / nav 上 Zod 沒有信任邊界可守，強行套用只增加程式量。若 owner 堅持字面「全部 Zod」，A 也可行，代價是多一層 runtime 物件。

#### OD-TYPE-2 全域 union 怎麼組裝

| 選項 | 內容 | 後果 |
|---|---|---|
| A kernel `.use()` 鏈泛型推導 | `createApp().use()` 以泛型累積 union | P1：只在 app 層可用；module 內部與 `shared/ui` 引用會循環（TS2456）或違反依賴方向，**擋不到 route / ui 的 typo**，達不到需求 |
| B declaration merging registry | `shared/permission` 宣告 `interface TPermissionRegistry`，各 module 在自己的檔案 augment（同 `TRouteIdRegistry`） | P2：可行；刪 module 目錄即移除；core 永遠有 `app:access` 不會 `never`。限制：反映「檔案在 program 內」而非「已 `.use()`」→ 保留 `build()` 執行期檢查 |
| C `pnpm gen:api` codegen | 由 codegen 產出全域權限 union 檔 | 權限目錄宣告在 module 的 TS 裡，codegen 要執行 TS 才拿得到 → 多一個產物與「忘了重跑 gen」的失效模式；YAML 端已有 extract 可順帶做（P3b） |

**建議：B 為主，加上 C 的一小部分**：module 權限用 registry；`x-permission` 沿用既有 extract，讓 `operations.gen.ts` 改輸出 `as const` 並以 registry 的 `TPermission` 檢查（P3b），YAML typo 從 vitest 前移到 `tsc`。不另建權限 codegen。

#### OD-TYPE-3 domain 型別來源

| 選項 | 內容 | 後果 |
|---|---|---|
| A 維持現況 | 手寫 `model/schema.ts`（Zod）+ orval TS interface 並存、不連結 | P5：YAML 抽換時 `tsc` 抓到產物型別流經之處（10 個），手寫 schema / 表單 / mock 靜默 |
| B orval 產 Zod | `orval.config.ts` 加 `client: "zod"` target，`model/schema.ts` 改由產物 `.extend()`（加 i18n 訊息） | P3：產物以 operation 為單位、無 component 級 `Tag` schema；YAML 沒寫的規則（`min(1)` 等）會消失，需先把驗證規則補進 YAML；改動 orval config 與 10 個 module 的 schema |
| C 手寫保留，編譯期錨定到產物 | `model/schema.ts` 加 `satisfies z.ZodType<Tag>`（或等價的雙向相容斷言），mock seed 以 `satisfies Tag[]`、`createCollection` 帶泛型 | 補上 P5 的三個缺口；改動小、不動 orval config；表單驗證規則留在手寫處 |

**建議：C 先行，B 列為之後評估**。理由：owner 要的效益 (a) 主要缺口是「手寫層沒有錨定到產物」，C 直接補上；B 的產物形狀（operation 為單位、規則不完整）目前不適合直接當 form schema。若 owner 希望 YAML 成為驗證規則的唯一來源，再開 B（前置：YAML 補齊驗證規則）。

#### OD-TYPE-4 分期與第一棒範圍

| 選項 | 內容 | 後果 |
|---|---|---|
| A 權限先（T1 → T2 → T3） | 見 Milestones | 最急的靜默失效（route / ui 永遠無權限）先解；T2 有 M6 key 搬遷前置，延後不卡 |
| B 權限 + module 契約一棒 | T1 + T2 合併 | 一次到位但範圍大；nav label 前置未完成會卡住整棒 |
| C 先做 domain 型別錨定（T3） | 先處理 openapi 抽換效益 | 效益 (a) 已部分存在（P5），急迫度低於權限 |

**建議：A**。另請 owner 裁決 T2 是否納入 `TNavItem.to` path registry（§3 與 R4 的張力）。

#### OD-TYPE-5 `defineModule` 相容策略

| 選項 | 內容 | 後果 |
|---|---|---|
| A 一次切換 | T1 一棒內把 `TPermission` 改為 registry 推導，10 個 module 同步 augment | P1'：非測試碼現有 31 個字面值全數合法，0 處要改；需改 5 個測試檔的刻意非法 fixture |
| B 漸進並存 | 過渡期 `TPermission = 已註冊 \| \`${string}:${string}\`` 或 flag 切換 | 並存期 typo 照樣通過，補全也會被寬型別稀釋；多一段要記得移除的過渡碼 |

**建議：A**。module 數固定（M8 凍結）、字面值已全合法，漸進只增加成本。

#### OD-TYPE-6 role id 是否型別化（`mockGrants` 的 key）

| 選項 | 內容 | 後果 |
|---|---|---|
| A 型別化 | 落地架構 spec §6.1 的 `coreRoles`（現況未實作：角色清單只散在 `coreGrants` 的 key、`users/model/schema.ts:10` 與 YAML `UserRole`），以 `as const` 宣告於 core，`mockGrants` key 收窄為 role union | `admn` typo 編譯期擋；module 不能自創角色（現況也沒有）；users schema / YAML 的角色列舉與 core 清單的一致性需另一個錨定（可併入 OD-TYPE-3 C） |
| B 維持 `string` | 只收窄 grant 值 | role typo 仍靜默 |

**建議：A**，併入 T1（同檔、改動小）。前端 runtime 不讀 role（架構 spec §6.1），只影響 mock 矩陣。
