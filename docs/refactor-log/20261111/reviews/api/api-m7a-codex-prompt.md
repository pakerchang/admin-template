# Codex out-of-band review — admin-template M7a（OpenAPI 契約 + extract）

你是獨立審查者。只讀，不改任何檔案，不 commit。

## 審查對象
- Repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-m7a`
- Branch：`feat/m7a-openapi-contract`
- 送審 sha：`571d1af20696d32bed1bee10fd6bdd3a4009c747`（未 push）
- Base：`ec5a55f`（`ec5a55fe8707941ae1639662c72c0e00629513da`，refactor/integration）
- 審查範圍：`git diff ec5a55f..571d1af`
- 判決輸出檔名：`api-m7a-codex-verdict.md`（你的最終訊息會被寫入此檔）

## 規格
arch spec §4.5（API 層）、§6.5、§9 M7 的 AC-2，以及 §0.4–0.6 的 R14、R21、R27、R29、§11 的 K5、K7。在 worktree 內執行：

```
git show origin/docs/refactor-specs:docs/specs/refactor/fsd-module-architecture.m3-revision.spec.md
```

## 本棒範圍（M7a）
repo 根 `openapi.yaml`；`scripts/extract-operations.ts`；`scripts/__tests__/**`；repo 根 `orval.config.ts`（只寫檔不跑 gen）；`package.json` devDeps（orval、yaml、tsx）與 `gen:api:extract` script。

**不在範圍內（M7b，不得列為 finding）**：orval 產物、`src/modules/**`、fetcher mutator、刪 adapter / apiFetch、AC-1 / 3 / 4 / 5 / 6 / 7。

實作方自報偏離（請判斷是否可接受）：extract 輸出與現行 `src/app/operations.gen.ts` 不逐字相同（現行檔用 `crud()` helper 手寫），故未覆蓋該檔，只做資料比對；`scripts/**` 與 `orval.config.ts` 不在 `pnpm build` 的 tsc 範圍，也不在 lint 範圍。

## 審查重點
(a) AC-2 每一條負例都有 fixture 和測試，而且測試真的以子行程跑 extract、斷言 exit 1 並指名 operation：0 或 2 個 tag、tag 不在清單、operationId 重複、缺 `x-permission`、格式錯（`orders`、`orders:*`）、public 缺 `security: []`、非 public 卻有 `security: []`。
(b) extract 沒有做權限目錄比對（R27）；`{id}` 有轉成 `:id`；輸出形狀符合 `TOperationTable`。
(c) 一致性比對測試是否真的比到 routes（method + path + operationId）與 permissions 的每一個值，而不是只比 key 數量。
(d) `openapi.yaml` 的路徑與回應形狀是否與現行 mock handlers 一致（行為紅線）；`/admin/images` 是否歸保留 tag `core`（R29）。
(e) `orval.config.ts` 是否符合 §4.5 orval config 列（跳過 `core`、`mode: single`、`clean: true`、mutator 路徑）。
(f) diff 沒有碰 `src/**`（`git diff --name-status ec5a55f..571d1af -- src` 應為空），也沒有升級任何既有依賴版本（檢查 `package.json` 與 `pnpm-lock.yaml` 中既有套件版本）。

能跑的話執行 `pnpm exec vitest run scripts`；若 read-only sandbox 跑不了，請註明「未執行 + 原因」，**不要當成 finding**。

## 分級規則（owner 指示，必須照做）
- 只有 critical，或會讓 build / test / demo 基本功能壞掉的問題，才標 `critical` 或 `warning-blocking`。
- mock 端的安全性、測試強度、命名 / 文件、spec 文字瑕疵一律標 `info`（只記錄）。
- M7b 範圍的項目不得列為 finding。
- 判決：有 critical → `FAIL`；只有 warning-blocking → `PASS-with-fixes`；只有 info 或無 finding → `PASS`。

## 輸出格式
1. Finding 清單：每條含嚴重度、`檔案:行號`、描述、建議修正。
2. 測試執行結果（或未執行原因）。
3. 最後**各以獨立一行**寫出以下三行（不加粗、不放 code block、不加前綴符號）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 571d1af20696d32bed1bee10fd6bdd3a4009c747
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只能三選一寫一個值。）
