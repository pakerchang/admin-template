---
name: declare-permission
description: 依 docs/specs/fsd-module-architecture.spec.md 宣告或修改權限（role × resource × action）。在新增 API operation、新增/改名 resource 或 action、調整角色預設 grant、讓 route / nav / 按鈕 / 表格操作依權限顯示時使用。
---

# declare-permission

權限的四個強制點（route guard、nav 過濾、操作層、MSW guard）都由宣告驅動，不在元件裡寫條件（§0.2 D5、§6）。每一步的 § 指向 `docs/specs/fsd-module-architecture.spec.md`；spec 沒寫清楚的地方**不要自己發明契約**，停下來問 owner。

## 前置條件（先確認，再動手）

先看 `CLAUDE.md`「架構遷移（進行中）」表的 milestone 狀態：

| 需要的能力 | 要等哪個 milestone 落地 |
|---|---|
| `can()`、`TModulePermissions`、`build()` 權限目錄比對 | M1 |
| 登入回 grants、mock 矩陣、route guard、`useVisibleNav`、`rowActions` / `FormSubmit` / `<Guarded>`、手寫 `src/app/operations.gen.ts`、fail-closed MSW guard | M4 |
| `openapi.yaml` 的 `x-permission` + `pnpm gen:api` 產生 operation 表 | M7 |

- **M4 之前**：權限仍由 `useUserPermissions()`（`src/pages/users/hooks/use-user.ts`）的語意方法提供（見 `CLAUDE.md`「架構」）。這段期間**允許沿用** `useUserPermissions()` 的語意方法，**禁止新增**直接比對 role 的寫法（`role === …`）或散寫 `canX && <X/>`；M4 統一換成宣告式（owner 2026-11-09 裁決）。
- **M4 到 M7 之間**：operation → permission 寫在手寫的 `src/app/operations.gen.ts`（檔頭註明 hand-maintained until M7，§4.5、§6.5 表 M4–M6 列）；其餘步驟照下文。
- **M7 起**：operation → permission **只**寫在 `openapi.yaml`（§0.5 R21）。

## 步驟

1. **權限字串格式**（§0.4 R17、§6.1）
   - `resource:action`，冒號分隔，例 `orders:read`、`users:update-role`。
   - 格式需符合 `^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$`（§4.5 extract 列）。
   - wildcard（`*`、`orders:*`）**只**出現在 grant 資料；`x-permission` 與元件宣告不得用 wildcard（§4.3 驗證 1.5.3、§6.1）。

2. **在 module 宣告權限目錄**（§0.5 R21、§6.1；型別化見 `docs/specs/typed-contracts-zod.spec.md` T1）
   ```ts
   import { z } from "zod";
   import { definePermissions } from "@/shared/permission";

   // Zod 目錄是單一來源：同一物件推出 TPermission（registry）、runtime schema 與 build() 用的 resources
   const ordersPermissions = definePermissions({
     orders: z.enum(["read", "update", "export"]),          // 含非 API 操作（orders:export）
   });

   declare module "@/shared/permission" {
     // eslint-disable-next-line @typescript-eslint/no-empty-object-type
     interface TPermissionRegistry
       extends Record<z.infer<typeof ordersPermissions.schema>, true> {}
   }

   export default defineModule({
     // …
     permissions: {
       ...ordersPermissions,                                 // catalog + resources + schema，不另寫 resources
       mockGrants: { support: ["orders:read"] },             // 角色預設 grant，只給 mock 矩陣用
     },
   });
   ```
   - 宣告與 augment 放在 module 自己的 `index.ts`：刪 module 目錄時權限一併從 `TPermission` 消失，殘留引用 `tsc` 報錯。
   - route / nav / `rowActions` / `EditActions` / `FormSubmit` / `Guarded` / `mockGrants` / `coreGrants` 的權限字串都由 registry 收窄：有 IDE 補全，寫錯 `tsc` 失敗。
   - `mockGrants` / `coreGrants` 的 key 只能是 `coreRoles`（`src/app/mock/permission-matrix.ts`，`TRoleRegistry`）；新增角色改 `coreRoles`，module 不得自創角色。
   - registry 反映「檔案在 program 內」而非「已 `.use()`」，所以 `build()` 執行期比對仍保留：每個非 public 的 operation permission、每個 nav `permission` 都必須能在已安裝 module 的目錄找到**完整的** `resource:action`，否則 `build()` throw（§4.3 驗證 1.4、1.5.3）。
   - `session.grants` 進前端時（`setAuth` 寫入前、`getAuth()` 讀出後）以已 `.use()` module 組出的 grant schema 逐筆 `safeParse`，不合法者丟棄；schema 由 `build()` 注入，測試要先 `build()` 再 `setAuth`。
   - 測試要刻意用目錄外的字串（測 `build()` throw、`can()` 負向）時，以 `string` 宣告再於注入點 cast（`p as TPermission`），不要放寬 `TPermission`。
   - core 角色與 grant（`app:access` 等）在 `src/app/mock/permission-matrix.ts`，不在 module（§6.1）。
   - ABAC 條件（`conditions`）不在 M1–M8 範圍，不要加（§0.4 R16、§6A）。

