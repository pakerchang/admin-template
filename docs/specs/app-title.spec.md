# App title Spec

sidebar 標題與瀏覽器分頁標題改成符合專案的名稱（owner 2026-11-10 裁決）。舊名（zh「…後台」／en「… Admin」，前綴為舊客戶品牌）是舊客戶專案遺留。

### User Story

身為打開 demo 的人，我在 sidebar 與瀏覽器分頁看到的是這個專案的名稱（中文「後台管理範本」、英文「Admin Template」），而不是舊客戶的品牌名。

### Acceptance Criteria

- [x] AC-a：渲染 `AppSidebar`，zh 語系顯示「後台管理範本」、en 語系顯示「Admin Template」。— `src/shells/default/__tests__/app-sidebar.test.tsx`（證據：Done Command exit 0，2026-11-10；改字串前紅燈：收到舊標題）
- [x] AC-b：repo 內（排除 `node_modules` / `dist` / `.git`）不再出現舊客戶品牌字樣（pattern `DAM[A]`，以字元類避免本檔自我匹配）。— `! grep -rn 'DAM[A]' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .`（證據：Done Command exit 0，2026-11-10）
- [x] AC-c：`index.html` 的 `<title>` 為 `Admin Template`。— `grep -q '<title>Admin Template</title>' index.html`（證據：Done Command exit 0，2026-11-10）
- [x] AC-d：既有測試全綠、lint 無違規（Done Command）。（證據：49 files / 407 tests passed、eslint 無輸出，2026-11-10 exit 0）
- [ ] AC-e `[manual]`：瀏覽器 `pnpm dev` 看 sidebar 標題與分頁標題（owner 親驗 pending，不阻擋交付）。

### Milestones

- M1（單棒）：先寫 AC-a 失敗測試 → 改三處字串 → Done Command exit 0。

### Touches

- `src/shared/i18n/locales/zh.json`（`dashboard.title`）
- `src/shared/i18n/locales/en.json`（`dashboard.title`）
- `index.html`（`<title>`）
- `src/shells/default/__tests__/app-sidebar.test.tsx`（新增）
- `docs/specs/app-title.spec.md`（本檔）

### Must-Not-Touch

- 其他 i18n key
- `src/shells/default/*.tsx` 元件結構

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && ! grep -rn 'DAM[A]' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . && grep -q '<title>Admin Template</title>' index.html
```
expected: exit 0（全量 vitest 若只有 `src/app/__tests__/override.integration.test.tsx` 偶發失敗，單獨重跑並照實記錄）
