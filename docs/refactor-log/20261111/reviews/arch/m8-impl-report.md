# M8 impl 報告：D1 / D4 驗收自動化與收尾

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8`
- branch：`feat/m8-core-only-verification`（已 push，追蹤 `origin/feat/m8-core-only-verification`）
- base：`refactor/integration` `ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`（開 worktree 前確認未前進）
- head：`2d1469543c91762af5106d33e9ef88414ada89ac`
- 本棒小 spec：`/Users/pakerchang/.claude/docs/specs/m8-impl.spec.md`（保留，不在 admin-template commit 內）

## Commit 清單

| sha | message | 驗證 |
|---|---|---|
| `74e804b` | test(app): cover page override by route id and module-removal fail-fast (M8) | 提交前在工作樹跑 `eslint src/** && pnpm build && vitest run` → RC=0，41 檔／354 測試全過。當時工作樹另有未提交的 `scripts/*`、`package.json`、`CLAUDE.md`，這些都不在 eslint（只掃 `src/**`）、tsc、vitest 的範圍內，所以結果等同只有 commit 1 的狀態（**沒有**另外 checkout 74e804b 單獨重跑）|
| `2d14695` | feat(scripts): add verify-core-only for D4 acceptance (M8) | Done Command 在這個 HEAD 跑，exit 0（見下）|

兩個 commit 都以 `HUSKY=0` 提交（跳過 lint-staged），提交前已手動跑 eslint 與 prettier。沒有 AI 署名，作者 pakerchang。

## AC 證據

- **AC-1** `bash scripts/verify-core-only.sh` → exit 0，印出 `core-only build: OK`（Done Command 的輸出）。
  - 暫存副本：`mktemp -d` 內建立 `git worktree add --detach <tmp>/core-only HEAD`；`trap EXIT` 執行 `git worktree remove --force` + `worktree prune` + `rm -rf`。之後 `git worktree list` 沒有殘留 `/T/tmp` 條目。**未提交的變更不會帶進副本**（只驗 HEAD）；但 `scripts/core-only-strip.ts` 和腳本本身是從原 repo 執行的。
  - 依賴：`pnpm install --frozen-lockfile --offline`，失敗才退回一般 install；用 `HUSKY=0` 避免動到共用 git config。這次離線安裝成功。
  - domain 名單：由 `scripts/core-only-strip.ts` 讀 `src/modules/*/index.ts` 的 `kind: "domain"` 取得 → `articles banners consumers orders product suppliers tags`（7 個，沒有寫死）。
  - §8.2 各步驟：strip 刪 `modules.ts` 的 import 和 `.use()` 行（刪除行數必須剛好是 2×domain 數，否則 throw）；用 `yaml` `parseDocument` 刪 domain tags，以及 tag 屬於 domain 的 operation（path 變空就整條刪）；`rm -rf src/modules/<id>`；`pnpm gen:api` → `extract-operations: wrote 11 operations`。
  - build 全量 `✓ built in 11.27s`。core-safe vitest 結果：**18 檔／134 測試全過**。
  - 排除清單（14 / 32，防呆門檻是 ≤ 一半）：見下方「已知問題」。
  - 紅線：Done Command 結尾的 `git diff --quiet` 通過，`git status --porcelain` 為空。
- **AC-2** `src/app/__tests__/override.integration.test.tsx`：fixture shell 用 `pages: { "orders.list": CompactOrderList }` 覆寫。覆寫頁只呼叫 orders 的 `useGetOrderList`（headless model）。測試先渲染預設頁再渲染覆寫頁，各自用新的 QueryClient，斷言：覆寫頁出現；leaf match 的 `staticData.routeId === "orders.list"`；兩邊 `["orderList", …]` 的 query key 陣列相等；資料相等；列表內容等於資料中的 order_id。單獨跑 1/1 通過；全量跑也通過。
- **AC-3** `src/app/kernel/__tests__/module-removal.test.ts`（用真實 module）：
  1. 刪 suppliers、保留 product → `module "product" requires "suppliers" but it is not installed`。
  2. 只刪 orders 的 `.use()`，operations.gen.ts 沒動 → throw 符合 `/^operation "\w+" requires "orders:\w+" which is not in any installed module's permission catalog$/`（1.5.3）。
  3. 對照組：模擬 YAML 刪 tag 並重 gen 後，同一組安裝可以 build。
  - `vitest run src/app/kernel` 中 3/3 通過。
