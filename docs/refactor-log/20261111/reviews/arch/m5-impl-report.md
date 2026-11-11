# M5 實作報告：Kernel / shared 搬遷 + 邊界 lint

## 基本資訊

| 項目 | 值 |
|---|---|
| worktree | `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m5` |
| branch | `feat/m5-shared-boundaries` |
| base | `refactor/integration` @ `ec5a55fe8707941ae1639662c72c0e00629513da`（開工時確認 tip 未前進） |
| head | `43dfba8562165ee6d56fdf51c2ef0c826d24add9` |
| 小 spec | `/Users/pakerchang/.claude/docs/specs/m5-impl.spec.md`（保留，不進 admin-template commit） |
| push | `~/.claude/scripts/cc-git-write.sh push -u origin feat/m5-shared-boundaries` → `* [new branch]`，`origin/feat/m5-shared-boundaries` = `43dfba8562165ee6d56fdf51c2ef0c826d24add9`（無 force） |

### Commit 清單（舊 → 新）

| # | sha | 訊息 | 該 commit 驗證（commit 前、工作樹 = 該 commit 內容） |
|---|---|---|---|
| 1 | `2cdc3acf7a2a1c5763dc90e4036d0e4026b6e7b9` | chore(lint): enforce module boundaries with eslint-plugin-boundaries | lint exit 0、`pnpm build` exit 0、`vitest run` exit 0（32 檔／316 tests） |
| 2 | `8189942f351d712d6bea9729c64e197530a6b0f0` | refactor(shared): move kernel and shared code into app, shared and shells | prettier --check exit 0、lint exit 0、build exit 0、vitest exit 0（32 檔／316 tests） |
| 3 | `43dfba8562165ee6d56fdf51c2ef0c826d24add9` | test: drop custom jsdom environment now that Vitest 5 keeps native AbortSignal | prettier exit 0、lint exit 0、build exit 0、vitest exit 0（32 檔／316 tests，verbose） |

- commit 1 工作樹為了讓 lint 綠，暫把待搬目錄 `src/{lib,hooks,utils,constants,plugins,types,locales}/**` 列入 boundaries ignore；commit 2 搬完後同步刪除這條（不留在最終設定）。
- commit 2 第一次驗證 vitest 有 2 個失敗（`use-get-all-products.test.tsx` 的 `vi.mock("@/services/api-client")` 沒被 codemod 改到，mock 失效），修正為 `vi.mock("@/shared/api/fetcher")` 後**整套重跑**（prettier／lint／build／vitest）才 commit，上表記的是重跑結果。
- 基準（base `ec5a55f`、未改任何檔）：lint 0、build 0、32 檔／316 tests。測試數前後一致（banner preset 測試是搬家，不是刪除）。

## AC 逐條證據

| AC | 證據 | 層級 |
|---|---|---|
| AC-1 | 暫時 fixture `src/shared/__boundary_fixture__.ts`（`import orders from "@/modules/orders"`）→ `pnpm exec eslint src/shared/__boundary_fixture__.ts` **exit 1**，訊息 `There is no policy allowing dependencies from elements of type "shared" to elements of type "module" and captured values: module="orders"  boundaries/dependencies`。確認後刪除，未 commit（`git log --all -- src/shared/__boundary_fixture__.ts` 無紀錄）。key 名與順序實測見下節 | 行為（eslint exit code） |
| AC-2 | `! grep -rnE "@/(app\|shells\|modules)/\|EOrderStatus" src/shared` 通過（含在 Done Command）。另查 `src/shared`、`src/shells` 無任何 `@/services`／`@/components`／`@/pages` import | 靜態 |
| AC-3 | `src/components/ui`、`src/lib`、`src/plugins`、`src/hooks` 不存在（Done Command）；另外 `src/utils`、`src/constants`、`src/types`、`src/locales`、`src/styles` 也已全部移除（`test ! -d` 實測通過）。utils／constants 沒有 domain 殘留需要留到 M6 | 靜態 |
| AC-4 | `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` exit 0，0 error、0 warning（Done Command）。ignore 清單見下節 | 靜態（lint） |
| jsdom 項 | 刪 `src/test/jsdom-node-abort.env.ts`，`vite.config.ts` 的 `test.environment` 改回 `"jsdom"`。先單跑 msw 相關路徑 `vitest run src/services src/app/mock src/shared/api src/pages/product/hooks` → 8 檔 90 tests 全過；再全量 verbose：32 檔 316 tests 全過，`api-client.test.ts`（apiFetch + MSW setupServer）、`permission-guard.test.ts`、`mock-handlers.test.ts`、`legacy-adapter.test.ts`、`role-visibility.test.tsx` 都在輸出內。沒有失敗，不需 DECISION | 行為（vitest） |

