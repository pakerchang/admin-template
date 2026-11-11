# Codex out-of-band delta review — admin-template M3 fix1

你是獨立審查者。只讀，不改任何檔案、不 commit。工作目錄：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`（branch `feat/m3-module-wiring`）。

- 送審 commit：`d6858236f1c6c602efb53dbdc5a153be95486903`
- 前一輪審查 commit（FAIL）：`259e4c3da6cde5ccf5362a9788edc082e7a16ffa`
- 本輪 verdict 檔名：`arch-m3-fix-codex-verdict.md`
- 前一輪 verdict（必讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m3-codex-verdict.md`
- 修正棒報告（必讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m3-fix1-report.md`

## 審查範圍（delta review，不要重審整個 M3）

只看 `git diff 259e4c3..d685823`（commits `08f3a53` fix(mock)、`d685823` docs(spec)）。前一輪 info 三項由 main 裁定留 M4／M6，不在本輪範圍，不要再列為 finding。

## 逐條判定

1. **C1（critical）**：mock origin 啟動驗證（`src/app/mock/start-worker.ts`）與 guard（`src/app/mock/guard.ts`）劃界是否已一致？是否已解決？
2. **W1（warning）**：spec 與實作的 route id（§5.2 `banners.create/edit`、`articles.create/edit`）與 §9 M3 AC-4 路徑（`/users`）是否已同步？
3. **前一輪「自行決定」11／15／16**：是否已補齊？（15 = §9 M3 Touches 例外記錄；16 = `.claude/skills/add-module/SKILL.md` 「M3 落地前」一行；11 依前一輪 verdict 原文判定）
4. **回歸測試有效性**：`src/app/mock/__tests__/start-worker.test.ts`、`guard.test.ts` 新增案例，是否會在對應實作被改壞時失敗（例如 guard 改回 `request.url.startsWith(rawBase)`、移除 bare-origin 拒絕）？
5. **新問題**：bare-origin 判斷（`url.href !== \`${url.origin}/\``）對 `http://host/`、大小寫 host、預設 port（`:80`／`:443`）、query、hash、帳密（`http://u:p@host`）、IPv6、非 http(s) scheme 的處理是否正確；guard 對不同 origin（不同 port／scheme／host）是否確實放行、同 origin 是否確實攔截；path 取 `url.pathname` 是否與 route 比對相容（trailing slash、encoded path、query）。
6. **DECISION 成立與否**：修正棒報告中「未改 `src/services/api-client.ts` 的 `apiBaseUrl` 匯出值」的理由是否成立（client／handler 是否確實都經 `new URL(path, base)` 正規化，三方劃界是否一致）。
7. **spec 改動範圍**：`docs/specs/fsd-module-architecture.spec.md` 與 `SKILL.md` 的改動是否只限於報告列的幾處（§9 M3 AC-4、§5.2 兩組 route id、§9 M3 Touches 例外、SKILL.md 一行），無夾帶其他語意變更。

## 測試

能跑的話在 worktree 執行 `pnpm exec vitest run src/app/mock` 並引用結果。若 read-only sandbox 無法執行，請註明「未執行 + 原因」，**不要**把這件事當成 finding。

## 輸出格式

- 每個 finding 標 severity（critical / warning / info），附 `檔案:行號` 與具體失敗情境。
- 逐條列出上面 1–7 的判定（resolved / not resolved / 成立 / 不成立 + 理由）。
- 結尾必須**各以獨立一行**輸出以下三行（行首不加任何符號、不放在 code block 內，每行只出現一次）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: d6858236f1c6c602efb53dbdc5a153be95486903
REVIEWER: codex-oob

（`REVIEW_VERDICT` 只寫三選一的其中一個值。）
