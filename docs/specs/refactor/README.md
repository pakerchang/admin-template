# 重構 feature spec 索引

本目錄封存 admin-template 重構（Microkernel + Modular Monolith 架構、依賴升級、API 契約層 PoC）相關的所有 spec，含已完成者，供查閱與追溯。

- 檔案內容**逐位元組**複製自原始位置，未做任何修改。
- 部分 spec 內含本機絕對路徑（`/Users/…`、`/private/tmp/…` scratchpad 報告路徑）等機器資訊，屬撰寫當時的工作環境紀錄，照原樣保留；這些路徑在其他機器上不存在。
- 狀態核對時間：2026-11-10（以 `git log` / `gh pr list` 核對）。

## 架構主線

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `fsd-module-architecture.m3-revision.spec.md` | Microkernel + Modular Monolith 目標架構（M0–M8），含 M3 W1 獲准修訂的最新版 | M0–M5 完成（M5 已併入 `refactor/integration`）；M7a 完成；M6、M7b、M8 未開始 | 見下方 milestone 表 |

> master 上的 `docs/specs/fsd-module-architecture.spec.md`（#6 合入）為修訂前版本，不在本目錄更動；本目錄版本取自 `feat/m3-module-wiring:docs/specs/fsd-module-architecture.spec.md`。

| Milestone | 狀態 | 證據 |
|---|---|---|
| M0（前置：deps P0 Node 22 + P1 ESLint 9） | 完成 | PR #4、#5 |
| M1 Kernel 契約與權限引擎 | 完成 | PR #8 |
| M2 MSW 取代 mockFetch | 完成（AC-5 已勾：main 派 s28 瀏覽器行為層驗證，owner 尚未親驗） | PR #9；AC-5 證據 s28 `ac5-browser-report.md`（tip 8458b19） |
| router pathless hotfix | 完成 | PR #10；spec 在 master `docs/specs/router-pathless-hotfix.spec.md` |
| M3 Module 接線 + default shell | 完成，已併入本地整合分支 `refactor/integration`（AC-1～7 已勾；AC-5 由 main 派 s28 瀏覽器行為層驗證，owner 尚未親驗） | integration tip `8458b19`（ff-only，基線 exit 0、23 files / 227 tests、LINT_OK）；`feat/m3-module-wiring` @ `8458b19` 已 push；codex 259e4c3 FAIL → d685823 PASS-with-fixes → 03acca9 PASS →（rebase）edfd74d PASS-with-fixes → 8458b19 PASS（arch chain `reviews/arch-m3-fix3-codex-verdict.md`）；中間 commit 509dc96..2aae3e6 不可單獨 build（bisect skip，main 已裁決接受） |
| M4 權限四強制點 + 內容區 403 | 完成，已併入本地整合分支 `refactor/integration`（AC-1～5、AC-7 有自動測試證據；AC-6 `[manual]` 瀏覽器驗收**待驗**，由 main 統一派；角色 grants 矩陣為 **main 代 owner 裁決，待 owner 覆核**） | integration tip `ec5a55f`（ff-only，基線 exit 0、32 files / 316 tests、LINT_OK）；branch `feat/m4-permission-enforcement` @ `ec5a55f` 未 push（origin 停在 rebase 前 `66e94c0`）；codex acd05c0 FAIL（C1 mock token 可偽造、C2 profile 提權）→ fix1/fix2 → 2988875 PASS-with-fixes（arch chain `reviews/arch-m4-fix-codex-verdict.md`）→ fix3 修 W1（重新整理後 session 失效）後依 owner 指示不再複審直接併入；AC-1 路徑 `/users/user-list` → `/users`（main 核准） |
| M5 Kernel / shared 搬遷 + 邊界 lint | 完成，已併入本地整合分支 `refactor/integration`（AC-1～4 有證據；`jsdom-node-abort.env.ts` 已刪；UI 外觀僅 CSS 產物比對，瀏覽器目視**待驗**） | integration tip `96f1565`（ff-only from `571d1af`；基線含 eslint exit 0、33 files / 328 tests、LINT_OK）；branch `feat/m5-shared-boundaries`：原實作 `43dfba8`（base `ec5a55f`，已 push）codex 一輪 PASS（arch chain `reviews/arch-m5-codex-verdict.md`）→ rebase 到 571d1af 只有 lock context 不同（`96f1565` push 於 `feat/m5-shared-boundaries-r1`）；boundaries 實測：`policies` 為正式 key（`rules` deprecated）、elements first-match、policies last-match |
| M6 Module 內嵌搬遷 | 未開始 | — |
| M7 orval 契約層 | **main 裁決拆兩段**。**M7a 完成**，已併入本地整合分支 `refactor/integration`：repo 根 `openapi.yaml`（36 operations）、`scripts/extract-operations.ts` + AC-2 fixture 測試、extract 結果與現行 `operations.gen.ts` 的一致性比對、根目錄 `orval.config.ts`（只寫檔未跑 gen）；AC-2 已勾。**M7b 未開始**（等 M6 併入）：gen 進 modules、mutator（AC-4）、刪 adapter（AC-5）、AC-1 / AC-3 / AC-6 / AC-7 | M7a：integration tip `571d1af`（ff-only；基線 exit 0、33 files / 328 tests、LINT_OK、`vitest run scripts` 12 tests）；branch `feat/m7a-openapi-contract` @ `571d1af`（base `ec5a55f`）；codex 首輪 PASS（api chain `reviews/api-m7a-codex-verdict.md`）；lead 第一手重跑 Done Command exit 0、`M7A_DONE_OK`。M4 決定：M7 前 mock 404 沿用 legacy body `No mock handler for …`；M7 起改為 `not found: no operation for …`（spec §6.5） |
| M8 D1 / D4 驗收自動化與收尾 | 未開始 | — |

