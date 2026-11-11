# Codex out-of-band 審查：admin-template AI-friendly 文件

你是獨立的 out-of-band reviewer。只讀不改：不得修改任何檔案、不得 commit。

## 送審對象
- repo worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-spec-rev`（branch `docs/fsd-architecture`）
- 送審 sha：`54b975a94256c9d482b218b8bab46997a4a5d501`，base：`ba1976f3f144721a61e67113a4d132f099b1821b`
- 你的輸出會原樣存成 verdict 檔 `arch-ai-docs-codex-verdict.md`

## 審查範圍
在上述 worktree 內執行：

```
git diff ba1976f3f144721a61e67113a4d132f099b1821b 54b975a94256c9d482b218b8bab46997a4a5d501
```

增量只應含 4 個路徑：`CLAUDE.md`、`.claude/skills/add-module/SKILL.md`、`.claude/skills/declare-permission/SKILL.md`、`docs/TRAPS.md`。

對照依據（不在審查範圍內，已通過審查並由 owner 定案）：`docs/specs/fsd-module-architecture.spec.md`（以 54b975a 版本為準，行號亦以此為準）。驗證「現況」時用 `git show master:<path>` 讀 master 上的檔案。

## 參考資料（唯讀）
- 文件棒派工 prompt：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/prompts/s12-arch-ai-docs.md`

## Rubric
(a) 文件和 spec 是否一致：有沒有發明 spec 沒寫的契約；引用的 spec § 編號和行號是否正確。
(b) 現況和目標有沒有混淆：CLAUDE.md 的現況描述對 master 是否仍正確（用 `git show master:<path>` 驗證）；目標結構（spec 的 FSD module 架構）有沒有被寫成現況。
(c) 兩個 skill（add-module、declare-permission）：frontmatter 是否只有 name、description（沒有 allowed-tools）；觸發描述是否清楚；前置 milestone 條件是否正確（對照 spec 的 milestone 定義）；步驟是否可操作。
(d) docs/TRAPS.md：每條是否有可查證的證據（master file:line 或 spec 行號，請實際查證）；格式是否為「症狀 / 真因 / 禁令」；有沒有無證據的條目。
(e) 是否遵守限制：只改上述 4 個路徑；沒有建立 `.claude/agents/` 或 `.claude/rules/`；沒有 commit `settings.local.json`。
(f) 文件棒 surface 的 4 個缺口，文件是否正確地寫成「先問 owner / 待定」，而不是擅自定案：
  1. M3–M7 之間新 module 的檔案放哪裡；
  2. M4 前的權限判斷寫法和「禁止散寫條件渲染」衝突；
  3. TRAPS 第 4–9 條沒有返工紀錄；
  4. §7.2 boundaries 設定 key 待 M5 實測。

## 輸出格式
- 先列 finding，每條標嚴重度 `critical` / `warning` / `info`，附檔案路徑與行號（以 54b975a 版本為準），說明問題與證據。
- 對 rubric (a)–(f) 各給一句結論。
- 最後輸出以下三行，**各自獨立一行、恰好出現一次、冒號後單一空格**，不要放在 code block 內，也不要在其他地方重複這三個字串：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 54b975a94256c9d482b218b8bab46997a4a5d501
REVIEWER: codex-oob

（`REVIEW_VERDICT` 三選一，只填一個值。有 critical → FAIL；只有 warning → PASS-with-fixes；否則 PASS。）
