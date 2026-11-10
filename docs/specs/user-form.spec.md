# User form Spec

> 狀態：**已合併**（PR #24，merge `58d7492`，2026-11-10）。DECIDED — 選項 A（owner 2026-11-11）。本棒只做編輯；新增使用者列為後續項。

讓 users 的新增／編輯頁（`src/modules/users/ui/UserForm.tsx`，目前是空殼：`isLoading = false`、`userData = null`、`onSubmit` 空函式）成為可用表單。

### User Story

身為有 `users:update` 權限的管理者，我從使用者列表點「編輯」進到 `/users/edit/$id`，看到該使用者的既有資料，修改後送出，資料經 mock API 寫入，看到成功 toast 並回到列表。

### 盤點（base `43c76a9`）

| 項目                       | 現況                                                                                                                                                                | 出處                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 路由                       | 只有 `users.list`（`/users/`）與 `users.edit`（`/users/edit/$id`，route permission `users:read`）；**無 create 路由**                                               | `src/modules/users/model/routes.ts:154-169`                                    |
| 進入點                     | 列表 rowAction `edit`（`users:update`）導到 `/users/edit/$id`；無「新增」按鈕                                                                                       | `src/modules/users/ui/UserList.tsx:156-162`                                    |
| API operation（users tag） | `listUsers` GET `/users`、`getMyProfile` GET `/user/me/profile`、`updateMyProfile` PUT `/user/me/profile`（只改**本人**）、`updateUserRole` POST `/admin/user/role` | `openapi.yaml:52-150`                                                          |
| 缺的 operation             | **依 id 讀取單一使用者**、**依 id 更新使用者（`x-permission: users:update`）**、**建立使用者** —— 三者皆不存在                                                      | 同上                                                                           |
| 權限目錄                   | `users: ["read", "update", "update-role"]`；無 `create`                                                                                                             | `src/modules/users/index.ts:366`                                               |
| 表單欄位                   | `userSchema` 扣 `created_at` / `updated_at` / `role`：user_id、email、first_name、last_name、phone_number（10 位數字）、address、remark                             | `src/modules/users/model/schema.ts`                                            |
| i18n                       | `users.userForm.*` 在 module en 字典與 core zh 字典各有一份（title 為「編輯」語意）；無 create 用標題                                                               | `src/modules/users/locales/en.json`、`src/shared/i18n/locales/zh.json:479-489` |

### Owner Decisions

- **DECISION-UF-1：A（owner 2026-11-11）**。在 `openapi.yaml` 新增 `getUser` GET `/users/{id}`（`x-permission: users:read`）與 `updateUser` PUT `/users/{id}`（`x-permission: users:update`），重跑 `pnpm gen:api`（產物不手改）；mock 以手寫 `http.*` 回 404（不存在 id），排在 orval handler 前。本棒只做編輯；新增使用者不做。
  - 不採「沿用 `updateMyProfile`」：該 operation 只改 token 本人（`src/modules/users/mocks/handlers.ts`），編輯他人會改到登入者自己。

### 後續項（不在本棒）

- 新增使用者：`createUser` POST `/users`、權限 action `users:create`（改 `src/modules/users/index.ts` 權限宣告）、`/users/create` 路由、列表「新增」按鈕、create 用 i18n 標題。等 `feat/t1-typed-permissions` 合併後另棒。

### Acceptance Criteria

- [x] AC-1：`/users/edit/$id` 載入時以 `getUser` 讀取該使用者並填入表單（行為測試：元件經 MSW）（證據：PR #24，merge `58d7492`）
- [x] AC-2：送出合法資料 → `updateUser` PUT `/users/{id}` → 成功 toast → 導回 `/users`，`["users"]` query invalidated；mock 寫入後 `listUsers` 可見（行為測試）（證據：PR #24，merge `58d7492`）
- [x] AC-3：id 不存在 → `getUser` / `updateUser` mock 回 404，表單頁顯示錯誤 toast（行為測試：handler + hook）（證據：PR #24，merge `58d7492`）
- [x] AC-4：送出鈕為 `FormSubmit permission="users:update"`；無權限 → disabled（沿用既有元件行為：`src/shared/ui/form-submit.tsx` 不隱藏）；guard 依 `x-permission` 擋 `users:read` / `users:update`（證據：PR #24，merge `58d7492`）
- [x] AC-5：新增的 i18n key zh / en 兩邊補齊（若無新增 key 則免）（證據：PR #24，merge `58d7492`）
- [x] AC-6：Done Command exit 0（證據：PR #24，merge `58d7492`）

勾選證據（AC-1～6）：PR #24「feat(users): 補完 users 編輯頁（GET/PUT /users/{id}）」，commit `307a7ad`、`eba34ab`、`e9936e2`（rebase 後 tip），merge commit `58d7492`（2026-11-10 合入 master，`gh pr view 24` state=MERGED）；Done Command exit 0。

### Touches

- `openapi.yaml`（新增兩個 operation）及 `pnpm gen:api` 產物
- `src/modules/users/model/use-user.ts`、`src/modules/users/ui/UserForm.tsx`、`src/modules/users/mocks/handlers.ts`
- `src/modules/users/locales/en.json`、`src/shared/i18n/locales/zh.json`（僅 `users.*`）
- 對應 `__tests__/`

### Must-Not-Touch

- `src/shared/permission/**`、各 module `permissions` 宣告（並行棒 `feat/t1-typed-permissions`）
- 其他 module

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm gen:api && git diff --exit-code -- src/modules/*/api src/modules/*/mocks src/app/operations.gen.ts && pnpm verify:core-only && echo DONE_COMMAND_OK
```

expected: exit 0
