# P1–P3 既有缺陷修正

來源：s1 瀏覽器驗收報告 P1–P3（早於 M7 的缺陷）。P4（`UserForm` 空殼）不在本 spec 範圍。

### User Story

身為後台管理者，我要在訂單列表看到每筆訂單的代理商編號、能刪除 banner、能新增文章，這樣日常維運不用繞路或找工程師。

### Acceptance Criteria

- [ ] (a) 訂單列表「代理商編號」欄顯示契約欄位 `vendor_id` 的 seed 值（RTL + MSW）。`src/modules/orders/ui/__tests__/order-list-vendor-id.test.tsx`
- [ ] (b) banner 列表按刪除 → 出現確認 dialog → 確認後打 `DELETE /admin/banners`（帶該筆 `banner_id`），列表移除該筆（RTL + MSW）。`src/modules/banners/ui/__tests__/banner-list-delete.test.tsx`
- [ ] (b2) banner 刪除 API 回非 2xx：只顯示錯誤 toast、不顯示成功 toast，dialog 保留、列表仍有該筆（同上測試檔；codex review 第 1 輪）
- [ ] (c) 新增文章：上傳封面後送出，打 `POST /admin/articles` 且 body 的 `image_url` 等於上傳結果（`file_name` + `/admin/images` 回傳的 `file_url`）（RTL + MSW）。`src/modules/articles/ui/__tests__/article-form-submit.test.tsx`
- [ ] (d) 編輯既有文章（不換封面）送出，打 `PUT /admin/articles` 且 `image_url` 保持原值（同上測試檔）
- [ ] (e) 既有測試全綠、build 通過、lint 無違規（Done Command）
- [x] (f) `[manual]` 瀏覽器 mock 模式各點一次：訂單列表代理商編號、banner 刪除、文章新增。**agent 已驗（chrome-devtools，2026-11-10），owner 未親驗**；owner 2026-11-10 裁決接受 agent 代驗（同 M2 / M3 AC-5 標註）。證據：代理商編號欄顯示 seed `supplier-N`；`DELETE /admin/banners` 200 後列表移除該筆；`POST /admin/articles` 200 且 body `image_url` = `/admin/images` 上傳結果

### Touches

- `src/modules/orders/ui/OrderList.tsx`：欄位 `agent_id` → `vendor_id`（契約 `openapi.yaml` 的 `Order.vendor_id`、`api/model/order.ts`）
- `src/modules/banners/ui/BannerList.tsx`：`handleDelete` 接既有 `useDeleteBanner`，沿用 tags 的確認 dialog；失敗時不關 dialog
- `src/modules/banners/model/use-banner.ts`：`useDeleteBanner` 的 `onSuccess` 在 API 錯誤（`mutationFn` 回 `undefined`）時不報成功、不 invalidate
- `src/shared/i18n/locales/zh.json`：`pages.banner.deleteConfirm` / `deleteDescription` / `confirmDelete`
- `src/modules/articles/ui/ArticleForm.tsx`：上傳／移除封面時同步表單 `image_url`（與 `BannerForm` 的 `setValue` 做法一致）
- 上列三支新測試檔

### Must-Not-Touch

- `openapi.yaml`、orval 產物（`src/modules/*/api/**`、`*.msw.ts`、`src/app/operations.gen.ts`）
- `src/app/mock/permission-matrix.ts`、各 module `mockGrants`、seed 內容
- F-1 權限宣告（`Guarded` / `rowActions` / `FormSubmit permission`）；不在元件寫 `canX &&`
- 不新增 module；`src/modules/users/ui/UserForm.tsx`（P4）
- 其他 module 的 delete hook（同樣寫法，另案）

### Milestones

- M1：P1–P3 三個缺陷各自紅燈測試 → 修正 → 綠燈，Done Command exit 0，push `fix/p1-p3-defects`（不開 PR）

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"
```

expected: exit 0（全量 vitest 若只有 `src/app/__tests__/override.integration.test.tsx` 偶發失敗，單獨重跑並照實記錄）
