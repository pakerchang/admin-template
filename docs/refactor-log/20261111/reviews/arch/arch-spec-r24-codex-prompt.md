# Codex out-of-band 審查：admin-template FSD 架構 spec（R24 修正）

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`ba1976f3f144721a61e67113a4d132f099b1821b`，base：`master`
- 你的輸出會原樣存成 verdict 檔 `arch-spec-r24-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff master...ba1976f3f144721a61e67113a4d132f099b1821b
```

diff 只含 `docs/specs/fsd-module-architecture.spec.md`。**重點看本輪增量**：

```
git diff 7f3a795 ba1976f
```

上一輪 Codex 對 `7f3a795` 判 PASS-with-fixes，提出兩條 warning：
- W1：R24 只拒絕「同源根目錄」，apiBaseUrl 設成同源非根路徑（例如 `location.origin + '/api'`）時不報錯，但 `/users`、`/user`、`/admin` 等其他前綴會落在 mock 攔截範圍外而被放行 → fail-closed 漏洞。
- W2：§10.2「無未決項」因 W1 而不成立。

`ba1976f` 是針對 W1、W2 的修正。審查以 ba1976f 版本為準；驗證 anchor 時用 `git show master:<path>` 讀 master 上的檔案。

## 參考資料（唯讀）
- 上一輪 verdict：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-spec-rulings-codex-verdict.md`
- Owner 裁決全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/inbox.md`，看最後一段第 2 項（mock 模式用「專用」絕對 origin）。

## Rubric
(a) 上一輪 W1、W2 是否確實關閉：
  - R24、§6.5 `startMockWorker`、M3 AC-7 是否都改成「拒絕任何同源」，且 AC 含同源非根路徑的負例；
  - §10.1、§11 有沒有殘留與「拒絕任何同源」矛盾的寫法（例如仍只提「同源根目錄」）；
  - §10.2「無未決項」現在是否成立。
(b)「拒絕任何同源」是否忠實落實 owner「專用絕對 origin」的裁決，有沒有超出裁決範圍（例如動到既有 API 路徑、新增 owner 沒要求的限制）。
(c) 先前已 PASS 的內容有沒有被本輪改壞（新矛盾、刪掉的必要內容、跨段引用斷裂）。
(d) 相關 AC 與 done command 是否可執行（檢查 package.json scripts、檔案路徑存在或會被該 milestone 建立、指令語法）。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，並附 spec 行號（以 ba1976f 版本 `docs/specs/fsd-module-architecture.spec.md` 的行號為準），說明問題與證據。
- 對 rubric (a) 的 W1、W2 各給 closed / partial / open 與行號。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: ba1976f3f144721a61e67113a4d132f099b1821b
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
