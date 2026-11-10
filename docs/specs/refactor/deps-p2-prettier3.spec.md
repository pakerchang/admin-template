# admin-template deps P2：Prettier 2 → 3

### User Story

身為 admin-template 維護者，我要把 Prettier 升到 3（連同 eslint-plugin-prettier 5），並把 Prettier 設定從 `eslint.config.js` 的 inline options 搬到獨立的 `.prettierrc`，讓 ESLint 的 `prettier/prettier` 規則、`pnpm prettier` script、lint-staged 的 `prettier --write` 三方讀同一份設定，不會因 Prettier 3 預設 `trailingComma: "all"` 而來回互改；並把全 repo reformat 隔離成單獨的 format-only commit，避免後續 FSD 重構 diff 混入格式噪音。

### Acceptance Criteria

- [ ] AC1：worktree `admin-template-deps-p2-prettier3`、branch `chore/deps-p2-prettier3`，base = origin/master `1614c24ee3e7d057acd5a09c3712ceea3938bc06`
- [ ] AC2：`prettier` 升到最新 3.x、`eslint-plugin-prettier` 升到 5.x；`eslint-config-prettier` 維持 10 不動；lockfile 同步
- [ ] AC3：新增 `.prettierrc`，內容原樣等於原 `prettier/prettier` rule options（`endOfLine: "auto"`、`trailingComma: "es5"`、`semi: true`、`tabWidth: 2`、`singleQuote: false`、`overrides` 的 `*.d.ts` → `parser: "typescript"`）
- [ ] AC4：`eslint.config.js` 的 `prettier/prettier` 改為 `"error"`（無 inline options，plugin 5 預設 usePrettierrc 讀 `.prettierrc`），嚴重度不變
- [ ] AC5：Commit 1 `chore(deps): upgrade to Prettier 3 and add .prettierrc` 只含依賴與設定，不含任何源碼格式變更
- [ ] AC6：Commit 2 `style: reformat with Prettier 3` 只含格式變更，範圍 = `prettier --write <範圍>` ＋ `prettier --write vite.config.ts`（若無變更則不做此 commit 並在報告說明）。`vite.config.ts` 不在 `<範圍>` glob 內，但 AC7 / Done Command 的 eslint 會檢查它的 `prettier/prettier`，Prettier 3 下它必須 reformat 才能過；放進 commit 1 會違反 AC5，所以歸在 commit 2（r2 修訂，codex review 第 1 輪指出 AC6 與 AC7 矛盾）
- [ ] AC7：Commit 2 後，eslint `--max-warnings 0` 無任何 `prettier/prettier` 錯誤，且 `prettier --check <範圍>` 通過（兩邊同一份設定）
- [ ] AC8：build、vitest 全綠；不加 AI 署名；不 push、不開 PR

`<範圍>` 決定：`"src/**/*.{js,jsx,ts,tsx,json,css,md}"`。理由：`package.json` 的 `prettier` script 用這個 glob；`.lintstagedrc.json` 的 `src/**/*.{js,jsx,ts,tsx}` 是它的子集。取 script 的 glob 為超集，兩處都涵蓋。範圍只在 `src/` 下，沒有 dist / 自動產生的 routeTree（本 repo 用 code-based routing），Prettier 3 也預設讀 `.gitignore`，所以不需要 `.prettierignore`。`src/**/*.d.ts` 被 eslint ignore，但原本 `pnpm prettier` script 就會格式化它們，維持現狀。

### Touches

- `package.json`、`pnpm-lock.yaml`
- `.prettierrc`（新增）
- `eslint.config.js`（只動 `prettier/prettier` rule 與相關註解）
- Commit 2：`src/**` 底下被 Prettier 3 reformat 的檔案，以及 `vite.config.ts`（format-only；理由見 AC6）

### Must-Not-Touch

- 主 checkout `/Users/pakerchang/Documents/nf_github/sideproject/admin-template` 與 `git stash`（`stash@{0}` 由 owner 處理）
- `.lintstagedrc.json`
- 任何非格式性的源碼語意；ESLint 設定中 prettier/prettier 以外的規則；package scripts（不改範圍）
- 遠端（不 push、不開 PR）

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p2-prettier3 && \
pnpm build && \
pnpm exec vitest run && \
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" vite.config.ts --max-warnings 0 && \
pnpm exec prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}" && \
echo DONE_COMMAND_OK
```

expected: 單一 `&&` 鏈 exit 0；vitest 全數 passed；eslint 0 errors、0 warnings；prettier 印出 `All matched files use Prettier code style!`；最後一行 `DONE_COMMAND_OK`

不涵蓋：lint-staged 實際 hook 行為、push / PR 狀態。
