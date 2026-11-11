# Codex out-of-band delta review — admin-template M3 fix2

你是獨立審查者。只讀，不改任何檔案、不 commit。工作目錄：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`（branch `feat/m3-module-wiring`）。

- 送審 commit：`03acca96840512a59ab30498db25c757835cb73f`
- 前一輪審查 commit（PASS-with-fixes）：`d6858236f1c6c602efb53dbdc5a153be95486903`
- 本輪 verdict 檔名：`arch-m3-fix2-codex-verdict.md`
- 前一輪 verdict（必讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m3-fix-codex-verdict.md`
- 修正棒報告（必讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m3-fix2-report.md`

## 審查範圍（delta review，額度考量，不要重審整個 M3）

只看 `git diff d685823..03acca9`（唯一 commit `03acca9` fix(mock): accept only http(s) mock origins；`src/app/mock/start-worker.ts` +5、`src/app/mock/__tests__/start-worker.test.ts` +4）。前一輪已 resolved 的項目與已裁定留後續 milestone 的 info 不要再列為 finding。

## 逐條判定

1. **前一輪 warning**：`start-worker.ts` 的 bare-origin 檢查放過 `ftp:` / `ws:` / `wss:` —— 是否已解決？
2. **新負例有效性**：若把新加的 protocol 檢查拿掉，`ftp scheme` / `ws scheme` / `wss scheme` 三個新負例是否會失敗（即不會意外被其他檢查以相同訊息命中而假通過）？
3. **新問題**：
   - http / https 正例（含大小寫 scheme、預設 port）是否仍通過；
   - 新檢查插入位置造成的錯誤訊息順序：既有負例（同 app origin、帶 path / query / hash / 帳密、無效 URL 等）是否仍各自命中原本預期的訊息，沒有被 protocol 檢查搶先或被改變；
   - 其他 scheme（例如 `file:`、`data:`、`javascript:`、`blob:`）走到此處時的行為是否合理（是否在 protocol 檢查之前就被其他分支以不相干訊息擋掉、或拋出非預期錯誤）。

## 測試

能跑的話在 worktree 執行 `pnpm exec vitest run src/app/mock` 並引用結果。若 read-only sandbox 無法執行，請註明「未執行 + 原因」，**不要**把這件事當成 finding。

## 輸出格式

- 每個 finding 標 severity（critical / warning / info），附 `檔案:行號` 與具體失敗情境。
- 逐條列出上面 1–3 的判定（resolved / not resolved / 成立 / 不成立 + 理由）。
- 結尾必須**各以獨立一行**輸出以下三行（行首不加任何符號、不放在 code block 內，每行只出現一次）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 03acca96840512a59ab30498db25c757835cb73f
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只寫三選一的其中一個值。）