- **AC-4 `[manual]`**：**瀏覽器驗收待驗**（本棒沒做 `pnpm dev`）。自動佐證放在 `src/app/__tests__/core-only.test.tsx`。它屬於 core-safe 集合，在 core-only 副本中也有跑且通過，內容：
  - 只裝 generic module（auth / users / team-members）；
  - superadmin 的 `useVisibleNav` 只有 `/team-members`；
  - `/` redirect 到 `/team-members`。

## Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8 && pnpm install --frozen-lockfile && bash scripts/verify-core-only.sh && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && git diff --quiet && echo DONE_COMMAND_OK
```

- 結果：exit 0（`DONE_RC=0`），輸出含 `core-only build: OK` 與 `DONE_COMMAND_OK`。
- core-only 副本：18 檔／134 測試。全量 repo：41 檔／354 測試，都通過。
- 之後 `git status --porcelain` 為空。
- 完整 log：`/private/tmp/claude-501/-Users-pakerchang--claude/d0ec4c81-99fb-4f19-ba66-42ccc75d0aef/scratchpad/done.log`

## 破壞性驗證

每項都是改壞 → 跑對應檢查 → 用 `git show HEAD:<file> > <file>` 還原 → `git diff --quiet`。6 項還原後都乾淨。腳本：`/private/tmp/claude-501/-Users-pakerchang--claude/d0ec4c81-99fb-4f19-ba66-42ccc75d0aef/scratchpad/destructive.sh`；各項 log 在同目錄的 `destructive/`。

| # | 改壞 | 結果 |
|---|---|---|
| D1 | 排除 grep 改成永遠不命中（排除清單變空） | rc=1，`exclusion guard failed (grep matched 0, …)` |
| D2 | 排除 grep 改成 `.`（排除全部） | rc=1，`exclusion guard failed (grep matched 32, 32 of 32 excluded …)` |
| D3 | 副本中 strip 後把 openapi.yaml 還原（漏刪 YAML tag），仍跑 gen | rc=1。**build 通過**；vitest 失敗：`core-only.test.tsx`、`operations-gen.test.ts`、auth / users handler 測試失敗，`build()` 1.5.3 throw |
| D3b | 漏刪 YAML 且沒有重 gen | rc=1。build 通過；vitest 4 檔失敗，錯誤為 `operation "listProducts" requires "product:read" which is not in any installed module's permission catalog`（§8.2 1.5.3 fail fast）|
| D4 | override 測試的 shell 改成 `pages: {}`（渲染預設頁） | rc=1，`Unable to find … compact-orders` |
| D5 | 測試 fixture 中 product 改成 `requires: []` | rc=1，`expected [Function] to throw an error`（1 fail / 2 pass）|

## Touches 外例外

- `CLAUDE.md`：M8 狀態改為「完成（待併入；AC-4 瀏覽器驗收待驗）」，並在「指令」段加一行 `pnpm verify:core-only` 說明（含 `FULL_INSTALL_TESTS` 維護提示）。
- 新增 `src/app/__tests__/core-only.test.tsx`（屬於 Touches 的 `src/app/__tests__/**`，作為 AC-4 自動佐證）。
- 沒有改 `eslint.config.js`：`scripts/` 不在 eslint 掃描範圍。

## 自行決定

1. **DECISION（需 main／owner 追認）**：main 裁決的 grep（`@/modules/<id>` 或 `"<id>.`）在 core-only 副本中**不夠讓 vitest 轉綠**。有 7 個 core-safe 測試失敗（25 個測試），原因分兩類：
   - 以 URL（`/orders/9`）、權限字串（`orders:read`）、YAML tag 引用 domain；
   - 根本沒有 domain 字面，只斷言完整安裝（例如 `toHaveLength(10)`、route 數 > 10／> 15）。

   我試過加上權限字串 pattern，但它也會把 `can.test.ts`、`permission-guard.test.ts`、`data-table-row-actions.test.tsx` 這類把 `orders:read` 當任意字串的純 shared 測試排除掉，總數超過一半，觸發防呆。

   **採用的寫法**：保留裁決的 grep，另在腳本中加一份明列的 `FULL_INSTALL_TESTS`（7 檔），輸出時分開列出。防呆改成「grep 命中 > 0 且排除總數 ≤ 一半」；清單中的檔案不存在時也 fail，避免清單過期。不改既有測試（Must-Not-Touch）。
