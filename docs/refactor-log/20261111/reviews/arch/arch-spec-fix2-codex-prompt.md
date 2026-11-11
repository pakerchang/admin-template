# Codex out-of-band 重審：admin-template FSD 架構 spec（fix2）

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`07dcae4c9f56e1cba548aa21ddee835ae63dddd7`，base：`master`
- 你的輸出會原樣存成 verdict 檔 `arch-spec-fix2-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff master...07dcae4c9f56e1cba548aa21ddee835ae63dddd7
```

diff 只含 `docs/specs/fsd-module-architecture.spec.md`。需要看本輪修正差異時，另執行：

```
git diff 44f52cc 07dcae4
```

審查以 07dcae4 版本的 spec 為準；驗證 anchor 時用 `git show master:<path>` 讀 master 上的檔案。

## 參考資料（唯讀）
- 上一輪 Codex verdict（對 44f52cc 判 FAIL，finding 1–5）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-spec-fix1-codex-verdict.md`。finding 依出現順序編號：1 = 裁決 6 未落實；2 = a3 guard 規則；3 = route composition 依賴方向；4 = route id 格式；5 = page route 的 routeId 必填。
- 更早一輪 verdict（對 0e7b65b，C1、C2、W1–W4，已於上一輪判 closed）：同目錄 `arch-spec-rev-codex-verdict.md`。C1 = API 權限中間格式；C2 = guardedRoute shared → app 依賴；W1 = api PoC 已知限制；W2 = M3 AC-1 `grep -c`；W3 = page-id 收集方式擇一；W4 = module i18n 資料形狀。
- Owner 裁決全文：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/inbox.md`（含 api 追加、裁決 4、裁決 5、裁決 6；**裁決 5 覆蓋裁決 4 的 OQ-9**）。請完整閱讀。
- api PoC 報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-orval-report.md`、`.../chains/api/poc-module-split-report.md`、`.../chains/api/poc-guard-fail-closed-report.md`（a3 guard 規則；`...` = 同一個 scratchpad 根 `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad`）。

## Rubric
(a) 上一輪 finding 1–5 是否逐條確實修好（逐條給 closed / partially / open 與證據行號）；前一輪已 closed 的 C1、C2、W1–W4 有沒有被改壞。
(b) spec 與 inbox 全部裁決是否一致：裁決 5 的單一 `openapi.yaml`、目錄修正、`operations.gen.ts`、ABAC=C、OQ-11 到 OQ-14；裁決 6 的權限來源分工、`x-permission: public` + `security: []`、完整 resource:action 目錄檢查；a3 的 apiBaseUrl / 404 / 403 判定。
(c) D1–D5（spec 內鎖定決策）有沒有被 spec 其他段落違反。
(d) 每個 milestone 能否獨立 merge；AC 是否可驗；done command 能否在 repo 實際執行（檢查 package.json scripts、檔案路徑存在或會被該 milestone 建立）。
(e) spec 內 `file:line` anchor 在 master 上是否成立；型別草案是否自洽（命名、欄位、泛型、跨段引用一致）；有沒有新引入的矛盾。
(f) 修正棒 surface 的待裁項——OQ-15 core tag、OQ-16 route id 格式、§11.2 的 apiBaseUrl 與同源設定衝突、401→403、getGrants 偏離 a3、R21 分兩期檢查、M3 過渡全 public——有沒有正確標為「待 owner 裁」或明說理由，而不是在正文被當成已定案執行。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，並附 spec 行號（以 07dcae4 版本 `docs/specs/fsd-module-architecture.spec.md` 的行號為準），說明問題與證據。
- 接著列上一輪 finding 1–5 的關閉狀態，以及 C1、C2、W1–W4 是否仍維持 closed。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 07dcae4c9f56e1cba548aa21ddee835ae63dddd7
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
