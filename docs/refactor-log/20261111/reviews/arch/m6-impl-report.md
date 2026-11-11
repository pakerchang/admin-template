# M6 實作報告：Module 內嵌搬遷

## 基本資訊

| 項目 | 值 |
|---|---|
| worktree | `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m6` |
| branch | `feat/m6-module-colocation` |
| base | `refactor/integration` @ `96f156551c3ec36fbf918a65eb1a8f93660154ef`（開工時確認 tip 未前進） |
| head | `60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4` |
| 小 spec | `/Users/pakerchang/.claude/docs/specs/m6-impl.spec.md`（保留，不進 admin-template commit） |
| push | `cc-git-write.sh push -u origin feat/m6-module-colocation` → `* [new branch]`；`git ls-remote` = `60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`（無 force） |

基準（base、未改檔）：33 檔／328 tests（prompt 給定，開工時跑全量綠）。

### Commit 清單

| # | sha | 訊息 | 該 commit 驗證（commit 前工作樹 = 該 commit 內容） |
|---|---|---|---|
| 1 | `d4245c20986363ea10fe5b2d86b457621b15631b` | refactor(i18n): move module-owned keys into module dictionaries | lint 0、build 0、vitest 0（34 檔／333）、字典 + API 比對 COMPARE_OK |
| 2 | `f65ce7fbafd1ddfba5b3ec5b0e9cb26bf090dcc2` | refactor(mock): split mock seed and handlers into module mocks | 第一次 lint／build 失敗（漏改 `app/kernel/__tests__/operations-gen.test.ts` 的 `@/services/mock/handlers` import）→ 修正後整套重跑：lint 0、build 0、vitest 0（34／333）、COMPARE_OK |
| 3 | `861478c0360a9eb86d6a8e4e51dbc519edd9590b` | refactor(modules): colocate pages, hooks and schemas inside modules | lint 0、build 0、vitest 0（34／333）、COMPARE_OK、vi.mock 目標 29/29 可解析。之後只改了一行註解（見下）才 commit |
| 4 | `60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4` | docs: mark M6 module colocation done in CLAUDE.md | 只動 CLAUDE.md；Done Command 在這個 HEAD 跑（下節） |

- commit 3 驗證後發現 AC-2 grep 命中 `users/mocks/handlers.ts` 的一行 JSDoc（`` `@/modules/users` `` 後面同行有 `*/`），改成不含該字面的 `//` 註解再 commit；這次修改沒有在 commit 3 上重跑 lint／build／test，以 commit 4（只多 CLAUDE.md）上的 Done Command 為準。
- 中間 commit 沒有保留任何 legacy ignore：commit 1、2 時 `LEGACY_PATHS` 仍在（pages／services／components 尚未搬），commit 3 搬完同時移除。

## AC 逐條證據