2. 排除的測試檔會先從副本中刪掉再 build。原因：`tsconfig.app.json` 包含測試檔，它們 import 已刪的 module，tsc 會失敗。這和裁決「build 全量」字面上有差異：build 的範圍 = 全部原始碼 + core-safe 測試。
3. 副本用 `git worktree add --detach HEAD`，只驗已 commit 的內容；strip 腳本從原 repo 執行。
4. AC-2 覆寫頁直接 import `@/modules/orders/model/use-order`。原因：orders 的 `index.ts` 沒有具名 export headless hook，而且 `src/modules` 本棒不可改；測試檔不受 boundaries lint 管。
5. `core-only-strip.ts` 刪掉最後一個 `.use()` 時會連分號一起刪（依賴 ASI）。副本只跑 tsc，不跑 lint，所以可接受，已用 `ponytail:` 註解標明。

## spec 差異

- §8.2「漏了步驟 2 但跑了步驟 4 → tsc / boundaries 因缺 index.ts 與 model/ 報錯」：**實測 tsc 不報錯**（D3：orval 重產的 `modules/<id>/api` 沒人 import，可以獨立編譯）。實際的 fail fast 發生在 vitest：`build()` 1.5.3 throw，還有 operations-gen 等測試失敗。副本沒跑 boundaries lint。
- §9 M8 AC-4 寫「sidebar 只有 users / team-members」：users module 本來就沒有宣告 nav（M3 行為不變），所以 core-only 的 sidebar 實際**只有 team-members**，`/` redirect 到 `/team-members`。
- §4.4 範例「覆寫頁只用 module `index.ts` 公開的 headless API」：orders 的 `index.ts` 目前沒有 export `useGetOrderList` 等 hook（見自行決定 4）。
- main 裁決「vitest 只跑 grep 排除後的 core-safe 測試」：實際上需要再加明列清單（見 DECISION 1）。

## 已知問題

- **排除清單（14 / 32）**：
  - grep 命中 7：`src/app/__tests__/app-wiring.test.tsx`、`src/app/__tests__/override.integration.test.tsx`、`src/app/kernel/__tests__/build.test.ts`、`src/app/kernel/__tests__/module-removal.test.ts`、`src/app/mock/__tests__/role-visibility.test.tsx`、`src/shared/api/__tests__/fetcher.test.ts`、`src/shared/module/__tests__/use-visible-nav.test.tsx`。
  - 明列 7：`src/app/__tests__/permission-structure.test.ts`、`src/app/__tests__/router-matching.test.ts`、`src/app/kernel/__tests__/operations-yaml.test.ts`、`src/app/mock/__tests__/mock-handlers.test.ts`、`src/app/router/__tests__/forbidden-boundary.test.tsx`、`src/app/router/__tests__/index-redirect.test.tsx`、`src/shared/i18n/__tests__/module-dictionaries.test.ts`。
  - 另有 9 個 domain module 內的測試會隨目錄一起刪除，不計入。
- 排除數 14/32 已接近一半的門檻（16）。之後新增「斷言完整安裝」的測試，可能讓防呆觸發，需要補清單，或把測試改成不依賴完整安裝。
- `build.test.ts` 只因為用了 `"orders.list"` 等 fixture 字串就被 grep 排除，其實不依賴 domain module。結果是 core-only 中 kernel 的核心單元測試沒有跑（裁決 grep 的副作用）。
- **core-only 畫面殘留的 domain 字串**（靜態檢視，非瀏覽器實測）：
  - `src/shared/i18n/locales/en.json`、`zh.json` 中 domain 相關 key 約 141 / 102 行（M6 未搬，CLAUDE.md 已記）；
  - `src/shared/ui/navbar/use-breadcrumb.ts` 寫死 `orders` / `products` / `banners` / `articles` / `batch-orders` 的麵包屑 case；
  - `src/shared/ui/data-table/utils/table-visibility.ts` 有 `ORDERS_TABLE` / `PRODUCTS_TABLE` / `ARTICLES_TABLE` / `TAGS_TABLE` 等 storage key；
  - `src/app/mock/core-handlers.ts` 的註解提到 product / banners / articles。
  - 這些不影響 core-only 的 build 和測試。
- AC-4 瀏覽器驗收待驗。

## push 結果

`cc-git-write.sh push -u origin feat/m8-core-only-verification` 成功（`* [new branch]`），沒有 force。`origin/feat/m8-core-only-verification` = `2d1469543c91762af5106d33e9ef88414ada89ac`。沒有 merge，沒有開 PR。

LIFECYCLE_PAUSE: true
