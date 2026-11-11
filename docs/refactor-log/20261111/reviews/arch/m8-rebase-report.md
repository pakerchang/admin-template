# M8 rebase report — 把 feat/m8-core-only-verification rebase 到 refactor/integration（P5 TS 6）

## 結果
- 新 head：`343a449fd14c54a47157de9656f66291e6ef3551`
- 新 base：`refactor/integration` = `f653b9912405e62fe69da751d8e984081a7b9103`（fetch 後確認，與 origin 相同，沒有前進）
- 舊 head／舊 base：`2d1469543c91762af5106d33e9ef88414ada89ac` / `ca6b62fb8fc48aef3545b6a8f2cb16aa1357ed74`
- rebase 前 M8 worktree 乾淨；作者全是 pakerchang。

## commit 新舊 sha 對照
| # | 舊 | 新 | 作者 | subject |
|---|----|----|------|---------|
| 1 | 74e804b | d4c305759db4a6ba9e4bd628670e03bec0cdd129 | pakerchang | test(app): cover page override by route id and module-removal fail-fast (M8) |
| 2 | 2d14695 | 343a449fd14c54a47157de9656f66291e6ef3551 | pakerchang | feat(scripts): add verify-core-only for D4 acceptance (M8) |

## 衝突與解法
- **沒有衝突**。兩邊都改了 `package.json`，但改的是不同 hunk：P5 改 devDependencies 的 `typescript`（`^5.9.3` → `~6.0.3`），M8 加 `scripts.verify:core-only`。git 自動合併成功，兩邊的修改都保留了。
- 合併後與 integration 相比的 `package.json` diff（只多了 M8 這一行 script）：
```diff
-    "gen:api:extract": "tsx scripts/extract-operations.ts"
+    "gen:api:extract": "tsx scripts/extract-operations.ts",
+    "verify:core-only": "bash scripts/verify-core-only.sh"
```
- `pnpm-lock.yaml` 沒有衝突，用的是 integration 版。

## TS 6 型別修正
無。

## verify-core-only 的前提（P5 改過 tsconfig.app.json）
P5 對 `tsconfig.app.json` 只改了 `lib`、刪了 `baseUrl` / `esModuleInterop` / `allowSyntheticDefaultImports`，並把 `typeRoots` 換成 `types: ["node"]`。`include` 仍是 `["src/**/*", "tailwind.config.ts"]`，沒有排除測試檔，所以測試檔仍在 `tsc -b` 範圍內。腳本在 build 前刪掉被排除測試檔的前提仍然成立，實際執行也通過（見下方 Done Command）。

## 每個 commit 的 exec 結果
exec 指令：`pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run`

| commit | install | eslint | build | vitest |
|--------|---------|--------|-------|--------|
| d4c3057 | ok | exit 0 | ✓ built in 5.55s | 41 個檔案通過、354 個測試通過 |
| 343a449 | ok | exit 0 | ✓ built in 5.16s | 41 個檔案通過、354 個測試通過 |

rebase 指令 exit 0，log 最後一行是 `Successfully rebased and updated refs/heads/feat/m8-core-only-verification.`

## range-diff 摘要
```
1:  74e804b = 1:  d4c3057 test(app): cover page override by route id and module-removal fail-fast (M8)
2:  2d14695 = 2:  343a449 feat(scripts): add verify-core-only for D4 acceptance (M8)
```
兩個 commit 都是 `=`，patch 和舊版完全相同，只換了 base。

## Done Command
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8 && pnpm install --frozen-lockfile && bash scripts/verify-core-only.sh && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && git diff --quiet && echo DONE_COMMAND_OK
```
- exit code：**0**
- 副本：`== core-only: copy HEAD 343a449 → …/core-only`
- domain modules（7 個）：articles banners consumers orders product suppliers tags
- 排除清單：**14 / 32**（grep 命中 7 個 + 明列的 full-install 測試 7 個），所以 core-safe 測試有 18 個。清單非空，也沒超過一半。
  - grep 命中：app-wiring.test.tsx、override.integration.test.tsx、kernel/build.test.ts、module-removal.test.ts、role-visibility.test.tsx、shared/api/fetcher.test.ts、use-visible-nav.test.tsx
  - 明列：permission-structure、router-matching、operations-yaml、mock-handlers、forbidden-boundary、index-redirect、module-dictionaries
- core-only 副本：build ✓ built in 4.14s；vitest 18 個檔案通過、134 個測試通過；輸出 `core-only build: OK`
- 完整 repo：eslint exit 0；build ✓ built in 5.04s；vitest 41 個檔案通過、354 個測試通過
- `DONE_COMMAND_OK`
- 腳本的暫存 worktree 已清除（`git worktree list` 裡沒有殘留）

驗證層級：屬於行為驗證，也就是 lint、build、vitest 全部實際跑過且 exit 0。沒有做實機 UI 驗證，因為這不在本棒範圍內。

## git status --porcelain
空的（工作樹乾淨）。

## push
- `cc-git-write.sh push -u origin HEAD:feat/m8-core-only-verification-r1` → `* [new branch] HEAD -> feat/m8-core-only-verification-r1`
- `git ls-remote`：`feat/m8-core-only-verification-r1` = 343a449f…（新 head），`feat/m8-core-only-verification` 仍是 2d146954…，沒有動。
- 副作用：因為帶了 `-u`，本地 `feat/m8-core-only-verification` 的 upstream 變成了 `origin/feat/m8-core-only-verification-r1`。如果要追蹤原 branch，請跑 `git branch -u origin/feat/m8-core-only-verification`。

沒有 merge，也沒有開 PR。

LIFECYCLE_PAUSE: true