## boundaries 設定 key 與比對順序（AC-1 實測，eslint-plugin-boundaries 7.4.2）

| 實測 | 做法 | 結果 | 結論 |
|---|---|---|---|
| `policies` vs `rules` | 同一 fixture 分別用兩個 key | 兩者都 exit 1、同一則 error；用 `rules` 時另印 `[boundaries][warning]: The 'rules' option is deprecated. Please use 'policies' instead`（連結 v6→v7 migration guide） | **採 `policies`**；`rules` 是 deprecated alias。spec §7.2 草案寫的 `rules` 要改 |
| element 比對順序 | fixture：`modules/orders/model/__fx__.ts` import `../ui/__fx_ui__`（model → ui，應擋）。A：具體者在前（`module-model` 先於 `module`）；B：把 `module` 移到最前 | A：exit 1，`from "module-model" … to "module-ui"`；B：exit 0（檔案被歸成 `module`，而 module 根允許碰本 module 各 segment） | **elements 取第一個符合的 descriptor**，具體者必須在前（與草案註解一致） |
| policy 評估順序 | fixture：`shells/default/__fx__.ts` import `@/modules/orders`。C：default-shell 的 `disallow` 排在 shell 的 `allow` 後面；D：`disallow` 移到最前 | C：exit 1，`Denied by policy at index 3`；D：exit 0 | **policies 由最後一個符合者決定**（後面覆蓋前面），所以 disallow 必須排在對應 allow 之後（草案順序正確） |

三組 fixture 全部刪除，`eslint.config.js` 用 `cmp` 確認還原。

## 落地的 lint 設定（`eslint.config.js`）

- 以草案為起點，追加在 flat config 陣列尾端：8 個 element（`module-api`／`module-model`／`module-ui`／`module-mocks`／`module`／`shell`／`app`／`shared`）、`boundaries/no-unknown-files: error`、`boundaries/dependencies`（`default: "disallow"` + `policies`）。
- `no-restricted-imports` 的 `@/modules/*/*` 只套在 `src/{app,shared,shells,modules}/**`：legacy `pages` 在 M6 前仍要 deep import module 內部（見 ignore 清單與已知問題）。
- 草案的 `**/use-user-permissions*` 與 `no-restricted-syntax`（`createRoute`／`useCan`）**沒有**加：現有 `src/app/kernel`、`src/shared/ui`、`src/shared/ui/data-table/row-actions.tsx` 合法使用 `useCan`，而草案把它掛在 `src/modules/**`、`src/shells/**`；現有 module 只有 `index.ts` 與 `model/routes.ts`，加了也不會有覆蓋。列在「spec 差異」，交 M6 搬 pages 時一起上線。

## boundaries ignore 清單（M6 要逐條移除）

`eslint.config.js` 的 `LEGACY_PATHS`：

