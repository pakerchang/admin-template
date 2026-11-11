# Codex out-of-band 審查：admin-template user-create spec（r2 重審）

你是獨立審查者。只讀、不改任何檔案、不 commit。

## 送審對象
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-user-create-spec`
- branch：`docs/user-create-spec`
- 送審 sha：`929b700fde6ea687ea1185813945a1d7711bdb1f`
- base：`67a8aee`（origin/master）
- diff 只有 `docs/specs/user-create.spec.md`（含 Owner Decisions OD-UC-1～4）。看 `git diff 67a8aee..929b700fde6ea687ea1185813945a1d7711bdb1f`。
- 你的輸出會寫入 verdict 檔 `user-create-spec-r2-codex-verdict.md`。

## 審查範圍說明（重要）
這是 **spec 起草棒**：只審 spec 文字品質。AC 屬後續實作棒（排在 I1 合併之後），**程式尚未實作是預期狀態，不得當成 finding 或 FAIL 理由**；OD 未裁決也是預期，不得當成 FAIL 理由。本輪 OD-UC-1～4 已由 main 代裁為全 A，不是待決項。

## 本輪重點（r2 重審）
`32c218c..929b700` 只改 `docs/specs/user-create.spec.md`（`git diff 32c218c..929b700fde6ea687ea1185813945a1d7711bdb1f`）。請確認上一輪 verdict
（`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/reviews/user-create-spec-r1-codex-verdict.md`）的：
- warning-blocking：`remark` 選填與共用 `userSchema` 必填矛盾 —— 是否已正確修正；
- info：login 精確比對說明 —— 是否已補清楚；
且修正沒有引入新的矛盾。

## 審查重點
(a) 盤點段是否與 base 程式碼一致（引用的檔案 / 行號 / 現況描述是否正確：`src/modules/users/**`、`openapi.yaml`、權限目錄與 grants 位置、路由與 `permission-structure` 測試計數、`.claude/skills/declare-permission`）；
(b) AC 是否可驗證、每條都指到具體測試檔或指令，且與設計段一致；是否遺漏 kernel operation 窮舉測試、i18n、core-only；
(c) Touches / Must-Not-Touch 是否完整且不互相矛盾；I1 排程依賴是否寫明；
(d) Owner Decisions 每條是否有選項、後果、建議，且後果描述正確（例：OD-UC-4 關於 `findMockUserByEmail` 的描述）；有沒有該列 OD 卻被 spec 自行決定的點；
(e) Done Command 是否可執行、有 `expected:`、能在實作後實質驗證 AC。

## 分級規則
只有會讓後續實作做錯（事實錯誤、AC 不可驗證、與既有 spec 衝突）的問題標 **warning-blocking**；措辭 / 排版 / 建議補充一律 **info**。

## 輸出格式
逐條列 finding：嚴重度、`檔案:行號`、問題、建議。最後各以獨立一行（行首即欄位名，不加 markdown 修飾、不加引號）輸出：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 929b700fde6ea687ea1185813945a1d7711bdb1f
REVIEWER: codex-oob

（REVIEW_VERDICT 三選一；無 warning-blocking 時不得 FAIL。三行各只能出現一次。）
