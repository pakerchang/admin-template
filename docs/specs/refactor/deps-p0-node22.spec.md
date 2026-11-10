# admin-template deps P0：Node 22 前置

repo: /Users/pakerchang/Documents/nf_github/sideproject/admin-template
worktree: /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p0-node22（branch chore/deps-p0-node22，base origin/master c139bdb）

### User Story

身為 admin-template 維護者，我希望專案要求 Node 22、拿掉沒在用的 `@typescript/native-preview`，並清掉 AuthLayout 的 `FormEvent` deprecated warning，讓 arch 重構 M0 從乾淨的 lint 狀態開始。

### Acceptance Criteria

- [ ] AC1 `package.json` 的 `engines.node` 是 `>=22`；README 的環境需求改成 Node.js 22+；不新增 `.nvmrc` / `.node-version`；`@types/node` 維持 `^22`
- [ ] AC2 `@typescript/native-preview` 從 package.json 和 pnpm-lock.yaml 移除；repo 內沒有任何 `tsgo|native-preview` 引用
- [ ] AC3 `src/components/layouts/AuthLayout.tsx` 改用 `SubmitEvent<HTMLFormElement>`（對應 `onSubmit?: SubmitEventHandler<T>`），不用 eslint-disable，行為不變
- [ ] AC4 build、vitest（14 files / 128 tests）、eslint（0 errors / 0 warnings）全部 exit 0

### Touches

- package.json
- pnpm-lock.yaml
- README.md
- src/components/layouts/AuthLayout.tsx

### Must-Not-Touch

- 主 checkout /Users/pakerchang/Documents/nf_github/sideproject/admin-template
- src/pages/users/components/EditUserRoleDialogContent.tsx、src/pages/orders/components/EditDialogContent.tsx（同類 React.FormEvent，範圍外，只回報）
- 其他依賴版本

### Done Command

```bash
set -e
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p0-node22
pnpm build
pnpm exec vitest run
pnpm exec eslint --max-warnings 0 "src/**/*.{js,jsx,ts,tsx}"
```

expected: block exit 0（`set -e`：任一條非 0 即整體非 0）；vitest 14 files / 128 tests passed；eslint 0 errors、0 warnings（`--max-warnings 0` 讓 warning 也會造成非 0）
