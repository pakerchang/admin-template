# admin-template orval module 分散輸出 PoC（api chain a2）

一次性 throwaway PoC。在既有 a1 PoC worktree 的 `poc/orval/` 內模擬 `modules/banners`、`modules/users`，實測兩種「orval 產物落各 module 目錄」切法（A 多 yaml 片段 / B 單 yaml 依 tag 分 output），結論寫到 chain scratchpad 的 `poc-module-split-report.md`。不落產品程式碼。

架構已鎖定（不重新評估）：Microkernel + Modular Monolith；`src/modules/<id>/{api,model,ui,mocks,index.ts}`；`src/shared` domain-free（只留 fetcher mutator 與 domain-free 工具）；`src/app` kernel 掛 MSW guard（只讀 `OperationPermissions` / `OperationRoute` 中間格式）；orval 產物不可放 `shared/api/generated`。

### User Story

身為 admin-template 的 owner，我要用實際跑過的 orval 指令與 vitest exit code 比較 A / B 兩種切法，決定整合 milestone 的 orval config 骨架與 gen script 形狀。

### Acceptance Criteria

- [ ] AC1：A、B 各有一份 orval config，`pnpm exec orval` exit code 記錄；`find` 目錄樹確認 api 產物落 `modules/<id>/api/`、msw/faker 落 `modules/<id>/mocks/`（不能拆則給最小可行替代並說明）
- [ ] AC2：記錄共用 schema（信封、`ErrorBody`）與 model 型別落點、是否跨 module 重複產出、放 shared 的判準
- [ ] AC3：檢查產物是否出現跨 module import（grep 結果貼報告）
- [ ] AC4：各切法下 operations.gen（routes + permissions）的 extract 方式與輸出位置；kernel 只經 module `index.ts` 或 gen 聚合檔取得
- [ ] AC5：a1 guard 測試改用 module 目錄產物跑 setupServer（至少 403 + 200 各一），A、B 各一次，vitest exit code 記錄
- [ ] AC6：新增一個 module 的步驟數 / 碰到的檔案數；換掉整個 domain 時要刪改什麼
- [ ] AC7：報告含 A/B 對照表、建議 + 理由、整合 milestone 的 orval config 骨架與 gen script 形狀、坑、未驗證項、worktree / branch / 最後 commit sha；commit 到 `poc/api-orval`（不加 AI 署名、不 push）

### Touches

- `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/**`
- `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-module-split-report.md`
- 本 spec 檔

### Must-Not-Touch

- worktree 的 root `package.json`、`pnpm-lock.yaml`、`src/**`
- 主 checkout `/Users/pakerchang/Documents/nf_github/sideproject/admin-template`
- `master` branch（不 commit、不 push、不開 PR）

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/orval && pnpm exec orval --config split-a/orval.config.ts && pnpm exec orval --config split-b/orval.config.ts && pnpm exec tsx split-a/extract.ts && pnpm exec tsx split-b/extract.ts && pnpm exec tsc --noEmit && pnpm exec vitest run && git -C .. diff --quiet master -- ../package.json ../pnpm-lock.yaml ../src && echo ALL_GREEN
```

expected: ALL_GREEN
