# 硬寫中文 UI 字串 i18n 化 Spec

狀態：**草稿，待 owner 裁決 OD-HZ-1～4**。實作依賴 I1（`docs/specs/i18n-scope-migration.spec.md`，branch `feat/i18n-scope-migration`）先合併到 master。

- 需求來源：I1 spec §1.4 與 OD-I18N-6 第三子題（owner 2026-11-11 裁決 A：硬寫中文不在 I1，另案處理）。本 spec 就是那個另案。
- 上位規則：key 命名沿用 OD-I18N-2 A（去掉 domain 段、放進 module 字典，全域 key 為 `<id>.*`）；放 core 還是 module 沿用 OD-I18N-3 A（只被一個 module 引用 → 該 module 字典；被 core 引用或被 ≥2 個 module 引用 → core 字典）。
- **盤點基準**：master `67a8aee`（I1 尚未合併）。I1 會改掉所有 key 名與字典位置，所以本文 §1 的「建議 key」是**依 I1 規則推算的 I1 落地後名稱**；實作棒第一步要在 I1 合併後的 master 上重新盤點（AC-0），以重盤結果為準。
- 盤點腳本放 session scratchpad，不進 repo；數字可用 §1.1 的定義重現。

## 1. 現況盤點（master `67a8aee`）

### 1.1 盤點定義

以 TypeScript AST（`ts.createSourceFile`）掃 `src/**/*.{ts,tsx}`，排除 `__tests__/` 目錄與 `*.test.ts(x)`。計入的節點：`StringLiteral`、`NoSubstitutionTemplateLiteral`、`TemplateExpression`（整段算一處）、`JsxText`；內容含 CJK 字元（`一-鿿`、`　-〿`、`＀-￯`）即算一處。註解不計（AST 不含註解）。

| 指標 | 數字 |
|---|---|
| 含中文的字串 / JSX 文字 | **76 處 / 18 檔** |
| 其中 mock seed（`product/mocks/seed.ts`，`lang(en, zh)` 的商品資料） | 20 處 / 1 檔 |
| 不含 seed | **56 處 / 17 檔** |

與 I1 §1.4（55 處 / 16 檔）的差異：多了 `shared/ui/image-upload/image-upload-dialog.tsx:325` 的 `"、"`（格式清單分隔符，畫面可見）。其餘分類數字一致。

### 1.2 逐處清單（不含 seed）

欄位說明：**處理**＝`key`（新增 key）、`reuse`（改用既有 key）、`刪 fallback`（OD-HZ-1 A：刪掉沒傳 `t` 時的中文 fallback 分支，該分支在 app 內不會被執行）、`英文字面值`（不顯示在 UI 的開發者訊息）、`保留`（白名單）。**位置**依 OD-I18N-3 A 判定。**建議 key** 為 I1 落地後的名稱，與同 module 既有 key 的路徑形狀對齊（例：`toast.article.get.listError` 經 I1 → `articles.toast.get.listError`）；I1 實際落地的同類 key 形狀不同時，以 I1 為準調整。**en 來源**：`既有:<key>` 表示沿用該 key 的現有 en 值；`new` 表示本 spec 起草的新譯文。