| AC | 證據 | 層級 |
|---|---|---|
| AC-1 | Done Command 內 `test ! -d src/pages && test ! -d src/services && for d in src/modules/*/; do test -f "$d/index.ts" \|\| exit 1; done` 通過。`src/components` 也已不存在（`ls src` = `app modules shared shells test`） | 靜態 |
| AC-2 | Done Command 內 `! grep -rnE "@/modules/[^/\"']+/" src/modules` 通過。R5：每個 module 的 `mocks/seed.ts` 自帶資料，`mocks/` 只 import `shared` 與本 module（auth 例外經 `@/modules/users` index，見「自行決定」2）。lint 層 boundaries 擋跨 module 內部 import（破壞性驗證 1–3） | 靜態 |
| AC-3 | `pnpm exec vitest run src/shared/i18n src/app/kernel --reporter=verbose` → 3 檔／50 tests 全過；新增 `src/shared/i18n/__tests__/module-dictionaries.test.ts` 5 tests：10 個 module `build()` 不 throw、core zh／en 頂層 key ∩ module id = ∅、`modules/*/locales/*.json` 頂層不含自身 id、module 字典經 kernel scope 到 `<id>.` | 行為（vitest） |
| AC-4 | `LEGACY_PATHS` 已刪，`boundaries/ignore` 只剩 `src/test/**`、`**/__tests__/**`；`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` exit 0、0 error 0 warning | 靜態（lint） |
| AC-5 | 全量 vitest：34 檔／333 tests 全過。base 33／328 → +1 檔／+5 tests（新增的 AC-3 測試）；沒有刪測試。搬家／改寫的測試：`services/__tests__/api-client.test.ts` → `shared/api/__tests__/fetcher.test.ts`；pages 下 5 個測試檔 → `modules/{banners,product}/{ui,model}/__tests__/`；`legacy-adapter.test.ts`、`mock-handlers.test.ts`、`operations-gen.test.ts` 的斷言來源由舊 handler 表改為 `registry.mockHandlers`（逐條見「測試改寫」） | 行為（vitest） |
| AC-6 `[manual]` | **待驗**（未開瀏覽器）。自動佐證：(a) 一次性 capture（`scratchpad/m6/capture.test.ts`）在 base 與每個 commit 各跑一次，比對「core json + registry.i18n」合併後完整 zh／en 字典 key→value：zh 475／475、en 474／474，missing／extra／changed 皆 0；(b) 同一份 capture 以 superadmin 打全部 GET operation × 3 種 query（34 個 request）回應逐 byte 相同；(c) 另以真 i18next（`shared/i18n/i18n` backend）照 kernel mount 的順序 `loadLanguages` → `addResourceBundle`，`getResourceBundle` 攤平後與 base capture `toEqual` 通過 | 行為（vitest 比對）；UI 目視未驗 |
| M5 遺留 | `components/shared/Card.tsx` → `modules/product/ui/components/Card.tsx`；`components/layouts/LoginPage.tsx` → `modules/auth/ui/LoginPage.tsx`；`components/shared/Navbar.tsx` shim 刪除（pages 改 import `@/shared/ui/navbar/navbar`，見自行決定 4）；`modules/orders/ui/order-status-tag.tsx` 改 `../model/schema`；`app/mock/index.ts` 不再 import `@/services/mock/handlers`，adapter 保留（移到 `shared/api/mock/legacy-adapter.ts`，見自行決定 1） | 靜態 + vitest |
| en 缺漏 | 不補翻譯；行為不變（字典比對 0 差異，en 缺的 key 仍 fallback zh）。歸屬見下節 | — |

## 搬遷對照表（舊 → 新；`git mv`，codemod `scratchpad/m6/codemod.mjs` 一次搬 72 檔並改寫 import）

規則：`pages/<p>/*.tsx`、`components/**`、`__tests__/**` → `modules/<id>/ui/**`；`pages/<p>/hooks/**`、`utils/**` → `modules/<id>/model/**`；`pages/<p>/docs/**` → `modules/<id>/docs/**`；`services/schemas/<s>.ts` → `modules/<id>/model/schema.ts`。

| 舊 | 新 |
|---|---|
| `src/pages/articles/{ArticleForm,ArticleList}.tsx`、`components/**`（含 `tiptap.css`） | `src/modules/articles/ui/` |
| `src/pages/articles/hooks/use-article.ts` | `src/modules/articles/model/use-article.ts` |
| `src/pages/banners/{BannerForm,BannerList}.tsx`、`components/ImageCard.tsx`、`__tests__/form/*` | `src/modules/banners/ui/` |
| `src/pages/banners/hooks/{use-banner,use-banner-sort}.ts`、`hooks/__tests__/*` | `src/modules/banners/model/` |
| `src/pages/banners/docs/*.md` | `src/modules/banners/docs/` |
| `src/pages/consumers/CustomerList.tsx`、`components/*` | `src/modules/consumers/ui/` |
| `src/pages/consumers/hooks/use-consumer.ts` | `src/modules/consumers/model/` |
| `src/pages/orders/OrderList.tsx`、`components/*`、`order-details/**` | `src/modules/orders/ui/` |
| `src/pages/orders/hooks/use-order.ts`、`utils/{copy-order.ts,copy-order.md,order-status.ts}` | `src/modules/orders/model/` |
| `src/pages/product/*.tsx`、`components/**`、`__tests__/*` | `src/modules/product/ui/` |
| `src/pages/product/hooks/**`、`utils/{field-comparison,form-transformers}.ts` | `src/modules/product/model/` |
| `src/pages/{suppliers,tags,team-members,users}/*.tsx`、`components/*` | `src/modules/<id>/ui/` |
| `src/pages/{suppliers,tags,team-members,users}/hooks/*` | `src/modules/<id>/model/` |
| `src/services/schemas/{article,banner,customer,orders,product,staff,supplier,tag,user}.ts` | `src/modules/{articles,banners,consumers,orders,product,team-members,suppliers,tags,users}/model/schema.ts` |
| `src/components/shared/Card.tsx` | `src/modules/product/ui/components/Card.tsx` |
| `src/components/layouts/LoginPage.tsx` | `src/modules/auth/ui/LoginPage.tsx` |
| `src/components/shared/Navbar.tsx`（shim） | 刪除 |
| `src/shells/default/{navbar,breadcrumb}.tsx`、`use-breadcrumb.ts` | `src/shared/ui/navbar/`（自行決定 4） |
| `src/services/mock/data.ts` | 刪除 → 各 `src/modules/<id>/mocks/seed.ts`（10 個；`DEMO_ACCOUNT` → `modules/auth/mocks/seed.ts`；`placeholderImage`／`iso`／`lang` → `shared/api/mock-db.ts`） |
| `src/services/mock/handlers.ts` | 刪除 → 各 `src/modules/<id>/mocks/handlers.ts`（經 `defineModule({ mockHandlers })`）+ `src/app/mock/core-handlers.ts`（`/admin/images`，R29）+ `src/shared/api/mock-db.ts`（`createCollection`、`listResponse`）+ `src/shared/api/mock/session-store.ts`（token 表） |
| `src/app/mock/legacy-adapter.ts` | `src/shared/api/mock/legacy-adapter.ts`（`THandler`、`DELAY_MS` 一併住這裡） |
| `src/services/__tests__/api-client.test.ts` | `src/shared/api/__tests__/fetcher.test.ts` |

