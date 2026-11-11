# Codex delta review：admin-template M3 rebase 後 head

你是 out-of-band reviewer。只讀不改：不修改任何檔案、不 commit。工作目錄：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`（branch `feat/m3-module-wiring`）。

## 對象
- 送審 sha：`edfd74d2c423e438416383741fdbb273cc0f6ff5`
- 新 base（`refactor/integration`）：`f864fc608dd98a422f88ad15ff8d9b004531731d`
- rebase 前已 Codex PASS 的 sha：`03acca96840512a59ab30498db25c757835cb73f`（舊 base `9597b186c61c17c847a089e6bf59814faadadcc5`）
- 上一輪 PASS verdict：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m3-fix2-codex-verdict.md`
- rebase 報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m3-rebase-report.md`
- 本輪 verdict 檔名：`arch-m3-rebase-codex-verdict.md`
- integration 上 M3 之前新進：router hotfix `f59e62b`（pathless protected route + `src/router/__tests__/routes.test.ts` 回歸測試）、deps P3 `f864fc6`（Vitest 5、jest-dom 7）。

## 範圍：delta review（不要重審整個 M3；舊 M3 內容已 PASS）
a. `git range-diff 9597b18..03acca9 f864fc6..edfd74d`：確認 5 個舊 commit 除作者/日期外，唯一實質差異是 `routes.tsx` modify/delete 衝突取「刪除」。任何其他 patch 差異都要列出並判斷。
b. 新增 commit `edfd74d`（`git show edfd74d`）：對照 hotfix 回歸測試 `git show f59e62b:src/router/__tests__/routes.test.ts` 的**每一條斷言**，確認在新測試或既有 M3 測試中有等價覆蓋，特別是：未登入導向 `/login`、已登入停在 `/users`、`/orders/9` params 解析。判斷等價性是否真的成立（同一 router 組裝路徑？同一 guard？斷言強度是否降低？），刪除舊測試是否遺漏任何情境。
c. M3 × P3 交會：`vite.config.ts` 合併結果、`src/test/setup.ts`、`src/test/jsdom-node-abort.env.ts`（P3 改過）下 M3 的測試是否仍有效（不是空轉/被跳過）；M3 有無依賴 P3 改掉的 API（例如 jest-dom matcher 型別、Vitest 4→5 行為差異）。
d. 中間 commit `509dc96..2aae3e6` 單獨 checkout 時測試會壞（舊回歸測試 import 已刪檔）。判斷這是否值得列 finding（bisect 可用性 vs. 將合併方式），以及合理處理方式（例如 squash merge 即可接受、或把 port 測試併入 509dc96）。

## 驗證
可執行時跑 `pnpm exec vitest run src/app`（及必要時 `pnpm exec vitest run src/router`），記錄結果。read-only sandbox 跑不了就註明「未執行 + 原因」，**不要當 finding**。

## 輸出格式
- Findings 分 critical / warning / info，每條附 `檔案:行號` 與理由；無 finding 就寫 none。
- 最後各以**獨立一行**輸出（字面、各恰一次）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: edfd74d2c423e438416383741fdbb273cc0f6ff5
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只能三選一，例如 `REVIEW_VERDICT: PASS`。）
