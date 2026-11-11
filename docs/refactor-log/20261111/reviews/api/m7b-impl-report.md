# M7b 交付報告

M7 剩下的 AC-1、AC-3、AC-4、AC-5、AC-6 都做完了，完整 Done Command（gen → diff → build → vitest → scripts → lint）在 commit 後跑出 **exit 0**，也印出了 `M7B_DONE_OK`。AC-7 是瀏覽器手動驗收，依 prompt 沒做，標待驗。

## 驗收結果（行為層，runtime exit code）
- Done Command 照 prompt 原文、不接 pipe，`EXIT=0`。
- `pnpm build`：`✓ built in 8.27s`。
- `pnpm exec vitest run`：38 個檔、347 個測試全過。
- `pnpm exec vitest run scripts`：1 個檔、12 個測試全過。
- `pnpm lint`（帶 `--fix`）跑完後 `git status` 是乾淨的，代表產物與手寫碼都不需要再改。

## 各 AC 證據
| AC | 證據 |
|---|---|
| AC-1 | 新增 `gen:api` = `orval && prettier --write <產物> && pnpm gen:api:extract`。重跑後 `git diff --exit-code -- src/modules src/app/operations.gen.ts` 為空。`operations.gen.ts` 改由 extract 產生，M7a 的 YAML↔表一致性測試仍然通過 |
| AC-2 | M7a 已完成，scripts 12/12 通過 |
| AC-3 | 新測試 `src/app/kernel/__tests__/operations-yaml.test.ts`，涵蓋三件事：<br>• 真實 YAML extract 後，用 10 個 module `build()` 不 throw<br>• 恰好 10 個 module<br>• 把 `listOrders` 改成 `orders:typo`：extract 會通過（R27 第一階段只查格式），但 `build()` throw 並指名 `operation "listOrders" requires "orders:typo"…` |
| AC-4 | `src/shared/api/__tests__/fetcher.test.ts` 的 `fetcher as orval mutator (M7 AC-4)`，共 4 個測試：<br>• orval client 回 body（鍵為 code/data/error/msg/total，不是 `{data,status,headers}`）<br>• 非 2xx throw `ApiError`（帶 status 403 與 body）<br>• 網路錯誤不會被 `nullOnApiError` 吞掉<br>• queryKey 是 `["/admin/tag", {page:1}]`，不含 origin；只有實際 request URL 才接上 `apiBaseUrl` |
| AC-5 | spec 原文的檢查指令印出 `AC5_OK`：legacy adapter 與它的測試、snapshot 都已刪除；`src/modules` 內沒有 `apiFetch`；`mocks/*.msw.ts` 只有 `<id>.msw.ts`。module handlers 都是 `HttpHandler[]`，接在 kernel guard 後面 |
| AC-6 | `src/modules/{tags,orders,users,auth}/mocks/__tests__/handlers.test.ts`：<br>• create 或 update 之後 list 讀得到（記憶體 seed 經 orval override 生效）<br>• 手寫的非 200 handler 排在 orval handler 之前且有生效：tags PUT 不存在的 id → 404、orders update → 404、users role → 404、auth 密碼錯 → 401 |
| AC-7 | **待驗**：`[manual]` 瀏覽器驗收（`VITE_API_MOCK=true pnpm dev` 各頁 CRUD），prompt 指定不做 |
| M4 裁決 | guard 的 404 body 已改成 `not found: no operation for <METHOD> <path>`，有 5 處測試同步更新 |

## 產物與刪除
- **產物**（皆進 git）：每個 module 都有 `api/<id>.ts`、`api/model/*`、`mocks/<id>.msw.ts`。檔數：articles 20、auth 9、banners 21、consumers 21、orders 21、product 24、suppliers 21、tags 19、team-members 18、users 21。另有 `src/app/operations.gen.ts`。
- **刪除**：
  - `src/shared/api/mock/legacy-adapter.ts`
  - `src/app/mock/__tests__/legacy-adapter.test.ts` 與它的 `.snap`
  - `apiFetch` 從 `fetcher.ts` 移除