搬遷後的 diff 檢查：被 rename 的檔案扣掉 import 行，只剩預期的 4 處改動（articles `TProfile`、consumers `contactInfoSchema`、product `FieldChange` 移到 model、`vi.mock` factory 內的動態 `import()` 路徑）。全 repo 29 個 `vi.mock` 目標都能解析到實檔。

## i18n 拆分方式與比對

- **方式**：kernel scope 規則（§4.3 步驟 4）只能把 module 字典放到 `<id>.*` 之下。現有全域 key 只有 en 的 `users.*`（`users.userForm.*`，7 個 leaf）頂層等於 module id，搬進 `modules/users/locales/en.json`（裸字典 `{ "userForm": … }`），`defineModule({ i18n: { en, zh: {} } })`。其餘 domain key（`pages.order.*`、`dashboard.menu.*`、`table.headers.*`、`consumer.*`、`staff.*` …）的頂層不是 module id，搬進 module 就必須改 key 名並改所有 `t()` 呼叫（約 770 處，含動態 key），會違反 AC-6 要求的「key→value 完全相同」，所以**本棒不搬**（見 spec 差異）。
- **kernel mount**：`create-app.tsx` 的 `mount` 先 `await i18next.loadLanguages(lngs)` 再 `addResourceBundle(lng, "translation", dict, true, false)`。順序有實際影響：i18next 25 的 BackendConnector 看到 bundle 已存在就不再走 backend（`i18next.js:1453` `hasResourceBundle` 檢查），先寫 module 字典會讓該語系的 core 字典永遠不載入。kernel 直接 import `i18next` 套件的預設 instance（`main.tsx` 已先 import `@/shared/i18n/i18n` 完成 init），避免測試載入 i18n 副作用。
- **比對結果**：zh 475／475、en 474／474 leaf，missing／extra／changed = 0（commit 1、2、3 各一次，另有 runtime i18next 比對通過）。
- **en 缺漏 71 key 的歸屬**（全部仍在 core 字典、en fallback 到 zh，與重構前相同）：`pages.supplier.*` 24 → suppliers；`pages.banner.*` 20 → banners；`pages.tag.*` 19 → tags；`pages.users.*` 7 → users；`validation.email.invalid` 1 → core。注意 en 另有 `users.userForm.*`（現在住 users module）是 `pages.users.userForm.*` 的英文版，但程式碼讀的是 `pages.users.userForm.*`，所以 en 使用者看到的是 zh fallback——重構前就如此，未改。

## Mock 拆分（R5）

