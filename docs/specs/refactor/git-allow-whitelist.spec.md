# admin-template git 放行 hook 改嚴格白名單（s19）

> 正本 spec：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/docs/specs/project-git-write-allow.spec.md`（本檔只是 ~/.claude session 的 spec-first 錨點，D/AC 以正本為準）。
> 出處：codex verdict FAIL（3 critical / 2 warning / 1 info，commit 75f71bd）＋ owner 裁決 2026-11-10「改嚴格白名單；判斷不了一律無輸出，誤擋只是多問一次，誤放不可接受」。

### User Story
As the owner, I want the admin-template PermissionRequest hook to auto-approve only an exact allowlist of `cc-git-write.sh commit|push|rebase` shapes, so that shell-expansion tricks (backslash, brace, glob), push config, and inherited GIT_* env can no longer turn an approved string into a protected-branch write or command execution.

### Acceptance Criteria
- [ ] AC-1 放行：`commit -m 'feat(x): y'`、`commit -F msg.txt`、`push -u origin <當前 branch>`、`push origin <當前 branch>`、`rebase origin/master|--continue|--abort|--skip`（主 checkout 與 worktree 的 feature branch）
- [ ] AC-2 退回：codex verdict 全部 PoC（`\--force`、`\:feat/x`、`HEAD:ma\ster`、`\--exec=id`、`\--receive-pack=id`、`HEAD:{master,feat/x}`、`{--exec=id,origin/master}`、`remote.origin.push` 設定下的 push、繼承 `GIT_DIR`、非測試模式的 `GIT_WRITE_ALLOW_REPO`、`refs/tags/…`）＋其他非白名單形狀
- [ ] AC-3 受保護 branch / detached → 退回
- [ ] AC-4 測試：fixture 失敗即測試失敗；每案斷言 hook exit 0；負向斷言「無輸出」
- [ ] AC-5 破壞性驗證：暫時放寬一條規則 → 對應測試失敗；還原後 cmp 一致

### Touches
- worktree：`.claude/hooks/git-write-project-allow.sh`、`.claude/hooks/tests/test-git-write-project-allow.sh`、`docs/specs/project-git-write-allow.spec.md`、`docs/TRAPS.md`、`CLAUDE.md`
- staging：`/private/tmp/claude-501/-Users-pakerchang--claude/05cee0d5-980b-4295-898e-64250e75b931/scratchpad/s19-install/**`

### Must-Not-Touch
- worktree `.claude/settings.json`、`.claude/settings.local.json`
- `~/.claude/scripts/**`、`~/.claude/settings.json`、`~/.claude/hooks/**`

### Done Command
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow && bash .claude/hooks/tests/test-git-write-project-allow.sh && jq -e '.hooks.PermissionRequest[0].hooks[0].command | endswith("git-write-project-allow.sh")' .claude/settings.json >/dev/null && pnpm exec vitest run && echo DONE_COMMAND_OK
```
expected: DONE_COMMAND_OK
