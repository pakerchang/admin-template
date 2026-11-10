# Login demo accounts Spec

mock 模式的登入頁加上展示帳號角色快選（owner 2026-11-10 裁決：「角色快選按鈕」），README 補完整展示帳號表。

### User Story

身為第一次打開 demo 的人，我在 mock 模式的登入頁看到幾個代表性角色的帳號（附一句說明能看到什麼），點一下就把帳密帶進表單，不用翻 README 也能切換角色體驗權限差異；接真後端（`VITE_API_MOCK=false`）時不出現這些假帳號。

### 設計取捨

- **D1 清單放 auth 的 mock 層**（`src/modules/auth/mocks/demo-accounts.ts`），不經 users 公開 API 撈。理由：users 的 `index.ts` 只公開 `findMockUserByEmail`（以 email 查），要依角色列清單得在 users 加新 export；而 users `index.ts` 可能與並行的 F-1 分支衝突。改以測試保證 email / role 與 users seed 一致（測試是白箱，可讀 seed；正式碼不讀 users seed，守 R5）。密碼取 `DEMO_ACCOUNT.password`，不重複寫。
- **D2 由 `index.ts` 注入**：`ui` 只能 import 本 module `model`（boundaries），不能讀 `mocks/` 或 `app/`。`index.ts` 可讀本 module 各 segment，以 `createElement(LoginPage, { demoAccounts })` 把清單當 prop 傳進頁面；`LoginPage` 沒拿到清單（或空陣列）就不渲染快選區。不改 `defineModule` 契約、不加 eslint 例外。
- **D3 mock 判斷**：module 不能 import `app/mock/enabled.ts`。auth mock 層以 `demoAccountsFor(import.meta.env.VITE_API_MOCK)` 取清單，語意與 `isMockEnabled` 相同（只有 `"false"` 才關），由測試對 `isMockEnabled` 逐值比對保證等價（測試不受 boundaries 限制）。
- **D4 點擊只帶值不送出**：表單維持 uncontrolled（`FormData`），快選按鈕 `type="button"`，經 `button.form.elements` 寫入 email / password。
- **D5 i18n**：沿用現行 `login.*` 在 core 字典（`src/shared/i18n/locales/{zh,en}.json`），新增 `login.demo.*`。

### Acceptance Criteria

- [x] AC-a：mock 模式（清單非空）渲染登入頁有 5 個快選（superadmin / admin / support / partner / premium），各帶角色與說明；點擊後 email / password 欄位值為該帳號與 `admin123`，且不送出（`login` 未被呼叫）。— `src/modules/auth/ui/__tests__/login-page.test.tsx`（證據：`src/modules/auth/ui/__tests__/login-page.test.tsx`，2026-11-10 exit 0）
- [x] AC-b：非 mock 模式不顯示：`demoAccountsFor("false")` 為空、`LoginPage` 無清單時不渲染快選；`demoAccountsFor` 與 `isMockEnabled` 對 `undefined / "" / "true" / "false"` 判斷一致。— `src/modules/auth/mocks/__tests__/demo-accounts.test.ts`、`login-page.test.tsx`（證據：`src/modules/auth/mocks/__tests__/demo-accounts.test.ts`、`login-page.test.tsx`，2026-11-10 exit 0）
- [x] AC-c：快選帳號的 email / role 與 users seed 一致（每筆在 seed 找得到、role 相同）。— `demo-accounts.test.ts`（證據：`src/modules/auth/mocks/__tests__/demo-accounts.test.ts`，2026-11-10 exit 0）
- [x] AC-d：每個快選帳號經 mock handler 實際 `POST /api/auth/login` 成功，回傳 user.role 等於清單角色。— `demo-accounts.test.ts`（證據：`src/modules/auth/mocks/__tests__/demo-accounts.test.ts`，2026-11-10 exit 0）
- [x] AC-e：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` exit 0（無 boundaries 違規、無新增 eslint-disable）。（證據：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`（無輸出），2026-11-10 exit 0）
- [ ] AC-f `[manual]`：瀏覽器 `pnpm dev` 點快選 → 按登入 → 依角色看到對應畫面（留給 owner）。（owner 親驗 pending：owner 2026-11-10 裁決先註記、不阻擋交付）
- [x] AC-g：README 套用 `readme-accounts.patch`，並註明登入頁在 mock 模式有角色快選。（證據：靜態核對 `README.md`「展示帳號」表與 L43 角色快選說明，2026-11-10；`readme-accounts.patch` 原檔不在 repo，以 README 內容核對）

### Touches

- `src/modules/auth/index.ts`
- `src/modules/auth/ui/LoginPage.tsx`
- `src/modules/auth/mocks/demo-accounts.ts`（新增）
- `src/modules/auth/mocks/__tests__/demo-accounts.test.ts`（新增）
- `src/modules/auth/ui/__tests__/login-page.test.tsx`（新增）
- `src/shared/i18n/locales/{zh,en}.json`（`login.demo.*`）
- `README.md`
- `docs/specs/login-demo-accounts.spec.md`（本檔）

### Must-Not-Touch

- `src/app/mock/permission-matrix.ts`、各 module `permissions.mockGrants`、`openapi.yaml`
- users / auth 的 seed 內容（`src/modules/{users,auth}/mocks/seed.ts`）
- 其他 module 的 `ui/**`、`model/routes.ts`（F-1 分支）；`orval.config.ts`、`mocks/*.msw.ts`、kernel mock 註冊（msw 分支）
- `eslint.config.js`；不新增 module

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"
```
expected: exit 0（全量 vitest 若只有 `src/app/__tests__/override.integration.test.tsx` 偶發失敗，單獨重跑並照實記錄）
