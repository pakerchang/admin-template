# admin-template deps P1：ESLint 9 flat config 遷移

repo: /Users/pakerchang/Documents/nf_github/sideproject/admin-template
worktree: /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p1-eslint9（branch chore/deps-p1-eslint9，base origin/master 724ae795198f04fecbde456ecd05798c46a644e6）

### User Story

身為 admin-template 維護者，我希望 lint 從已 EOL 的 ESLint 8 + `.eslintrc.json` 換成 ESLint 9 flat config，且規則行為與遷移前等價，讓後續 arch 重構的邊界規則可以直接以 flat config 撰寫。

### Acceptance Criteria

- [ ] AC1 `eslint` 升到最新 9.x（不是 10）；`eslint-config-prettier` 9→10；`globals` 升級；`@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` 改為 `typescript-eslint` meta 套件；其他 plugin 只做 peer 需要的最小升級
- [ ] AC2 `eslint-plugin-react-hooks` 升到可在 ESLint 9 flat config 使用的最低 major；若必須用 7，只啟用 `rules-of-hooks`(error) / `exhaustive-deps`(warn)
- [ ] AC3 `eslint-plugin-tailwindcss` exact pin `3.18.0`；`prettier` / `eslint-plugin-prettier` 不升 major
- [ ] AC4 `.eslintrc.json` → `eslint.config.js`；`.eslintignore` 內容搬進 `ignores` 後刪檔；`env` 改用 `globals`；`settings`（import/resolver、tailwindcss、react、alias）、overrides（`*.d.ts`、`vite.config.ts`）、`prettier/prettier` options 等價保留
- [ ] AC5 `tsconfig.node.json` include 的 `.eslintrc.json` 改為新檔名；`package.json` `lint` script 拿掉 `--format=compact`（不加新依賴）；`.lintstagedrc.json` 指令確認仍可用
- [ ] AC6 規則等價性：遷移前後各對代表性檔案（≥1 .tsx 元件、≥1 .ts、1 .d.ts、vite.config.ts）跑 `eslint --print-config` 存 scratchpad，比對 `rules`；交付報告逐條列出新增 / 移除 / 嚴重度改變的規則與原因，只允許「上游改名 / 移除 / preset 內容隨版本變動」這類不得不改的差異
- [ ] AC7 新版 plugin 報出的新 error 優先在設定層對齊；必須改源碼時最小化並逐一列出
- [ ] AC8 build、vitest、eslint（0 errors / 0 warnings）全部 exit 0；commit `chore(lint): migrate to ESLint 9 flat config` 到 chore/deps-p1-eslint9，不 push、不開 PR、不加 AI 署名

### Touches

- package.json
- pnpm-lock.yaml
- eslint.config.js（新增）
- .eslintrc.json（刪除）
- .eslintignore（刪除）
- tsconfig.node.json
- .lintstagedrc.json（僅在指令不相容時）
- src/**（僅 AC7 不得不改時，最小化）

### Must-Not-Touch

- 主 checkout /Users/pakerchang/Documents/nf_github/sideproject/admin-template
- prettier / eslint-plugin-prettier major（P2）
- eslint-plugin-boundaries / steiger（arch chain）
- 與 lint 無關的依賴版本

### Done Command

```bash
set -e
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p1-eslint9
pnpm build
pnpm exec vitest run
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" --max-warnings 0 && echo "DONE_COMMAND_OK build+vitest+eslint all exit 0"
```

expected: block exit 0；vitest 全數 passed；eslint 0 errors、0 warnings（`--max-warnings 0` 讓 warning 也會造成非 0）；最後印出 `DONE_COMMAND_OK`

修訂註記（codex review 第 3 輪）：
- 前四行是上游 prompt 指定的原文。只在 eslint 那行末尾加 `&& echo DONE_COMMAND_OK`：eslint 成功時不輸出任何東西，ledger 的 output tail 只剩 vitest 的耗時那一行，看不出 eslint 有沒有過。
- 實測發現這個 harness 裡的 `set -e` 不可靠：失敗的 eslint 之後的行照樣執行，block 仍然報 exit 0。`DONE_COMMAND_OK` 用 `&&` 綁在 eslint 上，所以至少能證明 eslint 這一步 exit 0。build 和 vitest 的 exit 0 不能只靠這個 block 證明，必須另外逐步記錄 exit code。
- `vite.config.ts` 不納入：它在 ESLint 8（P0 worktree c710bfb，檔案內容相同）就有 1 個 prettier/prettier error，屬於既有問題；不在 Touches 範圍內，`pnpm lint` 也只檢查 src。
- 這個 Done Command 不涵蓋：規則等價（見交付報告的 print-config 比對）、lint-staged 實際 hook、push / PR 狀態。
