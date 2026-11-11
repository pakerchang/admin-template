# Codex 審查：admin-template M7b（orval 產生 client 與 MSW handlers）

你是 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 審查對象
- repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-m7b`
- branch：`feat/m7b-orval-gen`
- 送審 sha：`ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`
- base：`60ff9c2`
- 審查範圍：`git diff 60ff9c2..ca6b62f`
- verdict 檔名：`api-m7b-codex-verdict.md`（你的最終輸出會被寫入此檔）
- 規格：worktree 內 `docs/specs/fsd-module-architecture.spec.md`，重點 §0.4–0.6（R14、R18、R21、R27、R29）、§4.5、§5.2、§6.5、§9 M7（AC-1..7）、§11 K1–K8。
- 實作棒交付報告（請先讀，內含 8 條 DECISION 與未做項）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/reviews/m7b-impl-report.md`
  請逐條評估 8 條 DECISION 是否違反 spec 或破壞行為。

本棒是 M7b：AC-1、AC-3、AC-4、AC-5、AC-6，以及 mock 404 body 改為 `not found: no operation for …`。AC-2 已於 M7a 完成；AC-7 是 `[manual]` 瀏覽器驗收，不在範圍內，**不得列為 finding**。

產物檔（`src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`）量大，抽查即可；重點放在手寫碼。

## 審查重點
(a) **行為紅線**：各 module `model/use-*.ts` 改用 orval client 後，路徑、HTTP method、query 參數、回應形狀、錯誤處理（toast / 回 null）、queryKey 與 invalidation 是否與 base `60ff9c2` 相同；login、列表、CRUD、403 流程是否可能壞掉。請對照 base 版本逐 module 比對。
(b) **AC-4**：`src/shared/api/fetcher.ts` 作為 orval mutator 是否回 body、非 2xx throw、queryKey 不含 origin；DECISION 1（不剝 `ApiEnvelope.data`）是否與 spec AC-4 相容。
(c) **AC-3**：`build()` 以 10 個 modules 成功；`orders:typo` 在 build / vitest 期 throw，且測試真的觸發（不是空測或被 skip）。
(d) **AC-5**：legacy adapter 與 `apiFetch` 已從正式碼刪除，`src/test/api-fetch.ts` 只被測試引用；MSW handlers 是 `HttpHandler[]` 並排在 kernel `http.all('*')` guard 之後；手寫非 200 handler 排在 orval handler 之前；統一 delay 不影響 guard 的 403 / 404。
(e) **AC-1**：`gen:api` 可重跑且無 diff（read-only 下無法重跑就以設定與產物一致性靜態判斷並註明）；`operations.gen.ts` 資料未變；eslint 只對產物關 `import/order`，沒有關 boundaries。
(f) 新增 `@faker-js/faker` 放 dependencies：是否會讓非 mock 的正式 bundle 引入 faker 或 mock 程式（看 `src/app/mock` 的動態載入與 `VITE_API_MOCK` gating）；有沒有升級任何既有依賴版本（`git diff 60ff9c2..ca6b62f -- package.json`）。

## 分級規則（owner 指示，必須照做）
- 只有以下情況可標 **critical** 或 **warning-blocking**：會讓 build / test / demo 基本功能壞掉（頁面打不開、登入 / CRUD / 導航壞、資料錯）的問題，或真實安全漏洞。
- 以下一律標 **info**：mock 端的安全性、測試強度、命名 / 文件、spec 文字瑕疵、交付報告已列的未做項。
- 判決：有 critical 或 warning-blocking → `FAIL` 或 `PASS-with-fixes`（依嚴重度）；僅 info → `PASS`。

## 執行
- 能跑就執行 `pnpm exec vitest run`；若 read-only sandbox 跑不了，註明原因即可，不要當 finding。

## 輸出格式
- 每條 finding：嚴重度（critical / warning-blocking / info）、`檔案:行號`、問題描述、為何是這個嚴重度。
- 對 8 條 DECISION 各給一句評估。
- 輸出最後**各以獨立一行**寫出以下三行（冒號後一個空格，不要加粗、不要放進 code block、不要重複）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL（擇一）
REVIEWED_COMMIT: ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74
REVIEWER: codex-oob