1. `src/pages/**` —— 各 module 的頁面與 hooks（M6 搬進 `modules/<id>/{model,ui}`）
2. `src/services/**` —— `schemas/`、`mock/{data,handlers}.ts`、`__tests__/api-client.test.ts`（M6／M7）
3. `src/components/**` —— 剩 3 檔：`layouts/LoginPage.tsx`（→ `modules/auth`）、`shared/Card.tsx`（→ `modules/product`）、`shared/Navbar.tsx`（指向 `shells/default/navbar` 的 re-export shim，M6 pages 改 import 後刪）

常駐（不屬 legacy，spec §5.1 指定）：`src/test/**`、`**/__tests__/**`。

## 搬遷對照表（舊 → 新；全部用 `git mv`）

| 舊路徑 | 新路徑 | 備註 |
|---|---|---|
| `src/components/ui/*`（22 檔） | `src/shared/ui/*` | 檔名不變（shadcn） |
| `src/components/shared/Paper.tsx` | `src/shared/ui/paper.tsx` | 改 kebab-case（與 `shared/ui` 既有命名一致） |
| `src/components/shared/TextInputs.tsx` | `src/shared/ui/text-inputs.tsx` | |
| `src/components/shared/LoadingPage.tsx` | `src/shared/ui/loading-page.tsx` | |
| `src/components/shared/EditActions.tsx` | `src/shared/ui/edit-actions.tsx` | |
| `src/components/shared/DataTable.tsx` | `src/shared/ui/data-table/data-table.tsx` | 相對 import `./table` → `.` |
| `src/components/shared/table/**` | `src/shared/ui/data-table/**` | 含 hooks／utils／examples／`__tests__` |
| `src/components/shared/__tests__/data-table-row-actions.test.tsx` | `src/shared/ui/data-table/__tests__/` | |
| `src/components/shared/dialog/ImageUploadDialog.tsx` | `src/shared/ui/image-upload/image-upload-dialog.tsx` | |
| `src/components/shared/Tags.tsx` | `src/shared/ui/tag.tsx`（`tone` prop）+ 新檔 `src/modules/orders/ui/order-status-tag.tsx` | 移除 `EOrderStatus`；未使用的 `DotTag` 刪除 |
| `src/components/shared/UnauthorizedPage.tsx` | 內容併入 `src/shells/default/forbidden.tsx` | 唯一消費者就是 Forbidden |
| `src/components/shared/index.ts` | 刪除 | 空檔 |
| `src/hooks/use-img-upload.ts` | `src/shared/api/upload.ts` | |
| `src/hooks/{use-toast.ts,use-mobile.tsx,use-multi-select.ts}` | `src/shared/lib/` | |
| `src/lib/{utils.ts,gen-validate-message.ts}` | `src/shared/lib/` | |
| `src/utils/array-helpers.ts` | `src/shared/lib/array-helpers.ts` | |
| `src/constants/locales.ts` | `src/shared/config/locales.ts`（語系常數）+ `src/shared/i18n/types.ts`（`TransKey`） | |
| `src/locales/{en,zh}.json` | `src/shared/i18n/locales/` | 整份搬（domain key 仍在，M6 拆） |
| `src/locales/{i18n.ts,types.ts}` | `src/shared/i18n/` | |
| `src/types/i18next.d.ts` | `src/shared/i18n/i18next.d.ts` | |
| `src/types/{index.d.ts,table.d.ts}`、`src/vite-env.d.ts` | `src/shared/types/` | `tsconfig.app.json` `typeRoots` 同步 |
| `src/styles/global.css` | `src/app/styles/global.css` | `components.json` 同步 |
| `src/services/api-client.ts` | `src/shared/api/fetcher.ts`（`apiFetch`／`apiBaseUrl`／`TApiResponse`）+ `src/shared/api/session.ts`（`getAuth`／`setAuth`／`clearAuth`／session 型別） | `TAuthUser.role` 改 `string`，不再 import users schema |
| `src/services/types/schema.ts` | `src/shared/api/schema.ts`（pagination／lang／image…）+ `src/shared/api/types.ts`（`TGetResponseContent`／`TPostResponseContent`／`TError`） | |
| `src/services/types/index.ts` | 刪除 | re-export；2 處 import 改指 `shared/api/schema` |
| `src/plugins/image-validation/**`（通用） | `src/shared/lib/image-validation/**` | index 移除 banner export |
| `src/plugins/image-validation/presets/banner/**` + `__tests__/banner-preset.test.ts` | `src/modules/banners/model/image-validation/**` | 相對 import 改 `@/shared/lib/image-validation` |