| 檔:行 | 字串 | 處理 | 位置 | 建議 key | en（來源） |
|---|---|---|---|---|---|
| `team-members/model/use-staff.ts:138` | 獲取員工列表失敗 | key | team-members | `team-members.toast.get.listError` | Failed to get staff list（new，句型同 `toast.article.get.listError`） |
| `use-staff.ts:165`、`:181` | 創建員工失敗 | key | team-members | `team-members.toast.create.error` | Staff creation failed（new，句型同 `toast.article.create.error`） |
| `use-staff.ts:198`、`:214` | 更新員工失敗 | key | team-members | `team-members.toast.update.error` | Staff update failed（new） |
| `use-staff.ts:233`、`:249` | 刪除員工失敗 | key | team-members | `team-members.toast.delete.error` | Staff deletion failed（new） |
| `use-staff.ts:173`、`:206`、`:241` | 成功 | reuse | core | `common.success` | Success（既有:`common.success`） |
| `use-staff.ts:174` | 員工創建成功 | key | team-members | `team-members.toast.create.success` | Staff created successfully（new） |
| `use-staff.ts:207` | 員工資料更新成功 | key | team-members | `team-members.toast.update.success` | Staff updated successfully（new） |
| `use-staff.ts:242` | 員工刪除成功 | key | team-members | `team-members.toast.delete.success` | Staff deleted successfully（new） |
| `articles/model/use-article.ts:125`、`:197` | 獲取用戶資訊失敗，請重新登入 | key | articles | `articles.toast.profile.fetchError` | Failed to get user info, please sign in again（new） |
| `use-article.ts:136`、`:208` | 無法獲取用戶資訊，請重新登入 | key | articles | `articles.toast.profile.missing` | User info unavailable, please sign in again（new） |
| `consumers/model/use-consumer.ts:62` | 獲取客戶列表失敗 | key | consumers | `consumers.toast.get.listError` | Failed to get customer list（new） |
| `use-consumer.ts:108` | 獲取交易記錄失敗 | key | consumers | `consumers.toast.get.transactionError` | Failed to get transaction history（new） |
| `tags/model/use-tag.ts:25` | 標籤名稱（`validation.required.field` 的 `field` 參數） | reuse | tags | I1 對 `pages.tag.tagName` 的新 key（預期 `tags.tagName`），以 `t()` 取值後傳入 | 依 I1（I1 沿用 en 舊路徑 `tag.tagName` = Tag Name） |
| `product/ui/ProductDraftForm.tsx:77` | `${product_name}（複製）` | key | product | `product.productDraft.copyName`（zh `{{name}}（複製）`） | `{{name}} (Copy)`（new） |
| `users/ui/components/EditUserRoleDialogContent.tsx:37` | 編輯使用者角色 | key | users | `users.editRole.title` | Edit User Role（new） |
| `EditUserRoleDialogContent.tsx:38` | 請選擇新的使用者角色 | key | users | `users.editRole.description` | Select a new role for the user（new） |
| `EditUserRoleDialogContent.tsx:48` | 新使用者 | key | users | `users.roles.new` | New User（new） |
| `EditUserRoleDialogContent.tsx:53` | 一般使用者 | key | users | `users.roles.user` | User（new） |
| `EditUserRoleDialogContent.tsx:58` | VIP會員 | key | users | `users.roles.vip` | VIP Member（new） |
| `EditUserRoleDialogContent.tsx:63` | 代理商 | key | users | `users.roles.agent` | Agent（既有:`order.agent`） |
| `EditUserRoleDialogContent.tsx:68` | 客服 | key | users | `users.roles.cservice` | Customer Service（既有:`staff.roles.cservice`） |
| `EditUserRoleDialogContent.tsx:73` | 管理員 | key | users | `users.roles.admin` | Admin（既有:`staff.roles.admin`） |
| `EditUserRoleDialogContent.tsx:78` | 超級管理員 | key | users | `users.roles.superadmin` | Super Admin（既有:`staff.roles.superadmin`） |
| `banners/model/image-validation/file-type.rule.ts:29`、`:44` | Banner 圖片請使用 … 格式… | 刪 fallback | — | — | — |
| `banners/.../filename-prefix.rule.ts:25`、`:55` | 桌面版／手機版圖片檔名請以 d_／m_ 開頭 | 刪 fallback | — | — | — |
| `banners/.../filesize.rule.ts:33`、`:46`、`:77`、`:90` | 檔案大小過小…／超過限制… | 刪 fallback | — | — | — |
| `banners/.../resolution.rule.ts:47`、`:59`、`:75`、`:123`、`:136`、`:152` | 桌面版／手機版解析度過小／過大／寬高比… | 刪 fallback | — | — | — |
| `banners/.../resolution.rule.ts:27`、`:102` | 無法獲取圖片尺寸資訊，請確保檔案為有效的圖片格式（無 `t` 分支，一律中文） | key | banners | `banners.validation.image.resolution.metadataMissing` | Unable to read image dimensions. Please make sure the file is a valid image（new） |
| `shared/lib/image-validation/base-rules/file-type.rule.ts:31`、`:47` | 不支援的檔案類型／副檔名… | 刪 fallback | — | — | — |
| `shared/.../base-rules/filename.rule.ts:19` | 檔名只能包含英文字母… | 刪 fallback | — | — | — |
| `shared/.../base-rules/filesize.rule.ts:23`、`:36` | 檔案大小過小…／超過限制… | 刪 fallback | — | — | — |
| `shared/lib/image-validation/manager.ts:142` | `` `驗證規則執行失敗: ${…"未知錯誤"}` ``（規則 throw 時的錯誤訊息，會出現在 `errors`、上傳 dialog 可見） | key ×2 | core | `validation.image.ruleFailed`（zh `驗證規則執行失敗: {{reason}}`）、`validation.image.unknownError`（zh `未知錯誤`） | Validation rule failed: {{reason}}／Unknown error（new） |
| `shared/lib/image-validation/utils/image-metadata.ts:24` | `new Error("無法讀取圖片資訊")`（被 `manager.ts:103-106` catch 後只 `console.warn`，UI 看不到） | 英文字面值 | — | — | 改為 `"Failed to read image metadata"` |
| `shared/ui/image-upload/image-upload-dialog.tsx:325` | `"、"`（允許格式清單的分隔符） | key | core | `dialog.imgUpload.formatSeparator`（zh `、`） | `, `（new） |
| `shells/default/app-sidebar.tsx:62` | 中文（語言切換選單的自稱名，與同陣列的 `"English"` 成對） | 保留（OD-HZ-3 A） | — | — | — |
| `app-sidebar.tsx:146` | 語言（`i18n.language` 不在清單時的按鈕文字） | key | core | `lng.label` | Language（new） |

