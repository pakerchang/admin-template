# Codex out-of-band 審查：admin-template FSD 架構 spec（owner 裁決寫回）

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`7f3a795de5ed768a461549052122d5f4b46927dd`，base：`master`
- 你的輸出會原樣存成 verdict 檔 `arch-spec-rulings-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff master...7f3a795de5ed768a461549052122d5f4b46927dd
```

diff 只含 `docs/specs/fsd-module-architecture.spec.md`。**重點看本輪增量**：

```
git diff 07dcae4 7f3a795
```

前一版 `07dcae4` 已獲 Codex PASS 且 owner 已確認定案；`7f3a795` 只應把 owner 對 7 項待裁的定案寫回 spec（新增 §0.6，R23–R29）。審查以 7f3a795 版本為準；驗證 anchor 時用 `git show master:<path>` 讀 master 上的檔案。

## 參考資料（唯讀）
- Owner 裁決全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/inbox.md`，看最後一段「修訂版 spec 定案 + 7 項待裁」。
- 前一版 PASS verdict：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-spec-fix2-codex-verdict.md`。

## Rubric
(a) 7 項定案是否忠實、完整寫回，且沒有超出裁決範圍：
  1. OQ-16 = `${moduleId}.${name}` typed key；
  2. mock 模式用專用絕對 origin；未設定或設成同源根目錄時報錯；不動既有 API 路徑；
  3. 未帶 token 回 403；
  4. `getGrants + can()`；
  5. R21 分兩期，並擋非 public 的 `security: []`；
  6. M3 全 public / M4 fail-closed；
  7. `/admin/images` 歸 `core` tag。
(b) 先前 PASS 的內容（07dcae4）有沒有被本輪改壞（新矛盾、刪掉的必要內容、跨段引用斷裂）。
(c) spec 實測 master 的 API 前綴是 `/api`、`/users`、`/user`、`/admin` 四個（inbox 只列三個）。請驗證此實測是否正確：`git show master:src/services/mock/handlers.ts`、`git show master:src/services/api-client.ts`（必要時 grep 其他 master 檔案）。
(d) 寫回棒自己提出的邊界：apiBaseUrl 設成「同源 + 非根路徑」（例如 `location.origin + /api`）時不會報錯，但其他前綴（`/users`、`/user`、`/admin`）會落在攔截範圍外而被放行。判斷這是否構成 fail-closed 漏洞，以及 spec 是否應把它列為待 owner 裁的事項（或已經這麼做）。
(e) 新增的 M3 AC-7 等 AC 與 done command 是否可執行（檢查 package.json scripts、檔案路徑存在或會被該 milestone 建立、指令語法）。
(f) §10.2 宣稱「無未決項」是否成立（對照 (d) 及任何你發現的未定案事項）。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，並附 spec 行號（以 7f3a795 版本 `docs/specs/fsd-module-architecture.spec.md` 的行號為準），說明問題與證據。
- 對 rubric (a) 的 7 項逐條給 faithful / partial / missing / over-scope 與行號；(c) 給實測結論與證據。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 7f3a795de5ed768a461549052122d5f4b46927dd
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
