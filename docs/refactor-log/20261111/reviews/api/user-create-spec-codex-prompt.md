# Codex out-of-band 審查：user-create spec 文字

你是獨立審查者。請以唯讀方式審查下列 spec 文字，不得修改任何檔案、不得 commit。

## 審查對象
- repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-user-create-spec`
- branch：`docs/user-create-spec`
- 送審 sha（head）：`011ef15a1ad00c3cf22f1fcb3573d40615dab7b2`
- base：`67a8aee`（origin/master）
- diff 範圍：只有 `docs/specs/user-create.spec.md`（140 行，含 Owner Decisions OD-UC-1～4）。可用 `git diff 67a8aee 011ef15a1ad00c3cf22f1fcb3573d40615dab7b2` 查看。
- 判決輸出檔名：`user-create-spec-codex-verdict.md`（你最後的回覆會被寫入此檔）

## 重要前提（請嚴格遵守）
- 這是 **spec 起草棒**：只審 spec 文字品質。
- AC 屬後續實作棒（排在 I1 合併之後），**程式尚未實作是預期狀態，不得當成 finding 或 FAIL 理由**。
- Owner Decisions（OD）未裁決也是預期（由 owner 裁決），**不得當成 FAIL 理由**。

## 審查重點
(a) 盤點段是否與 base 程式碼一致：引用的檔案 / 行號 / 現況描述是否正確，涵蓋 `src/modules/users/**`、`openapi.yaml`、權限目錄與 grants 位置、路由與 `permission-structure` 測試計數、`.claude/skills/declare-permission`。請實際打開檔案核對。
(b) AC 是否可驗證、每條都指到具體測試檔或指令，且與設計段一致；是否遺漏 kernel operation 窮舉測試、i18n、core-only。
(c) Touches / Must-Not-Touch 是否完整且不互相矛盾；I1 排程依賴是否寫明。
(d) Owner Decisions 每條是否有選項、後果、建議，且後果描述正確（例：OD-UC-4 關於 `findMockUserByEmail` 的描述，請對照程式碼核實）；有沒有該列 OD 卻被 spec 自行決定的點。
(e) Done Command 是否可執行、有 `expected:`、能在實作後實質驗證 AC。

## 分級規則
- **warning-blocking**：只限會讓後續實作做錯的問題——事實錯誤、AC 不可驗證、與既有 spec（`docs/specs/` 下其他檔）衝突。
- **info**：措辭 / 排版 / 建議補充一律 info。
- 判決：有 warning-blocking → `FAIL`；只有可局部修正的小問題 → `PASS-with-fixes`；無問題或只有 info → `PASS`。

## 輸出格式
1. Findings 清單，每條：嚴重度（warning-blocking / info）、`檔案:行號`、問題描述、依據（你核對的檔案:行號）、建議修法。
2. 最後各以**獨立一行**、行首無任何前綴或 markdown 符號寫出以下三行（每個欄位恰好一行，全文不得在其他地方重複這三個欄位名加冒號的寫法）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL（三選一）
REVIEWED_COMMIT: 011ef15a1ad00c3cf22f1fcb3573d40615dab7b2
REVIEWER: codex-oob
