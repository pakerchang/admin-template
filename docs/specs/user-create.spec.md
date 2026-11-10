# User create Spec

> 狀態：**DRAFT — Owner Decisions（OD-UC-1～4）已裁決**（main 代裁 2026-11-11，owner 可覆核；見 §Owner Decisions）。本 spec 接續 `docs/specs/user-form.spec.md` 列的「後續項：新增使用者」。
>
> **排程**：實作排在 **I1（`docs/specs/i18n-scope-migration.spec.md` scope 搬遷）合併之後**。I1 會改到 users module（`locales/`、`ui/UserForm.tsx` 的 i18n key、`index.ts` 的 `i18n` / `routeTitles`）；本 spec 的 i18n key 位置以 I1 落地後的版面為準，Touches 可能因 I1 調整（實作棒開工前以 I1 合併後的 master 重新核對本節盤點的行號與路徑）。

### User Story

身為有 `users:create` 權限的管理者，我在使用者列表點「新增」進到 `/users/create`，看到空白的使用者表單，填完送出，資料經 mock API 寫入，看到成功 toast 並回到列表，列表裡看得到新使用者。

### 盤點（base `67a8aee`）

| 項目 | 現況 | 出處 |
| --- | --- | --- |
| 權限目錄 | `users: z.enum(["read", "update", "update-role"])`；無 `create` | `src/modules/users/index.ts:13-15` |
| 角色 grants | users module `mockGrants: { admin: ["users:read"] }`；core `admin: ["app:access"]`、`superadmin: ["*"]`；support / partner 沒有任何 `users:*` | `src/modules/users/index.ts:32`、`src/app/mock/permission-matrix.ts:20-25` |
| 路由 | `users.list`（`/users/`）、`users.edit`（`/users/edit/$id`，`users:read`，F-1 D2 例外）；**無 create** | `src/modules/users/model/routes.ts` |
| 表單 | `UserForm` 以 `useParams` 取 `id`、`useGetUser(id)`（`enabled: Boolean(id)`）、送出走 `useUpdateUser`、`FormSubmit permission="users:update"`、`disabled={!isDirty \|\| isPending}` | `src/modules/users/ui/UserForm.tsx` |
| 列表入口 | 只有 rowActions `edit`（`users:update`）、`update-role`；無新增按鈕 | `src/modules/users/ui/UserList.tsx:154-170` |
| 其他 module 的新增按鈕慣例 | `<Guarded permission="<res>:create">`（只支援 `denied="hide"`）包按鈕 | `src/modules/suppliers/ui/SupplierList.tsx:300`、`src/shared/ui/guarded.tsx` |
| API | `/users` 只有 `listUsers` GET；`/users/{id}` 有 `getUser` / `updateUser` | `openapi.yaml:52-132` |
| 錯誤回應 | `components/responses/Error` 描述只有 401 / 403 / 404；整份 YAML 無 400 / 409 | `openapi.yaml:953-958` |
| mock | 記憶體 collection `createCollection(users, "user_id")`；`collection.create` 會把整個 body 寫進去（無白名單）、id = `user-${Date.now()}`、回 `{ message }` | `src/modules/users/mocks/handlers.ts`、`src/shared/api/mock-db.ts:95-105` |
| login 查帳號 | `findMockUserByEmail` = `collection.all().find(email)`，取第一筆；密碼一律比對 demo 密碼 | `src/modules/users/mocks/handlers.ts`、`src/modules/auth/mocks/handlers.ts:18-20` |
| kernel 窮舉測試 | `CASES` 必須恰好覆蓋所有非 GET operation | `src/app/mock/__tests__/mock-handlers.test.ts:107-188` |
| 結構測試 | `.create/.edit/.draft` route 不得是 `:read`，且計數寫死 `toBe(7)` | `src/app/__tests__/permission-structure.test.ts:45-57` |

### 設計

