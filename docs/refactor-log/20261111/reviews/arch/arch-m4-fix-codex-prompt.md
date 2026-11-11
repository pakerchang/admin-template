# Codex 複審：admin-template M4 fix1+fix2（delta review）

你是 out-of-band 審查者。只讀不改：不得修改任何檔案、不得 commit。用繁體中文（zh-TW）輸出。

## 審查對象

- Repo／worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`（你的 cwd）
- Branch：`feat/m4-permission-enforcement`
- 送審 sha：`2988875014dddb51661d2ace59f458066fb52f02`
- 前一輪（FAIL）sha：`acd05c0ff0745b253aa8516fc2da60f99e6c694f`
- M4 base：`refactor/integration` = `3c92e5ab8ec04720cb7d397b2ffc9baaf85635c9`
- 本輪 verdict 檔名：`arch-m4-fix-codex-verdict.md`

## 參考文件（請先讀）

- 前一輪 verdict（C1 可偽造 token；C2 profile 提權；W3 AC-6 與 superadmin 非 GET 覆蓋不足；5 點 spec 問題；自行決定 #2、#4、#9）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m4-codex-verdict.md`
- m4-fix1 報告（`047f401` token、`8395203` profile）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m4-fix1-report.md`
- m4-fix2 報告（`6e30216` 角色 grants、`2988875` spec／CLAUDE.md 同步）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m4-fix2-report.md`

## 既定前提（main 已代 owner 裁決，不必重判政策合理性；只審實作是否忠實、有無新問題）

1. spec 5 點全部核准：
   - login 回應新增 `grants` 為例外；
   - M7 前沿用 legacy 404 body；
   - §4.2／§4.3 照實作改；
   - 舊 session 重新登入一次即可；
   - Touches 補記例外。
2. 角色矩陣：
   - superadmin：`*`
   - admin：`users:read`＋`product:*`＋`orders:*`；**無** `users:update`／`users:update-role`
   - support：`orders:*`
   - partner：`product:*`＋`suppliers:read`＋`tags:read`
   - 重構前沒有權限檢查的頁，所有後台角色至少可讀。

## 審查範圍：delta review

`git diff acd05c0ff0745b253aa8516fc2da60f99e6c694f..2988875014dddb51661d2ace59f458066fb52f02`（四個 commit：`047f401`、`8395203`、`6e30216`、`2988875`）。必要時讀 diff 以外的程式碼來確認呼叫路徑。

逐條判定（每條給「已解決／部分解決／未解決／新問題」與證據 `file:line`）：

a. **C1 token**：token 是否不可預測；是否只接受 `Bearer <已簽發 token>`；所有依 token 查使用者的地方是否都走同一入口 `mockUserOfAuthorization`（grep 全 repo 確認沒有旁路）；有無其他繞過：header 大小寫、多個 Authorization、空 token／只有 `Bearer`、前後空白、session 表污染（例如可由請求寫入 session、登出未清、token 與 user 對應可被覆寫）。
b. **C2 profile**：`/user/me/profile` GET/PUT 是否綁定本人；PUT 白名單是否完整擋掉身分與權限欄位（id、user_id、role、grants、status 等）；`THandlerContext.authorization` 的傳遞有無漏洞（是否所有 handler 都拿得到正確值、有無 handler 仍讀其他來源）。
c. **W3**：superadmin 非 GET 測試是否真的打到 handler（不是只過 guard 或被 mock 掉），斷言是否能區分「handler 執行」與「被擋」。
d. **角色矩陣（`6e30216`）**：是否忠實反映上面 main 裁決；`role-visibility.test.tsx` 的期望值是否與 `6029bf0`（重構前可見範圍依據）一致；若矩陣被改壞（例如 admin 多給 `users:update`、partner 少 `tags:read`、support 多一個 module）測試是否會失敗；修正報告 DECISION D1–D4 的處理是否與 main 裁決一致。
e. **spec／CLAUDE.md（`2988875`）**：改動是否只限 main 核准的幾處；內容是否與實作一致（逐處對照程式碼）。
f. **新問題與逐 commit 可建置性**：修正有沒有引入新問題（回歸、型別漏洞、測試假陽性）；每個 commit 是否能獨立 build+test（修正報告有逐 commit 結果，請核對其可信度；能重跑就重跑）。

## 執行測試

若環境允許，執行：

```
pnpm exec vitest run src/app/mock src/shared/permission
```

read-only sandbox 跑不了就註明原因，**不要當成 finding**。

## 輸出格式

1. 前一輪 finding（C1、C2、W3、5 點 spec 問題、自行決定 #2、#4、#9）的解決狀態表。
2. 本輪 finding 列表，分 critical / warning / info，每條附檔案與行號、問題、建議。
3. 測試執行結果（或無法執行的原因）。
4. 最後**各以獨立一行**輸出以下三行（不加任何 markdown 修飾、前後不加其他字）：

```
REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 2988875014dddb51661d2ace59f458066fb52f02
REVIEWER: codex-oob
```

`REVIEW_VERDICT` 只能三選一：無 critical 且無需修正 → `PASS`；只有 warning/info 需修 → `PASS-with-fixes`；有 critical → `FAIL`。這三行在整份輸出中各只能出現一次（說明格式時不要重複寫出這些行）。