### 1.3 小計（依 OD-HZ-1～4 建議方案）

| 處理 | 處 | 說明 |
|---|---|---|
| 新增 key | 31 處 → **26 個 key** | team-members 7、articles 2、consumers 2、product 1、users 9、banners 1、core 4（`validation.image.ruleFailed`、`validation.image.unknownError`、`dialog.imgUpload.formatSeparator`、`lng.label`）；manager.ts 一處用到 2 個 key |
| 改用既有 key | 4 處 | `common.success` ×3、tags `tagName` ×1 |
| 刪 fallback 分支 | 19 處 | banners 14、core 5 |
| 改英文字面值 | 1 處 | `image-metadata.ts:24` |
| 保留（白名單） | 1 處 | `app-sidebar.tsx:62` |
| 合計 | 56 處（其中 manager.ts:142 一處計入「新增 key」） | |

26 個新 key 中 en 譯文：沿用既有 en 值 4 個（`users.roles.agent` / `cservice` / `admin` / `superadmin`），新撰 22 個。

### 1.4 現況機制（影響設計的事實）

- **圖片驗證 `t` 是選填，但唯一的呼叫端一定會傳**：`ValidationOptions.t` / `ValidationContext.t` 為 `I18nFunctionSchema.optional()`（`shared/lib/image-validation/schemas.ts:43`、`:66`）；規則寫成 `t ? t(key) : "中文 fallback"`。app 內唯一呼叫 `validateImage` 的是 `shared/ui/image-upload/image-upload-dialog.tsx:97`、`:194`，兩處都傳 `t`。因此 19 個 fallback 分支只在測試中被執行；且 banners fallback 文字與 key 的 zh 值本來就不同（例 `file-type.rule.ts:29` fallback 是「Banner 圖片請使用…」，有 `t` 時顯示 `validation.image.type.unsupported`），app 畫面一直顯示的是 key 的文字。
- **斷言 zh fallback 的測試 3 處**：`shared/lib/image-validation/__tests__/i18n-integration.test.ts:63-76`（「should fallback to default message when no translation function」）、`__tests__/basic-usage.test.ts:115`、`presets/__tests__/general.preset.test.ts:143`（後兩者不傳 `t`、斷言 fallback 中文）。
- **use-staff 的錯誤訊息走 `error.message`**：`mutationFn` 內 `throw new Error("創建員工失敗")`，`onError` 顯示 `error.message || "創建員工失敗"`，所以 throw 的字串本身就是 UI 文案。
- **mock seed 已是雙語資料**：`product/mocks/seed.ts:21-47` 以 `[en, zh]` 配對，經 `lang(en, zh)` 產生商品的多語欄位；這是 API 回應內容，不是 UI 文案。
- **語言切換自稱名**：`app-sidebar.tsx:61-64` 的 `languages` 陣列是 `中文` / `English`，兩個語系下都顯示各語言自己的名字。core 字典另有 `lng.zh`（zh 中文 / en Chinese），sidebar 目前沒用它。

