# TRAPS

格式：症狀 / 真因 / 禁令（全域 `dev-orchestrator-task-format` TRAPS 格式）。每條附來源；`file:line` 以 master `6029bf0` 為準，spec 行號指 `docs/specs/fsd-module-architecture.spec.md`。

分兩區：

- **A. 已在 master 發生／可在 master 重現**：現在就會踩到。
- **B. spec / PoC 預警，待對應 milestone 驗證**：來自 spec 與 api chain PoC 的推斷，本 repo 尚無重構返工紀錄；每條標明由哪個 milestone 驗證，驗證後依結果移到 A 區或刪除。

## A. 已在 master 發生／可在 master 重現

### `pnpm test` 跑了不結束、agent / CI 卡住

- **症狀**：執行 `pnpm test` 後指令一直不返回，非互動環境逾時。
- **真因**：`test` script 是 `vitest`（無 `run`），預設 watch 模式。
- **禁令**：一次性測試一律 `pnpm exec vitest run [path]`；禁用 `pnpm test`。
- **來源**：`package.json:18`；spec L926。

### 只想檢查 lint，結果檔案被改了

- **症狀**：跑 `pnpm lint` 後 `git status` 出現非預期修改。
- **真因**：`lint` script 帶 `--fix`，會直接改寫原始碼。
- **禁令**：只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`；禁止以 `pnpm lint` 當驗證步驟。
- **來源**：`package.json:14`；spec L926。

### mock 寫入後重新整理資料就不見了

- **症狀**：新增 / 編輯成功，重新整理頁面後回到原始資料。
- **真因**：mock 後端是記憶體 `db`（`structuredClone` 種子資料），寫入只改記憶體。
- **禁令**：不要把「重新整理後資料消失」當 bug 修；需要持久化先問 owner。
- **來源**：`src/services/mock/handlers.ts:8-9`。

### 重構期間想新增第 11 個 module，驗收指令失敗

- **症狀**：M3–M8 期間新增 module 後，M3 AC-1（`app/modules.ts` 恰好 10 個 `.use(`）、M6 AC-3 / M7 AC-3（實際 10 個 module）的驗收指令失敗。
- **真因**：spec 驗收以「恰好 10 個 module」寫死（spec L1106–1107、L1203、L1231）。
- **禁令**：M8 驗收完成前凍結新增 module（owner 裁決，spec 的「恰好 10 個」不改）；新 module 需求排到 M8 之後。
- **來源**：arch chain inbox「2026-11-09 owner 裁決：重構期間凍結新增 module（main 轉達）」。

## B. spec / PoC 預警，待對應 milestone 驗證

### orval 產的 MSW handler 回不了 404 / 422（M7 起）

- **驗證**：M7 AC-6（spec L1237）。
- **症狀**：在 orval mock handler 的 override 裡想回錯誤，response status 仍是 200。
- **真因**：orval MSW handler 的 status 寫死 200，`overrideResponse` 只決定 body。
- **禁令**：需要非 200 的情境，在 `mocks/handlers.ts` 手寫 `http.*` handler，排在該 operation 的 orval handler **之前**。
- **來源**：spec L1318（§11.1 K1）、L485。

### `setupServer` 的 `onUnhandledRequest` 報 TS2353（M2 起）

- **驗證**：M2 AC-3（spec L1084）。
- **症狀**：`server.listen({ onUnhandledRequest: … })` tsc 報 TS2353。
- **真因**：msw 3 把該選項改名為 `onUnhandledFrame`。
- **禁令**：自寫的 `setupServer` / `setupWorker` 選項一律用 `onUnhandledFrame`。
- **來源**：spec L1319（§11.1 K2）、L1084（M2 AC-3）。

### orval fetch client 回傳 `{ data, status, headers }` 而不是 body（M7 起）

- **驗證**：M7 AC-4（spec L1233；PoC 未驗 mutator，此 AC 首次驗證）。
- **症狀**：hook 拿到的是包一層的物件、型別是 status union，不是 API body。
- **真因**：orval `httpClient: "fetch"` 的回傳形狀；PoC 未驗 mutator（以 `output.baseUrl` 繞過）。
- **禁令**：unwrap 只在 `shared/api/fetcher.ts` mutator 做（非 2xx throw）；禁止在各 hook 自行 unwrap。mutator 形狀與 queryKey 以 M7 AC-4 為準。
- **來源**：spec L1320（§11.1 K3）、L484。

### mock 模式 `apiBaseUrl` 同源，guard 放行了該擋的 request（M3 起）

- **驗證**：M3 AC-7（spec L1117）。
- **症狀**：MSW guard 沒擋住 `/users`、`/user`、`/admin` 的 request；或同源時 vite 資源被回 404。
- **真因**：client 以絕對路徑 `new URL(path, baseUrl)` 組 URL，同源非根 base（例 `location.origin + "/api"`）會讓 `/users` 解析到 origin 根下、落在 guard 的 `apiBaseUrl` 範圍外；現況 base 預設為 `window.location.origin`。
- **禁令**：mock 模式 `VITE_API_BASE_URL` 必須是專用的絕對 origin（例 `http://mock-api.local`）；禁止 fallback 到 `window.location.origin`；禁止為此改動既有 API 路徑前綴。
- **來源**：`src/services/api-client.ts:44`、`:54`；spec L77（R24）、L745。

### 重新整理 `/users` 拿到 mock JSON、繞過 guard（M7 起）

- **驗證**：`docs/specs/msw-origin-anchor.spec.md` AC-1／AC-2（`src/app/mock/__tests__/origin-anchor.test.ts`）。
- **症狀**：mock 模式直接載入或重新整理與 API 同名的頁面（`/users`），畫面是 mock API 的 JSON；該 document request 沒帶 token 也拿到 200。
- **真因**：orval 產物與手寫 `mocks/handlers.ts` 以萬用 origin 註冊（`"*/users"`），會比對 app 自己的 origin；guard 只判 `apiBaseUrl` origin，範圍外放行後 fall through 到 module handler。
- **禁令**：module handler（產物 / 手寫）不得依賴自身 path 劃界；origin 錨定只靠 kernel `createMockHandlers` 的圍欄（guard 後第二位，非 `apiBaseUrl` origin → `passthrough()`），禁止移除或把 module handler 排到它前面；禁止用 orval `mock.baseUrl` 把 origin 寫死進產物。
- **來源**：s1 瀏覽器驗收 F1；`src/modules/users/mocks/users.msw.ts:124`。

### module route 的 `navigate({ to })` 失去型別檢查（M3 起）

- **驗證**：M3 落地時首次可觀察；spec 沒有專屬 AC（R4 已接受寬化，§4.6 L507–513）。
- **症狀**：module 化後 typed route 推導變寬，打錯路徑 tsc 不報錯。
- **真因**：module 以 factory 回傳 `AnyRoute[]`，組裝後樹型別寬化，`Register` 不再精確（R4 已接受）。
- **禁令**：module 內導航用 `model/routes` 的 route 物件（`xxxRoutes.get().details.fullPath`）；跨 module 只用 nav 字串；禁止為恢復型別而手刻全域 route 型別。
- **來源**：`src/router/index.ts:10-14`；spec L509-511（§4.6）。

### `modules/<id>/api/` 裡的手寫檔被刪、`mocks/` 殘留舊產物（M7 起）

- **驗證**：M7 AC-1、AC-5（spec L1227、L1235）；行為本身已在 PoC a2 實測（spec L193–194）。
- **症狀**：跑 `pnpm gen:api` 後 `api/` 下手寫檔消失；tag 改名後 `mocks/` 留著舊 `<old>.msw.ts`。
- **真因**：orval `clean: true` 會清掉 `api/` 整個目錄，但不清 `mocks/`。
- **禁令**：手寫 domain model 一律放 `model/`；`mocks/` 手寫檔禁命名 `*.msw.ts`；tag 改名時手動刪舊 `<old>.msw.ts`。
- **來源**：spec L193-194、L1321（§11.1 K4）。
