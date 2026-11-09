# 重構 feature spec 索引

本目錄封存 admin-template 重構（Microkernel + Modular Monolith 架構、依賴升級、API 契約層 PoC）相關的所有 spec，含已完成者，供查閱與追溯。

- 檔案內容**逐位元組**複製自原始位置，未做任何修改。
- 部分 spec 內含本機絕對路徑（`/Users/…`、`/private/tmp/…` scratchpad 報告路徑）等機器資訊，屬撰寫當時的工作環境紀錄，照原樣保留；這些路徑在其他機器上不存在。
- 狀態核對時間：2026-11-10（以 `git log` / `gh pr list` 核對）。

## 架構主線

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `fsd-module-architecture.m3-revision.spec.md` | Microkernel + Modular Monolith 目標架構（M0–M8），含 M3 W1 獲准修訂的最新版 | M0–M3 完成（M3 已併入 `refactor/integration`）；M4–M8 未開始 | 見下方 milestone 表 |

> master 上的 `docs/specs/fsd-module-architecture.spec.md`（#6 合入）為修訂前版本，不在本目錄更動；本目錄版本取自 `feat/m3-module-wiring:docs/specs/fsd-module-architecture.spec.md`。

| Milestone | 狀態 | 證據 |
|---|---|---|
| M0（前置：deps P0 Node 22 + P1 ESLint 9） | 完成 | PR #4、#5 |
| M1 Kernel 契約與權限引擎 | 完成 | PR #8 |
| M2 MSW 取代 mockFetch | 完成 | PR #9 |
| router pathless hotfix | 完成 | PR #10；spec 在 master `docs/specs/router-pathless-hotfix.spec.md` |
| M3 Module 接線 + default shell | 完成，已併入本地整合分支 `refactor/integration`（AC-1～4、6、7 已勾；AC-5 manual 待 owner） | integration tip `8458b19`（ff-only，基線 exit 0、23 files / 227 tests、LINT_OK）；`feat/m3-module-wiring` @ `8458b19` 已 push；codex 259e4c3 FAIL → d685823 PASS-with-fixes → 03acca9 PASS →（rebase）edfd74d PASS-with-fixes → 8458b19 PASS（arch chain `reviews/arch-m3-fix3-codex-verdict.md`）；中間 commit 509dc96..2aae3e6 不可單獨 build（bisect skip，main 已裁決接受） |
| M4 權限四強制點 + 內容區 403 | 未開始 | — |
| M5 Kernel / shared 搬遷 + 邊界 lint | 未開始 | — |
| M6 Module 內嵌搬遷 | 未開始 | — |
| M7 orval 契約層 | 未開始（依 api PoC 結論） | — |
| M8 D1 / D4 驗收自動化與收尾 | 未開始 | — |

## 依賴升級（deps chain）

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `deps-p0-node22.spec.md` | Node 22 前置 | 完成 | PR #4 |
| `deps-p1-eslint9.spec.md` | ESLint 9 flat config 遷移 | 完成 | PR #5 |
| `deps-p2-prettier3.spec.md` | Prettier 2 → 3 | 完成 | PR #7 |
| `deps-p3-vitest5.spec.md` | Vitest 3 → 5 | 完成，已 ff-only 併入 `refactor/integration`（tip `f864fc6`） | 原實作 `d29739c` codex PASS（`~/.claude/.claude/reviews/20261109T170530Z-58436-codex-review.md`，AC1–AC7 PASS；AC8 遠端狀態由子 session 以 ls-remote / gh pr list 補證）；rebase 後 `f864fc6`（parent `d7a6fc3`，作者 pakerchang）delta PASS（`~/.claude/.claude/reviews/20261109T193445Z-2644-codex-review.md`）；Done Command exit 0，19 files / 196 tests（AC5 的 16 / 179 為 rebase 前 base `46d13b6` 的基線）；併入後整合基線 install / build / vitest 19 / 196 / eslint 0 warning，exit 0 |

deps spec 中未提及 P4 / P5。

## API 契約層 PoC（api chain）

PoC spec 保留到 M7 落地時引用。PoC 程式碼在 branch `poc/api-orval`（未 push，worktree `admin-template-api-orval-poc`）；報告在 api chain scratchpad `chains/api/poc-*-report.md`。

證據說明：done command `ALL_GREEN` exit=0 為**子 session 自報，未經 codex 審**。AC 只勾 done command 實際涵蓋的項；報告內容、commit 與分析類 AC 不在 done command 範圍內，維持未勾。

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `orval-poc.spec.md` | orval + MSW sandbox PoC（a1） | PoC 完成，保留至 M7 | `8f20660`；`poc-orval-report.md`；vitest 7/7；AC 4/5 |
| `orval-module-split-poc.spec.md` | orval module 分散輸出 PoC（a2） | PoC 完成（採 B：單一 yaml 依 tag 分 output），保留至 M7 | `8d0ddfc`；`poc-module-split-report.md`；vitest 11/11；AC 2/7 |
| `guard-fail-closed-poc.spec.md` | guard fail-closed PoC（a3） | PoC 完成，保留至 M7 | `f006837`；`poc-guard-fail-closed-report.md`；vitest 18/18；AC 5/6 |
| `perm-colon-poc.spec.md` | 權限字串改冒號 PoC（a4） | PoC 完成，保留至 M7 | `1097347`；`poc-perm-colon-report.md`；vitest 18/18；AC 2/6 |

## 工具 / 流程

| 檔名 | 主題 | 狀態 |
|---|---|---|
| `git-allow-whitelist.spec.md` | git 放行 hook 改嚴格白名單 | 已擱置（global ask 已移除，目標已達） |
| `project-git-write-allow.spec.md` | 專案層放行 cc-git-write（PermissionRequest hook） | 已擱置（同上） |

## 後續流程

之後所有重構工作在本地 `refactor/integration` 分支以 fast-forward-only 方式逐棒累積（M3、deps P3 起），全部 milestone 完成後才開**一個** PR 合入 master。