1. **權限**（`declare-permission` 步驟 2）：`src/modules/users/index.ts` 的 `definePermissions` 改為 `users: z.enum(["read", "create", "update", "update-role"])`；`TPermissionRegistry` augment 不動（由 schema 推導）。`mockGrants` **不動**（OD-UC-1 = A：只有 superadmin 經 `*` 擁有 `users:create`）。
2. **API**（`declare-permission` 步驟 3）：`openapi.yaml` 的 `/users` 補 `post`：
   - `operationId: createUser`、`tags: [users]`、`x-permission: users:create`（不寫 `security: []`）。
   - requestBody `required: true`，schema 新增 `components/schemas/UserCreate`：`email`、`first_name`、`last_name`、`phone_number`、`address`、`remark`（`required` = `email`、`first_name`、`last_name`、`phone_number`、`address`，`remark` 選填，對齊 `userSchema`，OD-UC-3 = A；**不含 `role`**，OD-UC-2 = A）。不含 `user_id` / `created_at` / `updated_at`。
   - responses：`200` = `ApiEnvelope` + `data: User`（與 `updateUser` 同形，回建立後的使用者）；`400`（body 不合法）、`403`、`409`（email 重複，OD-UC-4 = A）皆 `$ref: Error`；`Error` 描述補上 400 / 409。
   - 跑 `pnpm gen:api`，產物（`api/users.ts`、`api/model/*`、`mocks/users.msw.ts`、`src/app/operations.gen.ts`）不手改。
3. **mock**（`src/modules/users/mocks/handlers.ts`）：
   - 手寫 `http.post("*/users", …)` 排在 orval `getCreateUserMockHandler` **之前**（TRAPS B「orval MSW handler 回不了 4xx」）：body 以與表單相同的 Zod schema（`model/schema.ts` 的 `userSchema` 扣 `user_id` / `role` / 時間戳，OD-UC-3 = A）`safeParse`，失敗 → `errorResponse(400, …)`；email 與既有使用者重複（不分大小寫）→ `errorResponse(409, …)`（OD-UC-4 = A）；否則 fall through。
   - orval `getCreateUserMockHandler` override：只取白名單欄位（沿用 `USER_FIELDS`），`role` 一律為 `user`（OD-UC-2 = A），`user_id` 由 mock 產生且**同一 runtime 內不重複**（同毫秒連建兩筆也不同；不得直接用 `collection.create`——它不過濾欄位、id 以 `Date.now()` 產生），`created_at` / `updated_at` = `now()`，寫入 `collection.all()`（放最前，與 `collection.create` 一致）後回 `ok(user)`。body 帶的 `user_id` / `role` / `created_at` 等非白名單欄位一律忽略。
   - 不改 `src/shared/api/mock-db.ts`。
4. **model**（`src/modules/users/model/use-user.ts`）：新增 `useCreateUser`，形狀同 `useUpdateUser`：`createUser(body).catch(nullOnApiError)`，失敗 → 錯誤 toast、回 `undefined`；成功 → `invalidateQueries({ queryKey: ["users"] })`、成功 toast、回建立的使用者。
5. **路由**（`src/modules/users/model/routes.ts`）：`TRouteIdRegistry` 加 `"users.create"`；`base` 底下新增 `ctx.page({ path: "create", permission: "users:create", routeId: "users.create", component: pages.create })`；`index.ts` 傳入 `create: UserFormPage`（沿用同一元件）。`/users/create` 不得被 `edit/$id` 吃掉。
6. **表單**（`src/modules/users/ui/UserForm.tsx`，新增 / 編輯同一元件，以有無 `id` 分模式）：

   | | 新增（無 `id`） | 編輯（有 `id`） |
   | --- | --- | --- |
   | 讀取 | **不呼叫** `getUser`（現行 `enabled: Boolean(id)` 已成立，AC 鎖住） | `getUser` 填入 |
   | 初始值 | `DEFAULT_VALUES` | `getUser` 回傳值 |
   | 送出 | `useCreateUser`，body 不帶 `user_id` | `useUpdateUser`（不變） |
   | 送出鈕 | `FormSubmit permission="users:create"` | `FormSubmit permission="users:update"`（不變） |
   | 標題 | create 用標題 key（新增） | 現行標題 |
   | 成功 | invalidate `["users"]` → 成功 toast → `navigate({ to: "/users" })`（順序以現行 `use-user.ts` 為準） | 同（不變） |
   | 失敗（400 / 409 / 403） | 錯誤 toast，留在表單、輸入不清空 | 不變 |

   送出鈕 `disabled={!isDirty || isPending}` 兩模式沿用。schema 與編輯共用 `userSchema` 扣 `user_id` / `role` / 時間戳（OD-UC-3 = A；新增模式不得要求 `user_id` 非空）。表單不含 role 欄位（OD-UC-2 = A）；409 只顯示 create 錯誤 toast，不做欄位級錯誤（OD-UC-4 = A）。