3. **宣告 operation 的權限**（§4.5、§6.5）
   - M7 起在 `openapi.yaml` 該 operation 寫 `x-permission: <resource:action>`。
   - 公開 operation（例 login）：**同時**寫 `x-permission: public` 與 `security: []`；缺 `security: []` → extract 失敗（§0.5 R21）。
   - 非 public 的 operation **不得**寫 `security: []` → extract 失敗（§0.6 R27）。
   - 每個 operation 都要宣告，沒有預設值（fail-closed，§0.4 R13）。未宣告 → `build()` throw、guard 回 403。
   - 改完跑 `pnpm gen:api` 重產 `src/app/operations.gen.ts`。M4–M6 則直接手改該檔（同形狀 `{ routes, permissions }`）。

4. **route guard**（§6.2）
   - `ctx.page` / `ctx.layout` 的 `permission` 必填；只需登入時顯式寫 `"authenticated"`。
   - 無權限時內容區顯示 `shell.Forbidden`、URL 與 shell 保留；不要新增 `/403` route（§0.3 R10）。

5. **nav**（§6.3）：`TNavItem.permission` 必填；shell 只經 `useVisibleNav()` 取 nav，不自行過濾。

6. **操作層：宣告式，不寫條件**（§6.4）
   - 表格：`<DataTable rowActions={[{ id, label, permission, denied?, onSelect }]} toolbarActions={…} />`，`denied` 預設 `"hide"`。
   - 編輯動作：`EditActions` 的 `onEdit` / `onView` / `onDelete` 為 `{ handler, permission }`。
   - 表單送出：`<FormSubmit permission="orders:update" />`（無權限 disabled）。
   - 其他低頻場景：`<Guarded permission="orders:export" denied="hide">…</Guarded>`。
   - `modules/**`、`shells/**` 禁用 `useCan`、禁讀 session `.role`（§6.4、§7.2 lint）。

7. **MSW guard 行為（只需理解，不要改）**（§6.5）
   - 判定順序：不在 `apiBaseUrl` 下 → 放行；對不到 operation → 404；未宣告 → 403；`public` → 放行；`can()` 為真 → 放行；否則 403（未帶 token 也是 403，§0.6 R25）。
   - mock 模式 `VITE_API_BASE_URL` 必須是**專用的絕對 origin**，不可與 app 同源（§0.6 R24）。

## 驗證

```bash
pnpm gen:api && git diff --exit-code -- src/modules src/app/operations.gen.ts   # M7 起
pnpm exec vitest run src/app/kernel src/shared/permission                         # build() 權限目錄比對、can()
pnpm build && pnpm exec vitest run                                                # done 基線；不要用 pnpm test（watch 會掛住）
```

`build()` 錯誤訊息對照：`has no permission declared` → 步驟 3；`not in any installed module's permission catalog` → 步驟 2（§4.3 驗證 1.5）。
