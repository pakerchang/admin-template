# admin-template guard fail-closed PoC（api chain a3）

一次性 throwaway PoC。在 a1/a2 PoC worktree 的 `poc/orval/` 內把 MSW 權限 guard 從 fail-open 改成 fail-closed：每個 operation 都必須宣告 permission，公開的 operation 明確標 `public`；未宣告 → 403，並讓「漏宣告」在開發期（extract / 完整性檢查）就被抓到。結論寫到 chain scratchpad 的 `poc-guard-fail-closed-report.md`。不落產品程式碼。

已鎖定（不重新評估）：owner 裁決 guard 預設 fail-closed；採 a2 的 B 切法（單 yaml 依 tag 分 output，`split-b/`）；guard 只讀 `OperationPermissions` / `OperationRoute` 中間格式。

### User Story

身為 admin-template 的 owner，我要 guard 對未宣告權限的 operation 一律拒絕，且漏宣告在 gen / 測試階段就失敗，讓整合 milestone 不會在 runtime 才發現權限漏洞。

### Acceptance Criteria

- [ ] AC1：`public` 表示法定案並實作，module 宣告與 YAML `x-permission: public` 兩種來源都支援；報告說明理由
- [ ] AC2：guard 比對到 route 但沒宣告 → 403（body 指出 operationId）；`public` → fall through；比對不到任何 route 的 request 處理方式明確實作並說明
- [ ] AC3：extract 遇到缺 `x-permission` 的 operation → throw、exit≠0，訊息列出 operationId（fixture yaml 實測）；提供 routes × permissions 完整性檢查函式，可在 kernel 啟動或測試呼叫
- [ ] AC4：`split-b/openapi.yaml` 有一個標 public 的 `POST /auth/login`，產物跑過 orval
- [ ] AC5：vitest（setupServer）：未宣告 operation → 403；public 不帶 token → 200；原本 403/200 情境照樣通過；extract fixture exit≠0
- [ ] AC6：報告含 done command exit code、vitest 數量、表示法與未比對 request 的理由、整合 guard/extract 介面簽名、未驗證項、worktree / branch / 最後 commit sha；commit 到 `poc/api-orval`（不加 AI 署名、不 push）

### Touches

- `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/**`（`poc/orval/src/permissions.ts`、`split-b/**`、`scripts/extract-permissions.ts`、`test/**`、fixture）
- `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-guard-fail-closed-report.md`
- 本 spec 檔

### Must-Not-Touch

- worktree 的 root `package.json`、`pnpm-lock.yaml`、`src/**`
- 主 checkout `/Users/pakerchang/Documents/nf_github/sideproject/admin-template`
- `master` branch（不 commit、不 push、不開 PR）
- 不新增依賴

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/orval && pnpm exec orval && pnpm exec orval --config split-b/orval.config.ts && pnpm exec tsx split-b/extract.ts && pnpm exec tsx scripts/extract-permissions.ts && pnpm exec tsc --noEmit && pnpm exec vitest run && git -C .. diff --quiet master -- ../package.json ../pnpm-lock.yaml ../src && echo ALL_GREEN
```

expected: ALL_GREEN
