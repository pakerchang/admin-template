# Codex 複審：admin-template M1 kernel 修正（out-of-band，delta review）

你是獨立 reviewer。只讀不改：不修改任何檔案、不 commit、不 push。

## 審查對象
- repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m1`（branch `feat/m1-kernel-contracts`，尚未 push）
- 送審 sha：`c888b200a1fa46813bc7855fa58447703e8ae5a4`
- 前一輪審查 sha：`b445350f4d4f5758e90fe94ac280f4dbc15bfc07`（判 PASS-with-fixes）
- base：`fcc673a5c7b39051b156fa6872d05902a3fd26b4`
- 判決輸出會被存成 `arch-m1-fix-codex-verdict.md`
- 前一輪 verdict 全文（請先讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/arch-m1-codex-verdict.md`
- 依據：worktree 內 `docs/specs/fsd-module-architecture.spec.md`（§4.2、§4.3、§6.2、§9 M1 的 AC / Touches / Must-Not-Touch / pseudo code）

## 範圍：delta review（額度考量，**不要重審整個 M1**）
只審 `git diff b445350..c888b20`（3 個 commit：322aacb fix(kernel) i18n 深層合併、f8601be test(kernel) 補測試、c888b20 docs(spec) 同步 §4.2 / §6.2 / pseudo code）。前一輪已判符合的部分不用重審。

## 要審的項目
1. **前一輪 finding 逐條判定是否已解決**（resolved / partially / unresolved），每條附實作與測試位置（檔案:行），並說明「把對應實作改壞時，新測試是否真的會失敗」：
   - W1 `src/app/kernel/build.ts` `scopeAndMerge()` 淺層覆蓋 core 同名頂層 key（需深層合併、同名不同子 key、module 無字典的測試；spec 淺層展開註解同步）；
   - W2 page 有 routeId 但缺 component 的負例；經 `build()` 取得的實際 protected route 在無 grant 時 `beforeLoad` 拋 `ForbiddenError`（把 `guardedRoute` 換成普通 `createRoute` 時要能抓到）；
   - W3 `guardedRoute` 保留原 `beforeLoad`：允許時 callback 收到原 context、回傳值保留；拒絕時 callback 不執行；
   - I1 `createApp` 的 `core` 參數與 `TRegistry` 位置，§4.2 公開簽名同步。
   - 另：前一輪「實作選擇 6（同 resource actions 取聯集）需補測試」與「選擇 1（getGrants 注入）需同步 §6.2」是否也已處理。
2. **修正是否引入新問題**，特別是深層合併的語意：
   - core 既有 key 不被 module 覆蓋（或依 spec 定義的優先序）；
   - 同名子 key 兩邊皆保留；
   - 陣列、非 plain object（null、Date、class instance、函式等）的處理是否合理，有無 prototype pollution（`__proto__` / `constructor`）風險；
   - 是否 mutate 輸入（core 字典或 module 字典）。
3. **spec 改動範圍**：`git diff b445350..c888b20 -- docs` 是否只動 §4.2、§6.2、pseudo code，且文字與實作一致；有無動到其他章節或與 §4.3 / AC 互相矛盾。
4. **Touches / Must-Not-Touch 是否仍守住**：`git diff --name-status fcc673a..c888b20 -- src` 應只有 `src/shared` / `src/app` 下的新增（`A`），既有 src 零修改。

## 執行測試
能跑的話在 worktree 內執行：
```
pnpm exec vitest run src/shared src/app/kernel
```
回報 exit code 與通過 / 失敗數。read-only sandbox 跑不了（如 EPERM 無法寫暫存檔）就註明「未執行 + 原因」，**不要當 finding**。

## 輸出格式
- finding 逐條：`- [critical|warning|info] 檔案:行 — 問題 — 建議`；沒有就寫「無新 finding」。
- 前一輪 finding 解決狀態表。
- 輸出最後**各以獨立一行**寫出（每個恰好一行，不要加粗、不要放進 code block）：

REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL（擇一）
REVIEWED_COMMIT: c888b200a1fa46813bc7855fa58447703e8ae5a4
REVIEWER: codex-oob
