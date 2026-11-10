# 重構 feature spec 索引

本目錄封存 admin-template 重構（Microkernel + Modular Monolith 架構、依賴升級、API 契約層 PoC）相關的所有 spec，含已完成者，供查閱與追溯。

- 檔案內容**逐位元組**複製自原始位置，未做任何修改。
- 部分 spec 內含本機絕對路徑（`/Users/…`、`/private/tmp/…` scratchpad 報告路徑）等機器資訊，屬撰寫當時的工作環境紀錄，照原樣保留；這些路徑在其他機器上不存在。
- 狀態核對時間：2026-11-10（以 `git log` / `gh pr list` 核對）。

## 架構主線

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `fsd-module-architecture.m3-revision.spec.md` | Microkernel + Modular Monolith 目標架構（M0–M8），含 M3 W1 獲准修訂的最新版 | M0–M8 全部完成；收尾 spec 文字同步（`a1ba484`，只改 spec md 與 CLAUDE.md，M4–M8 的「spec 文字差異待 M8 同步」已寫回 integration 的 `docs/specs/fsd-module-architecture.spec.md`）已併入，`refactor/integration` 凍結於 tip `a1ba484`，待 main 開整體 PR | 見下方 milestone 表 |

> master 上的 `docs/specs/fsd-module-architecture.spec.md`（#6 合入）為修訂前版本，不在本目錄更動；本目錄版本取自 `feat/m3-module-wiring:docs/specs/fsd-module-architecture.spec.md`。

