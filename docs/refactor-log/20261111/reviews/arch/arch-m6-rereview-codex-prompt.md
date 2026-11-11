# admin-template M6 重審（main 裁決前提下）— Codex out-of-band review

你是 out-of-band reviewer。只讀不改：不改任何檔案、不 commit。owner 不在線，不要提問，直接產出判決。

## 審查對象
- repo（worktree，即你的 cwd）：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m6`
- branch：`feat/m6-module-colocation`
- 送審 sha：`60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`
- base：`refactor/integration` @ `96f156551c3ec36fbf918a65eb1a8f93660154ef`
- 本輪 verdict 檔名：`arch-m6-rereview-codex-verdict.md`
- 與前一輪是**同一個 commit**，程式沒有任何改動。
- 前一輪 Codex verdict（FAIL）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m6-codex-verdict.md`
- M6 實作報告：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m6-impl-report.md`

前一輪唯一判為「會讓 demo 基本功能壞掉」的是 warning `src/modules/consumers/mocks/handlers.ts:8`：顧客購買紀錄改讀 consumers 自帶 collection，訂單狀態更新後不同步。其餘 finding 都標「否」。

## 既定前提（main 代 owner 裁決；你不重新判斷其政策合理性，但必須核對 spec 引文是否屬實）
1. spec R5 = OQ-3 鎖定「各 module 自帶 seed、module 不讀他 module 的 collection、consumers 自帶 transaction seed、consumers 沒有 requires」。出處（worktree 內 `docs/specs/fsd-module-architecture.spec.md`）：§0 約 L41、§4.5 約 L493、§5 約 L569、§10 OQ 表約 L1305。
2. main 依此裁定：購買紀錄與訂單狀態不同步是 R5 的**設計代價**，只記錄到已知問題，不阻擋。
3. owner 規則：mock 狀態一致性只記錄；只有 demo 基本功能（頁面打不開、登入後操作全部 403、CRUD 失敗）壞掉才阻擋。每個 milestone 只審一輪，其他發現記錄後併入。

## 要做
1. **核對前提 1 的 spec 引文**：逐條（四個出處）引出實際行號與原文要點，判定是否屬實。若有任何引文不屬實（行號偏差小可接受，內容不符才算），明確指出並說明對前提 2 的影響。
2. 在前提成立的情況下，**重新判定**前一輪「購買紀錄不同步」（`src/modules/consumers/mocks/handlers.ts:8`）是否仍構成阻擋項（依前提 3 的阻擋定義：它是否讓頁面打不開、全部 403 或 CRUD 失敗？）。
3. 確認前一輪其他 finding 的嚴重度與「是否基本功能壞掉」判定不變：session-store 全域矩陣 warning（`src/shared/api/mock/session-store.ts:74`）、AC-6 manual（`src/shared/i18n/__tests__/module-dictionaries.test.ts:15`）、breadcrumb（`src/shared/ui/navbar/use-breadcrumb.ts:36`）、domain i18n（`src/modules/product/index.ts:28`）。
4. 判斷 60ff9c2 是否還有其他與 R5 無關、會讓 build／test／demo 基本功能壞掉的問題。前一輪已審過全部 diff，本輪不必重做全面審查，重點是前提變更後的判定。
5. 能跑就執行 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 與 `pnpm exec vitest run`，回報 exit code 與摘要。read-only sandbox 跑不了就註明原因，**不要當 finding**。

## 輸出格式
- spec 引文核對表（出處／實際行號／原文要點／屬實與否）。
- findings 表：嚴重度（critical / warning / info）、`檔案:行`、說明、是否屬基本功能壞掉（是／否）。
- 指令執行結果。
- 最後**各以獨立一行**（不加 markdown 粗體、不加反引號、冒號後單一空格）寫出：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4
REVIEWER: codex-oob

（REVIEW_VERDICT 三選一只寫一個值。）
