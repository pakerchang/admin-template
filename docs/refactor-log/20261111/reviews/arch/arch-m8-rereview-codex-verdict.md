**判決：PASS。** 依 main 已裁決的前提，既有七項均列為已知問題，沒有需要開修正棒的項目；本輪未發現新增的基本功能阻擋或安全漏洞。

已確認 branch 與 HEAD 符合送審資料；比對使用指定 base `ca6b62f`，不使用已前進的 integration tip。本判決僅適用送審 SHA，不涵蓋後續 rebase 結果。

前提 3 的紅線原文屬實。[fsd-module-architecture.spec.md:1287](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m8/docs/specs/fsd-module-architecture.spec.md:1287)：

> **Must-Not-Touch**：`src/modules/**`、`src/shells/default/**`、`openapi.yaml`；行為紅線：腳本不得修改工作目錄（只在暫存副本操作）

原文未要求「所有 git 共用管理資料完全不變」。前輪依此延伸的嚴格紅線，不作為本輪阻擋依據。`git diff --quiet` 的機械檢查範圍也不包含共用 worktree 管理資料。

既有 findings 逐條重判如下；嚴重度沿用前輪，全部只記錄，不要求本棒修正：

1. **warning — `scripts/verify-core-only.sh:18`**：整 repo `worktree prune` 及 add/remove 會影響共用管理資料；屬已裁決的開發腳本清理問題，未發現造成基本 build／test／demo 壞掉或安全漏洞的證據。**BASIC-BREAK: no**
2. **warning — `scripts/verify-core-only.sh:17`**：cleanup 失敗與 INT／TERM 清理保證不足，可能殘留暫存目錄或登記；屬清理強健性限制。**BASIC-BREAK: no**
3. **warning — `scripts/verify-core-only.sh:43`**：grep 誤排及局部漏抓降低驗證涵蓋率；不構成已證實的基本功能故障或漏洞。**BASIC-BREAK: no**
4. **warning — `scripts/verify-core-only.sh:46`**：`FULL_INSTALL_TESTS` 明列清單已獲 main 追認；原先待追認事項已解除。**BASIC-BREAK: no**
5. **info — `scripts/verify-core-only.sh:33`**：helper 來自原工作目錄，可能混入未提交版本；屬驗證可重現性限制。**BASIC-BREAK: no**
6. **info — `src/app/__tests__/core-only.test.tsx:45`**：fixture 與注入認證未涵蓋實際登入、default shell/sidebar；瀏覽器驗收仍待驗，不能據此推定 demo 已壞。**BASIC-BREAK: no**
7. **info — `src/app/__tests__/override.integration.test.tsx:16`**：深 import 未驗證公開 index API 的使用流程；屬測試範圍限制。**BASIC-BREAK: no**

本輪針對同一 commit 的既有問題與新增阻擋風險作重核，未發現應改列阻擋的項目。

| 驗證 | 結果 |
|---|---|
| `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` | exit 1；pnpm 建立 `_tmp_*` 遭 sandbox EPERM，ESLint 未執行 |
| `pnpm exec vitest run` | exit 1；同上，Vitest 未執行 |
| `git diff --check ca6b62f..2d14695` | exit 0，靜態檢查通過 |

上述 sandbox 限制不列 finding。本輪沒有獨立驗證 build 或瀏覽器行為，亦未執行 `verify-core-only.sh`。審查前後工作樹皆乾淨，未修改檔案、未 commit；依只讀要求，本文供登記為 `arch-m8-rereview-codex-verdict.md`，未建立該檔。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: 2d1469543c91762af5106d33e9ef88414ada89ac
REVIEWER: codex-oob