| Milestone | 狀態 | 證據 |
|---|---|---|
| M0（前置：deps P0 Node 22 + P1 ESLint 9） | 完成 | PR #4、#5 |
| M1 Kernel 契約與權限引擎 | 完成 | PR #8 |
| M2 MSW 取代 mockFetch | 完成（AC-5 `[manual]` 保持未勾：main 派 s28 瀏覽器行為層驗證（agent 已驗），owner 親驗 pending（owner 2026-11-10 裁決先註記、不阻擋交付）） | PR #9；AC-5 證據 s28 `ac5-browser-report.md`（tip 8458b19） |
| router pathless hotfix | 完成 | PR #10；spec 在 master `docs/specs/router-pathless-hotfix.spec.md` |
| M3 Module 接線 + default shell | 完成，已併入本地整合分支 `refactor/integration`（`[cmd]` AC-1～4、AC-7 已勾，AC-6 已被取代（見 spec 註記）；AC-5 `[manual]` 保持未勾，由 main 派 s28 瀏覽器行為層驗證（agent 已驗），owner 親驗 pending（owner 2026-11-10 裁決先註記、不阻擋交付）） | integration tip `8458b19`（ff-only，基線 exit 0、23 files / 227 tests、LINT_OK）；`feat/m3-module-wiring` @ `8458b19` 已 push；codex 259e4c3 FAIL → d685823 PASS-with-fixes → 03acca9 PASS →（rebase）edfd74d PASS-with-fixes → 8458b19 PASS（arch chain `reviews/arch-m3-fix3-codex-verdict.md`）；中間 commit 509dc96..2aae3e6 不可單獨 build（bisect skip，main 已裁決接受） |
| M4 權限四強制點 + 內容區 403 | 完成，已併入本地整合分支 `refactor/integration`（AC-1～5、AC-7 有自動測試證據；AC-6 `[manual]` 已驗（s29 瀏覽器行為層，owner 未親驗）；角色 grants 矩陣為 main 代 owner 裁決，**owner 2026-11-10 覆核定案（OD-GRANT-1）**；寫入入口補宣告見 `docs/specs/f1-permission-declarations.spec.md`） | integration tip `ec5a55f`（ff-only，基線 exit 0、32 files / 316 tests、LINT_OK）；branch `feat/m4-permission-enforcement` @ `ec5a55f` 未 push（origin 停在 rebase 前 `66e94c0`）；codex acd05c0 FAIL（C1 mock token 可偽造、C2 profile 提權）→ fix1/fix2 → 2988875 PASS-with-fixes（arch chain `reviews/arch-m4-fix-codex-verdict.md`）→ fix3 修 W1（重新整理後 session 失效）後依 owner 指示不再複審直接併入；AC-1 路徑 `/users/user-list` → `/users`（main 核准） |
| M5 Kernel / shared 搬遷 + 邊界 lint | 完成，已併入本地整合分支 `refactor/integration`（AC-1～4 有證據；`jsdom-node-abort.env.ts` 已刪；UI 外觀僅 CSS 產物比對，瀏覽器目視**待驗**） | integration tip `96f1565`（ff-only from `571d1af`；基線含 eslint exit 0、33 files / 328 tests、LINT_OK）；branch `feat/m5-shared-boundaries`：原實作 `43dfba8`（base `ec5a55f`，已 push）codex 一輪 PASS（arch chain `reviews/arch-m5-codex-verdict.md`）→ rebase 到 571d1af 只有 lock context 不同（`96f1565` push 於 `feat/m5-shared-boundaries-r1`）；boundaries 實測：`policies` 為正式 key（`rules` deprecated）、elements first-match、policies last-match |
| M6 Module 內嵌搬遷 | 完成，已併入本地整合分支 `refactor/integration`（AC-1～5 有證據；AC-6 `[manual]` 已驗（s29 瀏覽器行為層，owner 未親驗：zh/en 17 路由逐字比對 6029bf0 一致；字典比對 zh 475／en 474 key→value 全同）） | integration tip `60ff9c2`（ff-only from `96f1565`；基線含 eslint exit 0、34 files / 333 tests、LINT_OK）；branch `feat/m6-module-colocation` @ `60ff9c2`（已 push）；codex 首輪 FAIL（唯一阻擋項：consumers 購買紀錄不隨訂單更新）→ main 依 spec R5／OQ-3 裁定只記錄（撤回修正棒 m6-fix1，未 commit）→ 同一 commit 重審 PASS（arch chain `reviews/arch-m6-rereview-codex-verdict.md`）；`src/pages`、`src/services`、`src/components` 已移除，boundaries `LEGACY_PATHS` 已移除 |
| M7 orval 契約層 | 完成，已併入本地整合分支 `refactor/integration`（main 裁決拆兩段 M7a / M7b；AC-1～6 有自動測試證據；AC-7 `[manual]` 瀏覽器 CRUD agent 驗為**部分通過**（s1，`~/.claude/plans/admin-template/s1-browser-ac-report.md`：當時有 F1 `/users` 重新整理 regression、P2 banner 刪除無作用、P3 文章無法新增，空白新增商品未走完；後續 F1 由 #17、P2/P3 由 #19 修正，空白新增商品仍未驗），owner 親驗 pending（owner 2026-11-10 裁決先註記、不阻擋交付））。M7a：repo 根 `openapi.yaml`（36 operations）、`scripts/extract-operations.ts` + AC-2 fixture 測試、根目錄 `orval.config.ts`。M7b：`pnpm gen:api`（orval + prettier + extract）產生 `src/modules/<id>/api/**`、`mocks/<id>.msw.ts` 與 `src/app/operations.gen.ts`；`shared/api/fetcher.ts` 為 orval mutator（回 HTTP body、非 2xx throw、queryKey 相對路徑）；legacy adapter 與 `apiFetch` 已刪；mock 404 body 改為 `not found: no operation for …`（spec §6.5，依 M4 決定） | M7b：integration tip `ca6b62f`（ff-only from `60ff9c2`；基線 `pnpm gen:api` 後無 diff、build、38 files / 347 tests、`vitest run scripts` 12 tests、lint 後工作樹乾淨，exit 0）；branch `feat/m7b-orval-gen` @ `ca6b62f`（未 push）；codex 首輪 PASS（api chain `reviews/api-m7b-codex-verdict.md`，8 條實作 DECISION 皆判相容 / 可接受）；lead 第一手重跑 Done Command exit 0。M7a：tip `571d1af`；codex 首輪 PASS（api chain `reviews/api-m7a-codex-verdict.md`） |
| M8 D1 / D4 驗收自動化與收尾 | 完成，已併入本地整合分支 `refactor/integration`（AC-1～3 有自動證據；AC-4 `[manual]` core-only 副本瀏覽器驗收 agent 已驗（s1，同上報告），owner 親驗 pending（owner 2026-11-10 裁決先註記、不阻擋交付），另以 `src/app/__tests__/core-only.test.tsx` 自動佐證）。`scripts/verify-core-only.sh`（`pnpm verify:core-only`）在暫存副本依 §8.2 刪 7 個 `kind:"domain"` module + YAML tag 並 `gen:api`，build 全量，vitest 依 **main 裁決 A** 只跑 core-safe 測試（grep 排除 + main 追認的 `FULL_INSTALL_TESTS` 明列 7 檔；排除為空或過半即 fail） | integration tip `343a449`（ff-only from `f653b99`；基線 eslint／build／41 files・354 tests／verify-core-only（排除 14/32、core-only 18 files・134 tests、`core-only build: OK`）／`git diff --quiet` exit 0、LINT_OK）；branch `feat/m8-core-only-verification` 原實作 `2d14695`（base `ca6b62f`，已 push）codex 首輪 PASS-with-fixes（7 條皆記錄類，arch chain `reviews/arch-m8-codex-verdict.md`）→ 因 #16h 擋非修正棒，依 M6 先例同 commit 帶分流前提重審 PASS（arch chain `reviews/arch-m8-rereview-codex-verdict.md`）→ rebase 到 f653b99（range-diff 皆 `=`，`343a449` push 於 `feat/m8-core-only-verification-r1`） |

