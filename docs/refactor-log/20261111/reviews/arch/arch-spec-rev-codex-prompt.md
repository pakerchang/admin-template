# Codex out-of-band review：admin-template FSD 架構 spec

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`0e7b65bc51986d8df2be4e06513e5a9b44c052a2`，base：`master`
- 你的輸出會原樣存成 verdict 檔 `arch-spec-rev-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff master...0e7b65bc51986d8df2be4e06513e5a9b44c052a2
```

diff 只含 `docs/specs/fsd-module-architecture.spec.md`（148a9b9 初版、0e7b65b 改為 Microkernel + Modular Monolith 修訂版）。審查以 0e7b65b 版本的 spec 為準；驗證 anchor 時用 `git show master:<path>` 讀 master 上的檔案。

## Owner 裁決（比對基準）
上一份 inbox 裁決全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/inbox.md`。請完整閱讀，重點包含：Microkernel + Modular Monolith 目錄樹、OQ-1 到 OQ-8 的裁決、MSW + orval、`requires`、內容區 403、ABAC 只列選項不定案、M0 前置。

## Rubric
1. spec 與 owner 裁決是否一致（上列每一項逐條比對；目錄樹逐節點比對）。
2. D1–D5（spec 內的鎖定決策）有沒有被 spec 其他段落違反。
3. 每個 milestone 能否獨立 merge；AC 是否可驗；done command 能否在 repo 實際執行（檢查 package.json scripts、檔案路徑是否存在或會被該 milestone 建立）。
4. spec 內的 `file:line` anchor 在 master 上是否成立（實際打開檢查行號與內容）。
5. 型別草案內部是否自洽（命名、欄位、泛型、跨段引用一致）。
6. 有沒有 spec 自行擇一、但沒 surface 給 owner 的地方（尤其 ABAC 必須只列選項不定案）。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，並附 spec 行號（以 0e7b65b 版本 `docs/specs/fsd-module-architecture.spec.md` 的行號為準），說明問題與證據。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 0e7b65bc51986d8df2be4e06513e5a9b44c052a2
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