import 改寫：codemod 腳本 `/private/tmp/claude-501/-Users-pakerchang--claude/0e432a7d-4786-4e46-a5eb-e9e825141537/scratchpad/codemod.mjs`（字面 specifier 換前綴；`api-client`／`services/types`／`plugins/image-validation` 依 symbol 拆到不同目標），改了 118 檔；之後對變動檔跑 `eslint --fix`（只整理 import 排序與合併）。`src/pages/**` 與 `src/modules/*/{index.ts,model/routes.ts}` 的 diff 只有 import 行（以 grep 過濾非 import 的 +/- 行為空確認）；pages/orders 三處 `Tag` 改成 `import { OrderStatusTag as Tag } from "@/modules/orders/ui/order-status-tag"`，JSX 不動。

UI 外觀：比對 base（`admin-template-arch-m4` @ `ec5a55f` 的 build）與 M5 build 的 CSS 規則，唯一差異是 `.bg-blue-500`、`.bg-orange-500`、`.bg-purple-500` 三條消失，來源是被刪的 `DotTag`（全 repo 無人使用）。`Tag` 的 tone 對應與原 `EOrderStatus` switch 逐一相同（含預設無色）。路由與 mock API 未動（`app/router`、`app/mock`、`services/mock` 只改 import）。

## utils／constants 的 domain 殘留與歸屬

- `src/utils`、`src/constants`：**沒有殘留**，兩個目錄已刪。原 `constants/locales.ts` 只有語系常數與 `TransKey`（domain-free）。
- 留在 legacy 的 domain 碼（不屬 utils／constants，但同屬 M5 未搬項）：
  - `src/components/shared/Card.tsx` → **M6 product**（欄位 stock／price／status、用 `table.headers.product.*`；§5.1 表把它列進 `shared/ui`，但它是商品卡，搬進 shared 等於把 domain 帶進 core，故未搬）
  - `src/components/layouts/LoginPage.tsx` → **M6 auth**（§5.1：`modules/auth/{model,ui}`）
  - `src/components/shared/Navbar.tsx` → M6 搬 pages 後刪（純 re-export）
  - `src/shared/i18n/locales/{en,zh}.json` 仍含 `order`／`dashboard`／`pages`／`table`／`toast`／`consumer`／`staff` 等 domain key → **M6 各 module**（§5.4 裸字典）
  - `src/shared/lib/gen-validate-message.ts` 型別收窄在 `pages.*` 前綴的 `TransKey` → M6 i18n 重整時一併處理

## 破壞性驗證（腳本 `/private/tmp/claude-501/-Users-pakerchang--claude/0e432a7d-4786-4e46-a5eb-e9e825141537/scratchpad/mutate.sh`，在最終 HEAD 乾淨工作樹執行）

做法：檔首插入一行違規 import → 只對該檔跑 eslint → 從備份還原 → `cmp` 與備份一致且 `git diff --quiet HEAD`。