- **lint 如何涵蓋產物**：gen 階段先跑 prettier，所以 `prettier/prettier` 規則會過。`eslint.config.js` 只對 `src/modules/*/api/**` 與 `*.msw.ts` 關掉 `import/order`，其餘規則照常檢查，包括 boundaries。

## DECISION
1. **mutator 回傳形狀**：prompt 寫「解開信封 body」，spec 的 AC-4 寫「回傳 body（非 `{data,status,headers}`）」。我解讀成把 fetch client 的外層 `{data,status,headers}` 解開，回 HTTP body，**沒有**再往下剝 `ApiEnvelope.data`。理由是 list 頁需要 `total`，這樣 hook 形狀不變。
2. **hooks 改法**：`model/use-*.ts` 改呼叫 orval 產生的 client 函式，用 `.catch(nullOnApiError)` 接錯誤，保留原本的 toast / 回 null 路徑。queryKey 沿用原本手寫的 key，沒換成 orval 的 `get*QueryKey`，理由是 invalidation 行為才能和 base 相同（行為紅線）。AC-4 的「相對路徑 queryKey」是在產物上驗證的。
3. **articles 讀 `/user/me/profile`**：這個 operation 屬 users tag，但 articles 沒有 `requires`（§5.2）。所以 articles 直接用 `fetcher<TProfile>(...)` 呼叫，不 import users 的產物，避免跨 module 依賴。
4. **`apiFetch` 移到 `src/test/api-fetch.ts`**：只給測試用（回 `{status, body}` 方便斷言 status），正式程式只剩 orval 產物與 `fetcher` 兩條路。
5. **新增依賴 `@faker-js/faker@10.6.0`**（放 dependencies，與 msw 同層）：orval 產生的 msw 檔一定會 import faker，不裝就無法編譯。版本取 PoC 已驗證的 10.6.0，並設 `locale: "en"` 縮小 bundle。這是新增，不是升級既有依賴，但超出 spec Touches 原本列的「orval / yaml devDeps」。
6. **mock 延遲**：原本每個 legacy handler 各自 delay 300ms（測試時 0），現在 module handler 改用 orval 產物，改成在 kernel 的 guard 之後放一個 `http.all(apiBaseUrl/*)` 統一 delay。guard 回的 403 / 404 一樣不延遲，與 base 相同。
7. **orval 設定**：加了 `override.fetch.includeHttpResponseReturnType: false`，讓產物的回傳型別就是 body。
8. **domain 型別轉換**：orders 與 consumers 的回應在 model 層 cast 成 `model/schema` 的型別（R18：ui 不直接用 api 型別）。原本 `apiFetch<T>` 也一樣沒有在 runtime 檢查型別。

## 偏離 / 未做 / 未驗證
- **AC-7 未驗**：瀏覽器 `setupWorker` 下 orval handler 與 hooks 是否實際正常，只在 node `setupServer` 驗過（對應 K6 / K8）。
- **eslint 過渡 policy 沒收回**：「mocks 可讀本 module 的 `model/`」這條，原註記寫「M7 改指 api/model 後收回」。現在 seed 的型別仍取自 `model/`，屬額外清理，沒有在本棒做。
- **spec §4.5 fetcher 的「403 統一 toast、401 清 session」沒有實作**：base 沒有這個行為，而且會和各 hook 自己的 toast 重複，依行為紅線維持原狀。
- **`docs/TRAPS.md` B 區沒改**：M7 相關條目（K1 / K3 / K4）本棒已驗證，照規則應移到 A 區或刪除，但沒有在本棒處理。
- 只做 1 個 commit（prompt 允許 2–3 個，非強制），這個 commit 本身已過 build + test。

## Git
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-m7b`
- branch：`feat/m7b-orval-gen`；base `60ff9c2`；head `ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`
- `git log --oneline 60ff9c2..HEAD`：
  - `ca6b62f feat(api): generate module clients and MSW handlers with orval (M7b)`
- 沒有 push、沒開 PR、沒 merge；commit 不含 AI 署名（已確認 trailer 數為 0）。
- 小 spec `~/.claude/docs/specs/admin-template-m7b-impl.spec.md` 已刪除。

LIFECYCLE_PAUSE: true
