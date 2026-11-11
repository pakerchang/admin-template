# admin-template M8 out-of-band 審查（Codex，一輪）

你是 out-of-band reviewer。只讀審查，**不得修改任何檔案、不得 commit、不得建立 git worktree**。

## 審查對象
- repo／worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8`（你的 cwd）
- branch：`feat/m8-core-only-verification`
- 送審 sha（head）：`2d1469543c91762af5106d33e9ef88414ada89ac`
- base：`refactor/integration` @ `ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`
- 範圍：`git diff ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74..2d1469543c91762af5106d33e9ef88414ada89ac`（2 個 commit：`74e804b` override／module-removal／core-only 測試；`2d14695` verify-core-only 腳本）
- 實作報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m8-impl-report.md`（請先完整讀）
- spec：worktree 內 `docs/specs/fsd-module-architecture.spec.md` 的 §0、§4.1／§4.3（build 驗證 1.5.x–1.8）、§4.4、§8.1、§8.2、§9 M8
- 輸出 verdict 檔名：`arch-m8-codex-verdict.md`（由 `-o` 寫出，你只需把最終回覆完整輸出）

## 前提一：main 裁決（2026-11-10，視為既定前提）
verify-core-only 在副本內 build 全量；vitest 只跑 core-safe 測試，依 `kind:"domain"` 名單自動排除「domain module 目錄以外、引用 domain module（grep `@/modules/<id>` 或 domain route id）的測試檔」並印出排除清單；**防呆**：排除清單為空或超過總測試檔一半 → 腳本 fail（避免 grep 失效時假綠）。理由：§8.2 意旨是驗證「刪掉 domain 後 app 能 build、core 能跑」。

實作偏離裁決之處（報告「自行決定 1」，待 main 追認，請你專門判定）：除 grep 外另加明列清單 `FULL_INSTALL_TESTS`（7 檔，只斷言完整安裝而沒有 domain 字面），防呆改為「grep 命中 > 0 且排除總數 ≤ 一半」，清單內檔案不存在也 fail。「自行決定 2」：被排除的測試檔在副本內 build 前先刪掉（tsconfig.app.json 含測試檔）。

## 前提二：owner 現行原則（決定嚴重度）
- 每個 milestone **只審一輪**。
- 只有 critical、或會讓 build／test／demo 基本功能壞掉的問題、以及安全漏洞，才會開修正棒。
- 測試強度、文件、spec 文字、mock 限制一律記錄到已知問題後併入（標 warning／info，不擋）。
- 實作與 spec 文字不一致時以 §0 鎖定決策為準；文字差異本身不作為嚴重度依據（記 info）。

## 逐條判定（每條附 `file:line` 證據）
a. AC-1～AC-4 是否成立。AC-4 為 manual，標「待驗」，並判定自動佐證 `core-only.test.tsx` 是否充分。
b. **紅線（最重要）**：`scripts/verify-core-only.sh` 是否在任何路徑（成功、失敗、中斷／SIGINT、`set -e` 提早退出、trap）都不修改原工作目錄與原 repo 的 git 狀態（worktree 清單、config、index、branch）；`git worktree add --detach` 與 trap 清除（含 `git worktree remove`／`prune`）是否可靠、trap 是否在 worktree 建立前就掛上或有遺漏窗口；`pnpm install` 是否可能寫到原 repo 的 `node_modules` 或 lockfile（workspace 解析、`--frozen-lockfile`、store 路徑、cwd）。
c. **假綠風險**：防呆能否真的擋住 grep 失效；`FULL_INSTALL_TESTS` 明列 + grep 的組合會不會把本來該跑的 core 測試排掉、讓「core 能跑」的驗證變空洞（特別是 `build.test.ts` 因 fixture 字串被排除，core-only 下 kernel 單元測試沒跑）；腳本的 build 是否真的是 core-only 狀態的全量 build（tsc + vite，不是只 typecheck 或只跑部分）。
d. `scripts/core-only-strip.ts`：`modules.ts` 行刪除（2×domain 數檢查）是否正確；YAML 刪 tag 與 operation 的正確性（多 tag operation、共用 schema）；刪最後一個 `.use()` 連分號一起刪的 ASI 依賴是否安全。
e. AC-2 override 測試是否真的證明「覆寫頁與預設頁同 query key、同資料」；AC-3 兩條 throw 是否對應 §4.3 的 requires 與 1.5.3。
f. 報告的「自行決定」5 項、「spec 差異」4 項、「已知問題」逐條判定；其中自行決定 1 偏離 main 裁決：是否合理、是否該照裁決原文改。
g. 每個 commit 能否獨立 lint+build+test（commit 1 `74e804b` 未單獨 checkout 重跑；read-only 下以靜態推理判斷，例如 commit 1 是否引用了只在 commit 2 才出現的檔案）。

## 執行
- 能跑就執行 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 與 `pnpm exec vitest run`，回報 exit code 與摘要。
- **不要跑** `scripts/verify-core-only.sh`（會建 worktree，read-only sandbox 不適用）。
- 指令因 sandbox 跑不了就註明「未執行 + 原因」，不要當 finding。

## 輸出格式
1. 逐條判定 a–g。
2. Findings 清單：每條 `[critical|warning|info] file:line — 描述`，並標 `BASIC-BREAK: yes|no`（yes = 會讓 build／test／demo 基本功能壞掉或屬安全漏洞）。
3. 最後**各以獨立一行**、恰好一次、不加 markdown 修飾地寫出：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 2d1469543c91762af5106d33e9ef88414ada89ac
REVIEWER: codex-oob

（REVIEW_VERDICT 只能三選一填一個值。判準：有 BASIC-BREAK=yes 的 finding → FAIL；只有不擋的 warning 但建議修 → PASS-with-fixes；否則 PASS。）