- 每個 module 的 `mocks/seed.ts` 自帶資料；需要他 module 資料的地方改成**自帶快照**，值與原 seed 一致：product 以 id 參照 supplier／tag；orders 自帶商品快照與買家聯絡資料；consumers 自帶 customer 與 transaction（與 orders 同值的另一份）；team-members 自帶 staff；articles 自帶作者與標籤名稱。API 回應比對 34／34 相同。
- 身分相關（三方共用帳號資料）：`shared/api/mock/session-store.ts`（domain-free）存 token → user_id（localStorage `mock-sessions` 格式不變）；users module 擁有帳號 collection，import 時以 `setMockRoleResolver` 提供 user_id → 目前角色；kernel `createMockHandlers` 以 `setMockGrantMatrix` 提供矩陣、guard 經 `mockRoleOf` 判權；auth module 的 login 經 `@/modules/users` index 的 `findMockUserByEmail` 查帳號（`auth.requires = ["users"]`）、`issueMockToken` 簽發、`mockGrantsOfRole` 展開 grants。角色被改後下一個 request 即生效、token 重新整理後仍有效（W1、C1、C2 測試皆過）。
- 測試預設 server（`src/test/setup.ts` 用 `app/mock` 的 `mockHandlers`）現在只有 guard + core handler；需要 module API 的測試改用 `makeApp().build().registry.mockHandlers`（`fetcher.test.ts` 新增 `beforeEach`；其餘本來就這樣用）。

## 測試改寫（不減數量）

| 測試 | 改動 |
|---|---|
| `app/mock/__tests__/legacy-adapter.test.ts` | 「covers every METHOD path」改以 `registry.mockHandlers`（扣 guard）對 `operations.routes` 比對集合，snapshot 檔不動且相符；「trailing slash」改用最小 handler 表 + DEMO_ACCOUNT |
| `app/mock/__tests__/mock-handlers.test.ts` | import 改指 module seed；「without storage (node)」改為 resetModules 後載入 auth handler + session store，經 `getResponse` 登入、`mockRoleOf` 驗角色（原本呼叫舊表的 login 與 `mockUserOfAuthorization`） |
| `app/kernel/__tests__/operations-gen.test.ts` | 「covers every METHOD path of the mock handler table」改以 `registry.mockHandlers` 的 method + pathname 對 `operations.routes` |
| `app/mock/__tests__/role-visibility.test.tsx`、product 兩個測試 | 只改 seed import 路徑 |
| `shared/api/__tests__/fetcher.test.ts`（原 api-client.test） | 搬家 + `beforeEach` 換成 registry handler |

## 破壞性驗證（腳本 `/private/tmp/claude-501/-Users-pakerchang--claude/331235b6-1dc7-4fbb-aa38-c3d0f4426666/scratchpad/m6/mutate.sh`，在 HEAD 乾淨工作樹執行）

| 改壞內容 | 檢查 | 結果 | 還原 |
|---|---|---|---|
| product index import `@/modules/suppliers/model/use-supplier` | eslint 該檔；AC-2 grep | eslint exit 1（`boundaries/dependencies` + `no-restricted-imports`）；grep HIT | `cmp` 一致 |
| orders handler import `@/modules/product/mocks/seed`（讀他 module seed） | 同上 | eslint exit 1（兩條規則）；grep HIT | 一致 |
| 同上但用相對路徑 `../../product/mocks/seed` | 同上 | eslint exit 1（`boundaries/dependencies`）；**grep miss**（AC-2 grep 只看 `@/` alias，相對路徑靠 lint） | 一致 |
| users `locales/en.json` 加頂層 `"users"` | `vitest run src/shared/i18n src/app/kernel` | exit 1（module-dictionaries 的裸字典 test 失敗；`build()` 1.3 throw 連帶 operations-gen 失敗） | 一致 |
| 刪 users `locales/en.json` 的 `userForm.title` | capture + `compare.py` | `missing users.userForm.title`、COMPARE_DIFF 1、exit 1 | 一致 |

跑完 `git status` 乾淨（0 個 dirty 檔）。R5「handler 讀他 module seed」沒有 runtime 層機制，自動檢查只有 lint（boundaries，alias 與相對路徑都擋）與 AC-2 grep（只擋 alias）。

