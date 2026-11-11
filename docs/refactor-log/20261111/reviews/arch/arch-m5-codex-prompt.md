# Codex out-of-band 審查：admin-template M5（kernel／shared 搬遷 + 邊界 lint）

你是獨立審查者。只讀，不改任何檔案，不 commit。不要預設任何結論；所有判定都要附 `檔案:行號` 或指令輸出作為依據。

## 審查對象
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m5`（branch `feat/m5-shared-boundaries`，已 push origin）
- 送審 sha：`43dfba8562165ee6d56fdf51c2ef0c826d24add9`
- base sha：`ec5a55fe8707941ae1639662c72c0e00629513da`（`refactor/integration`）
- 審查範圍：`git diff ec5a55f..43dfba8`（3 個 commit：`2cdc3ac` boundaries lint、`8189942` 搬遷、`43dfba8` 刪 jsdom env）
- verdict 檔名：`arch-m5-codex-verdict.md`

## 依據文件（請先讀）
- spec：worktree 內 `docs/specs/fsd-module-architecture.spec.md` 的 §0、§3、§5.1、§7、§9 M5
- 實作報告（AC 證據、boundaries 實測、ignore 清單、搬遷對照表、破壞性驗證、逐 commit 結果、「自行決定」10 項、「spec 差異」、已知問題）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m5-impl-report.md`

報告是實作方自述，請以 diff 與實測為準逐條核對，不要直接採信。

## owner 現行原則（判定嚴重度時必須遵守）
- 每個 milestone **只審一輪**。只有 critical，或會讓 build／test／demo 基本功能壞掉的問題才會開修正棒；其他一律記錄到已知問題後併入。
- 實作與 spec 文字不一致時，以 §0 鎖定決策為準；純文字差異不算嚴重度依據，一律記 info。

## 要審的項目（逐條判定）

a. **AC-1～AC-4 與 jsdom 項**：對照 §9 M5，逐條判定成立／部分／不成立，附 `file:line`。jsdom 項＝刪 `src/test/jsdom-node-abort.env.ts`、`vite.config.ts` 的 `test.environment` 改回 `"jsdom"` 後 MSW／AbortSignal 相關測試仍通過。

b. **行為不變（最重要）**：搬遷與 codemod 有沒有改壞執行期行為。至少檢查：
   - import 指向錯檔、同名 symbol 被導到不同實作；
   - `vi.mock(...)` 路徑漏改，導致 mock 失效（報告承認 commit 2 曾漏一處，請全 repo 再掃一次 `vi.mock` 與被 mock 模組的實際 import 路徑是否一致）；
   - barrel／re-export 遺漏（原本有 export 的 symbol 搬家後消失）；
   - `src/shared/ui/tag.tsx` 的 tone 與 `src/modules/orders/ui/order-status-tag.tsx` 的對應，是否與 base 版 `src/components/shared/Tags.tsx` 的 `EOrderStatus` switch 逐一一致（含 default 分支）；
   - `src/services/api-client.ts` 拆成 `src/shared/api/fetcher.ts` + `src/shared/api/session.ts` 是否保留原行為，包括 M4 的 mock session、`grants`、`getAuth`／`setAuth`／`clearAuth`、401 處理、storage key；`TAuthUser.role` 改 `string` 是否造成型別放寬後的行為差異；
   - i18n 搬到 `src/shared/i18n/` 後的初始化與 locale JSON 載入路徑；
   - `tsconfig*.json`（paths、typeRoots、include）、`components.json`、`vite.config.ts` 的路徑設定；
   - `src/pages/**` 是否真的只改 import 行（含 `OrderStatusTag as Tag` 別名），沒有夾帶邏輯／JSX 變更。

c. **boundaries 設定**（`eslint.config.js`）：
   - 規則是否真的擋得住 shared→app／shells／modules、跨 module deep import、shell→module；
   - elements 比對順序（第一個符合者生效）與 policies 評估順序（最後一個符合者生效）下，現有排列是否有漏洞；
   - ignore 清單（`LEGACY_PATHS` 及常駐的 `src/test/**`、`**/__tests__/**`）是否過寬，例如把 `src/shared`、`src/app`、`src/shells`、`src/modules` 的程式碼也排除了，或 `__tests__` 排除讓正式碼可藉此繞過；
   - `no-restricted-imports` 的 `@/modules/*/*` 只套非 legacy 目錄是否留下非預期的缺口。

d. **報告「自行決定」10 項與「spec 差異」**：逐條判定「合理」或「需修正」，附理由；以 §0 鎖定決策為準。

e. **逐 commit 可獨立 build+test**：報告列有逐 commit 結果（commit 1 曾暫時 ignore 待搬目錄、commit 2 搬完後刪除）。核對每個 commit 的設定與內容是否自洽；能的話抽查。

## 執行
- 若環境允許，在 worktree 內執行 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 與 `pnpm exec vitest run`，引用結果摘要。read-only sandbox 跑不了就註明「未執行 + 原因」，**不要當成 finding**。

## 輸出格式
- Findings：每條標 `critical` / `warning` / `info`，附 `檔案:行號` 與具體失敗情境，並**明確標註是否屬「會讓 build／test／demo 基本功能壞掉」**（是／否）。
- a～e 的逐條判定；「自行決定」10 項與「spec 差異」的逐條判定。
- 結尾**各以獨立一行**輸出以下三行（行首不加任何符號、冒號後一個空格）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 43dfba8562165ee6d56fdf51c2ef0c826d24add9
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只能三選一填一個值；有 critical 或基本功能壞掉應為 FAIL，只有需修的 warning 可為 PASS-with-fixes。上面三行在你的輸出中各只能出現一次。）
