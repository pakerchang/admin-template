# admin-template deps P4：Zod 3 → 4

> **審查對象 repo = `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p4-zod4`，範圍 = `refactor/integration..chore/deps-p4-zod4`**（base `refactor/integration` = `8458b19`）。
> 不是 `~/.claude`；`~/.claude` 裡 `settings.json`、`scripts/` 的未提交改動屬 owner，與本審查無關。

Lead 裁決：D1 image-validation function schema → `z.custom<Fn>()`，推導型別須與 v3 等價；D2 `use-product` 只在 tsc 報錯時改 `useForm` generics，不拿掉 coerce；D3 建議改 13 檔進 commit 2，`message` → `error` 不改。

### User Story

身為 admin-template 維護者，我要把 `zod` 從 3.25 升到最新 4.x，並把 v3 deprecated 寫法遷移成 v4 寫法，讓依賴保持最新、且表單驗證行為與型別不變。

### Acceptance Criteria

- [x] AC1 `package.json` 的 `zod` 為最新 4.x，`pnpm-lock.yaml` 同步，`pnpm install --frozen-lockfile` 通過。
- [x] AC2 必改 3 檔完成：`image-validation/schemas.ts` 移除 `z.function().args().returns()` 與 `z.promise`（改 `z.custom<Fn>()`）；`types.ts` 推導型別不變；`banner-form-validation.test.ts` 的 `ZodError.errors` → `.issues`。
- [x] AC3 D1 型別等價有證據：新增 type-level 斷言測試（`expectTypeOf(...).toEqualTypeOf<...>()`），`src/plugins/image-validation/__tests__/types.test.ts` 的同一份斷言，在 v3（base `8458b19` 的 zod 3，將該檔複製進暫時 detached worktree）與 v4（HEAD）下都通過 `pnpm exec tsc -b tsconfig.app.json`（其 `include: src/**/*` 已涵蓋測試檔）。（lead 裁決修訂：原寫 `tsc -p tsconfig.test.json --noEmit`，但該指令在 base `8458b19` 就因與 zod 無關的錯誤 exit 1——`src/pages/orders/utils/copy-order.ts(127,14): error TS2742`（`composite: true` 觸發 declaration 可攜性檢查）——故放棄改用 app config；不修 `copy-order.ts`。）
- [x] AC4 U1：`use-product.ts` 的 `z.coerce.number()` 保留（執行期 coerce 不變）；只有在 tsc 報錯時才修型別，報告註明是否觸發。實測觸發，且有兩個根因：(a) `.extend(cond ? A : B)` 在 v4 推成兩個 object 的 union → 以逐 key 合併的 shape 型別標註還原 v3 行為；(b) coerce input 為 `unknown` → 採 `z.coerce.number<number>()`（v4 官方 input generic，表單以 `valueAsNumber` 註冊）取代 D2 的 `useForm` generics 路線，因後者會連帶改 6 處 `errors.product_*` 與 `field-comparison.ts`；偏離理由見交付報告；**lead 已接受此偏離**（改動面更小、執行期 coerce 不變）。證據：v3 / v4 的 `TProductForm` 以 `--noErrorTruncation` 印出比對。
- [x] AC5 commit 2 只含 API 寫法遷移（`.email/.url/.datetime` → 頂層 `z.email/z.url/z.iso.datetime`、`.merge` → `.extend(X.shape)`），無行為變更、不改業務驗證規則；每種替換有 zod 4.6.7 實測對照（相同輸入 → 相同 success / issues）。行為不等價的替換不做（見 Touches）。
- [x] AC6 `vitest run` 測試檔數與測試數 ≥ 基線（23 files / 227 tests），全過、無 skip、未刪測試。v4 email/url 驗證行為差異若導致斷言變動，逐條說明。
- [x] AC7 commit 1 與 commit 2 各自都能 build + test 通過（Done Command）。
- [x] AC8 commit message 無 AI 署名；不 push、不開 PR、不 merge。

### Touches

Commit 1 `chore(deps): upgrade to Zod 4`：
- `package.json`
- `pnpm-lock.yaml`
- `src/plugins/image-validation/schemas.ts`
- `src/plugins/image-validation/types.ts`（僅在需要時；推導型別必須不變）
- `src/plugins/image-validation/__tests__/types.test.ts`（新增：D1 型別等價斷言）
- `src/pages/banners/__tests__/form/banner-form-validation.test.ts`
- `src/pages/product/hooks/use-product.ts`——僅 U1 觸發時（已觸發；只改此檔，`useForm` 呼叫端不動）
- `src/services/schemas/orders.ts`：僅 `z.nativeEnum` → `z.enum`（v4 標 deprecated，ESLint `import/no-deprecated` + `--max-warnings 0` 讓 commit 1 不綠，故提前；同檔 `.datetime()` 仍在 commit 2）

Commit 2 `refactor(zod): migrate deprecated v3 APIs`：
- `src/services/schemas/{orders,product,staff,supplier,tag,user,customer,banner}.ts`

D3 原列的 5 個表單檔（`use-banner.ts`、`use-supplier.ts`、`use-staff.ts`、`ImageDialog.tsx`、`LinkDialog.tsx`）**不改**：zod 4.6.7 實測（node 對照腳本）證明「帶自訂訊息」的寫法替換並非同一驗證語意——`z.email({message})` 會把自訂訊息套到 non-string 的 `invalid_type`；`.min(1).url()` 改成頂層 `z.url().min(1)` 會讓空字串的 `issues[0]` 從必填訊息變成網址訊息。違反 D3「只做寫法替換、不改驗證語意」，故保留 deprecated 寫法（仍可用、lint 不報）；**lead 已接受**此 5 檔不改。`banner-form-validation-flow.md` 隨 `use-banner.ts` 不動。

### Must-Not-Touch

- 主 checkout `/Users/pakerchang/Documents/nf_github/sideproject/admin-template` 的檔案、git stash、整合 worktree。
- 業務驗證規則（訊息文字、refine 條件、coerce 行為）。
- `message` → `error` 的改寫（可留）。
- `@hookform/resolvers`、`react-hook-form` 版本。
- 其他 import zod 但只用相容 API 的檔（`ImageUploadDialog.tsx`、`ArticleForm.tsx`、`use-article.ts`、`use-tag.ts`、`article.ts`、`services/types/schema.ts`）。

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p4-zod4 && \
pnpm install --frozen-lockfile && \
pnpm build && \
pnpm exec vitest run && \
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" vite.config.ts --max-warnings 0 && \
pnpm exec prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}" && \
echo DONE_COMMAND_OK
```

expected: 最後一行 `DONE_COMMAND_OK`，exit 0。

註：原派工的 `pnpm exec tsc -p tsconfig.test.json --noEmit` 已移除——它在 base `8458b19` 就 exit 1（`src/pages/orders/utils/copy-order.ts(127,14): error TS2742`，`composite: true` 觸發 declaration 可攜性檢查，與 zod 無關），依派工指示不修。型別覆蓋改由 `pnpm build`（`tsc -b tsconfig.app.json`，其 `include: src/**/*` 已涵蓋測試檔與 D1 型別斷言）保證。