7. **列表**（`src/modules/users/ui/UserList.tsx`）：標題區加新增按鈕，沿用其他 module 慣例 `<Guarded permission="users:create">` 包 `<Button>`（無權限 → **隱藏**；`Guarded` 只支援 hide），點擊 `navigate({ to: "/users/create" })`。不寫 `canX &&` 條件。
8. **i18n**：新增 key（create 標題、新增按鈕文字、`create.success` / `create.error` toast）放在 I1 落地後 `userForm.title`、`toast.user.update.*` 所在的同一字典、同一命名規則下，zh / en 兩邊補齊；I1 的 `key-ownership.test.ts` 須仍通過。

### Acceptance Criteria

- [ ] AC-1 權限目錄：`users:create` 在 users 目錄內，`TPermission` 收得到；`permissions.mockGrants` 不變（admin 仍只有 `users:read`，OD-UC-1 = A）。測試：`src/app/kernel/__tests__/operations-gen.test.ts` 加 `const ok: TOperationPermission = "users:create"`；`pnpm build` 通過。
- [ ] AC-2 API 契約：`openapi.yaml` 有 `createUser` POST `/users`（`x-permission: users:create`、無 `security: []`）；`pnpm gen:api && git diff --exit-code -- src/modules/*/api src/modules/*/mocks src/app/operations.gen.ts` exit 0；`pnpm exec vitest run src/app/kernel/__tests__/operations-yaml.test.ts` exit 0。
- [ ] AC-3 mock 建立：`src/modules/users/mocks/__tests__/handlers.test.ts` 新增：(a) 合法 body → 200、回 `data.user_id` 為新 id、`listUsers` 讀得到該筆；(b) body 帶 `user_id` / `created_at` / `role`（如 `"superadmin"`）被忽略，建出的 role 為 `user`（OD-UC-2 = A）；(c) 連續建立兩筆 id 不同；(d) 缺必填欄位 / email 格式錯 / phone 非 10 位數字 → 400（不是 422，OD-UC-3 = A），collection 筆數不變；(e) email 重複（含大小寫不同）→ 409（OD-UC-4 = A），筆數不變。
- [ ] AC-4 kernel 窮舉：`src/app/mock/__tests__/mock-handlers.test.ts` 的 `CASES` 補 `"POST /users"`（合法 payload → `{ code: 200, data: { email: … } }`），「case table covers exactly the non-GET operations」與 `it.each(writes)` 通過；guard：只有 `users:read` 的 session `POST /users` → 403（同檔角色段落加一條）。
- [ ] AC-5 路由與結構：`src/app/__tests__/router-matching.test.ts` 加 `/users/create` 解析到 `users.create`（不是 `edit/$id`）；`src/app/__tests__/permission-structure.test.ts` 的 form route 計數 7 → 8，且 `users.create` 的 permission 為 `users:create`（不加進 `EXCEPT`）。
- [ ] AC-6 表單新增模式（行為測試，元件經 MSW）：`src/modules/users/ui/__tests__/user-create.test.tsx`：(a) `/users/create` 不發出 `GET /users/{id}`、欄位為空、顯示 create 標題；(b) 填合法資料送出 → `POST /users` → `["users"]` invalidated → 成功 toast → 導到 `/users`；(c) mock 回 400 / 409 → create 錯誤 toast（無欄位級錯誤）、仍在 `/users/create`、輸入保留；(d) 無 `users:create` 的 grants → 送出鈕 disabled（`FormSubmit` 既有行為）；(e) 表單無 role 欄位（OD-UC-2 = A）。編輯模式既有 `user-form.test.tsx` 不改仍通過。
- [ ] AC-7 列表按鈕：`src/modules/users/ui/__tests__/user-list.test.tsx`：有 `users:create` → 顯示新增按鈕、點擊導到 `/users/create`；只有 `users:read` → 按鈕不存在。`src/app/__tests__/write-entry-permissions.test.tsx` 補 admin 角色斷言（OD-UC-1 = A）：admin 在 `/users` 看不到新增按鈕、直接進 `/users/create` 內容區 403；superadmin 看得到並可進。
- [ ] AC-8 i18n：新增 key zh / en 兩邊皆有；`pnpm exec vitest run src/shared/i18n` exit 0（含 I1 的 `key-ownership.test.ts`）。
- [ ] AC-9 core-only：`pnpm verify:core-only` 印 `core-only build: OK`（users 為 generic module，留在 core-only）。
- [ ] AC-10：Done Command exit 0。

