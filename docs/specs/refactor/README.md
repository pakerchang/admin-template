# 重構 feature spec 索引

本目錄封存 admin-template 重構（Microkernel + Modular Monolith 架構、依賴升級、API 契約層 PoC）相關的所有 spec，含已完成者，供查閱與追溯。

- 檔案內容**逐位元組**複製自原始位置，未做任何修改。
- 部分 spec 內含本機絕對路徑（`/Users/…`、`/private/tmp/…` scratchpad 報告路徑）等機器資訊，屬撰寫當時的工作環境紀錄，照原樣保留；這些路徑在其他機器上不存在。
- 狀態核對時間：2026-11-10（以 `git log` / `gh pr list` 核對）。

## 架構主線

| 檔名 | 主題 | 狀態 | 證據 |
|---|---|---|---|
| `fsd-module-architecture.m3-revision.spec.md` | Microkernel + Modular Monolith 目標架構（M0–M8），含 M3 W1 獲准修訂的最新版 | M0–M2 完成；M3 待併入；M4–M8 未開始 | 見下方 milestone 表 |

> master 上的 `docs/specs/fsd-module-architecture.spec.md`（#6 合入）為修訂前版本，不在本目錄更動；本目錄版本取自 `feat/m3-module-wiring:docs/specs/fsd-module-architecture.spec.md`。

| Milestone | 狀態 | 證據 |
|---|---|---|
| M0（前置：deps P0 Node 22 + P1 ESLint 9） | 完成 | PR #4、#5 |
| M1 Kernel 契約與權限引擎 | 完成 | PR #8 |
| M2 MSW 取代 mockFetch | 完成 | PR #9 |
| router pathless hotfix | 完成 | PR #10；spec 在 master `docs/specs/router-pathless-hotfix.spec.md` |
| M3 Module 接線 + default shell | codex review PASS，待併入本地整合分支 `refactor/integration`（AC-1～4、6、7 已勾；AC-5 manual 待 owner） | `feat/m3-module-wiring` @ `03acca9`（Done Command exit 0、219 tests）；codex 259e4c3 FAIL → d685823 PASS-with-fixes → 03acca9 PASS（arch chain `reviews/arch-m3-fix2-codex-verdict.md`） |
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
| `deps-p3-vitest5.spec.md` | Vitest 3 → 5 | codex review PASS，待併入 `refactor/integration` | PASS 對象 `d29739c`（base `46d13b6`）；目前 `chore/deps-p3-vitest5` 已 rebase 至 `745d890`（base `d7a6fc3`，patch-id 不同） |

deps spec 中未提及 P4 / P5。

## API 契約層 PoC（api chain）

PoC spec 保留到 M7 落地時引用。

| 檔名 | 主題 | 狀態 |
|---|---|---|
| `orval-poc.spec.md` | orval + MSW sandbox PoC（a1） | PoC，保留至 M7 |
| `orval-module-split-poc.spec.md` | orval module 分散輸出 PoC（a2） | PoC，保留至 M7 |
| `guard-fail-closed-poc.spec.md` | guard fail-closed PoC（a3） | PoC，保留至 M7 |
| `perm-colon-poc.spec.md` | 權限字串改冒號 PoC（a4） | PoC，保留至 M7 |

## 工具 / 流程

| 檔名 | 主題 | 狀態 |
|---|---|---|
| `git-allow-whitelist.spec.md` | git 放行 hook 改嚴格白名單 | 已擱置（global ask 已移除，目標已達） |
| `project-git-write-allow.spec.md` | 專案層放行 cc-git-write（PermissionRequest hook） | 已擱置（同上） |

## 後續流程

之後所有重構工作在本地 `refactor/integration` 分支以 fast-forward-only 方式逐棒累積（M3、deps P3 起），全部 milestone 完成後才開**一個** PR 合入 master。