## Done Command（HEAD `60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`、乾淨工作樹、背景執行並讀到結束通知）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m6 && pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && test ! -d src/pages && test ! -d src/services && for d in src/modules/*/; do test -f "$d/index.ts" || exit 1; done && ! grep -rnE "@/modules/[^/\"']+/" src/modules && echo DONE_COMMAND_OK
```

- exit code：**0**
- 輸出摘要：`Lockfile is up to date` → eslint 無輸出 → `✓ built in 4.74s` → `Test Files 34 passed (34)`、`Tests 333 passed (333)` → `DONE_COMMAND_OK`
- `src/shared/i18n`、`src/app/kernel` 測試：預設 reporter 不列檔名，另跑 `vitest run src/shared/i18n src/app/kernel --reporter=verbose` → 3 檔（`build.test.ts`、`operations-gen.test.ts`、`module-dictionaries.test.ts`）50 tests 全過
- 層級：行為（build + vitest）+ 靜態（lint、grep、目錄檢查）；UI 目視未驗

## prettier

`git diff --name-only --diff-filter=AMR 96f1565 HEAD` 扣掉 `.md` 共 119 檔中的程式／json 檔 `prettier --check` → All matched files use Prettier code style。`CLAUDE.md` 在 base 就不符 prettier（`git show HEAD~4:CLAUDE.md | prettier --check` exit 1），沿用原格式未整份重排。

## Touches 外的例外

- `src/app/kernel/create-app.tsx`（kernel，Must-Not-Touch 契約）：只改 `mount` 實作，填入原本標 `ponytail: … M6` 的字典寫入（§4.3 步驟 4）；型別、簽名、`build()` 都沒動。判斷為實作不是契約；若審查認定屬契約，請標 DECISION。
- `src/app/kernel/__tests__/operations-gen.test.ts`：測試資料來源改 registry（舊 handler 表已刪）。
- `src/shared/api/**`：新增 `mock-db.ts`、`mock/session-store.ts`，`mock/legacy-adapter.ts` 由 app 移入，`__tests__/fetcher.test.ts` 由 services 移入（modules 不可 import app，所以 adapter／helper 必須在 shared）。
- `src/shells/default/{navbar,breadcrumb}.tsx`、`use-breadcrumb.ts` 移出到 `src/shared/ui/navbar/`（prompt 預期的「刪 Navbar shim 需改 shells」例外，但動作是搬檔而不只是改 import，見自行決定 4）。
- `src/app/core.ts` 未改；`src/test/setup.ts` 未改。
- `CLAUDE.md`：M6 狀態「完成（待併入）」、mock／schema／i18n 路徑、目錄樹、lint 說明、頁面放置慣例。
- `src/app/__tests__`、`src/app/mock/__tests__`：只改 seed import 與斷言來源。

## 自行決定清單

1. **legacy adapter 移到 `shared/api/mock/legacy-adapter.ts`**：prompt 說 adapter 保留到 M7b 並「改指搬遷後位置」，但 handler 拆進 module 後，module 需要 adapter 而 module 不可 import app（§3.1），只能放 shared；功能與介面不變，M7b 仍整支刪。
2. **auth login 經 users index 查帳號（`auth.requires = ["users"]`）**：login 驗證的就是 users 的帳號，且角色被改後要立即反映；若讓 auth 自帶帳號副本，`/admin/user/role` 改角色後重新登入會拿到舊角色。spec §5.2 auth 列 `requires —`；這是唯一一條跨 module 讀 mock 資料的路徑，經 index.ts 公開函式，不讀 seed 檔。
3. **session store 用模組層級註冊**（`setMockRoleResolver` 由 users mocks import 時呼叫、`setMockGrantMatrix` 由 kernel `createMockHandlers` 呼叫）：kernel guard 需要 token → 角色，但 kernel 只能經 `app/modules.ts` 碰 module；`TCore`／`TModule` 契約不能加欄位，所以用 shared 的註冊點。代價：login 的 grants 用「最後一次 build() 的矩陣」（多個 app 同時存在時後者勝；目前只有測試會建多個，且都是同一組 module）。已在檔頭 `ponytail:` 註明。
4. **Navbar（含 Breadcrumb、useBreadcrumb）搬到 `shared/ui/navbar/`**：module `ui` 依 §3.1 不能 import shell，而 9 個頁面都自己渲染 `<Navbar>`。替代方案（Navbar 放進 `TShell` 由 shell 注入）要改 kernel 契約。`use-breadcrumb.ts` 內有 `dashboard.menu.orders.title` 等 i18n key 字面（不 import 任何 domain 程式；M5 AC-2 grep 仍過），§5.1 寫的「改讀 route `staticData.breadcrumb`」未做。
5. **i18n 只搬頂層已是 module id 的 key**（en `users.*`）：理由見「i18n 拆分方式」。`users` zh 字典以 `{}` inline，不建空 `zh.json`；不加 `augment.d.ts`（zh 無 key，`TransKey` 仍由 core zh.json 推導，與重構前相同）。
6. **eslint**：(a) `no-restricted-imports` 加 `ignores: ["**/__tests__/**"]`，與 boundaries 對測試的 ignore 一致（app 測試要讀 module seed）；(b) `module-mocks → 同 module module-model` 放行（M7 前沒有 `api/`，seed 型別與 `EOrderStatus` 取自 model；註明 M7 收回）；(c) 上線 §7.2 的 `no-restricted-syntax`（modules／shells 禁 `createRoute`、`useCan`）與 `**/use-user-permissions*` pattern（M5 交給 M6；現況 0 違規）。
7. **跨 module 依賴處理**：product → tags／suppliers 改 import `@/modules/tags`、`@/modules/suppliers`（兩個 index 新增具名 export `useGetAllTags`、`useGetSupplierAll`，`requires` 早已宣告）；consumers 自帶 `getOrderStatusText`（`model/order-status.ts`，字串對照與 orders 版相同）與 `contactInfoSchema`；articles 用本地 `TProfile` 型別取代 `TUser`。
8. **`FieldChange` 型別從 `ProductEditConfirmDialog.tsx` 移到 `model/field-comparison.ts`**（model 不可 import ui）。
9. 檔名維持原樣（PascalCase 元件不改 kebab-case），減少 rename 噪音；schema 一律命名 `model/schema.ts`。
10. `createCollection(seed, idKey, { searchField })`：spec §4.5 草案寫 `createCollection(name, seed)`，name 用不到所以沒加。

## spec 差異（M8 統一同步）

- §5.1「`locales/{en,zh}.json` → domain key 搬到 `modules/<id>/locales/`」：本棒只搬了 en `users.*`；其餘 domain key 需要改 key 名才能落在 `<id>.` 之下，與 AC-6「字典 key→value 不變」衝突，留待另案（改 key + codemod `t()` 呼叫 + 動態 key）。§4.1 `TNavItem.label`「必須以 `${moduleId}.` 開頭」同理未達成（nav label 仍是 `dashboard.menu.*`）。
- §5.1 `services/mock/handlers.ts` 過渡位置寫 `app/mock/legacy-adapter.ts`（M2–M6）：實作在 M6 已拆到各 module，adapter 在 `shared/api/mock/legacy-adapter.ts`。
- §5.1 `hooks/use-breadcrumb.ts` → `shells/default/`、`components/shared/{AppSidebar,Navbar,Breadcrumb}` → `shells/default/`：Navbar／Breadcrumb／useBreadcrumb 現在在 `shared/ui/navbar/`。
- §5.2 auth `requires —` → 實作 `requires: ["users"]`。
- §4.5 seed 列 `createCollection(name, seed)` → 實作 `createCollection(seed, idKey, opts)`。
- §7.2：`module-mocks` 多允許同 module `module-model`（M7 前）；`no-restricted-imports` 不套 `__tests__`。
- §9 M6 Touches 未列 `src/shared/api/**`、`src/shells/**`（實際動了，見例外）。
- §9 M6 AC-5「既有 14 個測試檔」→ 實際 base 33 檔。

## 已知問題（不阻擋）

- **行為差異（R5 帶來的）**：consumers 的購買紀錄與 orders 是兩份記憶體資料。重構前 `/admin/transaction_history` 讀的就是訂單表，在訂單頁改狀態會反映到顧客的購買紀錄；現在不會（初始資料相同）。customers 的 `total_spent`／`order_count` 原本就是 seed 時算好的，不受影響。
- `src/app/operations.gen.ts` 檔頭註解仍寫 `src/services/mock/handlers.ts`（Must-Not-Touch，M7 由 extract 產生覆蓋）。
- `src/shared/ui/data-table/examples/README.md` 引用不存在的 `services/types/schema.ts`（base 就過時）。
- AC-2 grep 擋不到相對路徑的跨 module import（破壞性驗證 3）；目前靠 boundaries lint 擋住。
- `shared/ui/navbar/use-breadcrumb.ts` 含 domain i18n key 字面（自行決定 4）。
- seed 有重複：orders 與 consumers 各有一份同值的訂單產生器，articles／orders／consumers 帶有商品名、人名快照（R5 的直接代價）。
- 測試預設 server 不再有 module handler：之後新測試若沒 `resetHandlers(registry.mockHandlers)`，打 module API 會拿到 guard 的 404。
- AC-6 UI 目視未驗；開發環境的 `mount` 字典寫入只在 vitest 模擬過（真 i18next + 同順序），沒在瀏覽器跑過。

## push

`~/.claude/scripts/cc-git-write.sh push -u origin feat/m6-module-colocation` → `* [new branch] feat/m6-module-colocation -> feat/m6-module-colocation`；remote head `60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`。未 merge、未開 PR、未 force。

LIFECYCLE_PAUSE: true