### Touches

（I1 合併後可能調整路徑 / 行號；i18n 字典位置以 I1 結果為準）

- `openapi.yaml`（`/users` post、`UserCreate` schema、`Error` 描述）及 `pnpm gen:api` 產物
- `src/modules/users/index.ts`（權限目錄、`create` page 注入；`mockGrants` 不動，OD-UC-1 = A）
- `src/modules/users/model/{routes.ts,use-user.ts}`（`model/schema.ts` 原則上不動，create 由 `userSchema` 衍生；OD-UC-3 = A）
- `src/modules/users/ui/{UserForm.tsx,UserList.tsx}`
- `src/modules/users/mocks/handlers.ts`
- users 的 i18n 字典（I1 後位置）
- 測試：`src/modules/users/{mocks,ui}/__tests__/**`、`src/app/mock/__tests__/mock-handlers.test.ts`、`src/app/__tests__/{router-matching.test.ts,permission-structure.test.ts,write-entry-permissions.test.tsx}`、`src/app/kernel/__tests__/operations-gen.test.ts`

### Must-Not-Touch

- `src/shared/permission/**`、`src/shared/ui/{guarded.tsx,form-submit.tsx}`（沿用既有行為，不為本棒擴充 `Guarded` 的 disable）
- `src/app/mock/permission-matrix.ts` 的 `coreRoles` / `coreGrants`（users 權限只經 users module `mockGrants`）
- `src/shared/api/mock-db.ts`、kernel guard（`src/shared/api/mock/permission-guard.ts`）、origin 圍欄
- 其他 module；I1 的 i18n 基礎設施（`src/shared/i18n/{i18n.ts,types.ts}`、kernel 組 key 邏輯）
- 產物檔手改（`api/**`、`mocks/users.msw.ts`、`operations.gen.ts`）
- `users.edit` 的 route permission 與 F-1 D2 例外（不在本棒）

### Owner Decisions

> **已裁決**：OD-UC-1～4 皆採 **A**（main 代裁 2026-11-11，owner 可覆核）。依據：最小改動、不重開既有裁決、與 R5 / OD-GRANT-1 一致。下列選項表保留供追溯；設計、AC、Touches 已依裁決收斂，不再保留非採用選項的條件式 AC。

#### OD-UC-1 角色 grants：誰拿 `users:create`

> **裁決**（main 代裁 2026-11-11，owner 可覆核）：**採用 A**：只有 superadmin（`*`）擁有 `users:create`，角色矩陣不動（依 OD-GRANT-1）。

現況 admin 只有 `users:read`（連 `users:update` 都沒有，OD-GRANT-1 已覆核），support / partner 沒有任何 `users:*`、連 `/users` 都進不去；superadmin 由 `*` 自動涵蓋。

