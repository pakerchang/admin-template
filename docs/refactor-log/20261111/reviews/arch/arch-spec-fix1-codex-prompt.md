# Codex out-of-band 重審：admin-template FSD 架構 spec（fix1）

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`44f52cc9ddcde816730cdd14e7ae0763b26dccf9`，base：`master`
- 你的輸出會原樣存成 verdict 檔 `arch-spec-fix1-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff master...44f52cc9ddcde816730cdd14e7ae0763b26dccf9
```

diff 只含 `docs/specs/fsd-module-architecture.spec.md`。需要看本輪修正差異時，另執行：

```
git diff 0e7b65b 44f52cc
```

審查以 44f52cc 版本的 spec 為準；驗證 anchor 時用 `git show master:<path>` 讀 master 上的檔案。

## 參考資料（唯讀）
- 上一輪 Codex verdict（對 0e7b65b 判 FAIL，含 C1、C2、W1–W4）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-spec-rev-codex-verdict.md`。上一輪 finding 依出現順序編號：C1 = API 權限中間格式（OperationPermissions / OperationRoute[] / routes 未定義）；C2 = `guardedRoute` 在 shared 使用 app 的 `ForbiddenBoundary`（shared → app）；W1 = api PoC 已知限制未納入（handler status 固定 200、MSW 3 `onUnhandledFrame`、fetch mutator unwrap）；W2 = M3 AC-1 `grep -c` 無法計 10 個 `.use()`；W3 = page-id 收集方式授權實作者擇一、擴張 D2；W4 = module i18n 資料形狀衝突（`orders.orders.*`）。
- Owner 裁決全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/inbox.md`（含 api 追加、裁決 4、裁決 5；**裁決 5 覆蓋裁決 4 的 OQ-9**）。請完整閱讀。
- api PoC 報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-orval-report.md`、`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-module-split-report.md`。

## Rubric
(a) 上一輪 C1、C2、W1–W4 是否逐條確實修好（逐條給 closed / partially / open 與證據行號）。
(b) spec 與 inbox 全部裁決是否一致，包括裁決 5 的單一 `openapi.yaml`、目錄修正、`operations.gen.ts`、ABAC=C、OQ-11 到 OQ-14。目錄樹逐節點比對。
(c) D1–D5（spec 內鎖定決策）有沒有被 spec 其他段落違反。
(d) 每個 milestone 能否獨立 merge；AC 是否可驗；done command 能否在 repo 實際執行（檢查 package.json scripts、檔案路徑存在或會被該 milestone 建立）。
(e) spec 內 `file:line` anchor 在 master 上是否成立；型別草案是否自洽（命名、欄位、泛型、跨段引用一致）；有沒有新引入的矛盾。
(f) 修正棒自己 surface 的三點——OQ-15 core tag、§11.2 權限來源 R11 對比裁決 5、route id 用 `${moduleId}.${name}` 的解讀——有沒有正確標為「待 owner 裁」，而不是在正文被當成已定案執行。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，並附 spec 行號（以 44f52cc 版本 `docs/specs/fsd-module-architecture.spec.md` 的行號為準），說明問題與證據。
- 接著列上一輪 C1、C2、W1–W4 的關閉狀態。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 44f52cc9ddcde816730cdd14e7ae0763b26dccf9
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