### 架構主線已知問題 / follow-up

依 owner 指示（2026-11-10）：不影響 build / test / demo 基本功能的審查發現只記錄、不開修正棒。

| Milestone | 項目 | 來源 |
|---|---|---|
| M4 | mock 登出只清 client session，不撤銷已簽發 token（mock 限制；M7 換真 API 前不處理） | arch chain `reviews/arch-m4-fix-codex-verdict.md` I1 |
| M4 | mock session 表存 localStorage（`mock-sessions`）：格式合法但人為植入的條目會被接受（同源 script 本可讀真 token，未增加攻擊面）；表只增不減 | arch chain `reviews/m4-fix3-report.md` D-W1-1、D-W1-2 |
| M4 | mock create / delete handler 對空 body 也回成功；資料結果只以 tags 驗證 | arch chain `reviews/m4-fix3-report.md` W2 限制 |
| M4 | 瀏覽器實機驗證已由 s29 完成（AC-6、角色 nav、越權內容區 403、重新整理後保持登入、users 表單送出皆通過；行為層，owner 未親驗）；未驗：其他 feature 完整 CRUD、圖片上傳、banner 拖曳、60ff9c2 之後的 commit | main 轉 s29 `manual-ac-report.md` |
| M4 | 行為變更（已裁決：owner 2026-11-10 覆核定案（OD-GRANT-1），D1、D2 接受）：support / partner 可進後台（6029bf0 被 layout 擋）；admin 失去 users 編輯鈕（直接進 `/users/edit/$id` 可開但送出 disabled） | arch chain `reviews/m4-fix2-report.md` D1–D4 |
| M4 | 本目錄的 arch spec 為 M3 修訂版；M4 的 spec 文字更新（§4.2/§4.3/§6.1/§6.5/§9）在 integration 的 `docs/specs/fsd-module-architecture.spec.md`，M8 統一同步 | `2988875` |
| M4 | `CLAUDE.md`、spec 兩份 md 原本即未通過 prettier --check | arch chain `reviews/m4-fix2-report.md` |
| M3 | 中間 commit 509dc96..2aae3e6 不可單獨 build（bisect skip，已接受） | main 裁決 |
| M5 | boundaries 常駐 ignore `**/__tests__/**` 會讓正式碼透過 import 測試檔繞過邊界檢查（現無此用法） | arch chain `reviews/arch-m5-codex-verdict.md` W1 |
| M5 | spec §7.2 草案的 `no-restricted-syntax`（`createRoute`／`useCan`）與 `use-user-permissions` 限制未上線；M6 搬 pages 時補 | arch chain `reviews/arch-m5-codex-verdict.md` W2、自行決定 #9 |
| M6 | boundaries `LEGACY_PATHS`（`src/pages/**`、`src/services/**`、`src/components/**`）與 pages 對 module 的 deep import（`order-status-tag`、`banners/model/image-validation`）須隨搬遷一併清除，不能只刪 ignore | arch chain `reviews/m5-impl-report.md`、verdict I1 |
| M6 | `components/shared/Card.tsx` 歸 product、`components/layouts/LoginPage.tsx` 歸 auth、`components/shared/Navbar.tsx` re-export shim 待刪；`shared/i18n/types.ts` 的 `TranslationResources` 與 §5.4 同名不同義（`TranslationResources` 同名問題**已完成**：core 資源型別改名 `TCoreResources`，`TranslationResources` 改為 §5.4 擴充介面，i18n-scope-migration I1） | arch chain `reviews/m5-impl-report.md` 自行決定 1、2、7 |
| M5 | spec 文字差異（§7.2 `rules`→`policies`、§5.1 檔名 kebab-case、Card 未搬、upload hook 落點）待 M8 同步 | arch chain `reviews/m5-impl-report.md`「spec 差異」 |
| M6 | `en.json` 比 zh 少 71 個 key（例 `pages.tag.addTag`）（**已完成**：i18n-scope-migration I1） | arch chain 觀察 |
| M6 | consumers 購買紀錄為自帶 seed，不隨訂單狀態更新（R5/OQ-3 設計代價；codex M6 verdict 判 demo-breaking，main 依 spec 裁定只記錄） | arch chain `reviews/arch-m6-codex-verdict.md`、`arch-m6-rereview-codex-verdict.md` |
| M6 | `shared/api/mock/session-store.ts` 全域 grant 矩陣「最後寫入者勝」，多 app build 時 login grants 可能與 guard 不一致，且無 reset 生命週期（單 app demo 不受影響） | arch chain `reviews/arch-m6-codex-verdict.md` W2 |
| M6 | i18n 只搬了 en `users.*`；其餘 domain key（`pages.*`、`dashboard.menu.*`、`table.headers.*` 等，約 770 處 `t()`）與 nav label 尚未改成 `<id>.` scope，需改 key 名 + codemod，另案處理（**已完成**：i18n-scope-migration I1） | arch chain `reviews/m6-impl-report.md` 自行決定 5、spec 差異 |
| M6 | `shared/ui/navbar/use-breadcrumb.ts` 仍硬編 domain 路徑與翻譯 key，未改由 route `staticData.breadcrumb` 驅動（**已完成**：改讀 nav registry（補裁 1 = C），i18n-scope-migration I1） | arch chain `reviews/arch-m6-codex-verdict.md` info |
| M6 | AC-6 已由 s29 瀏覽器驗（見上）；module 字典的 `mount` 寫入順序（先 `loadLanguages` 再 `addResourceBundle`）只在 vitest 模擬過 | arch chain `reviews/m6-impl-report.md` |
| M6 | 測試預設 server 只有 guard + core handler；新測試打 module API 須 `resetHandlers(registry.mockHandlers)` | arch chain `reviews/m6-impl-report.md` 已知問題 |
| M6 | AC-2 grep 擋不到相對路徑的跨 module import（由 boundaries lint 擋） | arch chain `reviews/m6-impl-report.md` 破壞性驗證 3 |
| M6 | spec 文字差異 8 項待 M8 同步：§5.1 i18n 拆分範圍、adapter 落點 `shared/api/mock/legacy-adapter.ts`、Navbar/Breadcrumb 落點 `shared/ui/navbar/`、§5.2 auth `requires: ["users"]`、§4.5 `createCollection(seed, idKey, opts)`、§7.2 lint 放行（mocks→同 module model、`__tests__`）、§9 M6 Touches 未列 `shared/api`/`shells`、AC-5「14 檔」過時 | arch chain `reviews/m6-impl-report.md`「spec 差異」 |
| 全域（s29） | F-1：tags / suppliers / team-members / banners 的 UI 與 articles 表單未接權限宣告，唯讀角色（support / partner）仍看得到新增 / 編輯 / 刪除入口，送出後 mock 回 403、資料不變。重構前這些頁無權限檢查、support 可寫，現在 403——已裁決（OD-GRANT-1，owner 2026-11-10「接受矩陣＋修 F-1」），修正見 `docs/specs/f1-permission-declarations.spec.md`（branch `feat/f1-permission-declarations`，含 product 潛在同型問題） | main 轉 s29 `manual-ac-report.md` |
| 全域（s29） | 重構前既有、非本次引入：R-2 en 語系仍有寫死中文；R-3 users/edit 表單為空（stub）；R-4 products 刪除無確認框 | main 轉 s29 `manual-ac-report.md` |
| M8 | `FULL_INSTALL_TESTS` 明列 7 檔需人工維護；排除 14/32 已接近一半門檻（16），新增「斷言完整安裝」的測試可能觸發防呆 | arch chain `reviews/m8-impl-report.md`、main 追認 |
| M8 | 字面 grep 會誤排不依賴 domain 的測試（`kernel/__tests__/build.test.ts` 只因 fixture 字串 `"orders.list"` 被排除，core-only 下 kernel 單元測試沒跑）；防呆只擋零命中與過半，擋不住局部漏抓 | arch chain `reviews/arch-m8-codex-verdict.md` W `:43` |
| M8 | `verify-core-only.sh` cleanup 對整個 repo 跑 `git worktree prune`（可能清掉其他已失效登記）；`worktree remove` 失敗被忽略、只掛 EXIT trap（無 INT/TERM）；strip helper 從原工作目錄執行，未提交的 helper 變更會影響結果。spec 紅線只要求不改工作目錄，已由 `git diff --quiet` 檢查 | arch chain `reviews/arch-m8-codex-verdict.md` W `:17`／`:18`、I `:33` |
| M8 | override 測試以深 import 取 orders hook（orders `index.ts` 未公開 headless hook），未驗「只用 module index 公開 API 換頁」；AC-4 自動佐證用 fixture shell 與注入認證，未涵蓋實際登入與 default shell sidebar | arch chain `reviews/arch-m8-codex-verdict.md` I |
| M8 | core-only 畫面殘留 domain 字串（靜態檢視）：en/zh 字典 domain key、`use-breadcrumb.ts` 硬編 case、`table-visibility.ts` 的 `ORDERS_TABLE` 等 storage key、`core-handlers.ts` 註解（en/zh 字典 domain key 與 `use-breadcrumb.ts` 項**已完成**：i18n-scope-migration I1；其餘未動） | arch chain `reviews/m8-impl-report.md` |
| i18n（I1 後） | 非測試 `.ts/.tsx` 硬寫中文 75 處 / 17 檔（mock seed 20、module toast / 錯誤訊息 19、module UI 文案 11、banners 圖片驗證規則 16、core 圖片驗證 7、shell 語言切換 2）未改 i18n（OD-I18N-6 裁決另案） | `docs/specs/i18n-scope-migration.spec.md` §1.4 |
| i18n（I1 後） | `RecursiveKeyOf` 連物件節點也收進 `TransKey`（例 `"tags.nav"`），`t()` 指到物件也能過 `tsc`；改 leaf-only 對既有 `t()` 呼叫的影響未量測 | `docs/specs/i18n-scope-migration.spec.md`「已知事項」 |
| i18n（I1 後） | `t()` 本身接受任意 string：`i18next.d.ts` 只**新增** `TransKey` overload，i18next 內建 overload 仍收 string，`t("tags.addTga")` 照過 `tsc`（基準即如此，非 I1 引入）；key 型別檢查只在宣告為 `TransKey` 的位置生效（AC-4 以 `TransKey` 指派鎖住） | i18n-scope-migration I1 實作棒實測 |
| M8 | spec 文字差異待同步：AC-4「sidebar 只有 users / team-members」實際只有 team-members（users 本無 nav）；§8.2「漏步驟 2 但跑步驟 4 → tsc 報錯」實測 tsc 不報、由 vitest `build()` 1.5.3 擋；§4.4 覆寫頁「只用 index 公開 API」與現況不符 | arch chain `reviews/m8-impl-report.md`「spec 差異」 |
| 收尾 | spec 同步只處理差異清單：§4.4 範例 `ordersRoutes.build(ctx, …)`（實作為 `ordersRoutes(ctx, …)`）未改；M1–M3 AC checkbox 未更新；spec md 原本即未通過 prettier --check（未整檔重排） | arch chain `reviews/m8-spec-sync-report.md` |
| M7a | pnpm-lock 中既有 `unplugin@3.7.0` 的 optional `esbuild` 隨新增 orval 從 0.25.12 解析為 0.28.2（`package.json` 既有版本未變；無故障證據） | api chain `reviews/api-m7a-codex-verdict.md` info 1 |
| M7a | extract 輸出與現行手寫 `src/app/operations.gen.ts`（`crud()` helper）不逐字相同，M7a 只做資料比對、未覆蓋；產物直接放進 src 後的 eslint 由 M7b `gen:api` 實際驗證 | api chain m7a-impl 交付報告 |
| M7a | `scripts/**` 與 `orval.config.ts` 不在 `pnpm build` 的 tsc 範圍，也不在 `pnpm lint` 範圍（只用暫時 tsconfig 檢查過一次） | api chain m7a-impl 交付報告 |
| M7b | 非 mock 模式仍靜態載入 mock handlers 與 `@faker-js/faker`（`app/modules.ts → module index → mocks/handlers.ts → *.msw.ts → faker`；`VITE_API_MOCK` 只控制 worker 啟動），正式 bundle 很可能含 faker 與 mock 程式，增量未實測；faker 從根入口匯入，`locale: "en"` 不保證只載英文 locale | api chain `reviews/api-m7b-codex-verdict.md` info |
| M7b | 新增依賴 `@faker-js/faker@10.6.0`（dependencies；orval 產生的 msw 檔必 import）超出 spec Touches 原列的 orval / yaml devDeps | api chain `reviews/m7b-impl-report.md` DECISION 5 |
| M7b | spec §4.5 fetcher 的「403 統一 toast、401 清 session」未實作（base 無此行為，且會與各 hook 自己的 toast 重複，依行為紅線維持原狀） | api chain `reviews/m7b-impl-report.md` |
| M7b | hooks 沿用手寫 queryKey，未改用 orval `get*QueryKey`（保持 invalidation 與 base 相同）；mutator 回 HTTP body，不再剝 `ApiEnvelope.data`（列表需 `total`）——spec 文字待 M8 同步 | api chain `reviews/m7b-impl-report.md` DECISION 1、2 |
| M7b | eslint 過渡 policy「mocks 可讀本 module 的 `model/`」未收回（seed 型別仍取自 `model/`）；產物只關 `import/order` | api chain `reviews/m7b-impl-report.md` |
| M7b | `docs/TRAPS.md` B 區 M7 相關條目（K1 / K3 / K4）已驗證但未移到 A 區或刪除 | api chain `reviews/m7b-impl-report.md` |
| M7b | AC-7 瀏覽器 `setupWorker` 下 orval handler 與 hooks 未實測（只在 node `setupServer` 驗過，對應 K6 / K8）；codex 唯讀 sandbox 下 vitest 因 EPERM 未執行，測試數由實作棒、lead 與併入棒三方重跑佐證 | api chain `reviews/m7b-impl-report.md`、`reviews/api-m7b-codex-verdict.md` |
| M7b | orval 對空字串 / null query 的序列化與舊 helper 不同，現行 hook 的參數整理下未見可觸發問題 | api chain `reviews/api-m7b-codex-verdict.md` |
| M7b | **regression**：module handler 為萬用 origin（`"*/users"`），mock 模式重新整理 `/users` 拿到 mock JSON 且繞過 guard。修正：kernel origin 圍欄，branch `fix/msw-origin-anchor`；瀏覽器重新整理驗收待 owner | `docs/specs/msw-origin-anchor.spec.md`；s1 瀏覽器驗收 F1 |
| 全域（owner 2026-11-10 新需求） | **底層契約型別改以 Zod（已是依賴，v4）為單一來源，推導 TS 型別**。目標：IDE type suggest 與型別推導，讓不符架構的結構在編譯期就被擋，方便開發與糾錯。附帶效益（owner 2026-11-10 追加）：(a) 型別由契約推導後，若 `openapi.yaml` 的結構整個抽換成另一種格式，依賴它的 UI flow 會在編譯期直接報錯，等於替 TDD 式重構多一層自動糾錯，功能類似測試案例；(b) 整個抽換 module 時，缺漏或不相容的宣告（permission、route、nav、i18n）同樣由型別擋下，抽換更便利。現況多數契約欄位是寬 string，沒有提示也沒有推導，寫錯只能靠執行期 `build()` throw 或根本不報錯：(1) 權限：`` TPermission = `${string}:${string}` ``（`src/shared/permission/types.ts:2`）、`TGrant`（:4）、`TGrantMatrix`（roleId 為 string，:29）、`permissions.resources: Record<string, readonly string[]>`（:24）；route / nav / `rowActions` / `EditActions` / `FormSubmit` 的 `permission`、`mockGrants`、`openapi.yaml` 的 `x-permission` 寫錯（如 `tag:read`、`tags:raed`）型別不擋，UI 端寫錯靜默變成永遠無權限。(2) module 契約（`src/shared/module/types.ts`）：`TModule.id`（:75）、`requires`（:79，module id 皆 string）、`TNavItem.label`（:25，註解要求 `${moduleId}.` 開頭但型別不檢查）、`TNavItem.to`（:27，任意字串，非已註冊路徑）、`staticData.routeId` 執行期為 string（:18）、`i18n: Record<TLocale, Record<string, unknown>>`（:84，字典 key 無推導）。(3) 方向：resource × action 建列舉矩陣（`z.enum` / `as const`）推導 `TPermission` union；module id、route id、nav to、i18n key 同樣由宣告推導。待設計：module 可拔除，全域 union 由 kernel 組裝型別（延伸現有 `TRouteIdRegistry` augmentation 模式，`src/shared/module/types.ts:11`）或由 `pnpm gen:api` codegen；Zod runtime 驗證與純型別推導的分工；與 `defineModule` 的相容。尚無 spec。 | owner 2026-11-10 |

