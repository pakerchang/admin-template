# admin-template deps P5：TypeScript 5.9 → 6.0

> **審查對象 repo = /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p5-ts6，範圍 = `refactor/integration..chore/deps-p5-ts6`**（base `refactor/integration` = `ca6b62f`）。
> 不是 `~/.claude`；`~/.claude` 裡 `settings.json`、`scripts/` 的未提交改動屬 owner，與本審查無關。

### User Story

身為 admin-template 維護者，我要把 TypeScript 從 5.9 升到 6.0.x，並清掉 TS 6 下 deprecated 的 `baseUrl`、補上明確 `types`，讓專案在 TS 6 下 build / test / lint 全綠且執行期行為不變，為之後 TS 7 鋪路。

### Acceptance Criteria

- [x] AC-1 `node_modules/typescript` 為 6.0.x；`package.json` 寫 `"typescript": "~6.0.<patch>"`（不是 `^6`、`latest`）；其他依賴版本不變，`pnpm-lock.yaml` diff 只與 typescript 有關。
- [x] AC-2 `tsconfig.json`、`tsconfig.app.json` 都沒有 `baseUrl`；`paths` 只有 `"@/*": ["./src/*"]`；未使用 `ignoreDeprecations`。
- [x] AC-3 `tsconfig.app.json` 與 `tsconfig.node.json` 都明確寫 `"types": ["node"]`（若其他型別如 vitest globals 失效，最小補上並在報告說明）。
- [x] AC-4 四層 alias：`src/app`、`src/shared`、`src/shells`、`src/modules` 各至少一個 `@/<層>/` import，`pnpm build`（`tsc -b` + `vite build`）可解析。
- [x] AC-5 `eslint` 0 warning（`--max-warnings 0`），`import/no-unresolved` 能解析 `@/`。
- [x] AC-6 `pnpm exec vitest run` 測試數 ≥ base 基線且全數通過，無 skip、無刪測試。
- [x] AC-7 執行期行為不變：源碼若有修改只限型別註記（TS 6 推導變更讓 `tsc -b` 真的報錯時），逐條列出；orval 產物（`src/modules/*/api/**`、`*.msw.ts`）不手改。
- [x] AC-8 commit message 無 AI 署名。
- [x] AC-9 建議改項（刪 `DOM.Iterable`、`esModuleInterop`/`allowSyntheticDefaultImports`、`typeRoots`）做或不做都在報告列出；刪 `typeRoots` 前確認 `src/shared/types/*.d.ts` augmentation 仍生效。
- [x] AC-10 記錄 base 與 HEAD 的 `pnpm exec tsc -p tsconfig.test.json --noEmit` 結果（TS2742 不修）。

### Touches

- `package.json`（typescript 版本）
- `pnpm-lock.yaml`（連帶）
- `tsconfig.json`（刪 `baseUrl`）
- `tsconfig.app.json`（刪 `baseUrl`、加 `types`、建議改項）
- `tsconfig.node.json`（加 `types`）
- 僅在 `tsc -b` 於 TS 6 真的報錯時：最小型別註記的 `src/**` 檔（orval 產物除外）

### Must-Not-Touch

- 主 checkout `admin-template`、整合 worktree `admin-template-integration`、git stash
- 其他依賴版本（含 typescript-eslint、vite、vitest、@types/*）
- orval 產物 `src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`、orval 設定
- `scripts/`、測試檔（M8 範圍）、`tsconfig.test.json` 拆分、`copy-order` TS2742 修正
- 不 push、不開 PR、不 merge

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p5-ts6 && \
pnpm install --frozen-lockfile && \
pnpm exec tsc --version | grep -E '^Version 6\.0\.' && \
! grep -q baseUrl tsconfig.json tsconfig.app.json && \
git grep -qE "from ['\"]@/app/" -- src && \
git grep -qE "from ['\"]@/shared/" -- src && \
git grep -qE "from ['\"]@/shells/" -- src && \
git grep -qE "from ['\"]@/modules/" -- src && \
pnpm build && \
pnpm exec vitest run && \
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" vite.config.ts --max-warnings 0 && \
pnpm exec prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}" && \
echo DONE_COMMAND_OK
```

expected: 最後一行印 `DONE_COMMAND_OK`，exit 0。
