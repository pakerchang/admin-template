# admin-template M1 修正後複審（delta review）

你是 out-of-band 審查者。cwd 為 worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m1`（branch `feat/m1-kernel-contracts`）。**只讀，不改任何檔案、不 commit、不 push。**

- 送審 sha：`5ce3579e72a2b32ac79698cfb464bf1a9cc76d02`（先確認 `git rev-parse HEAD` 等於此值、工作樹乾淨）
- 前一輪審查 sha：`c888b200a1fa46813bc7855fa58447703e8ae5a4`，判決 PASS-with-fixes
- 前一輪 verdict 全文（請先讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m1-fix-codex-verdict.md`
- 本輪輸出存為 verdict 檔：`arch-m1-fix2-codex-verdict.md`
- base：`fcc673a5c7b39051b156fa6872d05902a3fd26b4`

## 範圍：delta review（額度考量，不要重審整個 M1）

主要看 `git diff c888b20..5ce3579`（只有 commit 5ce3579，改 `src/app/kernel/build.ts`、`src/app/kernel/__tests__/build.test.ts`）。

1. **前一輪 finding 逐條判定是否已解決**：
   - W-a `build.ts` `out[k] = ...` 對 `__proto__` 觸發繼承 setter（prototype 被換、key 不成 own property）。
   - W-b `isDict()` 把 Date / class instance 等非 plain object 當字典遞迴。
   對每條：實作是否修好；新增測試在對應實作被改壞（例如退回 `out[k] =`、退回原 `isDict`）時是否確實會失敗。能實際做 mutation 就做（在暫存副本，不要動 worktree），做不到就以靜態判讀並註明。
2. **修正有沒有引入新問題**，深層合併語意逐項核對：
   - core 既有 key 不被 module 覆蓋（core leaf 優先）；
   - 同名子 key 兩邊都保留；
   - `__proto__` / `constructor` / `prototype` 等特殊鍵（含 `JSON.parse()` 產生的 own `__proto__`）；
   - null prototype 物件（`Object.create(null)`）是否仍被視為可遞迴字典；
   - Date / class instance / 陣列 / 函式 / null 為 leaf；
   - 輸入（core、module）不被修改；結果 prototype 正常、無全域 `Object.prototype` 污染。
3. **確認 delta 沒有改 spec**（`git diff --name-only c888b20..5ce3579` 不含 docs/spec）。
4. **Touches / Must-Not-Touch**：`git diff --name-status fcc673a..5ce3579 -- src` 應只有 `src/shared` / `src/app` 下的新增（A），既有 src 零修改。
5. 能跑的話執行 `pnpm exec vitest run src/shared src/app/kernel`，報 exit code 與通過數。read-only sandbox 跑不了就註明原因，**不要列為 finding**。

## 輸出格式

- finding 逐條：`[critical|warning|info] 檔案:行 — 問題 — 建議`；沒有就寫「無新 finding」。
- 前一輪 finding 解決狀態表（項目 / 狀態 / 實作與測試位置 / 改壞時測試是否會抓到）。
- 最後**各以獨立一行**、恰好一次輸出下列三行（冒號後一個空格，不加任何修飾）：

```
REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 5ce3579e72a2b32ac79698cfb464bf1a9cc76d02
REVIEWER: codex-oob
```

`REVIEW_VERDICT` 只擇一值（PASS、PASS-with-fixes 或 FAIL）。判準：無 finding 或僅 info → PASS；有 warning → PASS-with-fixes；有 critical → FAIL。
