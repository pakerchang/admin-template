# admin-template 權限字串改冒號 PoC（api chain a4）

一次性 throwaway PoC。把 a1–a3 PoC worktree `poc/` 內所有權限字串的分隔符從點號改成冒號（`banners.manage` → `banners:manage`），重跑 done command 全綠後 commit。結論寫到 chain scratchpad 的 `poc-perm-colon-report.md`。不落產品程式碼。

已鎖定（不重新評估）：owner 裁決 D5——權限字串一律 `<resource>:<action>`；`public` 保留字不變；產物用 gen 重新產生，不手改。

### User Story

身為 admin-template 的 owner，我要 PoC 的權限字串全面採用 `<resource>:<action>` 冒號格式，確認 YAML 解析、MSW guard、extract、測試在冒號下都正常，整合 milestone 可直接沿用。

### Acceptance Criteria

- [ ] AC1：`poc/` 底下 yaml `x-permission`、module `permissions`、角色權限表、測試斷言、錯誤訊息斷言、fixture 中的權限字串全改為冒號；`public` 不變
- [x] AC2：產物（`generated/`、`split-*/modules/*` 產出、`operations.gen.ts`）由 gen 重新產生
- [ ] AC3：改完後 grep 確認無點號形式權限字串殘留，指令與結果貼進報告
- [x] AC4：done command（不接 pipe）`ALL_GREEN`、exit=0，記下 vitest 數量
- [ ] AC5：說明 YAML 值含冒號是否需引號、MSW 路由比對是否受影響
- [ ] AC6：報告含改動檔清單、殘留 grep、exit code、vitest 數量、坑、最後 commit sha；commit 到 `poc/api-orval`（不加 AI 署名、不 push）

### Touches

- `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/**`
- `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-perm-colon-report.md`
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
