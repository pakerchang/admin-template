# Codex out-of-band 重審：admin-template M8（依 main 分流裁決前提）

你是 out-of-band reviewer。只讀，不修改任何檔案，不 commit。

## 審查對象
- Worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8`
- Branch：`feat/m8-core-only-verification`
- 送審 sha：`2d1469543c91762af5106d33e9ef88414ada89ac`
- Base：`refactor/integration` @ `ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`
- 與前一輪審查為**同一個 commit**，程式沒有任何改動。
- 本輪 verdict 檔名：`arch-m8-rereview-codex-verdict.md`
- 前一輪 verdict（PASS-with-fixes，7 條 finding：4 warning、3 info，全部 `BASIC-BREAK: no`，無 critical、無安全漏洞）：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m8-codex-verdict.md`
- M8 實作報告：
  `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m8-impl-report.md`

## 既定前提（main 代 owner 裁決；你不重新判斷其政策合理性）
1. owner 分流規則：只有 critical、會讓 build／test／demo 基本功能壞掉的問題、或安全漏洞，才開修正棒；測試強度、文件、spec 文字、mock 限制、開發腳本的清理強健性一律只記錄到已知問題，不阻擋。每個 milestone 只審一輪。
2. main 已追認前一輪 warning `scripts/verify-core-only.sh:46` 所指的 `FULL_INSTALL_TESTS` 明列清單（偏離裁決原文 A 但符合意旨）。
3. 依前提 1，前一輪 7 條 finding（`verify-core-only.sh:18` 整 repo `worktree prune`／git 管理資料寫入、`:17` cleanup 失敗與 INT/TERM、`:43` grep 誤排與局部漏抓、`:46` 明列清單、`:33` helper 來自原工作目錄、`core-only.test.tsx:45` AC-4 自動佐證範圍、`override.integration.test.tsx:16` 深 import）全部列為已知問題，不開修正棒。spec §9 M8 行為紅線原文是「腳本不得修改工作目錄（只在暫存副本操作）」，工作目錄已由 Done Command 的 `git diff --quiet` 機械檢查。紅線原文出處：worktree 內 `docs/specs/fsd-module-architecture.spec.md` 的 `#### M8` 段 Must-Not-Touch 行。
4. 本輪重審的目的是讓 review gate 登記一個反映 main 分流結果的 verdict；之後會把 2d14695 rebase 到新 integration tip（P5 TS 6）再 ff-only 併入。

## 要做
1. 核對前提 3 的 spec 紅線原文是否屬實（引原文並附行號）。
2. 在前提成立的情況下，確認前一輪 7 條 finding 是否仍全部「不屬基本功能壞掉、非安全漏洞」。若有任何一條在前提下仍應阻擋，明確指出並說明理由。
3. 判斷 2d14695 是否還有前一輪沒提到、會讓 build／test／demo 基本功能壞掉或屬安全漏洞的問題（前一輪已審過全部 diff，這輪不必重做全面審查）。
4. 能跑就執行 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 與 `pnpm exec vitest run`；read-only sandbox 跑不了就註明，不要當 finding。**不要跑** `scripts/verify-core-only.sh`。

## 輸出
- Finding 逐條：嚴重度（critical / warning / info）、檔案:行號、說明、`BASIC-BREAK: yes|no`。
- 判決語意：在前提下沒有任何需要開修正棒的項目 → PASS；有需要修正的非阻擋項 → PASS-with-fixes；有阻擋項 → FAIL。
- 最後**各以獨立一行**寫（每行恰好出現一次，冒號後單一空格）：

```
REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 2d1469543c91762af5106d33e9ef88414ada89ac
REVIEWER: codex-oob
```
（`REVIEW_VERDICT` 只填三者之一。上面範例區塊僅示意格式，你的最終輸出中三行請勿放在 code fence 內。）