### 架構主線已知問題 / follow-up

依 owner 指示（2026-11-10）：不影響 build / test / demo 基本功能的審查發現只記錄、不開修正棒。

| Milestone | 項目 | 來源 |
|---|---|---|
| M4 | mock 登出只清 client session，不撤銷已簽發 token（mock 限制；M7 換真 API 前不處理） | arch chain `reviews/arch-m4-fix-codex-verdict.md` I1 |
| M4 | mock session 表存 localStorage（`mock-sessions`）：格式合法但人為植入的條目會被接受（同源 script 本可讀真 token，未增加攻擊面）；表只增不減 | arch chain `reviews/m4-fix3-report.md` D-W1-1、D-W1-2 |
| M4 | mock create / delete handler 對空 body 也回成功；資料結果只以 tags 驗證 | arch chain `reviews/m4-fix3-report.md` W2 限制 |
| M4 | 瀏覽器實機驗證待做：AC-6 manual、重新整理後保持登入（F5）、support / partner 進後台後的 403 呈現 | arch chain `reviews/arch-m4-fix-codex-verdict.md` W2 |
| M4 | 行為變更待 owner 覆核：support / partner 可進後台（6029bf0 被 layout 擋）；admin 失去 users 編輯鈕（直接進 `/users/edit/$id` 可開但送出 disabled） | arch chain `reviews/m4-fix2-report.md` D1–D4 |
| M4 | 本目錄的 arch spec 為 M3 修訂版；M4 的 spec 文字更新（§4.2/§4.3/§6.1/§6.5/§9）在 integration 的 `docs/specs/fsd-module-architecture.spec.md`，M8 統一同步 | `2988875` |
| M4 | `CLAUDE.md`、spec 兩份 md 原本即未通過 prettier --check | arch chain `reviews/m4-fix2-report.md` |
| M3 | 中間 commit 509dc96..2aae3e6 不可單獨 build（bisect skip，已接受） | main 裁決 |
| M5 | boundaries 常駐 ignore `**/__tests__/**` 會讓正式碼透過 import 測試檔繞過邊界檢查（現無此用法） | arch chain `reviews/arch-m5-codex-verdict.md` W1 |
| M5 | spec §7.2 草案的 `no-restricted-syntax`（`createRoute`／`useCan`）與 `use-user-permissions` 限制未上線；M6 搬 pages 時補 | arch chain `reviews/arch-m5-codex-verdict.md` W2、自行決定 #9 |
| M6 | boundaries `LEGACY_PATHS`（`src/pages/**`、`src/services/**`、`src/components/**`）與 pages 對 module 的 deep import（`order-status-tag`、`banners/model/image-validation`）須隨搬遷一併清除，不能只刪 ignore | arch chain `reviews/m5-impl-report.md`、verdict I1 |
| M6 | `components/shared/Card.tsx` 歸 product、`components/layouts/LoginPage.tsx` 歸 auth、`components/shared/Navbar.tsx` re-export shim 待刪；`shared/i18n/types.ts` 的 `TranslationResources` 與 §5.4 同名不同義 | arch chain `reviews/m5-impl-report.md` 自行決定 1、2、7 |
| M5 | spec 文字差異（§7.2 `rules`→`policies`、§5.1 檔名 kebab-case、Card 未搬、upload hook 落點）待 M8 同步 | arch chain `reviews/m5-impl-report.md`「spec 差異」 |
| M6 | `en.json` 比 zh 少 71 個 key（例 `pages.tag.addTag`） | arch chain 觀察 |
| M7a | pnpm-lock 中既有 `unplugin@3.7.0` 的 optional `esbuild` 隨新增 orval 從 0.25.12 解析為 0.28.2（`package.json` 既有版本未變；無故障證據） | api chain `reviews/api-m7a-codex-verdict.md` info 1 |
| M7a | extract 輸出與現行手寫 `src/app/operations.gen.ts`（`crud()` helper）不逐字相同，M7a 只做資料比對、未覆蓋；產物直接放進 src 後的 eslint 由 M7b `gen:api` 實際驗證 | api chain m7a-impl 交付報告 |
| M7a | `scripts/**` 與 `orval.config.ts` 不在 `pnpm build` 的 tsc 範圍，也不在 `pnpm lint` 範圍（只用暫時 tsconfig 檢查過一次） | api chain m7a-impl 交付報告 |