## 2. 設計原則

- **行為不變（zh）**：zh 畫面上每一處文字與改動前逐字相同（`（複製）` 這類組字結果也相同）。en 畫面從中文變成英文。
- **歸屬沿用 I1**：新 key 的位置用 OD-I18N-3 A 判定，命名用 OD-I18N-2 A；I1 的 `key-ownership.test.ts`（I1 AC-1）照樣適用新 key，不另寫歸屬測試。
- **en 與 zh 的 key 集合相同**：每個新 key 在 en / zh 字典都有值。
- **不顯示在 UI 的字串不進字典**：只被 `console.*` 或被 catch 吞掉的訊息改英文字面值。
- **防回歸**：用一支掃描測試鎖住「`src/` 非測試程式碼沒有中文字串」，例外只能經白名單（OD-HZ-2、OD-HZ-3）。

### User Story

身為 admin-template 的使用者，我切到 English 後，toast、錯誤訊息、對話框與驗證訊息都顯示英文，不再夾雜硬寫在程式碼裡的中文；身為開發者，我新增 UI 文案時如果直接寫中文字串，測試會失敗、提醒我改放進字典。

### Milestones

單棒（H1），一個 PR。前置條件：I1 已合併到 master。done 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0。

H1 步驟：

1. **重新盤點**（AC-0）：在 I1 合併後的 master 上以 §1.1 的定義重跑盤點，對照 §1.2；新增或消失的位置、I1 落地後實際的同類 key 名稱，寫進交付報告的差異表，並依 §2 原則處理新增的位置。
2. 圖片驗證：依 OD-HZ-1 處理 `t` 與 fallback；`manager.ts` 的規則失敗訊息改用 `t`；`image-metadata.ts` 改英文字面值；更新 §1.4 列的 3 個測試。
3. 依 §1.2 新增 key（en / zh 兩邊）並改呼叫端。`use-staff.ts` 的 throw 改成 `throw new Error(t("team-members.toast.create.error"))` 這類形式，`onError` 的 fallback 也改用同一個 key，保持「顯示 `error.message`」的行為。
4. 新增 fixture 與測試（AC-1、AC-2、AC-4、AC-5）。
5. 更新 `docs/specs/refactor/README.md`：I1 新增的「硬寫中文另案」follow-up 列，標記由本 spec 處理並附 PR 號。

### Acceptance Criteria