| 選項 | 內容 | 後果 |
| --- | --- | --- |
| **A（採用）** | 不給任何角色，只有 superadmin（`*`）能新增 | 矩陣不動、與 OD-GRANT-1「admin 對 users 唯讀」一致；admin 看不到新增按鈕、進 `/users/create` 內容區 403 |
| B | 給 admin `users:create` | admin 能新增卻不能編輯（無 `users:update`），權限形狀不對稱；等於重開 OD-GRANT-1 |
| C | 給 admin `users:create` + `users:update` | 對稱，但改了已定案的矩陣，且 `users.edit` 的 D2 例外連帶要重審；超出本 spec 範圍 |

理由：本 spec 只加能力，不改既定角色邊界；要放寬 admin 應另開 grants 議題一次處理 create / update。support / partner 一律不給。

#### OD-UC-2 新增時可否指定 role

> **裁決**（main 代裁 2026-11-11，owner 可覆核）：**採用 A**：表單不帶 role，mock 一律建為 `user`，body 的 `role` 忽略。

| 選項 | 內容 | 後果 |
| --- | --- | --- |
| **A（採用）** | 表單不帶 role；mock 一律建為 `user`，body 帶 `role` 忽略 | `users:create` 不會變成繞過 `users:update-role` 的提權管道；要改角色走既有 rowAction `update-role` |
| B | 表單加 role 下拉，`UserCreate` 含 `role` | 需再定「指定 role 是否也要 `users:update-role`」與 role 上限（能否建 superadmin），範圍與風險都變大 |

#### OD-UC-3 必填欄位與非法 body

> **裁決**（main 代裁 2026-11-11，owner 可覆核）：**採用 A**：與編輯表單共用 `userSchema`（扣 `user_id` / `role` / 時間戳），不合法回 **400**（沿用現有 mock 錯誤慣例，不新增 422）。

| 選項 | 內容 | 後果 |
| --- | --- | --- |
| **A（採用）** | 與編輯表單相同：`userSchema` 扣 `user_id` / `role` / 時間戳；email 格式、first / last name / address 非空、phone 10 位數字必填，remark 可空；mock 用同一 schema 驗，不合法 → 400 | 前後端同一份規則、零新驗證邏輯；YAML `UserCreate.required` 對齊 |
| B | 只要求 email + 姓名，其餘選填 | 要另寫一份 create schema，且建出的使用者在編輯表單會因必填欄位空白而無法直接送出 |

非法 body 狀態碼採 **400**（YAML 目前無 400 / 422 先例，沿用現有 mock 錯誤慣例，不新增 422）。

#### OD-UC-4 email 重複

> **裁決**（main 代裁 2026-11-11，owner 可覆核）：**採用 A**：不分大小寫查重，重複回 409 + create 錯誤 toast，不做欄位級錯誤。

| 選項 | 內容 | 後果 |
| --- | --- | --- |
| **A（採用）** | mock 不分大小寫檢查重複 → 409，前端顯示 create 錯誤 toast（不做欄位級錯誤對應） | 避免 `findMockUserByEmail` 取第一筆導致 login 撞到錯的帳號；成本一個 `some()` |
| B | 不檢查 | 可建出同 email 帳號，新帳號排在最前會遮蔽原帳號的 login（以 demo 密碼登入時拿到新帳號的 role） |
| C | 409 + 欄位級錯誤（email 欄位標紅） | 體驗較好，但要新增 server error → RHF `setError` 的對應機制，目前 codebase 無先例 |

備註（不需裁決）：新建帳號沒有密碼欄位；mock login 對所有帳號比對同一個 demo 密碼（`auth/mocks/handlers.ts:20`），新帳號因此可用 demo 密碼登入，role `user` 無 `app:access` 進不了後台。沿用現況，不在本棒處理。

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm gen:api && git diff --exit-code -- src/modules/*/api src/modules/*/mocks src/app/operations.gen.ts && pnpm verify:core-only && echo DONE_COMMAND_OK
```

expected: exit 0

> 執行時機：完整 Done Command 須在實作 **commit 之後**執行（`verify:core-only` 以 `git worktree add --detach … HEAD` 建副本，只驗已 commit 內容），並核對其輸出 `== core-only: copy HEAD <sha>` 的 SHA 即為待驗收 commit。
