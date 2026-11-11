# Codex out-of-band 審查：admin-template M4（permission enforcement）

你是獨立審查者。只讀，不改任何檔案，不 commit。不要預設任何結論；所有判定都要附檔案:行號或指令輸出作為依據。

## 審查對象
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`（branch `feat/m4-permission-enforcement`，本地未 push）
- 送審 sha：`acd05c0ff0745b253aa8516fc2da60f99e6c694f`
- base：`3c92e5ab8ec04720cb7d397b2ffc9baaf85635c9`（`refactor/integration`，M3 + deps P4 Zod 4）
- 審查範圍：`git diff 3c92e5a..acd05c0`（5 個 commit：`git log --oneline 3c92e5a..acd05c0`）
- verdict 檔名：`arch-m4-codex-verdict.md`

## 依據文件（請先讀）
- spec：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4/docs/specs/fsd-module-architecture.spec.md`
  - §9 M4（AC-1 路徑已依 main 核准改為 `/users`），以及其引用的 §3.1、§4、§6.1–§6.5、R10、R19、R22–R25、R29、§11.1
- 實作棒報告（AC 證據、M3 過渡項收尾、7 項破壞性驗證、14 項自行決定、5 處 spec 模糊或矛盾）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m4-impl-report.md`
- rebase 報告（5 個 commit range-diff、逐 commit build+test 結果）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m4-rebase-report.md`

報告是實作方自述，請以 diff 與實測為準逐條核對，不要直接採信。

## 要審的項目

1. **AC 逐條**：對照 spec §9 M4 的每一條 AC，判定 diff 是否確實滿足（滿足 / 部分 / 未滿足 + 依據）。
2. **Touches／Must-Not-Touch**：diff 是否只動 M4 Touches 允許的範圍；有無碰到 Must-Not-Touch。
3. **行為紅線**（任一違反即為 critical）：
   - superadmin 可見範圍不得縮減；
   - 不得新增 `/403` route；
   - URL、route id、i18n key、mock API 路徑與既有回應 body 不變。
4. **安全性與 fail-closed**：
   - guard 對「未宣告權限的 route／API」「未帶 token」「偽造或竄改 token」的行為；
   - `sessionGrants()` 缺 `app:access` 時的處理；
   - `useCan`、nav、rowActions 在沒有 provider 時是否一律拒絕；
   - 權限字串比對：wildcard 規則、`resource:action` 是否完整比對，有無前綴／子字串／大小寫／分隔符等繞過。
5. **行為變更**：
   - support／partner 由「進不了後台」變成「可進後台、只看有權限的部分」是否符合 spec（R10、§6.1）；
   - 舊 session（沒有 `grants` 欄位）升級後的處理是否可接受（是否 fail-closed、使用者體驗是否有卡死或靜默提權）。
6. **實作報告「自行決定」1–14**：逐條判定「合理」或「需修正」，附理由。
7. **實作報告「spec 模糊或矛盾處」5 點**：逐條判定實作方的處理是否恰當，以及是否應升報 owner 裁決。
8. **測試有效性**：測試是否真的會在對應實作被改壞時失敗（不只是存在）；指出哪些關鍵行為沒有會失敗的測試。可對照實作報告的 7 項破壞性驗證核對其可信度。
9. **逐 commit 可獨立 build+test**：依 rebase 報告的逐 commit 結果核對；能的話抽查。

## 執行
- 若環境允許，在 worktree 內執行 `pnpm exec vitest run` 並引用結果摘要。read-only sandbox 跑不了就在輸出中註明「未執行 + 原因」，**不要當成 finding**。

## 輸出格式
- Findings：每條標 `critical` / `warning` / `info`，附 `檔案:行號` 與具體失敗情境。
- 「自行決定」1–14 的逐條判定；「spec 模糊或矛盾處」5 點的逐條判定。
- 結尾**各以獨立一行**輸出以下三行（行首不加任何符號、冒號後一個空格）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: acd05c0ff0745b253aa8516fc2da60f99e6c694f
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只能三選一填一個值；有 critical 應為 FAIL，只有 warning 需修可為 PASS-with-fixes。上面三行在你的輸出中各只能出現一次。）