| 改壞內容 | 檔案 | eslint | 命中規則 | 還原一致 |
|---|---|---|---|---|
| shared → modules（`import "@/modules/orders"`） | `src/shared/lib/utils.ts` | exit 1 | `boundaries/dependencies` | yes |
| shared → app（`import "@/app/core"`） | `src/shared/lib/utils.ts` | exit 1 | `boundaries/dependencies` | yes |
| shared → shells（`import "@/shells/default"`） | `src/shared/lib/utils.ts` | exit 1 | `boundaries/dependencies` | yes |
| module A → module B 內部檔（`import "@/modules/suppliers/model/routes"`） | `src/modules/product/index.ts` | exit 1 | `boundaries/dependencies`（module → 他 module 的 module-model） | yes |
| 同上 | 同上 | exit 1 | `no-restricted-imports`（`@/modules/*/*`） | yes |
| default shell → module index（`import "@/modules/orders"`） | `src/shells/default/forbidden.tsx` | exit 1 | `boundaries/dependencies`（Denied by policy at index 3） | yes |
| module model → 同 module ui（`import "../ui/order-status-tag"`） | `src/modules/orders/model/routes.ts` | exit 1 | `boundaries/dependencies` | yes |
| src 下未分類新檔 `src/stray/x.ts` | （新檔） | exit 1 | `boundaries/no-unknown-files` | 已刪 |

腳本輸出 `ALL_MUTANTS_DETECTED`，跑完 `git status` 乾淨。

