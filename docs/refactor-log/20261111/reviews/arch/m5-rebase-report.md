# M5 rebase 到 refactor/integration — 報告

狀態：**DONE**（rebase 成功，每個 commit 的 exec 都 exit 0，Done Command 也 exit 0）

## 總覽
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m5`，branch `feat/m5-shared-boundaries`
- 新 head：`96f156551c3ec36fbf918a65eb1a8f93660154ef`
- 新 base：`refactor/integration` = `571d1af20696d32bed1bee10fd6bdd3a4009c747`（fetch 後確認沒有前進；integration 沒有 remote 追蹤分支，以本地 ref 為準）
- 舊 base：`ec5a55fe8707941ae1639662c72c0e00629513da`，舊 head：`43dfba8562165ee6d56fdf51c2ef0c826d24add9`
- 開始前 worktree 乾淨；新舊 commit 的作者都是 `pakerchang <pakerchang@gmail.com>`

## commit 新舊對照
| # | 舊 | 新 | 主旨 |
|---|----|----|------|
| 1 | 2cdc3ac | b71bd40fb52374a16dd57ad04f3f0ad679ae2578 | chore(lint): enforce module boundaries with eslint-plugin-boundaries |
| 2 | 8189942 | 22f94f4cd4498bb918656c5a1d5eb28534e56b22 | refactor(shared): move kernel and shared code into app, shared and shells |
| 3 | 43dfba8 | 96f156551c3ec36fbf918a65eb1a8f93660154ef | test: drop custom jsdom environment now that Vitest 5 keeps native AbortSignal |

## 衝突與解法（只發生在 commit 1）
- 重疊檔案：只有 `package.json`、`pnpm-lock.yaml`，和 lead 的比對結果一致。
- `package.json`：git 自動合併，沒有衝突。和 integration 相比只多一行 `"eslint-plugin-boundaries": "7.4.2"`；M7a 的 `gen:api:extract`、`orval 8.47.0`、`tsx ^4.20.3`、`yaml ^2.9.1` 都保留，其他欄位沒動。
- `pnpm-lock.yaml`：有衝突。做法如下：
  1. `cc-git-write.sh checkout --ours pnpm-lock.yaml`。rebase 時 ours 就是 integration；之後用 `cmp` 確認這份和 `refactor/integration:pnpm-lock.yaml` 一模一樣。
  2. 執行 `pnpm install`，沒加 `--frozen-lockfile`，也沒跑 update。結果 exit 0，`+58` 個 package（M7a 的 orval/tsx/yaml 等連結到 worktree），lock 只補上 boundaries 相關條目。
  3. `git diff refactor/integration -- pnpm-lock.yaml`：**刪除行 0 行**，新增的行和原 M5 commit（`ec5a55f..2cdc3ac`）的 lock 新增行**排序後完全相同**。也就是說，沒有任何其他套件的版本變動。
  4. 新增的條目：`eslint-plugin-boundaries@7.4.2`、`@boundaries/{config@1.0.1,elements@3.3.2,policies@1.0.1}`、`handlebars@4.7.10`、`neo-async@2.6.2`、`uglify-js@3.19.3`、`wordwrap@1.0.0`、`eslint-import-resolver-node@0.3.9`、`eslint-module-utils@2.14.0(...)`、`is-core-module@2.17.0`。這些和原 M5 的 lock delta 相同，都是 boundaries 的 transitive 依賴。
- 解完後 `git add` → `GIT_EDITOR=true cc-git-write.sh rebase --continue`
- 備註：raw `git checkout --ours` 被 permission deny 擋下，所以改用 `cc-git-write.sh checkout`，語意相同。

## eslint 排除
- **沒有加**。lint 指令只掃 `src/**`，exec 和 Done Command 都沒因為 `scripts/**` 或 `orval.config.ts` 報錯。`eslint.config.js` 和舊版完全相同。

## 每個 commit 的 exec 結果
exec 指令：`pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run`

| commit | install | eslint | build | vitest |
|--------|---------|--------|-------|--------|
| b71bd40 | OK | OK（無輸出） | ✓ built in 4.89s | 33 files / 328 tests passed |
| 22f94f4 | OK | OK | ✓ built in 4.71s | 33 / 328 passed |
| 96f1565 | OK | OK | ✓ built in 4.61s | 33 / 328 passed |

rebase 最後印出 `Successfully rebased and updated refs/heads/feat/m5-shared-boundaries.`，背景任務 exit 0。

## range-diff（`git range-diff ec5a55f..43dfba8 refactor/integration..HEAD`）
- `1: 2cdc3ac ! 1: b71bd40`：差異**只在 `pnpm-lock.yaml` 的 context 行**。新條目插入位置旁邊的鄰居從 `@corvu/utils@0.4.2` 換成 M7a 帶進來的 `@commander-js/extra-typings@15.1.0`。新增內容本身沒有變，`package.json` 和 `eslint.config.js` 也沒有差異。
- `2: 8189942 = 2: 22f94f4`：完全相同
- `3: 43dfba8 = 3: 96f1565`：完全相同

## Done Command（最終 HEAD 96f1565）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m5 && pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && ! grep -rnE "@/(app|shells|modules)/|EOrderStatus" src/shared && test ! -d src/components/ui && test ! -d src/lib && test ! -d src/plugins && test ! -d src/hooks && test ! -e src/test/jsdom-node-abort.env.ts && echo DONE_COMMAND_OK
```
- exit code **0**，輸出含 `DONE_COMMAND_OK`
- build：✓ built in 4.70s；vitest：**Test Files 33 passed (33)、Tests 328 passed (328)**
- 確認有收錄 `scripts/__tests__/extract-operations.test.ts`：預設 reporter 不會逐檔列出，所以另外跑了 `pnpm exec vitest list --filesOnly`。輸出含 `scripts/__tests__/extract-operations.test.ts`，總共 33 檔，和 run 的檔數一致。
- 驗證層級：行為層，lint、build、測試實際跑過且 exit 0。

## push
- `cc-git-write.sh push -u origin HEAD:feat/m5-shared-boundaries-r1` → `* [new branch] HEAD -> feat/m5-shared-boundaries-r1`
- `git ls-remote` 結果：`feat/m5-shared-boundaries-r1` = `96f156551c3ec36fbf918a65eb1a8f93660154ef`；`feat/m5-shared-boundaries` 仍是 `43dfba8562165ee6d56fdf51c2ef0c826d24add9`，沒有被改動。
- 副作用：因為帶了 `-u`，本地 `feat/m5-shared-boundaries` 的 upstream 現在指向 `origin/feat/m5-shared-boundaries-r1`。之後如果要改回去，執行 `git branch --set-upstream-to=origin/feat/m5-shared-boundaries`。

## 沒做的事
- 沒有 merge、沒有開 PR、沒有 force push、沒有動整合 worktree。commit 內沒加 AI 署名，rebase 也沒有改寫 message。

LIFECYCLE_PAUSE: true