## 依賴升級（deps chain）

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `deps-p0-node22.spec.md` | Node 22 前置 | 完成 | PR #4 |
| `deps-p1-eslint9.spec.md` | ESLint 9 flat config 遷移 | 完成 | PR #5 |
| `deps-p2-prettier3.spec.md` | Prettier 2 → 3 | 完成 | PR #7 |
| `deps-p3-vitest5.spec.md` | Vitest 3 → 5 | 完成，已 ff-only 併入 `refactor/integration`（tip `f864fc6`） | 原實作 `d29739c` codex PASS（`~/.claude/.claude/reviews/20261109T170530Z-58436-codex-review.md`，AC1–AC7 PASS；AC8 遠端狀態由子 session 以 ls-remote / gh pr list 補證）；rebase 後 `f864fc6`（parent `d7a6fc3`，作者 pakerchang）delta PASS（`~/.claude/.claude/reviews/20261109T193445Z-2644-codex-review.md`）；Done Command exit 0，19 files / 196 tests（AC5 的 16 / 179 為 rebase 前 base `46d13b6` 的基線）；併入後整合基線 install / build / vitest 19 / 196 / eslint 0 warning，exit 0 |
| `deps-p4-zod4.spec.md` | Zod 3 → 4 | 完成，已 ff-only 併入 `refactor/integration`（tip `3c92e5a`） | branch `chore/deps-p4-zod4`（base `8458b19`）：`b6cbc5f` 升級＋必改、`3c92e5a` deprecated API 遷移，作者 pakerchang；第 1 輪 codex FAIL 只因 AC3 驗收指令在 base 已壞（`copy-order.ts:127` TS2742，與 zod 無關）→ lead 依派工授權改寫 AC3 為 `tsc -b tsconfig.app.json`，v3 / v4 型別斷言皆過；重審 PASS（`~/.claude/.claude/reviews/20261109T201731Z-83751-codex-review.md`）；Done Command exit 0，24 files / 229 tests；commit 1 單獨 build＋test 亦過；併入後整合基線 install / build / vitest 24 / 229 / eslint 0 warning，exit 0 |
| `deps-p5-ts6.spec.md` | TypeScript 5.9 → 6.0 | 完成，已 ff-only 併入 `refactor/integration`（tip `f653b99`） | branch `chore/deps-p5-ts6`（base `ca6b62f`）：`f653b99`，作者 pakerchang；typescript `~6.0.3`、兩處 `baseUrl` 移除、單一 `@/*`、app / node `types: ["node"]`、刪 `DOM.Iterable` / interop 兩行 / `typeRoots`，源碼未改；codex 首輪 PASS（`~/.claude/.claude/reviews/20261109T234942Z-24928-codex-review.md`，範圍 `ca6b62f..f653b99`）；Done Command exit 0，38 files / 347 tests（與 base 相同），eslint 0 warning；併入後整合基線 install / tsc 6.0.3 / build / vitest 38 / 347 / eslint 0 warning，exit 0 |