- [ ] AC-0 [cmd] 重盤點的前置：實作 branch 已包含 I1（I1 的 fixture 存在）。`test -f src/shared/i18n/__tests__/fixtures/scope-keymap.json && echo I1_MERGED` 印出 `I1_MERGED`；交付報告附 §1.2 對照重盤結果的差異表（沒有差異也要寫「無差異」）。
- [ ] AC-1 [cmd] 無硬寫中文：新增 `src/shared/i18n/__tests__/no-hardcoded-zh.test.ts`，以 `import.meta.glob("/src/**/*.{ts,tsx}", { query: "?raw", import: "default" })` 讀檔（排除 `__tests__/`、`*.test.ts(x)`、`src/test/**`），用 `typescript` 的 `createSourceFile` 依 §1.1 定義找出含中文的節點；斷言結果只剩白名單：(a) 路徑符合 `/mocks/seed.ts$` 的檔案（OD-HZ-2 A），(b) `src/shells/default/app-sidebar.tsx` 的字面值 `"中文"` 恰 1 處（OD-HZ-3 A）。白名單以「路徑 pattern + 字面值 + 處數」寫在測試內，不寫死 module id（core-only 副本刪掉 module 後仍通過）。`pnpm exec vitest run src/shared/i18n/__tests__/no-hardcoded-zh.test.ts` exit 0。
- [ ] AC-2 [cmd] 字典值對照：新增 fixture `src/shared/i18n/__tests__/fixtures/hardcoded-zh-keymap.json`，每列 `{ key, zh, en, enSource, sites }`（`enSource` 為 `"new"` 或 `"existing:<key>"`，`sites` 為 `檔:行` 陣列），內容等於 AC-0 重盤後的 §1.2「新增 key」列；新增測試 `src/shared/i18n/__tests__/hardcoded-zh-keymap.test.ts`，以 `makeApp().build().registry.i18n`（`src/app/__tests__/fixture.tsx`，與 I1 `scope-migration.test.ts` 同一取法）斷言每列 `zh[key] === zh`、`en[key] === en`、`en !== zh`，且 `enSource: "existing:<k>"` 的列 `en` 等於該既有 key 目前的 en 值。此測試讀 module 字典，列入 `scripts/verify-core-only.sh` 的 `FULL_INSTALL_TESTS`。`pnpm exec vitest run src/shared/i18n/__tests__/hardcoded-zh-keymap.test.ts` exit 0。
- [ ] AC-3 [cmd] 歸屬：I1 的 `src/shared/i18n/__tests__/key-ownership.test.ts` 不改判準、不加白名單即通過（新 key 的位置符合 OD-I18N-3 A）。`pnpm exec vitest run src/shared/i18n/__tests__/key-ownership.test.ts` exit 0。
- [ ] AC-4 [cmd] 圖片驗證（OD-HZ-1 A）：`validateImage(file, options)` 的 `options` 與 `options.t` 為必填（`schemas.ts` 的 `t` 去掉 `.optional()`）；`src/shared/lib/image-validation/**`、`src/modules/banners/model/image-validation/**` 不再有 `t ?` 三元 fallback；§1.4 列的 3 個測試改為傳入 `t`（`i18n-integration.test.ts` 的 fallback 案例改成斷言 `manager.ts` 規則失敗時回傳 `t("validation.image.ruleFailed", …)` 的結果）；另加一個型別案例斷言不傳 `t` 時 `tsc` 報錯（`// @ts-expect-error` 寫成一行放得下的形狀，見 `docs/TRAPS.md`「`@ts-expect-error` 被 prettier 換行後失效」）。`pnpm exec vitest run src/shared/lib/image-validation src/modules/banners/model/image-validation && pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-5 [cmd] en 畫面行為：新增 `src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx`，切到 en 後渲染 `EditUserRoleDialogContent`，斷言標題 `Edit User Role` 與 7 個角色 label 都是 en 字典的值、容器文字不含中文；新增 `src/modules/team-members/model/__tests__/use-staff-i18n.test.tsx`，en 下以 MSW 讓建立員工回非 2xx，斷言 toast description 為 `Staff creation failed`（覆蓋 throw → `error.message` 路徑）。兩個測試在 zh 下各加一個案例，斷言文字與 §1.2 的 zh 原文逐字相同。`pnpm exec vitest run src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx src/modules/team-members/model/__tests__/use-staff-i18n.test.tsx` exit 0。
- [ ] AC-6 [cmd] follow-up 收尾：`docs/specs/refactor/README.md` 的硬寫中文 follow-up 列引用本 spec。`grep -n 'i18n-hardcoded-strings' docs/specs/refactor/README.md` 有輸出。
- [ ] AC-7 [cmd] 基線：見 Done Command。

### Touches

- `src/modules/team-members/model/use-staff.ts`
- `src/modules/articles/model/use-article.ts`
- `src/modules/consumers/model/use-consumer.ts`
- `src/modules/tags/model/use-tag.ts`
- `src/modules/product/ui/ProductDraftForm.tsx`
- `src/modules/users/ui/components/EditUserRoleDialogContent.tsx`
- `src/modules/banners/model/image-validation/{file-type,filename-prefix,filesize,resolution}.rule.ts`
- `src/shared/lib/image-validation/{schemas.ts,types.ts,manager.ts,base-rules/*.rule.ts,utils/image-metadata.ts}`
- `src/shared/ui/image-upload/image-upload-dialog.tsx`
- `src/shells/default/app-sidebar.tsx`
- 字典：`src/shared/i18n/locales/{en,zh}.json`；`src/modules/{team-members,articles,consumers,product,users,banners}/locales/{en,zh}.json`
- 測試：`src/shared/lib/image-validation/__tests__/{i18n-integration,basic-usage}.test.ts`、`src/shared/lib/image-validation/presets/__tests__/general.preset.test.ts`、`src/modules/banners/model/image-validation/__tests__/banner-preset.test.ts`（若不傳 `t`）；新增 `src/shared/i18n/__tests__/{no-hardcoded-zh,hardcoded-zh-keymap}.test.ts`、`fixtures/hardcoded-zh-keymap.json`、`src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx`、`src/modules/team-members/model/__tests__/use-staff-i18n.test.tsx`
- `scripts/verify-core-only.sh` 的 `FULL_INSTALL_TESTS` 清單（加入 AC-2 測試）
- `docs/specs/refactor/README.md`（AC-6）

### Must-Not-Touch

- `openapi.yaml` 與 orval 產物（`src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`、`src/app/operations.gen.ts`）
- `src/modules/*/mocks/seed.ts`（OD-HZ-2 A：seed 是 API 資料，不是 UI 文案）
- I1 的 fixture（`scope-keymap.json`、`scope-deleted.json`、`core-en-additions.json`）既有列的內容，與 `key-ownership.test.ts` 的判準
- kernel 的字典 scope / 合併邏輯（`src/app/kernel/build.ts`、`create-app.tsx`）與 `TransKey` / augmentation 機制
- 註解裡的中文、測試資料裡的中文（例 `basic-usage.test.ts:105` 的 `"中文檔名.jpg"` 是測試輸入）
- 既有 key 的 zh 值（只新增 key，不改既有文字）

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm verify:core-only
```
expected: exit 0，最後輸出含 `core-only build: OK`

### Owner Decisions

#### OD-HZ-1 圖片驗證的中文 fallback 怎麼處理

19 處中文是「沒傳 `t` 時」的 fallback（§1.4：app 內唯一呼叫端一定傳 `t`，只有測試會走到）。

| 選項 | 內容 | 後果 |
|---|---|---|
| A `t` 改必填、刪 fallback | `ValidationOptions.t` 必填，19 個三元分支整個刪掉；3 個測試改成傳 `t` | 刪最多程式碼、畫面零變化；不傳 `t` 在 `tsc` 就失敗。`shared/lib/image-validation` 的公開介面變嚴（目前無其他呼叫端） |
| B 保留選填，fallback 改英文 | 三元保留，fallback 文字改成英文 | 不改介面；但 fallback 文字與 key 的值仍是兩份，zh 使用者若走到 fallback 會看到英文 |
| C 保留中文 fallback，列白名單 | 不動程式碼，AC-1 白名單加 19 處 | 零改動；白名單變大、未來 fallback 與字典文字持續漂移（banners 現在就不一致） |

**建議：A**。fallback 是沒有實際呼叫端的死路徑，而且文字跟字典已經不同步；改必填後由 `tsc` 保證所有呼叫端都會翻譯。

#### OD-HZ-2 mock seed 的 20 處中文是否納入

| 選項 | 內容 | 後果 |
|---|---|---|
| A 不納入，白名單 `mocks/seed.ts` | seed 保持現狀 | seed 已是 `lang(en, zh)` 雙語資料，畫面依語系選欄位；它是 API 回應內容，不屬 UI 字典 |
| B 納入 | 把商品名搬進字典 | 等於把資料翻譯塞進 UI 字典，與「資料多語由 API 欄位提供」的模型衝突；mock 換真 API 時要再拆 |

**建議：A**。

#### OD-HZ-3 語言切換選單的「中文」

| 選項 | 內容 | 後果 |
|---|---|---|
| A 保留自稱名，列白名單 | `中文` / `English` 維持在程式碼中 | 符合常見慣例（每個語言用自己的文字顯示，使用者不懂目前語系也找得到）；AC-1 白名單 1 處 |
| B 改用 `lng.*` key | 改用 core 既有的 `lng.zh` / `lng.en` | en 下會顯示 `Chinese`，zh 下顯示 `英文`；切錯語系的使用者較難找回 |

**建議：A**。`語言`（`app-sidebar.tsx:146`）不屬自稱名，照 §1.2 新增 `lng.label`。

#### OD-HZ-4 新 key 的 en 譯文來源

22 個新撰譯文 + 4 個沿用既有 en 值，列在 §1.2。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 以本 spec §1.2 的 en 為準 | 實作棒照表寫入，fixture `enSource` 標 `new` / `existing:<key>`；AC-0 重盤若有新增位置，實作棒依同類 key 句型撰寫並在交付報告列出 | 審 spec 時就審譯文，與 OD-I18N-6 的做法一致 |
| B owner 另行提供 | 實作棒先放 placeholder | 多一輪往返；placeholder 會讓 AC-2 的 `en !== zh` 斷言難以定義 |

**建議：A**。
