# 重構進度紀錄 2026-11-12（現況）

取代 PR #35（2026-11-11 08:00 快照）。同目錄：`arch-report.md`、`api-report.md`、`deps-report.md`（各 chain 報告）、`decision-log.md`（代理決策全紀錄）、`protocol.md`（chain 協作協定）。email 已遮蔽為 `<email>`，本機路徑以 `~`／`<scratchpad>` 代替。

## 已合併（2026-11-11～12）

### admin-template

| PR | 內容 | merge commit |
|---|---|---|
| #28 | T2 module 契約型別化 spec | `87506b4` |
| #29 | 硬寫中文字串 i18n spec | `8f2922e` |
| #30 | T1 typed contracts／使用者表單 spec 的 AC 打勾同步 | `68fcc93` |
| #31 | T3 domain 型別錨定 spec | `64303bf` |
| #32 | I1：module 字典 scope 化、nav label 由 registry 注入 | `3f6519c` |
| #36 | 新增使用者頁（user-create） | `645da8a` |
| #37 | T2：typed module contracts 實作 | `a6e0870` |
| #38 | H1：硬寫中文 UI 字串搬入字典 | `454b93d` |

### claude-config

| PR | 內容 | merge commit |
|---|---|---|
| #101 | herdr-dispatch status 怪異行為 spec（附重現證據） | `752469a` |
| #103 | codex-review 隔離 reviewer 的 CODEX_HOME（CRIT-AC21） | `d89b2e1` |
| #104 | herdr-dispatch：從 stderr 擷取 wait 錯誤、畫面上的對話框視為 blocked | `948cbea` |

## 進行中

- **#39 T3**（domain schema／seed／角色錨定 orval 型別）：codex 第一輪 PASS，正在解與 master 的衝突；合併後 T1～T3 全部完成。
- **claude-config dispatch AC-11 live smoke**（#104 合併後的 M2）：已派工。

## 待 owner

- 關閉 **#27**（user-create spec，已被 #36 取代）。
- **#33／#34**（[parked]）：關閉，branch 保留。
- **#35**：由本 PR 取代。是否刪除 branch `docs/refactor-log-20261111`（含公開 email）由 owner 決定。
- 以上關閉動作 lead／main 沒有 `gh pr close` 權限，需 owner 執行。

## main 代裁清單（owner 可覆核）

全文見 `decision-log.md` 對應標題。

- 2026-11-11 userform2：接受兩個範圍外 commit，push 並開 PR（A）。
- 2026-11-11T02:55 user-create OD-UC-1～4 全 A（OD-GRANT-1 矩陣不動、防提權）。
- 2026-11-11T03:20 T2：1A 2B 3A 4A；硬寫中文：全 A。
- 2026-11-11T03:25 spec-tick：router AC-3 A（等價打勾）、AC-4 B（維持未勾）。
- 2026-11-11T03:35 T3 OD：1B 2A 3A 4A 5A 6A 7A；created_at 缺值顯示「—」。
- 2026-11-11T03:55 硬寫中文 HZ-4 A：§1.2 譯文定稿。
- 2026-11-11T03:26 i18n-impl 授權框不代按，任其 timeout。
- 2026-11-12T01:18 dispatch-quirks：AC 拆 M1（AC-1～10）／M2（AC-11 smoke）。
- 2026-11-12T01:18 #38 偏差接受；T2 spec 逆變敘述記為 follow-up。
- 2026-11-12T01:20 T3×#38 角色 key：#38 先合，T3 只最小改 4 個角色。
- 2026-11-12T01:24 #38 合併前驗證 master+#38（build 0、1017 tests）。
- 2026-11-12T01:27 自我更正：曾以 `git worktree remove --force` 移除 main 自建的暫存 worktree，之後不再使用 --force。
- 2026-11-12T01:34 #36 衝突：merge origin/master 解（不 force），以 master key 為準。
- 2026-11-12T01:49 T3：接受 `use-order.ts` 一行 Touches 外偏差（型別連動必要）。

## Follow-up

- T2 spec §2.2 的逆變敘述需修正。
- 硬寫中文 spec §1.2／§1.3 的統計數字需更新（T3 後已變動）。
- OrderCard「—」分支只有單元測試，沒有瀏覽器驗證。
- image-validation README 範例需更新。
- 各 PR 都沒做瀏覽器實機驗證（只有 build + vitest）。
- worktree 清理：以下 worktree 的 PR 多已合併，可移除（2026-11-12 現況）：
  `admin-template-hz-impl`、`-i18n-hardcoded-spec`、`-i18n-impl`、`-i18n-spec`、`-spec-tick`、`-t1`、`-t2-impl`、`-t2-spec`、`-t3-spec`、`-user-create`、`-user-create-spec`、`-userform`；`-t3-impl` 等 #39 合併後再移除。
- harness follow-ups：
  - lead 沒有 `gh pr ready`／`edit`／`close` 的 verb（cc-git-write.sh）。
  - Done Command 包 wrapper 會被 ledger 標為 tainted。
  - codex 7 天額度偏低。