P5 依 main 裁決等 M7b 併入後開工（M6 / M7b 會動同一批檔案）。

### 依賴升級已知問題 / follow-up

| 階段 | 項目 | 來源 |
|---|---|---|
| P5 | `react-i18next@15.7.4` peer 寫 `typescript@^5`，install 有 peer 警告；build / test / 型別檢查不受影響 | deps chain p5 交付報告 |
| P5 | `tsc -p tsconfig.test.json --noEmit` 在 base 就失敗，現為 TS6307（`src/app/kernel/__tests__/operations-yaml.test.ts:12` import `scripts/extract-operations.ts` 不在 project）；原 TS2742 已不再出現；test tsconfig 修或刪待排 | deps chain p5 交付報告 |
| P5 | 未驗 shadcn CLI 在根 `tsconfig.json` 無 `baseUrl` 時能否解析 `components.json` aliases | deps chain p5 交付報告 |
| P5 | 瀏覽器 demo 待驗（源碼未改，vite build 與 347 測試通過） | deps chain p5 交付報告 |

## API 契約層 PoC（api chain）

PoC spec 保留到 M7 落地時引用。PoC 程式碼在 branch `poc/api-orval`（未 push，worktree `admin-template-api-orval-poc`）；報告在 api chain scratchpad `chains/api/poc-*-report.md`。

