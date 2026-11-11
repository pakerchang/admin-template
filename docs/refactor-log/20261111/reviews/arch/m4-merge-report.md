# M4 merge report — feat/m4-permission-enforcement → refactor/integration

結論：DONE（ff-only 成功，基線與 lint 都通過；這兩項是行為層驗證，以 exit code 為準）

## Pre-check（整合 worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration`）
- `git status --porcelain`：空
- branch：`refactor/integration`
- merge 前 tip：`3c92e5ab8ec04720cb7d397b2ffc9baaf85635c9`（符合預期）
- `feat/m4-permission-enforcement`：`ec5a55fe8707941ae1639662c72c0e00629513da`
- `git merge-base --is-ancestor refactor/integration feat/m4-permission-enforcement`：成立

## Merge
- 指令：`~/.claude/scripts/cc-git-write.sh merge --ff-only feat/m4-permission-enforcement`
- 輸出：`Updating 3c92e5a..ec5a55f` / `Fast-forward`，60 files changed, 1808 insertions(+), 357 deletions(-)，exit 0
- merge 後 tip：`ec5a55fe8707941ae1639662c72c0e00629513da`（等於預期值）

## 基線（Done Command）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && echo DONE_COMMAND_OK
```
- exit code：0
- build：`✓ built in 4.84s`
- vitest：`Test Files 32 passed (32)`、`Tests 316 passed (316)`
- 輸出含 `DONE_COMMAND_OK`

## Lint
- `pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → `LINT_OK`，exit 0
- 跑完後 `git status --porcelain` 仍為空

## `git log --oneline 3c92e5a..HEAD`
```
ec5a55f test(permission): pin full grant sets per role
4ea8e1c test(mock): assert successful non-GET operations for superadmin
231b54c fix(mock): persist issued sessions across reloads
2988875 docs(spec): sync M4 spec with implementation and record role matrix
6e30216 fix(permission): align role grants with pre-refactor visibility
8395203 fix(mock): bind /user/me/profile to the caller and whitelist writable fields
047f401 fix(mock): issue unguessable session tokens and verify them strictly
acd05c0 docs: mark M4 permission enforcement done in CLAUDE.md
87f71c4 feat(permission): declarative row actions and form submit
f9860f2 feat(permission): content-area 403 and grant-filtered nav
6764886 feat(permission): fail-closed mock API with session grants
2e535a9 docs(spec): use current /users URL in M4 AC-1
```

## 未做（依指示）
- 沒 push `refactor/integration`，也沒開 PR
- 沒改任何檔案內容
- mock 瑕疵依 owner 指示只記錄，這次沒有複審

LIFECYCLE_PAUSE: true
