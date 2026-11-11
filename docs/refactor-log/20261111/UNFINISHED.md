# 未完成事項（2026-11-11 08:00 checkpoint）

> owner 於 02:50 移交總決策權，main 依 spec 優先代裁、PR merge 留 owner。08:00 凍結所有進度上 GitHub。本檔逐條列未完成事項：所屬 chain／branch・PR／目前狀態／阻塞點／下一步。
> 同目錄：`{arch,api,deps}-{report,inbox}.md`（各 chain 報告與 inbox）、`protocol.md`、`decision-log.md`、`reviews/<chain>/`（Codex 審查 prompt／run log／verdict 與各棒報告）、`codex-verdicts/`（main 層送審 verdict）。內容為原樣複製、未改。

## 1. 待 owner merge（建議順序）

| # | 項目 | chain | branch／PR | 狀態 | 阻塞點 | 下一步 |
|---|---|---|---|---|---|---|
| 1-1 | i18n scope 遷移實作（I1） | arch | `feat/i18n-scope-migration`／[#32](https://github.com/pakerchang/admin-template/pull/32) | ready、OPEN | 待 owner merge | **先合**；後面各 spec 與實作以它為 base |
| 1-2 | spec 打勾同步（T1／userform） | deps | `docs/spec-tick-t1-userform`／[#30](https://github.com/pakerchang/admin-template/pull/30) | ready、OPEN | 待 owner merge | #32 後合 |
| 1-3 | T3 型別化契約 spec | arch | `docs/spec-typed-contracts-t3`／[#31](https://github.com/pakerchang/admin-template/pull/31) | ready、OPEN | 待 owner merge；OD-T3 為 main 代裁 | 覆核 OD-T3-1～7 後合 |
| 1-4 | T2 型別化契約 spec | arch | `docs/spec-typed-contracts-t2`／[#28](https://github.com/pakerchang/admin-template/pull/28) | ready、OPEN | 待 owner merge；OD-T2 為 main 代裁 | 覆核 OD-T2-1～4 後合 |
| 1-5 | 硬寫中文 spec | arch | `docs/spec-i18n-hardcoded`／[#29](https://github.com/pakerchang/admin-template/pull/29) | ready、OPEN | 待 owner merge；OD-HZ 為 main 代裁 | 覆核 OD-HZ-1～4（含 HZ-4 譯文）後合 |
| 1-6 | 新增使用者 spec | api | `docs/user-create-spec`／[#27](https://github.com/pakerchang/admin-template/pull/27) | **draft**（spec 已定稿） | lead 的 `gh pr ready`／`gh pr edit` 被 auto mode 擋，PR body 已過時 | owner 手動轉 ready、更新 PR body，再合 |
| 1-7 | dispatch-status quirks spec | deps | claude-config `fix/dispatch-status-quirks`／[claude-config#101](https://github.com/pakerchang/claude-config/pull/101) | OPEN | 待 owner merge | 合併後派實作（見 2-5） |

## 2. #32（或 #101）合併後才能開工的實作

| # | 項目 | chain | 依據 | 阻塞點 | 下一步 |
|---|---|---|---|---|---|
| 2-1 | 新增使用者（user-create）實作 | api | #27 spec | #32、#27 未合 | 合併後以 master 為 base 開實作 branch，走 M1→M3 |
| 2-2 | T2 實作 | arch | #28 spec；OD-T2-2 採 **B**（PoC 不成立時退 A **需 owner 同意**） | #32、#28 未合 | 先跑 PoC，再實作 |
| 2-3 | T3 實作（含 `EditUserRoleDialogContent` 修正） | arch | #31 spec | #32、#31 未合 | 合併後派工 |
| 2-4 | 硬寫中文實作 | arch | #29 spec | #32、#29 未合 | 合併後派工 |
| 2-5 | dispatch-status quirks 實作 | deps | claude-config #101 | #101 未合 | 合併後派工 |

## 3. main 代裁清單（owner 可覆核；出處 `decision-log.md` 2026-11-11 段）

| 決策 | 代裁結果 | 覆核入口 |
|---|---|---|
| OD-UC-1～4 | 全 A（OD-GRANT-1 矩陣不動、防提權、最小改動） | #27 |
| OD-T2-1～4 | 1A、2B（PoC 不成立需 owner 同意才退 A）、3A、4A | #28 |
| OD-HZ-1～4 | 全 A；HZ-4 補裁 A：§1.2 譯文定稿，並授權超出額度的第二輪回填 | #29 |
| OD-T3-1～7 | 1B、2A、3A、4A（role 對話框屬 demo 可見缺陷，納入 T3；標籤不新增硬寫中文）、5A、6A、7A；`created_at` 缺值顯示「—」 | #31 |
| spec-tick AC-3／AC-4 | router AC-3 A（等價打勾）；AC-4 B（不放寬權限、維持未勾） | #30 |

## 4. owner 親驗 pending

| 項目 | 狀態 | 下一步 |
|---|---|---|
| M2 AC-5、M3 AC-5 瀏覽器驗收 | agent 已驗，owner 未親驗 | owner 瀏覽器親驗 |
| M4 AC 瀏覽器驗收 | 同上 | 同上 |
| M7 AC-7 | agent 驗為部分通過（空白新增商品未驗） | owner 親驗，含空白新增商品 |
| M8 AC-4 | agent 已驗 | owner 親驗 |
| T1 AC-9 | pending | owner 親驗 |

## 5. harness follow-ups（claude-config）

| 項目 | 現象 | 下一步 |
|---|---|---|
| wrapper done 誤報 | wrapper 以 done 回報仍有背景 shell 在跑的子 session | 修 wrapper 的完成判定 |
| 授權框無人值守 auto-block | i18n-impl 03:25 puppeteer heredoc 觸發「Dangerous rm operation not ruled out」確認框，無人按 → 1:48 後自動 block | 子 session 改用 chrome-devtools MCP 或不含 rm 的指令；評估規則調整 |
| Done Command 被判 tainted | Done Command 包 `; echo DONE_EXIT=$?` 會被 ledger 判 tainted | ledger 判定或 prompt 範本調整 |
| lead 無法 `gh pr ready/edit` | `cc-git-write.sh` 無此 verb | 補 verb 或改流程 |
| auto mode 下 cc-git-write.sh 不跳 ask | auto mode 時 ask 未觸發 | 檢查 permission 層級設定 |

## 6. 其他

| 項目 | 狀態 | 下一步 |
|---|---|---|
| worktree 清理 | admin-template-* 共 9 個 worktree（不含本次暫用的 admin-template-checkpoint，已移除）；#24／#25／#26 已合併者可清 | 待 owner 指示 |
| ~/.claude 主 checkout 未提交改動 | owner 的未提交改動約 28 檔，在 `main` 上；checkpoint **未 commit、未 stash、未切 branch** | owner 自行處理 |
| claude-config `fix/crit-ac21-reviewer-home` | M1（RED）、M2 已 commit；P5 Done 前置 amendment 的 spec 修改以 wip commit 推上，未審未驗；M3 驗收未做 | 見 [claude-config#102](https://github.com/pakerchang/claude-config/pull/102)（draft） |
| claude-config `feat/mode-intent-auto-mode-hint` | 實已於 PR #4（2026-06-08）合入 main、遠端 branch 已刪；worktree 殘留 | 不需 PR；worktree 待 owner 清理 |
| [parked] `poc/api-orval` | 已被 M7 取代 | [#33](https://github.com/pakerchang/admin-template/pull/33)（draft，僅留存） |
| [parked] `chore/project-git-write-allow` | git-allow hook 方向擱置 | [#34](https://github.com/pakerchang/admin-template/pull/34)（draft，僅留存） |
