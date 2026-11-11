Critical：none。

Warning：

- `src/app/__tests__/fixture.tsx:31–34`、`src/app/__tests__/app-wiring.test.tsx:97–107`：刪除舊測試後，auth 覆蓋並非完全等價。新測試共用 production 的 router builder 與 protected guard，但覆寫 `isAuthenticated`，因此不再驗證 `setAuth/clearAuth → getAuth → createCore → guard` 整條接線；即使 `src/app/core.ts:19` 錯接，仍可能通過。已登入案例也僅斷言 Stub 出現，未保留原本載入完成後 pathname 等於 `/users` 的斷言。建議補上使用預設 `createCore()`、真實 session 狀態的兩條 `/users` 測試，並明確斷言最終 pathname。

Info：

- `509dc96:src/router/__tests__/routes.test.ts:4`：中間四個 commit 引用已刪除的 routes，會破壞逐 commit 測試與 bisect。這是歷史整理問題，非最終 head 回歸；squash merge 可接受。若保留各 commit，建議把測試移植併入 `509dc96`。

其餘查核結果：

- **a 通過**：range-diff 中五個舊 commit 除作者外，唯一實質差異是刪除 `routes.tsx` 時納入上游 pathless hotfix 的內容；沒有其他 patch 差異。
- **b 部分通過**：五組路徑的 root、protected parent、leaf 斷言，以及 `/orders/9` 的完整 `{ id: "9" }` params 斷言均逐字等強度移植至 `router-matching.test.ts:11–25`。未登入 `/tags` 使用相同 protected guard，足以測 guard 分支；但完整 auth 接線及 `/users` 最終位置的覆蓋缺口如上。
- **c 靜態通過**：`vite.config.ts:14–19` 同時保留 P3 environment/setup 與 M3 mock origin。未見 skip/todo/only；jest-dom 的 Vitest matcher 註冊與型別擴充、`vitest/runtime` environment exports 均可在已安裝套件核對。未發現 M3 使用失效 API。

行為驗證**未執行**：`pnpm exec vitest run src/app` 在啟動 Vitest 前，因唯讀 sandbox 禁止建立工作目錄 `_tmp_*`，以 `EPERM`、exit 1 結束。此限制不列 finding。

未修改檔案、未 commit；依只讀要求，未建立 `arch-m3-rebase-codex-verdict.md`。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: edfd74d2c423e438416383741fdbb273cc0f6ff5
REVIEWER: codex-oob