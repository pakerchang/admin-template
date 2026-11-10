# F-1 寫入入口補權限宣告 Spec

M4 後 support / partner 可以進後台（OD-GRANT-1，owner 2026-11-10 接受現況矩陣），但 tags、suppliers、team-members、banners、articles 的寫入入口沒有接權限宣告，唯讀角色看得到新增 / 編輯 / 刪除 / 拖曳排序，也能進 create / edit 表單（送出後 mock guard 回 403）。product 同樣沒接，只是現在矩陣裡沒有只讀 product 的角色。本棒照 `fsd-module-architecture.spec.md` §6.4 補宣告，矩陣不動。

來源：`s2-grants-review-report.md` §5（owner 裁決「接受矩陣＋修 F-1」）、§6（Touches / AC 草稿）。

### User Story

身為只有唯讀權限的後台使用者（support / partner），我在 tags、suppliers、team-members、banners、articles、product 頁面不會看到我不能用的新增 / 編輯 / 刪除 / 排序入口；直接輸入 create / edit 網址時，內容區顯示 403，網址不變。admin 的畫面不變。

### Acceptance Criteria

- [ ] AC-1：以 support、partner 的 grants（`permission-matrix` + module `mockGrants` 展開）渲染 tags、suppliers、team-members、banners、articles 列表頁，新增 / 編輯 / 刪除入口不渲染；banners 的上下架按鈕與拖曳排序也不出現。admin 都看得到。product 以合成 grants `["app:access", "product:read"]` 驗同一件事（含「複製為新商品」入口，因為它進 draft 表單建立新商品）。測試：`src/app/__tests__/write-entry-permissions.test.tsx`。
- [ ] AC-2：partner 直接進 `/articles/create`、`/banners/edit/$id`，合成 `product:read` 進 `/products/create`、`/products/edit/$id`、`/products/draft/$id`，內容區顯示 `shell.Forbidden`，URL 不變；admin 進同樣網址不顯示 Forbidden。測試：同上檔。
- [ ] AC-3：結構性測試：routeId 結尾為 `.create` / `.edit` / `.draft` 的 route，`staticData.permission` 不是 `:read`。例外：`users.edit` 維持 `users:read`（D2：owner 已接受「admin 可開表單、送出鈕 disabled」，且該表單是 stub、無對應 API；改成 `users:update` 會讓 admin 從 disabled 表單變成 403，屬另一個行為變更）。測試：`src/app/__tests__/permission-structure.test.ts`。
- [ ] AC-4：`src/app/mock/__tests__/role-visibility.test.tsx` 的 nav 期望值與 `EXPECTED_GRANTS` 不變（只改註解字樣），測試通過。
- [ ] AC-5 `[manual]`（留給 owner）：瀏覽器以 carol@example.com（support）/ david@example.com（partner），密碼 admin123 登入，逐頁確認看不到寫入入口、直接開 create / edit 網址看到 403。

### 做法（§6.4）

- 列操作：`EditActions { handler, permission }`（tags / suppliers / team-members 的 tooltip 按鈕改用它）。
- 新增鈕、banners 卡片按鈕、product「複製為新商品」：`<Guarded permission>`。`Guarded` 在 §6.4 有定義但 repo 尚未實作，本棒在 `src/shared/ui/guarded.tsx` 補上；除 `denied="hide"` 外加 `fallback`（無權限時改渲染的內容），供 banners 拖曳排序在無 `banners:update` 時退回不可拖曳的 grid。
- 表單送出：`FormSubmit`（articles / banners 依模式給 `:create` / `:update`；product create / draft = `product:create`、edit = `product:update`）。
- route：articles / banners / product 的 create、draft 改 `:create`，edit 改 `:update`。
- tags / suppliers / team-members 是對話框、無子 route；新增與編輯入口都隱藏後對話框打不開，對話框內送出鈕不改（YAGNI）。

### Touches

- `src/shared/ui/guarded.tsx`（新增）
- `src/modules/tags/ui/TagList.tsx`、`src/modules/suppliers/ui/SupplierList.tsx`、`src/modules/team-members/ui/TeamMemberList.tsx`
- `src/modules/banners/ui/BannerList.tsx`、`src/modules/banners/ui/components/ImageCard.tsx`、`src/modules/banners/ui/BannerForm.tsx`、`src/modules/banners/model/routes.ts`
- `src/modules/articles/ui/ArticleList.tsx`、`src/modules/articles/ui/ArticleForm.tsx`、`src/modules/articles/model/routes.ts`
- `src/modules/product/ui/ProductList.tsx`、`ProductCreateForm.tsx`、`ProductEditForm.tsx`、`ProductDraftForm.tsx`、`src/modules/product/model/routes.ts`
- 測試：`src/app/__tests__/write-entry-permissions.test.tsx`（新增）、`src/app/__tests__/permission-structure.test.ts`、`src/modules/banners/ui/__tests__/form/banner-form.test.tsx`（「驗證失敗 → 送出 disabled」補 `GrantsContext ["*"]`，否則改用 `FormSubmit` 後會因缺權限而假綠）、`src/modules/product/ui/__tests__/product-list-integration.test.tsx`（TestWrapper 補 `GrantsContext ["*"]`，新增鈕改 `<Guarded>` 後沒給 grants 會被隱藏）
- 文字同步：`docs/specs/fsd-module-architecture.spec.md` §6.1 表格標題、`src/app/mock/__tests__/role-visibility.test.tsx` 註解、`docs/specs/refactor/README.md`（M4 列、行為變更待覆核、s29 F-1）、`CLAUDE.md` milestone 表 M4 列
- `docs/specs/f1-permission-declarations.spec.md`（本檔）

### Must-Not-Touch

- `src/app/mock/permission-matrix.ts`、各 module `permissions.mockGrants`、`openapi.yaml`、`src/app/operations.gen.ts`
- `role-visibility.test.tsx` 的 `EXPECTED_GRANTS` 與 nav 期望值
- `fsd-module-architecture.spec.md` §9 各 milestone 的 AC 區段
- users / orders / consumers module（`users.edit` 見 AC-3 例外）
- 不新增 module；元件內不寫 `canX &&`、不比對 role、modules 不呼叫 `useCan`

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"
```
expected: exit 0