## 依賴升級（deps chain）

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `deps-p0-node22.spec.md` | Node 22 前置 | 完成 | PR #4 |
| `deps-p1-eslint9.spec.md` | ESLint 9 flat config 遷移 | 完成 | PR #5 |
| `deps-p2-prettier3.spec.md` | Prettier 2 → 3 | 完成 | PR #7 |
| `deps-p3-vitest5.spec.md` | Vitest 3 → 5 | 完成，已 ff-only 併入 `refactor/integration`（tip `f864fc6`） | 原實作 `d29739c` codex PASS（`~/.claude/.claude/reviews/20261109T170530Z-58436-codex-review.md`，AC1–AC7 PASS；AC8 遠端狀態由子 session 以 ls-remote / gh pr list 補證）；rebase 後 `f864fc6`（parent `d7a6fc3`，作者 pakerchang）delta PASS（`~/.claude/.claude/reviews/20261109T193445Z-2644-codex-review.md`）；Done Command exit 0，19 files / 196 tests（AC5 的 16 / 179 為 rebase 前 base `46d13b6` 的基線）；併入後整合基線 install / build / vitest 19 / 196 / eslint 0 warning，exit 0 |
| `deps-p4-zod4.spec.md` | Zod 3 → 4 | 完成，已 ff-only 併入 `refactor/integration`（tip `3c92e5a`） | branch `chore/deps-p4-zod4`（base `8458b19`）：`b6cbc5f` 升級＋必改、`3c92e5a` deprecated API 遷移，作者 pakerchang；第 1 輪 codex FAIL 只因 AC3 驗收指令在 base 已壞（`copy-order.ts:127` TS2742，與 zod 無關）→ lead 依派工授權改寫 AC3 為 `tsc -b tsconfig.app.json`，v3 / v4 型別斷言皆過；重審 PASS（`~/.claude/.claude/reviews/20261109T201731Z-83751-codex-review.md`）；Done Command exit 0，24 files / 229 tests；commit 1 單獨 build＋test 亦過；併入後整合基線 install / build / vitest 24 / 229 / eslint 0 warning，exit 0 |


P5（TS 6）依 owner 舊裁決，M3 後確認 arch spec 修訂定稿再開。

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