證據說明：done command `ALL_GREEN` exit=0 為**子 session 自報，未經 codex 審**。AC 只勾 done command 實際涵蓋的項；報告內容、commit 與分析類 AC 不在 done command 範圍內，維持未勾。

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `orval-poc.spec.md` | orval + MSW sandbox PoC（a1） | PoC 完成，保留至 M7 | `8f20660`；`poc-orval-report.md`；vitest 7/7；AC 4/5 |
| `orval-module-split-poc.spec.md` | orval module 分散輸出 PoC（a2） | PoC 完成（採 B：單一 yaml 依 tag 分 output），保留至 M7 | `8d0ddfc`；`poc-module-split-report.md`；vitest 11/11；AC 2/7 |
| `guard-fail-closed-poc.spec.md` | guard fail-closed PoC（a3） | PoC 完成，保留至 M7 | `f006837`；`poc-guard-fail-closed-report.md`；vitest 18/18；AC 5/6 |
| `perm-colon-poc.spec.md` | 權限字串改冒號 PoC（a4） | PoC 完成，保留至 M7 | `1097347`；`poc-perm-colon-report.md`；vitest 18/18；AC 2/6 |

## 工具 / 流程

| 檔名 | 主題 | 狀態 |
|---|---|---|
| `git-allow-whitelist.spec.md` | git 放行 hook 改嚴格白名單 | 已擱置（global ask 已移除，目標已達） |
| `project-git-write-allow.spec.md` | 專案層放行 cc-git-write（PermissionRequest hook） | 已擱置（同上） |

## 後續流程

之後所有重構工作在本地 `refactor/integration` 分支以 fast-forward-only 方式逐棒累積（M3、deps P3 起），全部 milestone 完成後才開**一個** PR 合入 master。