## Done Command（最終 HEAD `43dfba8562165ee6d56fdf51c2ef0c826d24add9`、乾淨工作樹）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m5 && pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && ! grep -rnE "@/(app|shells|modules)/|EOrderStatus" src/shared && test ! -d src/components/ui && test ! -d src/lib && test ! -d src/plugins && test ! -d src/hooks && test ! -e src/test/jsdom-node-abort.env.ts && echo DONE_COMMAND_OK
```

- exit code：**0**（背景執行，讀到結束通知後才定稿）
- 輸出摘要：`Lockfile is up to date` → eslint 無輸出（0 error／0 warning）→ `✓ built in 4.67s` → `Test Files  32 passed (32)`、`Tests  316 passed (316)` → `DONE_COMMAND_OK`
- 層級：行為（build + vitest 實跑）＋ 靜態（lint、grep、目錄檢查）。UI 目視為 manual，未做（見已知問題）

## prettier

- commit 2 的變動檔（扣除 json 與 CLAUDE.md）`prettier --check` exit 0；commit 3 的 `vite.config.ts` exit 0；`eslint.config.js` 已 `--write`。
- `CLAUDE.md` 在 base 就不符 prettier（表格對齊；`git show refactor/integration:CLAUDE.md | prettier --check` exit 1），本棒沿用原格式，沒有整份重排。
- `components.json` 改由 `json.dumps(indent=2)` 寫出，結尾多了換行（原檔無）。

## Touches 外的例外

- `CLAUDE.md`：M5 狀態改「完成（待併入）」；架構段的已搬路徑（API／session／schema／shadcn／i18n）、命名例外路徑、跨頁共用位置、boundaries 實測結論。
- `vite.config.ts`：lead 交辦的 vitest 設定（`environment`）。
- `src/modules/orders/ui/order-status-tag.tsx`、`src/modules/banners/model/image-validation/**`：spec §5.1 明列的落點（新檔／搬入），既有 module 檔只改 import。
- `src/pages/**`：只改 import（含 `vi.mock` 路徑與 `OrderStatusTag as Tag` 別名）。

## 自行決定清單

1. `Card.tsx` 不搬進 `shared/ui`（商品專屬，歸 M6 product），與 §5.1 表不同。
2. `components/shared/Navbar.tsx` re-export shim 保留到 M6（M4 已註明）。
3. `shared/ui` 下由 `components/shared` 搬來的元件改 kebab-case（`paper.tsx`、`data-table/data-table.tsx`…），避免 `Card.tsx`／`card.tsx` 這類在 macOS 不分大小寫檔案系統上撞名，也與既有 `form-submit.tsx`、shells 命名一致。`data-table/hooks/useApiSorting.ts`、`useColumnVisibility.ts` 維持原名（CLAUDE.md 已知例外，路徑已更新）。
4. `use-img-upload.ts` 整支搬到 `shared/api/upload.ts`（§5.1 寫 `shared/ui/image-upload/` + `shared/api/upload.ts`；hook 本體就是上傳 API，沒再拆）。
5. `DotTag` 無人使用 → 刪除，不做 tone 版。
6. `shared/ui/tag.tsx` tone 命名：`warning|info|accent|danger|success`。
7. `TransKey` 仍由整份 `zh.json` 推導，宣告合併留給 M6（§5.4）；`shared/i18n/types.ts` 目前的 `TranslationResources` 是原 `locales/types.ts` 的 zh/en 物件型別，與 §5.4 的「module 擴充點介面」同名不同義，M6 改寫時要注意。
8. `services/__tests__/api-client.test.ts` 留在 `services`（它同時讀 `services/mock/data`），只改 import；M6 刪 `services` 時一起搬。
9. 草案的 `no-restricted-syntax`（`createRoute`／`useCan`）與 `use-user-permissions` 限制本棒不加（理由見「落地的 lint 設定」）。
10. `no-restricted-imports` 的 `@/modules/*/*` 只套非 legacy 目錄。

## spec 差異（M8 統一同步）

- §7.2 草案 `boundaries/dependencies` 的 `rules:` → 實作用 `policies:`（7.4.2 正式 key）；草案註解「精確 key 名與 element 比對順序於 M5 實測」可改寫成上面的實測結論（elements first-match、policies last-match）。
- §7.2 `boundaries/ignore` 多了 `LEGACY_PATHS`（M6 移除）；`no-restricted-imports` 只套非 legacy 目錄；`no-restricted-syntax` 區塊與 `use-user-permissions` pattern 未上線。
- §7.2 default shell 的 disallow 用 `{ element: { type: MODULE_TYPES } }`（擋所有 module element，不只 index.ts）。
- §5.1 `components/shared/Card.tsx` → 實作留 legacy、歸 M6 product。
- §5.1 `components/shared/{Paper,TextInputs,LoadingPage,EditActions}.tsx` → `shared/ui/` 下改 kebab-case 檔名；`DataTable.tsx` → `shared/ui/data-table/data-table.tsx`。
- §5.1 `hooks/use-img-upload.ts` → 只落 `shared/api/upload.ts`（沒有另拆 `shared/ui/image-upload/` 的 hook）。
- §5.1 `services/api-client.ts` → `fetcher.ts` 目前還是 M2 形狀的 `apiFetch`（不是 orval mutator／不 unwrap），M7 再改。
- §5.1 `test/setup*.ts`：`jsdom-node-abort.env.ts` 已刪（Vitest 5 不需要）。

## 已知問題（不阻擋）

- `src/pages/**` 對 `@/modules/orders/ui/order-status-tag`、`@/modules/banners/model/image-validation` 是 deep import；pages 在 boundaries ignore 與 `no-restricted-imports` 範圍外所以 lint 不報。M6 把 pages 搬進對應 module 後自然變成同 module 相對 import；若 M6 先移除 ignore，這兩處會被擋。
- `src/modules/orders/ui/order-status-tag.tsx` import `@/services/schemas/orders`（legacy，被 ignore 的目標不檢查）；M6 搬 schema 後改 `../model`。
- `app/mock/{index,legacy-adapter}.ts` 仍 import `@/services/mock/handlers`（M2 adapter，M6／M7 範圍）。
- `src/shared/ui/data-table/examples/pagesize-selector-usage.md` 引用不存在的 `@/hooks/api/{product,user,order}`（base 就是過時範例）；本棒只改了已搬的路徑。
- 部分 `git mv` 因內容大改，git 的 rename detection 顯示成刪除＋新增（`constants/locales.ts`、`locales/types.ts`、`Tags.tsx`、`UnauthorizedPage.tsx`）。
- AC 的「UI 外觀不變」只做了 CSS 產物比對與 vitest，**沒有開瀏覽器**目視（manual 未驗證）。
- jsdom 項的「Vitest 5 不再替換 AbortSignal」是根據測試全過推論，未另寫斷言驗證全域物件身分。

LIFECYCLE_PAUSE: true

