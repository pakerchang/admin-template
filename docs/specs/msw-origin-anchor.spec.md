# MSW origin anchor Spec

M7 regression（s1 瀏覽器驗收 F1）：mock 模式登入後直接載入或重新整理 `/users`，service worker 回的是 mock API 的 JSON，不是 SPA 頁面；該 document request 沒帶 token 也拿到 200，繞過 permission guard。

**根因**：orval 產的 MSW handler（`src/modules/<id>/mocks/<id>.msw.ts`）與各 module 手寫的 `mocks/handlers.ts` 都以萬用 origin 註冊（例 `src/modules/users/mocks/users.msw.ts:124` 的 `"*/users"`），會比對任何 origin，包括 app 自己的 origin。guard（`src/shared/api/mock/permission-guard.ts`）只在 `apiBaseUrl` origin 內判定，範圍外 `return undefined` → fall through 到 module handler。M6 的 legacy adapter 以 `new URL(path, baseUrl)` 錨定，沒有這個問題。kernel core handler（`src/app/mock/core-handlers.ts` 的 `/admin/images`）與延遲 handler 已錨定 `apiBaseUrl`。

盤點（`"*/..."` 萬用 origin path）：`/api/auth/login`、`/users`、`/user/me/profile`、`/admin/user/role`、`/admin/{articles,banners,customers,order,order/update,products,products/update,staff,supplier,tag,transaction_history}`。目前只有 `/users` 與頁面路徑同名，但新增頁面時會再撞。

### 修法與取捨

| 做法 | 結論 |
|---|---|
| orval `mock.baseUrl` 讓產物帶前綴 | **不採**：orval 把值寫成字面字串進產物，origin 會被寫死；`.env` 改 `VITE_API_BASE_URL` 後產物不跟著變。手寫 `handlers.ts` 的 `"*/..."` 也照樣漏 |
| 逐一改 module 手寫 handler / 改產物 | **不採**：產物不手改（CLAUDE.md），手寫處分散在 10 個 module，以後新 module 仍可能漏 |
| guard 範圍外改回 `passthrough()` | **不採**：guard 的契約（§6.5 判定表第一列「放行 = `return undefined`」）與單元測試都以 fall through 定義，改語意會連帶改 spec 主表 |
| **kernel 在 guard 後加一道 origin 圍欄** | **採用**：`createMockHandlers` 在 guard 之後、任何其他 handler 之前加 `http.all("*")`，request origin ≠ `apiBaseUrl` origin 時回 `passthrough()`（交給網路，即 Vite / 真資源）。一處涵蓋 orval 產物、手寫 handler 與日後新增的 module；origin 取執行期 `apiBaseUrl`，不寫進產物 |

代價：測試中以 `server.use()` 前置的 handler 不受圍欄影響（`use` 前插，排在 guard 之前），既有 guard 測試照舊；`server.resetHandlers(...registry.mockHandlers)` 之後若有測試刻意打非 `apiBaseUrl` origin 並期待 module handler 回應，會改為 passthrough（盤點時無此測試）。

### User Story

身為 mock 模式下的開發者 / demo 使用者，我在 `/users` 等頁面按重新整理或直接輸入網址時，要看到 SPA 頁面；只有打到 `VITE_API_BASE_URL` origin 的 API request 才由 MSW 回應，且照常經過 permission guard。

### Acceptance Criteria

- [x] AC-1：app origin（非 `apiBaseUrl`）的 `GET /users`、`POST /admin/images`，以及 `operations.gen.ts` 每一條 route（`:param` 代入任意值）在 `registry.mockHandlers` 下都不被攔截（`getResponse` 回 `undefined` 或 passthrough response）。測試：`src/app/mock/__tests__/origin-anchor.test.ts`。（證據：`src/app/mock/__tests__/origin-anchor.test.ts`，2026-11-10 exit 0）
- [x] AC-2：`apiBaseUrl` origin 的 `GET /users` 照常由 mock 回應且經過 guard：未帶 token → 非 200（403）；superadmin token → 200。同檔測試。（證據：`src/app/mock/__tests__/origin-anchor.test.ts`「AC-2」，2026-11-10 exit 0）
- [x] AC-3：破壞性驗證——移除圍欄後 AC-1 測試失敗（紅燈先於實作記錄），還原後綠燈。（證據：紅燈紀錄見 `~/.claude/plans/admin-template/s5-msw-origin-anchor-report.md`（實作前 `vitest run origin-anchor.test.ts` exit 1，34/36 route 被攔）；綠燈：`src/app/mock/__tests__/origin-anchor.test.ts`，2026-11-10 exit 0。本次未重做移除圍欄的破壞步驟）
- [x] AC-4：`pnpm gen:api` 後 `src` 工作樹無 diff（本棒不改 orval config 與產物）。（證據：`pnpm gen:api && git diff --exit-code -- src`，2026-11-10 exit 0）
- [x] AC-5：既有測試全綠；guard 仍是 `registry.mockHandlers[0]`。（證據：全量 vitest 48 files / 405 tests + `origin-anchor.test.ts`「guard stays first」、`mock-handlers.test.ts`，2026-11-10 exit 0）
- [ ] AC-6 `[manual]`：瀏覽器 mock 模式登入後，在 `/users` 重新整理顯示 SPA 頁面（留給 owner）。（owner 親驗 pending：owner 2026-11-10 裁決先註記、不阻擋交付）

### Touches

- `src/app/mock/index.ts`（`createMockHandlers` 加 origin 圍欄）
- `src/app/mock/__tests__/origin-anchor.test.ts`（新增）
- `docs/specs/msw-origin-anchor.spec.md`（本檔）
- `docs/TRAPS.md`（B 區補一條）
- `docs/specs/refactor/README.md`（M7b 已知問題加一列）

### Must-Not-Touch

- `openapi.yaml` 的 path 與 API 前綴（R24：`/api`、`/user`、`/users`、`/admin`）
- `orval.config.ts`、orval 產物（`src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`、`src/app/operations.gen.ts`）
- 任何 module 的 `ui/**`、`model/routes.ts`、`mocks/handlers.ts`；`src/app/mock/permission-matrix.ts`、module `mockGrants`
- `src/shared/api/mock/permission-guard.ts`（guard 判定語意不變）

### Done Command

```bash
pnpm gen:api && git diff --exit-code -- src && pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && echo DONE_COMMAND_OK
```
expected: exit 0，輸出含 DONE_COMMAND_OK（`git diff` 須在 commit 之後跑）
