# Codex 複審（delta review）：admin-template M3 fix3

你是 out-of-band reviewer。只讀，不改任何檔案、不 commit。

## 對象
- Repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`
- Branch：`feat/m3-module-wiring`
- 送審 sha：`8458b19f7dce8be49c92184596d94e5f6014b3cb`
- 前一輪送審 sha：`edfd74d2c423e438416383741fdbb273cc0f6ff5`（判 PASS-with-fixes）
- 本輪 verdict 檔名：`arch-m3-fix3-codex-verdict.md`
- 前一輪 verdict 全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m3-rebase-codex-verdict.md`
- 修正棒報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m3-fix3-report.md`

## 審查範圍（delta review）
只看 `git diff edfd74d..8458b19`（僅 `src/app/__tests__/router-matching.test.ts`），必要時讀相關原始碼（`src/app/core.ts`、auth session / guard 相關檔）以判斷。

前一輪 warning：auth 測試注入 `isAuthenticated`，未驗 `setAuth/clearAuth → getAuth → createCore → guard` 整條接線；已登入案例缺最終 pathname 斷言。

請判定此 warning 是否已解決，逐項回答：
1. 新測試是否走預設 `createCore()`（未注入 `isAuthenticated`）與真實 `setAuth`／`clearAuth`？
2. 是否斷言最終 pathname（未登入 → `/login`，已登入 → `/users`）？
3. session 清理（如 `afterEach`/`beforeEach` 的 `clearAuth`、storage 重置）是否避免污染其他測試？
4. 若 `core.ts` 錯接（例如 `isAuthenticated` 不讀 `getAuth`、或恆回 true/false），新測試是否真的會失敗？請具體推演。
5. 有沒有引入新問題（flaky、非同步未 await、全域狀態外洩等）？

前一輪 info（中間 commit bisect 限制）已由 main 裁決接受，不必再列。

## 測試
能跑的話執行：`pnpm exec vitest run src/app/__tests__/router-matching.test.ts`。read-only sandbox 跑不了就註明「未執行 + 原因」，不要把它當 finding。

## 輸出格式
- Finding 逐條：嚴重度（critical / warning / info）、`檔案:行號`、描述、建議。無 finding 就寫「無」。
- 前一輪 warning 的解決狀態（已解決／部分／未解決 + 理由）。
- 最後**各以獨立一行**輸出以下三行（恰好各一次，不要放在 code block 或句中）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 8458b19f7dce8be49c92184596d94e5f6014b3cb
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只寫三擇一的其中一個值。）
